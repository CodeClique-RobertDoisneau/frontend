import { WritableSignal } from '@angular/core';

export type PyodideRequest =
  | { type: 'INIT'; buffer: SharedArrayBuffer | null; packages?: string[] }
  | { type: 'RUN'; id: string; code: string }
  | { type: 'LOAD_PKG'; packages: string[] };

export type PyodideResponse =
  | { type: 'READY' }
  | { type: 'LOADING' }
  | { type: 'ERROR'; error: string }
  | { type: 'RUN_STDIN_REQUEST'; id: string }
  | { type: 'RUN_STDOUT'; id: string; text: string }
  | { type: 'RUN_STDERR'; id: string; text: string }
  | { type: 'RUN_PLOT_OUTPUT'; id: string; base64: string }
  | { type: 'RUN_SUCCESS'; id: string }
  | { type: 'RUN_ERROR'; id: string; error: string };

export interface ExecutionHandler {
  onInput?: (text: string) => void;
  onOutput?: (text: string) => void;
  onError?: (text: string) => void;
  onPlot?: (base64: string) => void;
  isRunning?: WritableSignal<boolean>;
}