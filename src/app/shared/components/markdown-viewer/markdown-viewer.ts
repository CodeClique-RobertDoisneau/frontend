import { Component, inject, signal, ViewEncapsulation, ChangeDetectionStrategy, computed } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { RemarkModule, KatexComponent } from 'ngx-remark';

import { Pyodide } from '@shared/services/pyodide/pyodide';
import { CodeBlock } from 'app/shared/components/code-block/code-block';


@Component({
  selector: 'app-markdown-viewer',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, RemarkModule, CodeBlock, KatexComponent],
  templateUrl: './markdown-viewer.html',
  styleUrls: ['./markdown-viewer.scss', './markdown.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownViewer {
  private readonly pyodide = inject(Pyodide);

  markdown = signal<string>('');

  // State signals
  fileLoading = signal(false);
  fileError = signal<string | null>(null);
  readonly pyodideError = this.pyodide.error;
  readonly pyodideLoading = this.pyodide.loading;

  isLoading = computed(() =>
    this.fileLoading() || this.pyodideLoading()
  );
  gotError = computed(() =>
    !this.fileError() || !this.pyodideError()
  );

  // Markdown renderer
  processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

  async onFileSelected(event: Event): Promise<void> {
    this.pyodide.load();

    this.fileLoading.set(true);
    this.fileError.set(null);

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.fileLoading.set(false);
      this.fileError.set('No file selected');
      return;
    }

    const markdown = await file.text();
    this.markdown.set(markdown);
    this.fileLoading.set(false);
    input.value = '';
  }
}
