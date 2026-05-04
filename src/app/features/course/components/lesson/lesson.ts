import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { NodeInfo } from '@shared/services/node.service';
import { Pyodide } from '@shared/services/pyodide/pyodide';

@Component({
  selector: 'app-lesson',
  imports: [MarkdownViewer],
  templateUrl: './lesson.html',
  styleUrl: './lesson.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lesson {
  node = input.required<NodeInfo>();
  pyodide = inject(Pyodide);
}
