import { Component, inject, signal, ViewEncapsulation, ChangeDetectionStrategy, computed } from '@angular/core';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CodeBlock } from './code-block/code-block';
import { PyodideService } from '../../services/pyodide/pyodide';

@Component({
  selector: 'app-course-viewer',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, CodeBlock],
  templateUrl: './course-viewer.html',
  styleUrls: ['./course-viewer.scss', './markdown.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseViewer {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly pyodideService = inject(PyodideService);

  // Markdown rendering signals
  parsedHtml = signal<string>('');
  codeBlocks = signal<Array<{ text: string; lang?: string }>>([]);

  // Expose Pyodide loading state
  readonly isPyodideLoading = this.pyodideService.isLoading;
  readonly isPyodideReady = this.pyodideService.isReady;
  readonly pyodideError = this.pyodideService.error;

  // State signals
  readonly isLoadingFile = signal(false);
  readonly fileError = signal<string | null>(null);
  readonly isLoading = computed(() =>
    this.isLoadingFile() || this.isPyodideLoading()
  );

  constructor() {}

  async onFileSelected(event: Event): Promise<void> {
    this.pyodideService.load().catch(err => {
      console.error('Failed to initialize Pyodide:', err);
    });

    this.isLoadingFile.set(true);
    this.fileError.set(null);

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.isLoadingFile.set(false);
      return;
    }

    try {
      const markdown = await file.text();
      this.parseMarkdown(markdown);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process file';
      this.fileError.set(errorMsg);
      console.error('Error processing markdown file:', err);
    } finally {
      this.isLoadingFile.set(false);
      input.value = '';
    }
  }


  private async parseMarkdown(markdown: string): Promise<void> {
    const renderer = new marked.Renderer();
    const codeBlocks: Array<{ text: string; lang?: string }> = [];

    // Override the code renderer to collect python code blocks
    renderer.code = (args) => {
      const { text, lang } = args as { text: string; lang?: string };
      const index = codeBlocks.length;
      codeBlocks.push({ text, lang });
      // Return a placeholder
      return `<code-block-placeholder data-index="${index}"></code-block-placeholder>`;
    };

    marked.use(
      { renderer },
      markedKatex({ throwOnError: false })
    );

    const html = await marked.parse(markdown);

    // Store the parsed HTML and code blocks for use in the template
    this.parsedHtml.set(html || '');
    this.codeBlocks.set(codeBlocks);
  }

  getMarkdownSegments(): Array<{ type: 'html'; content: SafeHtml } | { type: 'code'; content: string; lang: string }> {
    const html = this.parsedHtml();
    const codes = this.codeBlocks();
    const segments: Array<{ type: 'html'; content: SafeHtml } | { type: 'code'; content: string; lang: string }> = [];

    const parts = html.split(/<code-block-placeholder data-index="(\d+)"><\/code-block-placeholder>/);

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // HTML segment
        if (parts[i]) {
          segments.push({
            type: 'html',
            content: this.sanitizer.bypassSecurityTrustHtml(parts[i]) // /!\ TODO: SANITIZATION
          });
        }
      } else {
        // Code block segment
        const index = parseInt(parts[i]);
        const codeBlock = codes[index];
        if (codeBlock) {
          let lang: string;
          if (!codeBlock.lang) {
            lang = "";
          } else {
            lang = codeBlock.lang;
          }
          segments.push({
            type: 'code',
            content: codeBlock.text,
            lang: lang
          });
        }
      }
    }

    return segments;
  }
}
