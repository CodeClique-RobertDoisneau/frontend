import { Component, ChangeDetectionStrategy, input, computed, viewChild, effect } from '@angular/core';
import { MatTreeModule, MatTree } from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TocNode {
  name: string;
  level: number;
  children?: TocNode[];
}

@Component({
  selector: 'app-toc',
  imports: [MatTreeModule, MatButtonModule, MatIconModule],
  templateUrl: './toc.html',
  styleUrl: './toc.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toc {
  content = input.required<string>();
  tree = viewChild<MatTree<TocNode>>('tree');

  childrenAccessor = (node: TocNode) => node.children ?? [];
  hasChild = (_: number, node: TocNode) => !!node.children && node.children.length > 0;

  readonly toc = computed(() => this.buildToc(this.content()));

  constructor() {
    effect(() => {
      if (this.toc().length > 0) {
        // expandAll must run after the tree renders with new data
        setTimeout(() => this.tree()?.expandAll(), 0);
      }
    });
  }

  scrollToHeader(event: Event, name: string) {
    event.preventDefault();
    event.stopPropagation();
    const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const target = elements.find(el => el.textContent?.trim() === name.trim());
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private buildToc(content: string): TocNode[] {
    if (!content) return [];
    const lines = content.split('\n');
    const root: TocNode = { name: 'root', level: 0, children: [] };
    const stack: TocNode[] = [root];
    // Must start at column 0 (or up to 3 spaces) and be a proper ATX heading
    const headerRegex = /^ {0,3}(#{1,6})(?:\s+(.+?))?(?:\s+#+\s*)?$/;
    let inFencedBlock = false;

    for (const line of lines) {
      // Track fenced code blocks (``` or ~~~)
      if (/^ {0,3}(`{3,}|~{3,})/.test(line)) {
        inFencedBlock = !inFencedBlock;
        continue;
      }
      if (inFencedBlock) continue;

      const match = line.match(headerRegex);
      // Require at least one space after # and a non-empty title
      if (match && match[2]) {
        const level = match[1].length;
        // Strip inline markdown: bold, italic, code, links
        const name = match[2]
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/__(.+?)__/g, '$1')
          .replace(/_(.+?)_/g, '$1')
          .replace(/`(.+?)`/g, '$1')
          .replace(/\[(.+?)\]\(.+?\)/g, '$1')
          .trim();

        if (!name) continue;

        const node: TocNode = { name, level, children: [] };
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }
        const parent = stack[stack.length - 1];
        if (parent.children) parent.children.push(node);
        stack.push(node);
      }
    }
    return root.children || [];
  }
}
