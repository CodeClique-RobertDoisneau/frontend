import { Injectable, OnDestroy, signal, WritableSignal } from '@angular/core';
import { ExecutionHandler, PyodideRequest, PyodideResponse } from './pyodide.types';

@Injectable()
export class Pyodide implements OnDestroy {
  private webWorker: Worker | null = null;
  private serviceWorkerRegistered = false;
  private initialPackages: string[] = [];
  private executionHandlers = new Map<string, ExecutionHandler>();

  private interruptBuffer: Uint8Array | null = null;
  private interruptRequests: string[] = [];

  private isReadySignal = signal<boolean>(false);
  public readonly isReady = this.isReadySignal.asReadonly();

  public init(packages?: string[]) {
    if (this.webWorker) return;
    if (packages) this.initialPackages = packages;

    this.initWebWorker(this.initialPackages);
    this.initServiceWorker();
  }

  public reset(): void {
    if (!this.webWorker) return;

    // Terminate existing worker and clear state
    this.webWorker.terminate();
    this.webWorker = null;
    this.executionHandlers.forEach((handler) => {
      handler.onError?.('Python environment reset.');
      handler.isRunning?.set(false);
    });
    this.executionHandlers.clear();

    this.interruptBuffer = null;
    this.interruptRequests = [];

    this.isReadySignal.set(false);

    // Initialise workers again
    this.init(this.initialPackages);
  }

  public run(
    code: string, 
    onOutput?: (text: string) => void,
    onError?: (text: string) => void,
    onPlot?: (base64: string) => void,
    onInput?: (text: string) => void
  ): { executionId: string, isRunning: WritableSignal<boolean> } {
    if (!this.serviceWorkerRegistered || !this.webWorker || !this.isReadySignal()) {
      throw new Error('Pyodide is not ready yet.');
    }

    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 0;
    }

    const executionId: string = crypto.randomUUID();
    const isRunning = signal<boolean>(true);

    const handler: ExecutionHandler = {
      onOutput: onOutput,
      onError: onError,
      isRunning: isRunning,
      onPlot: onPlot,
      onInput: onInput
    }
    this.executionHandlers.set(executionId, handler);

    const msg: PyodideRequest = { type: 'RUN', id: executionId, code };
    this.webWorker.postMessage(msg);

    return { executionId, isRunning };
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
      this.reset();
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

  public loadPackage(packages: string[]): void {
    if (!this.webWorker) return;
    this.webWorker.postMessage({ type: 'LOAD_PKG', packages });
  }

  private initWebWorker(packages: string[] = []) {
    try {
      this.webWorker = new Worker(
        new URL('./pyodide.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      try {
        const interruptSharedBuffer = new SharedArrayBuffer(1);
        this.interruptBuffer = new Uint8Array(interruptSharedBuffer);
        
        this.webWorker.postMessage({ type: 'INIT', buffer: interruptSharedBuffer, packages });
      } catch {
        console.warn('SharedArrayBuffer is not available. Interrupts will not work.');
        this.webWorker.postMessage({ type: 'INIT', buffer: null, packages });
      }

      this.webWorker.onmessage = this.handleWorkerMessage.bind(this);      
    } catch (error) {
      console.error('There was an error initialising the Web Worker: ', error);
    }
  }

  private initServiceWorker() {
    if (this.serviceWorkerRegistered || !('serviceWorker' in navigator)) return;

    try {
      this.serviceWorkerRegistered = true;
      navigator.serviceWorker.register(
        new URL('./pyodide.sw.js', import.meta.url),
        { type: 'module', scope: '/' }
      ).catch((error) => {
        console.error('Pyodide Service Worker registration failed:', error);
      });
    } catch (error) {
      console.error('There was an error initialising the Service Worker: ', error);
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
    this.webWorker?.terminate();
  }
}