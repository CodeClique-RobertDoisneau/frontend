/// <reference lib="webworker" />
import type { PyodideAPI } from 'pyodide';

export type PyodideRequest = 
  | { type: 'INIT' }
  | { type: 'RUN'; id: string; code: string };

export type PyodideResponse = 
  | { type: 'READY' }
  | { type: 'RUN_STREAM_OUTPUT'; id: string; text: string }
  | { type: 'RUN_COMPLETE'; id: string }
  | { type: 'ERROR'; id?: string; error: string };


let pyodide: PyodideAPI | null = null;

function respond(msg: PyodideResponse) {
  postMessage(msg);
}
addEventListener('message', async ({ data }: { data: PyodideRequest }) => {
  try {
    switch (data.type) {
      case 'INIT':
        if (!pyodide) {
          const pyodideModulePath = '/assets/pyodide/pyodide.mjs';
          // @ts-ignore
          const { loadPyodide } = await import(pyodideModulePath);
          pyodide = await loadPyodide({
            indexURL: '/assets/pyodide/'
          });
        }
        respond({ type: 'READY' });
        break;

      case 'RUN':
        if (!pyodide) throw new Error('Pyodide not initialized');
        
        const { id, code } = data;

        // Redirect stdout to the main thread via postMessage
        pyodide.setStdout({
          batched: (text) => respond({ type: 'RUN_STREAM_OUTPUT', id, text }),
        });

        await pyodide.runPythonAsync(code);

        respond({ type: 'RUN_COMPLETE', id });
        break;
    }
  } catch (err) {
    console.error('WORKER: Error:', err);
    const error = err instanceof Error ? err.message : String(err);
    const id = 'id' in data ? data.id : undefined;
    respond({ type: 'ERROR', id, error });
  }
});