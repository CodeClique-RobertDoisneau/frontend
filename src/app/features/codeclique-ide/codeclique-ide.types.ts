import { WritableSignal } from '@angular/core';
import { Pyodide } from '@shared/services/pyodide/pyodide';

export interface PythonExample {
  name: string;
  filename: string;
  code: string;
  dependencies: string[];
}

export interface ReplLine {
  type: 'input' | 'output' | 'error';
  content: string;
}

export interface IdeTab {
  id: string;
  name: string;
  code: WritableSignal<string>;
  pyodide: Pyodide;
  replHistory: WritableSignal<ReplLine[]>;
  isRunning: WritableSignal<boolean>;
  executionId: string | null;
  plot: WritableSignal<string>;
  waitingForInput: WritableSignal<boolean>;
  userInput: WritableSignal<string>;
  packages: { name: string; loaded: boolean }[];
}
