import { Component, ChangeDetectionStrategy, input, computed, signal, effect } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TocNode {
  name: string;
  level: number;
  children?: TocNode[];
}

@Component({
  selector: 'app-toc',
  imports: [NgTemplateOutlet, MatButtonModule, MatIconModule],
  templateUrl: './toc.html',
  styleUrl: './toc.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toc {
  content = input.required<string>();

  readonly toc = computed(() => this.buildToc(this.content()));
  
  // Reactive Signal to manage expanded state of heading items
  readonly expandedNodes = signal<Set<string>>(new Set<string>());

  constructor() {
    // Automatically expand all hierarchical parent headings by default when data loads
    effect(() => {
      const nodes = this.toc();
      const newExpanded = new Set<string>();
      
      const traverse = (item: TocNode) => {
        if (item.children && item.children.length > 0) {
          newExpanded.add(item.name);
          item.children.forEach(traverse);
        }
      };
      
      nodes.forEach(traverse);
      this.expandedNodes.set(newExpanded);
    });
  }

  isExpanded(name: string): boolean {
    return this.expandedNodes().has(name);
  }

  toggleNode(name: string) {
    const current = new Set(this.expandedNodes());
    if (current.has(name)) {
      current.delete(name);
    } else {
      current.add(name);
    }
    this.expandedNodes.set(current);
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
    const headerRegex = /^ {0,3}(#{1,6})(?:\s+(.+?))?(?:\s+#+\s*)?$/;
    let inFencedBlock = false;

    for (const line of lines) {
      // Track fenced code blocks to skip headers inside code examples
      if (/^ {0,3}(`{3,}|~{3,})/.test(line)) {
        inFencedBlock = !inFencedBlock;
        continue;
      }
      if (inFencedBlock) continue;

      const match = line.match(headerRegex);
      if (match && match[2]) {
        const level = match[1].length;
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
