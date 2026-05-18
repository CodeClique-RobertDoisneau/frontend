import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { NodeInfo } from '@shared/services/node/node';
import { Pyodide } from '@shared/services/pyodide/pyodide';

@Component({
  selector: 'app-exercise',
  imports: [MarkdownViewer],
  templateUrl: './exercise.html',
  styleUrl: './exercise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Exercise {
  node = input.required<NodeInfo>();
  pyodide = inject(Pyodide);
}
