import { Component, signal, computed, input, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';

import { Pyodide } from '@shared/services/pyodide/pyodide';

@Component({
  selector: 'app-code-block',
  imports: [MatButtonModule, MatIconModule, FormsModule, CodeEditor],
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
})
export class CodeBlock {
  @ViewChild('editor') editorRef: ElementRef | undefined;
  private readonly pyodideService = inject(Pyodide);
  protected languages = languages;

  initialCode = input<string>('');
  language = input<string>('');
  
  readonly code = signal<string>('');
  readonly output = signal<string>('');
  readonly error = signal<string>('');
  readonly isRunning = signal<boolean>(false);
  
  readonly canRun = computed(() => !this.isRunning() && this.code().trim().length > 0);

  constructor() {
    effect(() => this.code.set(this.initialCode()) );
  }

  async run(): Promise<void> {
    if (!this.canRun()) return;

    this.isRunning.set(true);
    this.output.set('');
    this.error.set('');

    try {
      const result = await this.pyodideService.execute(this.code());

      if (result.error) {
        this.error.set(result.error);
      } else {
        this.output.set(result.output);
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.isRunning.set(false);
    }
  }

  reset(): void {
    this.code.set(this.initialCode());
    this.output.set('');
    this.error.set('');
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }
}
