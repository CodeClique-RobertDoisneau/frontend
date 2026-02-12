import { Component, signal, input, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';

import { Theming } from '@shared/services/theming/theming';
import { Pyodide } from '@shared/services/pyodide/pyodide';

@Component({
  selector: 'app-code-block',
  imports: [MatButtonModule, MatIconModule, FormsModule, CodeEditor, MatProgressSpinnerModule],
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
})
export class CodeBlock implements OnInit {
  theming = inject<Theming>(Theming);
  pyodide = input<Pyodide>();
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
    const engine = this.pyodide();
    if (!engine || !engine.isReady()) return;

    this.output.set('');
    this.error.set('');
    this.plot.set('');

    this.executionId = engine.run(
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
    const engine = this.pyodide();
    if (!engine || !this.executionId) return;
    engine.interruptExecution(this.executionId);
  }

  reset(): void {
    this.stop();
    this.output.set('');
    this.error.set('');
    this.plot.set('');
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
