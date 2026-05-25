import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { Toc } from '../toc/toc';

@Component({
  selector: 'app-lesson',
  imports: [MarkdownViewer, Toc],
  templateUrl: './lesson.html',
  styleUrl: './lesson.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lesson {
  markdown = input.required<string>();
  pyodide = inject(Pyodide);
}
