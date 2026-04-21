/// <reference lib="webworker" />
import { PyodideAPI, loadPyodide as loadPyodideType } from 'pyodide';
import { PyodideRequest, PyodideResponse } from './pyodide.types';
import { bindCallback } from 'rxjs';

const importLink = '/pyodide/pyodide.mjs';

let pyodide: PyodideAPI | null = null;
let interruptBuffer: Uint8Array | null = null;
let isMatplotlibLoaded = false;

// Utility to post messages back to the main thread
function respond(msg: PyodideResponse) {
  postMessage(msg);
}

// Helper script to extract plots and clean up memory
const PLOT_HELPER_SCRIPT = `
import io, base64
import matplotlib.pyplot as plt

# Function to retrieve the last plot as a base64 string
def _fetch_last_plot():
    if plt.get_fignums():
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        plt.close('all') 
        return img_str
    return None

# Override show to prevent blocking
plt.show = lambda: None
`;

addEventListener('message', async ({ data }: { data: PyodideRequest }) => {
  try {
    switch (data.type) {
      case 'INIT': handleInit(data); break;
      case 'RUN': handleRun(data); break;
      case 'LOAD_PKG': handleLoadPkg(data); break;
    }
  } catch (globalErr) {
    respond({ type: 'ERROR', error: String(globalErr) });
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

  // Load Pyodide
  pyodide = await loadPyodide({
    indexURL: '/pyodide',
    packages: initialPackages,
  });
  await pyodide.runPythonAsync(`exit = lambda: None`);

  // Setup Interrupts
  if (data.buffer) {
    interruptBuffer = new Uint8Array(data.buffer);
    pyodide.setInterruptBuffer(interruptBuffer);
  }

  // Setup Matplotlib
  if (initialPackages.includes('matplotlib')) {
    isMatplotlibLoaded = true;
    // Agg renders to a non-interactive backend, suitable for our use case
    await pyodide.runPythonAsync(`import matplotlib; matplotlib.use("Agg")`);
    await pyodide.runPythonAsync(PLOT_HELPER_SCRIPT);
  }

  respond({ type: 'READY' });
}

async function handleRun(data: Extract<PyodideRequest, { type: 'RUN' }>) {
  if (!pyodide) {
    respond({ type: 'RUN_ERROR', id: data.id, error: 'Pyodide not initialized' });
    return;
  }

  const { id, code } = data;

  // Reset interrupt buffer for this run
  if (interruptBuffer) interruptBuffer[0] = 0;

  let stdoutBuffer = '';
  let stderrBuffer = '';

  pyodide.setStdin({
    stdin: () => {
      if (stdoutBuffer) {
        respond({ type: 'RUN_STDOUT', id, text: stdoutBuffer + '\n' });
        stdoutBuffer = '';
      }
      if (stderrBuffer) {
        respond({ type: 'RUN_STDERR', id, text: stderrBuffer + '\n' });
        stderrBuffer = '';
      }

      respond({ type: 'RUN_STDIN_REQUEST', id });
      
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/__get_stdin__?id=${id}`, false);
      xhr.send();

      return xhr.responseText;
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
    // Execute Code
    await pyodide.runPythonAsync(code);

    // Check for Plots
    if (isMatplotlibLoaded) {
      const plotFetcher = pyodide.globals['get']('_fetch_last_plot');
      if (plotFetcher) {
        const base64Str = plotFetcher();
        if (base64Str) {
          respond({ type: 'RUN_PLOT_OUTPUT', id, base64: base64Str });
        }
      }
    }

    respond({ type: 'RUN_SUCCESS', id });
  } catch (err) {
    respond({ type: 'RUN_ERROR', id, error: String(err) });
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
    respond({ type: 'ERROR', error: String(err) });
  }
}