import { Injectable, OnDestroy, signal, WritableSignal } from '@angular/core';
import { ExecutionHandler, PyodideRequest, PyodideResponse } from './pyodide.types';

@Injectable()
export class Pyodide implements OnDestroy {
  private worker: Worker | null = null;
  private initialPackages: string[] = [];
  private executionHandlers = new Map<string, ExecutionHandler>();

  private interruptBuffer: Uint8Array | null = null;
  private interruptRequests: string[] = [];

  private isReadySignal = signal<boolean>(false);
  public readonly isReady = this.isReadySignal.asReadonly();

  public init(packages?: string[]) {
    if (this.worker) return;
    if (packages) this.initialPackages = packages;

    this.initWorker(this.initialPackages);
    this.initServiceWorker();
  }

  private initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(
        new URL('./pyodide.sw.ts', import.meta.url),
        { type: 'module', scope: '/' }
      ).then((registration) => {
        console.log('Pyodide Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.error('Pyodide Service Worker registration failed:', error);
      });
    }
  }

  public resetWorker(): void {
    if (!this.worker) return;

    // Terminate existing worker and clear state
    this.worker.terminate();
    this.worker = null;
    this.interruptBuffer = null;
    this.isReadySignal.set(false);

    this.initWorker(this.initialPackages);

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
    onPlot?: (base64: string) => void,
    onInput?: (text: string) => void
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
      onPlot: onPlot,
      onInput: onInput
    }
    this.executionHandlers.set(executionId, handler);

    isRunningSignal?.set(true);

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

  public sendInput(executionId: string, value: string): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'INPUT_RESPONSE',
        id: executionId,
        value: value + '\n'
      });
    } else {
      console.error('Service Worker controller not available to send input.');
    }
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
      case 'LOADING':
        this.isReadySignal.set(false);
        break;

      case 'READY':
        this.isReadySignal.set(true);
        break;

      case 'RUN_STDIN_REQUEST':
        this.executionHandlers.get(data.id)?.onInput?.('Input requested');
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