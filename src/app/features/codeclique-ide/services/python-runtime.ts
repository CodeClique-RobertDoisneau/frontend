import { Signal } from '@angular/core';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { IdeRuntime } from '../codeclique-ide.types';

export class PythonRuntime implements IdeRuntime {
  private pyodide: Pyodide;
  private executionId: string | null = null;
  
  readonly isReady: Signal<boolean>;
  readonly isRunning: Signal<boolean>;

  constructor() {
    this.pyodide = new Pyodide();
    this.isReady = this.pyodide.isReady;
    this.isRunning = this.pyodide.isRunning;
  }

  init(dependencies: string[] = []): void {
    this.pyodide.init(dependencies);
  }

  run(
    code: string,
    onOutput: (text: string) => void,
    onError: (text: string) => void,
    onPlot?: (base64: string) => void,
    onInputRequest?: () => void
  ): void {
    if (this.executionId) {
      this.stop();
    }
    const executionId = this.pyodide.run(
      code,
      onOutput,
      onError,
      onPlot || (() => {}),
      onInputRequest || (() => {})
    );
    this.executionId = executionId;
  }

  stop(): void {
    if (this.executionId) {
      this.pyodide.interruptExecution(this.executionId);
    }
  }

  sendInput(text: string): void {
    if (this.executionId) {
      this.pyodide.sendInput(this.executionId, text);
    }
  }

  reset(): void {
    this.pyodide.reset();
    this.executionId = null;
  }

  loadPackage(packages: string[]): void {
    this.pyodide.loadPackage(packages);
  }

  destroy(): void {
    this.pyodide.ngOnDestroy();
  }
}
