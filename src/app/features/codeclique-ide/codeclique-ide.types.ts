import { Signal, WritableSignal } from '@angular/core';

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

export interface IdeRuntime {
  readonly isReady: Signal<boolean>;
  readonly isRunning: Signal<boolean>;
  
  init(dependencies?: string[]): void;
  run(
    code: string,
    onOutput: (text: string) => void,
    onError: (text: string) => void,
    onPlot?: (base64: string) => void,
    onInputRequest?: () => void
  ): void;
  stop(): void;
  sendInput(text: string): void;
  reset(): void;
  loadPackage?(packages: string[]): void;
  destroy(): void;
}
