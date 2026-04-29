/// <reference lib="webworker" />
import { PyodideAPI, loadPyodide as loadPyodideType } from 'pyodide';
import { PyodideRequest, PyodideResponse } from './pyodide.types';

const importLink = '/pyodide/pyodide.mjs';

let pyodide: PyodideAPI | null = null;
let interruptBuffer: Uint8Array | null = null;
let stdinBuffer: Int32Array | null = null;
let isMatplotlibLoaded = false;

function respond(msg: PyodideResponse) {
  postMessage(msg);
}

const PLOT_HELPER_SCRIPT = `
import io, base64
import matplotlib.pyplot as plt

def _fetch_last_plot():
    if plt.get_fignums():
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        plt.close('all') 
        return img_str
    return None

plt.show = lambda: None
`;

const INTERRUPT_HELPER_SCRIPT = `
def _raise_interrupt():
    raise KeyboardInterrupt()
`;

addEventListener('message', async ({ data }: { data: PyodideRequest }) => {
  try {
    switch (data.type) {
      case 'INIT': handleInit(data); break;
      case 'RUN': handleRun(data); break;
      case 'LOAD_PKG': handleLoadPkg(data); break;
      case 'INTERRUPT': handleInterrupt(); break;
      case 'WRITE_FILE': handleWriteFile(data); break;
      case 'READ_FILE': handleReadFile(data); break;
      case 'DELETE_FILE': handleDeleteFile(data); break;
      case 'MKDIR': handleMkdir(data); break;
      case 'RMDIR': handleRmdir(data); break;
      case 'LIST_DIR': handleListDir(data); break;
    }
  } catch (globalErr) {
    const errorMsg = globalErr instanceof Error ? globalErr.stack || globalErr.message : String(globalErr);
    respond({ type: 'ERROR', error: errorMsg });
  }
});

async function handleInit(data: Extract<PyodideRequest, { type: 'INIT' }>) {
  if (pyodide) {
    respond({ type: 'READY' });
    return;
  }

  const { loadPyodide } = (await import(importLink)) as {
    loadPyodide: typeof loadPyodideType;
  };

  const initialPackages = data.packages || [];

  pyodide = await loadPyodide({
    indexURL: '/pyodide',
    packages: initialPackages,
  });
  await pyodide.runPythonAsync(`exit = lambda: None`);
  await pyodide.runPythonAsync(INTERRUPT_HELPER_SCRIPT);

  if (data.interruptBuffer) {
    interruptBuffer = new Uint8Array(data.interruptBuffer);
    pyodide.setInterruptBuffer(interruptBuffer);
  }
  if (data.stdinBuffer) {
    stdinBuffer = new Int32Array(data.stdinBuffer);
  }

  if (initialPackages.includes('matplotlib')) {
    isMatplotlibLoaded = true;
    await pyodide.runPythonAsync(`import matplotlib; matplotlib.use("Agg")`);
    await pyodide.runPythonAsync(PLOT_HELPER_SCRIPT);
  }

  respond({ type: 'READY' });
}

function handleInterrupt() {
  if (!pyodide) return;
  const raiseInterrupt = pyodide?.globals['get']('_raise_interrupt');
  if (raiseInterrupt) {
    try {
      raiseInterrupt();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.stack || err.message : String(err);
      if (!errorMsg.includes('KeyboardInterrupt')) {
        console.warn('Unexpected error while raising interrupt:', errorMsg);
      }
    }
  }
}

async function handleWriteFile(data: Extract<PyodideRequest, { type: 'WRITE_FILE' }>) {
  if (!pyodide) return;
  try {
    pyodide.FS.writeFile(data.path, data.content);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    respond({ type: 'ERROR', error: 'Failed to write file: ' + errorMsg });
  }
}

async function handleReadFile(data: Extract<PyodideRequest, { type: 'READ_FILE' }>) {
  if (!pyodide) {
    respond({ type: 'FILE_ERROR', id: data.id, error: 'Pyodide not initialized' });
    return;
  }
  try {
    const content = pyodide.FS.readFile(data.path, { encoding: 'utf8' });
    respond({ type: 'FILE_READ', id: data.id, content });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    respond({ type: 'FILE_ERROR', id: data.id, error: errorMsg });
  }
}

async function handleDeleteFile(data: Extract<PyodideRequest, { type: 'DELETE_FILE' }>) {
  if (!pyodide) return;
  try {
    pyodide.FS.unlink(data.path);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    respond({ type: 'ERROR', error: 'Failed to delete file: ' + errorMsg });
  }
}

async function handleMkdir(data: Extract<PyodideRequest, { type: 'MKDIR' }>) {
  if (!pyodide) return;
  try {
    pyodide.FS.mkdir(data.path);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    respond({ type: 'ERROR', error: 'Failed to create directory: ' + errorMsg });
  }
}

async function handleRmdir(data: Extract<PyodideRequest, { type: 'RMDIR' }>) {
  if (!pyodide) return;
  try {
    pyodide.FS.rmdir(data.path);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    respond({ type: 'ERROR', error: 'Failed to remove directory: ' + errorMsg });
  }
}

async function handleListDir(data: Extract<PyodideRequest, { type: 'LIST_DIR' }>) {
  if (!pyodide) {
    respond({ type: 'FILE_ERROR', id: data.id, error: 'Pyodide not initialized' });
    return;
  }
  try {
    const contents = pyodide.FS.readdir(data.path);
    const filtered = contents.filter((c: string) => c !== '.' && c !== '..');
    respond({ type: 'DIR_LISTED', id: data.id, contents: filtered });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    respond({ type: 'FILE_ERROR', id: data.id, error: errorMsg });
  }
}

async function handleRun(data: Extract<PyodideRequest, { type: 'RUN' }>) {
  if (!pyodide) {
    respond({ type: 'RUN_ERROR', id: data.id, error: 'Pyodide not initialized' });
    return;
  }

  const { id, code } = data;

  if (interruptBuffer) interruptBuffer[0] = 0;

  let stdoutBuffer = '';
  let stderrBuffer = '';

  pyodide.setStdin({
    stdin: () => {
      if (stdoutBuffer) {
        respond({ type: 'RUN_STDOUT', id, text: stdoutBuffer });
        stdoutBuffer = '';
      }
      if (stderrBuffer) {
        respond({ type: 'RUN_STDERR', id, text: stderrBuffer });
        stderrBuffer = '';
      }

      respond({ type: 'RUN_STDIN_REQUEST', id });

      let text = '';
      if (stdinBuffer) {
        Atomics.store(stdinBuffer, 0, 1);

        Atomics.wait(stdinBuffer, 0, 1);

        if (Atomics.load(stdinBuffer, 0) === 2) {
          const dataView = new Uint8Array(stdinBuffer.buffer, 4);
          let end = 0;
          while (dataView[end] !== 0 && end < dataView.length) end++;
          text = new TextDecoder().decode(dataView.subarray(0, end));

          Atomics.store(stdinBuffer, 0, 0);

          if (text.includes('\x03')) {
            const raiseInterrupt = pyodide?.globals['get']('_raise_interrupt');
            if (raiseInterrupt) {
              raiseInterrupt();
            }
            return '';
          }
          return text;
        }
      }

      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/__get_stdin__?id=${id}`, false);
      xhr.send();
      text = xhr.responseText;

      if (text.includes('\x03')) {
        const raiseInterrupt = pyodide?.globals['get']('_raise_interrupt');
        if (raiseInterrupt) {
          raiseInterrupt();
        }
        return '';
      }

      return text;
    }
  });

  pyodide.setStdout({
    raw: (code) => {
      const char = String.fromCodePoint(code);
      stdoutBuffer += char;
      if (char === '\n') {
        respond({ type: 'RUN_STDOUT', id, text: stdoutBuffer });
        stdoutBuffer = '';
      }
    },
  });

  pyodide.setStderr({
    raw: (code) => {
      const char = String.fromCodePoint(code);
      stderrBuffer += char;
      if (char === '\n') {
        respond({ type: 'RUN_STDERR', id, text: stderrBuffer });
        stderrBuffer = '';
      }
    },
  });

  try {
    await pyodide.runPythonAsync(code);

    if (isMatplotlibLoaded) {
      const plotFetcher = pyodide?.globals['get']('_fetch_last_plot');
      if (plotFetcher) {
        const base64Str = plotFetcher();
        if (base64Str) {
          respond({ type: 'RUN_PLOT_OUTPUT', id, base64: base64Str });
        }
      }
    }

    respond({ type: 'RUN_SUCCESS', id });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.stack || err.message : String(err);
    respond({ type: 'RUN_ERROR', id, error: errorMsg });
  } finally {
    if (stdoutBuffer) {
      respond({ type: 'RUN_STDOUT', id, text: stdoutBuffer });
    }
    if (stderrBuffer) {
      respond({ type: 'RUN_STDERR', id, text: stderrBuffer });
    }
  }
}

async function handleLoadPkg(data: Extract<PyodideRequest, { type: 'LOAD_PKG' }>) {
  if (!pyodide) {
    respond({ type: 'ERROR', error: 'Pyodide not initialized' });
    return;
  }

  try {
    respond({ type: 'LOADING' });
    await pyodide.loadPackage(data.packages);
    respond({ type: 'READY' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.stack || err.message : String(err);
    respond({ type: 'ERROR', error: errorMsg });
  }
}