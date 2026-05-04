import { Component, computed, effect, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { RemarkModule, KatexComponent } from 'ngx-remark';
import { CodeBlock } from '@shared/components/code-block/code-block';
import { MermaidBlock } from '@shared/components/mermaid-block/mermaid-block';

import type { Pyodide } from '@shared/services/pyodide/pyodide';
import type { Processor } from "unified";
import type { Root } from 'mdast';
import remarkStringify from 'remark-stringify';

@Component({
  selector: 'app-outline',
  imports: [MatIconModule, RemarkModule, KatexComponent, CodeBlock, MermaidBlock],
  templateUrl: './outline.html',
  styleUrl: './outline.scss',
})
export class Outline {
  pyodide = input<Pyodide>();
  outlineType = input<string>('');
  processor = input<Processor<Root, undefined, undefined, undefined, undefined>>();
  node = input<Object>();

  mdastNode = computed<Root>(() => {
    if (!this.node()) return { type: 'root', children: [] };
    const newNode = {
      type: 'root',
      children: this.node()
    };
    return newNode as Root;
  });

  markdown = computed(() => {
    const mdastNode = this.mdastNode();
    const proc = this.processor();
    if (!mdastNode || !proc) return '';
    return proc().use(remarkStringify).stringify(mdastNode);
  });

  isOpen = signal(false); 

  toggleOutline() {
    if (this.outlineType() === 'AIDE') {
      this.isOpen.update(v => !v);
    }
  }
}

