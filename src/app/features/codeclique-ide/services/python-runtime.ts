import { Signal, computed, signal } from '@angular/core';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { ExecutionContext } from '@shared/services/pyodide/pyodide.types';
import { IdeRuntime } from '../codeclique-ide.types';

export class PythonRuntime implements IdeRuntime {
  private pyodide: Pyodide;
  private currentContext = signal<ExecutionContext | null>(null);
  
  readonly isReady: Signal<boolean>;
  readonly isRunning: Signal<boolean>;

  constructor() {
    this.pyodide = new Pyodide();
    this.isReady = this.pyodide.isReady;
    this.isRunning = computed(() => this.currentContext()?.isRunning() ?? false);
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
    if (this.isRunning()) {
      this.stop();
    }
    
    const context = this.pyodide.run(code);
    this.currentContext.set(context);

    context
      .onOutput(onOutput)
      .onError(onError);

    if (onPlot) context.onPlot(onPlot);
    if (onInputRequest) context.onStdinRequest(onInputRequest);
  }

  stop(): void {
    this.currentContext()?.interrupt();
  }

  sendInput(text: string): void {
    this.currentContext()?.provideInput(text);
  }

  reset(): void {
    this.pyodide.reset();
    this.currentContext.set(null);
  }

  loadPackage(packages: string[]): void {
    this.pyodide.loadPackages(packages);
  }

  destroy(): void {
    this.pyodide.destroy();
  }
}
