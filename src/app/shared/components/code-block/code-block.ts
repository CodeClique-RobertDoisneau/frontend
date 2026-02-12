import { Component, signal, input, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';

import { Pyodide } from '@shared/services/pyodide/pyodide';
import { Theming } from '@shared/services/theming/theming';

@Component({
  selector: 'app-code-block',
  imports: [MatButtonModule, MatIconModule, FormsModule, CodeEditor, MatProgressSpinnerModule],
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
})
export class CodeBlock implements OnInit {
  pyodide = inject(Pyodide);
  theming = inject(Theming);
  languages = languages;
  
  initialCode = input<string>('');
  language = input<string>('');
  
  code = signal<string>('');
  output = signal<string>('');
  error = signal<string>('');
  plot = signal<string>('');
  
  executionId: string | null = null;
  isRunning = signal<boolean>(false);

  ngOnInit() {
    this.code.set(this.initialCode());
  }

  run(): void {
    if (!this.pyodide.isReady()) return;

    this.isRunning.set(true);
    this.output.set('');
    this.error.set('');
    this.plot.set('');

    this.executionId = this.pyodide.run(
      this.code(),
      (outText) => {
        if (!outText) return;
        this.output.update(current => current + outText + '\n');
      },
      (errText) => {
        if (!errText) return;
        this.error.set(errText);
      },
      this.isRunning,
      (base64) => {
        if (!base64) return;
        this.plot.set(base64);
      }
    );
  }

  stop(): void {
    if (!this.executionId) return;
    this.pyodide.interruptExecution(this.executionId);
  }

  reset(): void {
    this.stop();
    this.output.set('');
    this.error.set('');
    this.plot.set('');
    this.isRunning.set(false);
    this.code.set(this.initialCode());
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }
}
