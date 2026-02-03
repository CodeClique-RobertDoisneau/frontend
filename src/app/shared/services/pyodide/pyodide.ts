import { Injectable, signal } from '@angular/core';
import { loadPyodide, PyodideAPI } from 'pyodide';

export interface ExecutionResult {
  output: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class Pyodide {
  private pyodideInstance: PyodideAPI | null = null;
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string>('');

  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();
  
  async load(): Promise<PyodideAPI | null> {
    if (this.pyodideInstance) {
      return this.pyodideInstance;
    }
    this.loadingSignal.set(true);

    try {
      this.pyodideInstance = await loadPyodide();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error loading Pyodide';
      this.errorSignal.set(errorMsg);
    } finally {
      this.loadingSignal.set(false);
    }
    return this.pyodideInstance;
  }

  async execute(code: string): Promise<ExecutionResult> {
    if (!this.pyodideInstance) {
      return { output: '', error: 'Pyodide is not loaded or loading' };
    }
    const pyodide = await this.pyodideInstance;

    try {
      // Redirect stdout to arr
      const arr: string[] = [];
      pyodide.setStdout({ batched: (msg) => arr.push(msg) });
      // Execute code
      await pyodide.runPythonAsync(code);

      return { output: arr.join('') || '(no output)' };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { output: '', error };
    }
  }
}
