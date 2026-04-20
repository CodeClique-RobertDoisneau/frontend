import { Component, inject, input, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
import { visit } from 'unist-util-visit';
import remarkDirectiveTransformer from './utils/directive-transformer';
import { RemarkModule, KatexComponent } from 'ngx-remark';

import { CodeBlock } from '@shared/components/code-block/code-block';
import { Outline } from '@shared/components/outline/outline'
import { Pyodide } from '@shared/services/pyodide/pyodide';

const ALLOWED_IFRAME_HOSTS = ['www.youtube-nocookie.com', 'player.vimeo.com'];

function remarkIframeWhitelist() {
  return (tree: any) => {
    visit(tree, 'html', (node: any) => {
      const srcMatch = node.value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
      if (!srcMatch) return;
      try {
        const url = new URL(srcMatch[1]);
        if (!ALLOWED_IFRAME_HOSTS.includes(url.hostname)) return;
        const w = node.value.match(/\swidth=["']?(\d+)/i);
        const h = node.value.match(/\sheight=["']?(\d+)/i);
        node.type = 'safeIframe';
        node.src = srcMatch[1];
        node.width = w ? w[1] : '800';
        node.height = h ? h[1] : '450';
      } catch {}
    });
  };
}

@Component({
  selector: 'app-markdown-viewer',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, RemarkModule, KatexComponent, CodeBlock, Outline],
  templateUrl: './markdown-viewer.html',
  styleUrls: ['./markdown-viewer.scss', './markdown.scss'],
  encapsulation: ViewEncapsulation.None, // Pour markdown.css
})
export class MarkdownViewer implements OnInit{
  private sanitizer = inject(DomSanitizer);
  pyodide = input<Pyodide>();
  markdown = input<string>('');
  packages = input<string[]>([]);

  ngOnInit() {
    const engine = this.pyodide();
    engine?.init(this.packages());
  }

  trustUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  processor = unified().use(remarkParse).use(remarkGfm).use(remarkDirective).use(remarkDirectiveTransformer).use(remarkIframeWhitelist).use(remarkMath);
}
