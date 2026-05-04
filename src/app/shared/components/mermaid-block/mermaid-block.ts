import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, resource, signal, viewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { Theming } from "@shared/services/theming/theming";
import mermaid from 'mermaid';

@Component({
  selector: 'app-mermaid-block',
  template: `
  <div #container></div>
  <div [innerHTML]="svg.value()"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MermaidBlock {
  el = viewChild.required<ElementRef>('container');
  code = input.required<string>();

  sanitizer = inject(DomSanitizer);
  theming = inject(Theming);

  mermaidTheme = computed<'default' | 'dark'>(() => this.theming.resolvedTheme() === 'dark' ? 'dark' : 'default');

  svg = resource({
    params: () => ({
      code: this.code(),
      el: this.el(),
      theme: this.mermaidTheme()
    }),
    loader: ({params: {code, el, theme}}) => this.render(code, el, theme),
    defaultValue: "loading"
  });

  async render(code: string, el: ElementRef, theme: 'default' | 'dark') {
    try {
      if(!el.nativeElement.id) {
        el.nativeElement.id = `mermaid-${crypto.randomUUID()}`;
      }
      mermaid.initialize({
        theme: theme,
        securityLevel: 'loose',
      });
      const {svg} = await mermaid.render(el.nativeElement.id, code);
      return this.sanitizer.bypassSecurityTrustHtml(svg);
    }
    catch(err) {
      console.error(err);
      return (err as Error).message;
    }
  }
}