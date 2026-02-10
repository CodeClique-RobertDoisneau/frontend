import { Component, signal, computed, input, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';

import { Pyodide } from '@shared/services/pyodide/pyodide';
import { Theming } from '@shared/services/theming/theming';

@Component({
  selector: 'app-code-block',
  imports: [MatButtonModule, MatIconModule, FormsModule, CodeEditor],
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
})
export class CodeBlock implements OnInit {
  @ViewChild('editor') editorRef: ElementRef | undefined;
  pyodide = inject(Pyodide);
  theming = inject(Theming);
  languages = languages;

  initialCode = input<string>('');
  language = input<string>('');
  
  code = signal<string>('');
  output = signal<string>('');
  error = signal<string>('');
  isRunning = signal<boolean>(false);
  
  canRun = computed(() => !this.isRunning() && this.code().trim().length > 0 && this.pyodide.isReady());

  ngOnInit() {
    this.code.set(this.initialCode());
  }

  async run(): Promise<void> {
    if (!this.canRun()) return;

    this.isRunning.set(true);
    this.output.set('');
    this.error.set('');

    try {
      // Pass a callback to handle the streaming output
      await this.pyodide.run(this.code(), (text) => {
        // Update signal as data arrives
        this.output.update(current => current + text + '\n');
      });
    } catch (err) {
      this.error.set(String(err));
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
