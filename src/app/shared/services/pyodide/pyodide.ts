import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import { ExecutionContext, PyodideRequest, PyodideResponse } from './pyodide.types';

@Injectable()
export class Pyodide {
  private webWorker: Worker | null = null;
  private serviceWorkerRegistered = false;
  private initialPackages: string[] = [];
  private executionHandlers = new Map<string, ExecutionContext>();
  private interruptBuffer: Uint8Array | null = null;
  private stdinBuffer: Int32Array | null = null;

  private interruptRequests = new Set<string>();
  private pendingFileOperations = new Map<string, (reason?: any) => void>();
  private interruptTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  private isReadySignal = signal<boolean>(false);
  public readonly isReady = this.isReadySignal.asReadonly();

  private errorSignal = signal<string | null>(null);
  public readonly error = this.errorSignal.asReadonly();

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.teardown();
    });
  }

  public init(packages?: string[]) {
    if (this.webWorker) return;
    if (packages) this.initialPackages = packages;

    this.initWebWorker(this.initialPackages);
    this.initServiceWorker();
  }

  public reset(): void {
    this.teardown();

    // Notify Service Worker to clear pending inputs
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CANCEL_STDIN', id: '*' });
    }

    // Initialise workers again
    this.init(this.initialPackages);
  }

  private teardown(): void {
    this.webWorker?.terminate();
    this.webWorker = null;

    this.executionHandlers.forEach((context) => {
      context._handleError('Python environment reset.\n');
      context._setRunning(false);
    });
    this.executionHandlers.clear();

    // Reject all pending file operations to prevent memory leaks
    this.pendingFileOperations.forEach((reject) => reject('Python environment reset.\n'));
    this.pendingFileOperations.clear();

    // Clear any pending interrupt timeouts
    this.interruptTimeouts.forEach((handle) => clearTimeout(handle));
    this.interruptTimeouts.clear();

    this.interruptBuffer = null;
    this.stdinBuffer = null;
    this.interruptRequests.clear();

    this.isReadySignal.set(false);
  }

  public run(code: string): ExecutionContext {
    if (!this.webWorker || !this.isReadySignal()) {
      throw new Error('Pyodide is not ready yet.');
    }

    if (this.executionHandlers.size > 0) {
      throw new Error('A script is already running. Call interrupt() first.');
    }

    // Warn if neither stdin strategy is available
    if (!this.stdinBuffer && !this.serviceWorkerRegistered) {
      console.warn('No stdin strategy available. input() calls will hang.');
    }

    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 0;
    }

    const executionId: string = crypto.randomUUID();
    const context = new ExecutionContext(executionId, {
      sendInput: this.sendInput.bind(this),
      interruptExecution: this.interruptExecution.bind(this)
    });

    this.executionHandlers.set(executionId, context);

    const msg: PyodideRequest = { type: 'RUN', id: executionId, code };
    this.webWorker.postMessage(msg);

    return context;
  }

  private interruptExecution(executionId: string): void {
    if (this.interruptRequests.has(executionId)) return;
    this.interruptRequests.add(executionId);

    // If Python is blocked on input(), resolve the XHR immediately with the abort signal
    this.sendInput(executionId, '\x03');

    // Try sending an interrupt message to trigger graceful Ctrl-C for yielding code
    if (this.webWorker) {
      this.webWorker.postMessage({ type: 'INTERRUPT' } as PyodideRequest);
    }

    // Try SAB interrupt
    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 2;
    }

    // Clear any existing timeout for this execution just in case
    const existingHandle = this.interruptTimeouts.get(executionId);
    if (existingHandle) clearTimeout(existingHandle);

    // 1-second timeout fallback for stuck threads
    const handle = setTimeout(() => {
      const handler = this.executionHandlers.get(executionId);
      if (!handler) return;
      handler._handleError('Interrupt signal ignored. Restarting kernel...\n');
      this.interruptTimeouts.delete(executionId);
      this.reset();
    }, 1000);
    this.interruptTimeouts.set(executionId, handle);
  }

  public loadPackages(packages: string[]): void {
    if (!this.webWorker) return;
    this.webWorker.postMessage({ type: 'LOAD_PKG', packages } as PyodideRequest);
  }

  private sendInput(executionId: string, value: string): void {
    if (this.stdinBuffer && (Atomics.load(this.stdinBuffer as Int32Array, 0) as number) === 1) {
      // Worker is waiting via Atomics
      const encoder = new TextEncoder();
      const encoded = encoder.encode(value);

      const MAX_STDIN_BYTES = this.stdinBuffer.buffer.byteLength - 4 - 1; // -1 for null terminator
      if (encoded.length > MAX_STDIN_BYTES) {
        console.error(`Input too long: ${encoded.length} bytes (max ${MAX_STDIN_BYTES})`);
        return;
      }

      const dataView = new Uint8Array(this.stdinBuffer.buffer, 4);
      dataView.set(encoded);
      dataView[encoded.length] = 0; // null terminator

      Atomics.store(this.stdinBuffer, 0, 2); // state = ready
      Atomics.notify(this.stdinBuffer, 0, 1);
      return;
    }

    // If the string contains \x03, it's a simulated Ctrl-C for input.
    if ('serviceWorker' in navigator) {
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.postMessage({
          type: 'INPUT_RESPONSE',
          id: executionId,
          value: value
        });
      } else {
        // Controller not yet active — wait for it
        navigator.serviceWorker.ready.then(registration => {
          (registration.active ?? registration.installing ?? registration.waiting)
            ?.postMessage({
              type: 'INPUT_RESPONSE',
              id: executionId,
              value: value
            });
        }).catch(err => console.error('Service Worker ready error:', err));
      }
    } else {
      console.error('Service Worker not available to send input.');
    }
  }

  public writeFile(path: string, content: string): void {
    if (!this.webWorker) return;
    this.webWorker.postMessage({ type: 'WRITE_FILE', path, content } as PyodideRequest);
  }

  public readFile(path: string): Promise<string> {
    if (!this.webWorker) return Promise.reject('Worker not ready');
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingFileOperations.set(id, reject);

      const listener = (event: MessageEvent<PyodideResponse>) => {
        const data = event.data;
        if (data.type === 'FILE_READ' && data.id === id) {
          this.webWorker?.removeEventListener('message', listener);
          this.pendingFileOperations.delete(id);
          resolve(data.content);
        } else if (data.type === 'FILE_ERROR' && data.id === id) {
          this.webWorker?.removeEventListener('message', listener);
          this.pendingFileOperations.delete(id);
          reject(data.error);
        }
      };
      this.webWorker?.addEventListener('message', listener);
      this.webWorker?.postMessage({ type: 'READ_FILE', path, id } as PyodideRequest);
    });
  }

  public deleteFile(path: string): void {
    if (!this.webWorker) return;
    this.webWorker.postMessage({ type: 'DELETE_FILE', path } as PyodideRequest);
  }

  public mkdir(path: string): void {
    if (!this.webWorker) return;
    this.webWorker.postMessage({ type: 'MKDIR', path } as PyodideRequest);
  }

  public rmdir(path: string): void {
    if (!this.webWorker) return;
    this.webWorker.postMessage({ type: 'RMDIR', path } as PyodideRequest);
  }

  public listDir(path: string): Promise<string[]> {
    if (!this.webWorker) return Promise.reject('Worker not ready');
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingFileOperations.set(id, reject);

      const listener = (event: MessageEvent<PyodideResponse>) => {
        const data = event.data;
        if (data.type === 'DIR_LISTED' && data.id === id) {
          this.webWorker?.removeEventListener('message', listener);
          this.pendingFileOperations.delete(id);
          resolve(data.contents);
        } else if (data.type === 'FILE_ERROR' && data.id === id) {
          this.webWorker?.removeEventListener('message', listener);
          this.pendingFileOperations.delete(id);
          reject(data.error);
        }
      };
      this.webWorker?.addEventListener('message', listener);
      this.webWorker?.postMessage({ type: 'LIST_DIR', path, id } as PyodideRequest);
    });
  }

  private initWebWorker(packages: string[] = []) {
    try {
      this.webWorker = new Worker(
        new URL('./pyodide.worker.ts', import.meta.url),
        { type: 'module' }
      );

      let interruptSharedBuffer: SharedArrayBuffer | null = null;
      let stdinSharedBuffer: SharedArrayBuffer | null = null;

      try {
        interruptSharedBuffer = new SharedArrayBuffer(1);
        this.interruptBuffer = new Uint8Array(interruptSharedBuffer);

        // Stdin buffer needs to be larger to hold strings and flags
        stdinSharedBuffer = new SharedArrayBuffer(1024 * 64);
        this.stdinBuffer = new Int32Array(stdinSharedBuffer);
      } catch {
        console.warn('SharedArrayBuffer is not available. Interrupts and Atomics stdin will not work.');
      }

      this.webWorker.postMessage({
        type: 'INIT',
        interruptBuffer: interruptSharedBuffer,
        stdinBuffer: stdinSharedBuffer,
        packages
      } as PyodideRequest);

      this.webWorker.onmessage = this.handleWorkerMessage.bind(this);
    } catch (error) {
      console.error('There was an error initialising the Web Worker: ', error);
    }
  }

  private initServiceWorker() {
    if (this.serviceWorkerRegistered || !('serviceWorker' in navigator)) return;

    try {
      navigator.serviceWorker.register(
        new URL('./pyodide.sw.js', import.meta.url),
        { type: 'module', scope: '/' }
      ).then(() => {
        this.serviceWorkerRegistered = true;
      }).catch((error) => {
        console.error('Pyodide Service Worker registration failed:', error);
      });
    } catch (error) {
      console.error('There was an error initialising the Service Worker: ', error);
    }
  }

  private handleWorkerMessage({ data }: { data: PyodideResponse }) {
    if (
      data.type === 'FILE_READ' ||
      data.type === 'FILE_ERROR' ||
      data.type === 'DIR_LISTED'
    ) return; // Handled by inline listeners

    switch (data.type) {
      case 'LOADING':
        this.isReadySignal.set(false);
        break;

      case 'READY':
        this.isReadySignal.set(true);
        break;

      case 'RUN_STDIN_REQUEST':
        this.executionHandlers.get(data.id)?._handleStdinRequest();
        break;

      case 'RUN_STDOUT':
        this.executionHandlers.get(data.id)?._handleOutput(data.text);
        break;

      case 'RUN_STDERR':
        this.executionHandlers.get(data.id)?._handleError(data.text);
        break;

      case 'RUN_PLOT_OUTPUT':
        this.executionHandlers.get(data.id)?._handlePlot(data.base64);
        break;

      case 'RUN_SUCCESS': {
        const handle = this.interruptTimeouts.get(data.id);
        if (handle) {
          clearTimeout(handle);
          this.interruptTimeouts.delete(data.id);
        }
        this.executionHandlers.get(data.id)?._setRunning(false);
        this.executionHandlers.delete(data.id);
        this.interruptRequests.delete(data.id);
        break;
      }

      case 'RUN_ERROR': {
        const handle = this.interruptTimeouts.get(data.id);
        if (handle) {
          clearTimeout(handle);
          this.interruptTimeouts.delete(data.id);
        }
        const ctx = this.executionHandlers.get(data.id);
        ctx?._handleError(data.error);
        ctx?._setRunning(false);
        this.executionHandlers.delete(data.id);
        this.interruptRequests.delete(data.id);
        break;
      }

      case 'ERROR':
        this.errorSignal.set(data.error);
        console.error(data.error);
        break;
    }
  }
}