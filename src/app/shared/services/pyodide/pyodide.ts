import { Injectable, OnDestroy, signal } from '@angular/core';
import { PyodideRequest, PyodideResponse } from './pyodide.worker';

interface ExecutionHandler {
  resolve: () => void;
  reject: (error: any) => void;
  onOutput?: (text: string) => void;
}

@Injectable({ providedIn: 'root' })
export class Pyodide implements OnDestroy {
  private worker: Worker | null = null;
  
  // Map execution IDs to their Promise resolvers and output callbacks
  private activeExecutions = new Map<string, ExecutionHandler>();

  // Signals for global state
  readonly isReady = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' });
      
      this.worker.onerror = (err) => {
        console.error('Pyodide Service: Worker error:', err);
        this.error.set(`Worker error: ${err.message}`);
      };

      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      
      this.worker.postMessage({ type: 'INIT' });
    } else {
      this.error.set('Web Workers are not supported.');
    }
  }

  /**
   * Executes Python code.
   * @param code The Python script to run.
   * @param onOutput Optional callback to receive stdout stream (print statements).
   * @returns A Promise that resolves when execution completes.
   */
  async run(code: string, onOutput?: (text: string) => void): Promise<void> {
    if (!this.worker || !this.isReady()) {
      throw new Error('Pyodide is not ready yet.');
    }

    const id = crypto.randomUUID();

    return new Promise<void>((resolve, reject) => {
      // Store the handlers to be called when messages arrive from the worker
      this.activeExecutions.set(id, { resolve, reject, onOutput });
      
      const msg: PyodideRequest = { type: 'RUN', id, code };
      this.worker!.postMessage(msg);
    });
  }

  private handleWorkerMessage({ data }: { data: PyodideResponse }) {
    switch (data.type) {
      case 'READY':
        this.isReady.set(true);
        break;

      case 'RUN_STREAM_OUTPUT':
        const streamHandler = this.activeExecutions.get(data.id);
        if (streamHandler?.onOutput) {
          streamHandler.onOutput(data.text);
        }
        break;

      case 'RUN_COMPLETE':
        const completeHandler = this.activeExecutions.get(data.id);
        if (completeHandler) {
          completeHandler.resolve();
          this.activeExecutions.delete(data.id);
        }
        break;

      case 'ERROR':
        if (data.id && this.activeExecutions.has(data.id)) {
          // Error specific to a run execution
          const errorHandler = this.activeExecutions.get(data.id);
          errorHandler?.reject(data.error);
          this.activeExecutions.delete(data.id);
        } else {
          // Global initialization error
          this.error.set(data.error);
        }
        break;
    }
  }

  ngOnDestroy() {
    this.worker?.terminate();
    this.activeExecutions.clear();
  }
}