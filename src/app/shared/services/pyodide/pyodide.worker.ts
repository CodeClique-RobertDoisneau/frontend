/// <reference lib="webworker" />
import { PyodideAPI, loadPyodide as loadPyodideType } from 'pyodide';

const importLink = '/pyodide/pyodide.mjs';

export type PyodideRequest =
  | { type: 'INIT'; buffer: SharedArrayBuffer | null; packages?: string[] }
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

// Helper script to extract plots and clean up memory
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

plt.show = lambda: None  # Override show to prevent blocking
`;

addEventListener('message', async ({ data }: { data: PyodideRequest }) => {
  try {
    switch (data.type) {
      case 'INIT': {
        // Prevent double initialization on the same worker instance
        if (pyodide) {
            respond({ type: 'READY' });
            return;
        }

        const { loadPyodide } = (await import(importLink)) as {
          loadPyodide: typeof loadPyodideType;
        };

        const packages = data.packages || [];
        
        // Load Pyodide
        pyodide = await loadPyodide({
          indexURL: '/pyodide',
          packages: packages,
        });

        // Setup Interrupts
        if (data.buffer) {
          interruptBuffer = new Uint8Array(data.buffer);
          pyodide.setInterruptBuffer(interruptBuffer);
        }

        // Setup Matplotlib
        if (packages.includes('matplotlib')) {
          isMatplotlibLoaded = true;
          // Set backend to Agg to prevent GUI errors
          await pyodide.runPythonAsync(`import matplotlib; matplotlib.use("Agg")`);
          await pyodide.runPythonAsync(PLOT_HELPER_SCRIPT);
        }

        respond({ type: 'READY' });
        break;
      }

      case 'RUN': {
        if (!pyodide) {
          respond({ type: 'RUN_ERROR', id: data.id, error: 'Pyodide not initialized' });
          return;
        }
        
        const { id, code } = data;

        // Reset interrupt buffer for this run
        if (interruptBuffer) interruptBuffer[0] = 0;

        // Attach streams
        pyodide.setStdout({
          batched: (text) => respond({ type: 'RUN_STDOUT', id, text }),
        });

        pyodide.setStderr({
          batched: (text) => respond({ type: 'RUN_STDERR', id, text }),
        });

        try {
          // Execute Code
          await pyodide.runPythonAsync(code);

          // Check for Plots
          if (isMatplotlibLoaded) {
            // Use .get() method safely
            const fetcher = pyodide.globals['get']('_fetch_last_plot');
            if (fetcher) {
                const base64Str = fetcher();
                // Destroy the proxy to prevent memory leaks (optional but good practice)
                fetcher.destroy(); 
                
                if (base64Str) {
                  respond({ type: 'RUN_PLOT_OUTPUT', id, base64: base64Str });
                }
            }
          }

          respond({ type: 'RUN_SUCCESS', id });
        } catch (err: any) {
          respond({ type: 'RUN_ERROR', id, error: String(err) });
        }
        break;
      }
    }
  } catch (globalErr) {
    // Catch-all for loading errors (e.g. 404 on pyodide.mjs)
    respond({ type: 'ERROR', error: String(globalErr) });
  }
});