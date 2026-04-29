import { Signal, WritableSignal, signal } from '@angular/core';

export type PyodideRequest =
  | { type: 'INIT'; stdinBuffer: SharedArrayBuffer | null; interruptBuffer: SharedArrayBuffer | null; packages?: string[] }
  | { type: 'RUN'; id: string; code: string }
  | { type: 'LOAD_PKG'; packages: string[] }
  | { type: 'INTERRUPT' }
  | { type: 'WRITE_FILE'; path: string; content: string }
  | { type: 'READ_FILE'; path: string; id: string }
  | { type: 'DELETE_FILE'; path: string }
  | { type: 'MKDIR'; path: string }
  | { type: 'RMDIR'; path: string }
  | { type: 'LIST_DIR'; path: string; id: string };

export type PyodideResponse =
  | { type: 'READY' }
  | { type: 'LOADING' }
  | { type: 'ERROR'; error: string }
  | { type: 'RUN_STDIN_REQUEST'; id: string }
  | { type: 'RUN_STDOUT'; id: string; text: string }
  | { type: 'RUN_STDERR'; id: string; text: string }
  | { type: 'RUN_PLOT_OUTPUT'; id: string; base64: string }
  | { type: 'RUN_SUCCESS'; id: string }
  | { type: 'RUN_ERROR'; id: string; error: string }
  | { type: 'FILE_READ'; id: string; content: string }
  | { type: 'FILE_ERROR'; id: string; error: string }
  | { type: 'DIR_LISTED'; id: string; contents: string[] };

export class ExecutionContext {
  private _isRunning: WritableSignal<boolean> = signal(true);
  public readonly isRunning: Signal<boolean> = this._isRunning.asReadonly();

  private outputCallback?: (text: string) => void;
  private errorCallback?: (text: string) => void;
  private plotCallback?: (base64: string) => void;
  private stdinRequestCallback?: () => void;

  constructor(
    public readonly executionId: string,
    private readonly pyodideServiceMethods: {
      sendInput: (id: string, text: string) => void;
      interruptExecution: (id: string) => void;
    }
  ) { }

  public onOutput(callback: (text: string) => void): this {
    this.outputCallback = callback;
    return this;
  }

  public onError(callback: (text: string) => void): this {
    this.errorCallback = callback;
    return this;
  }

  public onPlot(callback: (base64: string) => void): this {
    this.plotCallback = callback;
    return this;
  }

  public onStdinRequest(callback: () => void): this {
    this.stdinRequestCallback = callback;
    return this;
  }

  public provideInput(text: string): void {
    this.pyodideServiceMethods.sendInput(this.executionId, text);
  }

  public interrupt(): void {
    this.pyodideServiceMethods.interruptExecution(this.executionId);
  }

  /** @internal */
  _handleOutput(text: string) { this.outputCallback?.(text); }
  /** @internal */
  _handleError(text: string) { this.errorCallback?.(text); }
  /** @internal */
  _handlePlot(base64: string) { this.plotCallback?.(base64); }
  /** @internal */
  _handleStdinRequest() { this.stdinRequestCallback?.(); }
  /** @internal */
  _setRunning(value: boolean) { this._isRunning.set(value); }
}