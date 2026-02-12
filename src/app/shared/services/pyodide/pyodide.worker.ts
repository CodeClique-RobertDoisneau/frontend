/// <reference lib="webworker" />
import { PyodideAPI, loadPyodide as loadPyodideType } from 'pyodide';

const importLink = '/pyodide/pyodide.mjs';

export type PyodideRequest =
  | { type: 'INIT'; buffer: SharedArrayBuffer; packages?: string[] }
  | { type: 'RUN'; id: string; code: string };

export type PyodideResponse =
  | { type: 'READY' }
  | { type: 'RUN_STDOUT'; id: string; text: string }
  | { type: 'RUN_STDERR'; id: string; text: string }
  | { type: 'RUN_PLOT_OUTPUT'; id: string; base64: string } 
  | { type: 'RUN_SUCCESS'; id: string }
  | { type: 'RUN_ERROR'; id: string; error: string }
  | { type: 'ERROR'; error: string };

let pyodide: PyodideAPI | null = null;
let interruptBuffer: Uint8Array | null = null;
let isMatplotlibLoaded = false;

function respond(msg: PyodideResponse) {
  postMessage(msg);
}

// Helper script to extract plots, for matplotlib
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
`;

addEventListener('message', async ({ data }: { data: PyodideRequest }) => {
  try {
    switch (data.type) {
      case 'INIT':
        const { loadPyodide } = (await import(importLink)) as { 
          loadPyodide: typeof loadPyodideType 
        };

        const packages = data.packages || [];
        pyodide = await loadPyodide({
          indexURL: '/pyodide',
          packages: packages,
        });
        
        // Native Interrupt
        if (data.buffer) {
          interruptBuffer = new Uint8Array(data.buffer);
          pyodide.setInterruptBuffer(interruptBuffer);
        }
        
        // Specific setup for Matplotlib if requested
        if (packages.includes('matplotlib')) {
          isMatplotlibLoaded = true;
          pyodide.runPython(`import matplotlib; matplotlib.use("Agg")`);
          pyodide.runPython(PLOT_HELPER_SCRIPT);
        }
        
        respond({ type: 'READY' });
        break;

      case 'RUN':
        if (!pyodide) throw new Error('Pyodide not initialized');
        const { id, code } = data;

        if (interruptBuffer) interruptBuffer[0] = 0;
        
        pyodide.setStdout({
          batched: (text) => respond({ type: 'RUN_STDOUT', id, text }),
        });

        pyodide.setStderr({
          batched: (text) => respond({ type: 'RUN_STDERR', id, text }),
        });

        try {
          await pyodide.runPythonAsync(code);

          if (isMatplotlibLoaded) {
            const fetcher = pyodide.globals["get"]("_fetch_last_plot");
            const base64Str = fetcher();
            if (!base64Str) return;
            respond({ type: 'RUN_PLOT_OUTPUT', id, base64: base64Str });
          }
          
          respond({ type: 'RUN_SUCCESS', id });
        } catch (err: any) {
          respond({ type: 'RUN_ERROR', id, error: String(err) });
        }
        break;
    }
  } catch (globalErr) {
    respond({ type: 'ERROR', error: String(globalErr) });
  }
});