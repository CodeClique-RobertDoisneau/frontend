import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { NodeInfo } from '@shared/services/node/node';
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
  node = input.required<NodeInfo>();
  pyodide = inject(Pyodide);
}
