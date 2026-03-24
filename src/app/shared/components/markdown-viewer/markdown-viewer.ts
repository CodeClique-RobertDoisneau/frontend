import { Component, effect, inject, input, OnInit, ViewEncapsulation } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Pyodide } from '@shared/services/pyodide/pyodide';

import katex from 'katex';
(window as any).katex = katex;

import mermaid from 'mermaid';
(window as any).mermaid = mermaid;

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import remarkDirectiveTransformer from './utils/directive-transformer';

import { RemarkModule, KatexComponent } from 'ngx-remark';
import { CodeBlock } from '@shared/components/code-block/code-block';
import { MermaidBlock } from '@shared/components/mermaid-block/mermaid-block';
import { Outline } from '@shared/components/outline/outline';
import { VideoBlock } from "../video-block/video-block";

@Component({
  selector: 'app-markdown-viewer',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RemarkModule,
    KatexComponent,
    CodeBlock,
    Outline,
    MermaidBlock,
    VideoBlock],
  templateUrl: './markdown-viewer.html',
  styleUrls: ['./markdown-viewer.scss', './markdown.scss'],
  encapsulation: ViewEncapsulation.None, // To allow markdown styles to apply properly
})
export class MarkdownViewer implements OnInit {
  pyodide = input<Pyodide>();
  markdown = input<string>('');
  packages = input<string[]>([]);

  ngOnInit() {
    // Should ideally be loaded by parent
    const engine = this.pyodide();
    engine?.init(this.packages());
  }

  processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDirective)
    .use(remarkDirectiveTransformer);
}
