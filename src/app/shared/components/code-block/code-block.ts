import { Component, signal, input, inject, OnInit, effect, untracked } from '@angular/core';
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

  executionContext: any | null = null;
  isRunning = signal<boolean>(false);

  waitingForInput = signal<boolean>(false);
  userInput = signal<string>('');

  constructor() {
    effect(() => {
      const initCode = this.initialCode();
      untracked(() => this.code.set(initCode));
    });
  }

  ngOnInit() {
  }

  run(): void {
    const engine = this.pyodide();
    if (!engine || !engine.isReady()) return;

    this.output.set('');
    this.error.set('');
    this.plot.set('');

    this.executionContext = engine.run(this.code())
      .onOutput((outText: string) => {
        if (!outText) return;
        this.output.update(current => current + outText);
      })
      .onError((errText: string) => {
        if (!errText) return;
        this.error.update(current => current + errText);
      })
      .onPlot((base64: string) => {
        if (!base64) return;
        this.plot.set(base64);
      })
      .onStdinRequest(() => {
        this.waitingForInput.set(true);
      });

    this.isRunning = this.executionContext.isRunning;
  }

  submitInput(): void {
    if (!this.executionContext) return;

    this.executionContext.provideInput(this.userInput());
    this.waitingForInput.set(false);
    this.userInput.set('');
  }

  stop(): void {
    if (!this.executionContext) return;
    this.executionContext.interrupt();
    this.waitingForInput.set(false);
  }

  reset(): void {
    this.stop();
    this.output.set('');
    this.error.set('');
    this.plot.set('');
    this.userInput.set('');
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
