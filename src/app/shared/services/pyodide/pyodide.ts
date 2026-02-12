import { effect, Injectable, OnDestroy, signal, WritableSignal } from '@angular/core';
import { PyodideRequest, PyodideResponse } from './pyodide.worker';

interface ExecutionHandler {
  onOutput?: (text: string) => void;
  onError?: (text: string) => void;
  isRunning?: WritableSignal<boolean>;
  onPlot?: (base64: string) => void;
}

@Injectable({ providedIn: 'root' })
export class Pyodide implements OnDestroy {
  private packages: string[] = [];
  private worker: Worker | null = null;
  private interruptBuffer: Uint8Array | null = null;
  private interruptRequests: string[] = [];
  private executionHandlers = new Map<string, ExecutionHandler>();

  private isReadySignal = signal<boolean>(false);
  public readonly isReady = this.isReadySignal.asReadonly();

  public init(packages?: string[]) {
    if (this.worker) return;
    if (packages) this.packages = packages;

    this.initWorker(this.packages);
  }

  public resetWorker(packages?: string[]): void {
    if (!this.worker) return;
    if (packages) this.packages = packages;

    this.worker.terminate();
    this.worker = null;

    this.interruptBuffer = null;
    
    this.isReadySignal.set(false);
    this.initWorker(packages);

    this.executionHandlers.forEach((handler) => {
      handler.onError?.('Python environment reset.');
      handler.isRunning?.set(false);
    });
    this.executionHandlers.clear();
  }

  public run(
    code: string, 
    onOutput?: (text: string) => void,
    onError?: (text: string) => void,
    isRunningSignal?: WritableSignal<boolean>,
    onPlot?: (base64: string) => void
  ): string {
    if (!this.worker || !this.isReadySignal()) {
      throw new Error('Pyodide is not ready yet.');
    }

    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 0;
    }

    const executionId: string = crypto.randomUUID();

    const handler: ExecutionHandler = {
      onOutput: onOutput,
      onError: onError,
      isRunning: isRunningSignal,
      onPlot: onPlot
    }
    this.executionHandlers.set(executionId, handler);

    const msg: PyodideRequest = { type: 'RUN', id: executionId, code };
    this.worker!.postMessage(msg);

    return executionId;
  }

  public interruptExecution(executionId: string): void {
    if (this.interruptRequests.includes(executionId)) return;
    this.interruptRequests.push(executionId);

    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 2;
    }

    setTimeout(() => {
      const handler = this.executionHandlers.get(executionId);
      if (!handler) return;
      handler.onError?.('Interrupt signal ignored. Restarting kernel...');
      this.resetWorker();
    }, 1000);
  }

  private initWorker(packages: string[] = []) {
    try {
      this.worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' });
      
      try {
        const interruptSharedBuffer = new SharedArrayBuffer(1);
        this.interruptBuffer = new Uint8Array(interruptSharedBuffer);
        
        this.worker.postMessage({ type: 'INIT', buffer: interruptSharedBuffer, packages });
      } catch {
        console.warn('SharedArrayBuffer is not available. Interrupts will not work.');
        this.worker.postMessage({ type: 'INIT', buffer: null, packages });
      }

      this.worker.onmessage = this.handleWorkerMessage.bind(this);      
    } catch {
      console.error('Web Workers are not supported.');
    }
  }

  private handleWorkerMessage({ data }: { data: PyodideResponse }) {
    switch (data.type) {
      case 'READY':
        this.isReadySignal.set(true);
        break;

      case 'RUN_STDOUT':
        this.executionHandlers.get(data.id)?.onOutput?.(data.text);
        break;

      case 'RUN_STDERR':
        this.executionHandlers.get(data.id)?.onError?.(data.text);
        break;

      case 'RUN_PLOT_OUTPUT':
        this.executionHandlers.get(data.id)?.onPlot?.(data.base64);
        break;

      case 'RUN_SUCCESS':
        this.executionHandlers.get(data.id)?.isRunning?.set(false);
        this.executionHandlers.delete(data.id);
        break;

      case 'RUN_ERROR':
        this.executionHandlers.get(data.id)?.onError?.(data.error);
        this.executionHandlers.get(data.id)?.isRunning?.set(false);
        this.executionHandlers.delete(data.id);
        break;

      case 'ERROR':
        console.error(data.error);
        break;
    }
  }

  ngOnDestroy() {
    this.worker?.terminate();
  }
}