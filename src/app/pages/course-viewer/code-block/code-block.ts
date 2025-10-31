import { Component, signal, computed, input, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PyodideService } from '../../../services/pyodide/pyodide';
// import hljs, { AutoHighlightResult } from 'highlight.js';

@Component({
  selector: 'app-code-block',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
})
export class CodeBlock {
  @ViewChild('editor') editorRef: ElementRef | undefined;

  readonly initialCode = input.required<string>();
  readonly language = input<string>();

  readonly code = signal('');
  // readonly highlightedCode = computed(() => {hljs.highlightAuto(this.code())});
  readonly output = signal('');
  readonly error = signal<string | null>(null);
  readonly isRunning = signal(false);

  readonly canRun = computed(() => !this.isRunning() && this.code().trim().length > 0);

  private readonly pyodideService = inject(PyodideService);

  constructor() {
    effect( () => this.code.set(this.initialCode()) );
  }

  async run(): Promise<void> {
    if (!this.canRun()) return;

    this.isRunning.set(true);
    this.output.set('');
    this.error.set(null);

    try {
      const editor = this.editorRef?.nativeElement;
      this.code.set(editor.value);
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

    const editor = this.editorRef?.nativeElement;
    editor.value = this.code();

    this.output.set('');
    this.error.set(null);
  }

  async copy(): Promise<void> {
    try {
      const editor = this.editorRef?.nativeElement;
      if (editor) {
        this.code.set(editor.value);
      }
      await navigator.clipboard.writeText(this.code());
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }
}
