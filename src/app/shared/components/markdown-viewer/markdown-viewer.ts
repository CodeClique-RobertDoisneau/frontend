import { Component, input, ViewEncapsulation } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import katex from 'katex';
(window as any).katex = katex;

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkDirectiveTransformer from './utils/directive-transformer';
import { RemarkModule, KatexComponent } from 'ngx-remark';

import { CodeBlock } from '@shared/components/code-block/code-block';
import { Outline } from '@shared/components/outline/outline'

@Component({
  selector: 'app-markdown-viewer',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, RemarkModule, KatexComponent, CodeBlock, Outline],
  templateUrl: './markdown-viewer.html',
  styleUrls: ['./markdown-viewer.scss', './markdown.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownViewer {
  markdown = input<string>('');
  processor = unified().use(remarkParse).use(remarkGfm).use(remarkDirective).use(remarkDirectiveTransformer).use(remarkMath);
}
