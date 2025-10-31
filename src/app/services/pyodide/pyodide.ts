import { Injectable, signal } from '@angular/core';

declare global {
  interface Window {
    loadPyodide: (config?: any) => Promise<PyodideInterface>;
  }
}

export interface PyodideInterface {
  runPython(code: string): any;
  runPythonAsync(code: string): Promise<any>;
  loadPackage(packages: string | string[]): Promise<void>;
  globals: any;
}

export interface ExecutionResult {
  output: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class PyodideService {
  readonly isLoading = signal(false);
  readonly isReady = signal(false);
  readonly error = signal<string | null>(null);
  readonly instance = signal<PyodideInterface | null>(null);

  private pyodidePromise: Promise<PyodideInterface> | null = null;

  async load(): Promise<PyodideInterface> {
    if (this.pyodidePromise) return this.pyodidePromise;

    this.isLoading.set(true);
    this.error.set(null);

    this.pyodidePromise = this.loadPyodideFromCDN()
      .then(pyodide => {
        pyodide.runPython(`
          import sys
          from io import StringIO
          sys.stdout = StringIO()
        `);
        this.instance.set(pyodide);
        this.isReady.set(true);
        return pyodide;
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : String(err);
        this.error.set(message);
        this.isReady.set(false);
        throw err;
      })
      .finally(() => this.isLoading.set(false));

    return this.pyodidePromise;
  }

  private loadPyodideFromCDN(): Promise<PyodideInterface> {
    return new Promise((resolve, reject) => {
      if (window.loadPyodide) {
        resolve(window.loadPyodide());
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
      script.async = true;

      script.onload = () => {
        if (window.loadPyodide) {
          resolve(window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
          }));
        } else {
          reject(new Error('Failed to load Pyodide'));
        }
      };

      script.onerror = () => reject(new Error('Failed to load Pyodide script'));

      document.head.appendChild(script);
    });
  }

  async execute(code: string): Promise<ExecutionResult> {
    const pyodide = this.instance();
    if (!pyodide) {
      return { output: '', error: 'Pyodide not initialized' };
    }

    try {
      // Reset stdout
      pyodide.runPython('sys.stdout = StringIO()');

      // Execute code
      const result = await pyodide.runPythonAsync(code);
      const stdout = pyodide.runPython('sys.stdout.getvalue()') as string;

      const output = [stdout, result].filter(Boolean).join('\n').trim();

      return { output: output || '(no output)' };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { output: '', error };
    }
  }
}
