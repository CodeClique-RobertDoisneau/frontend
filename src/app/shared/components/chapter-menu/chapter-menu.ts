import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { SectionExpansionPanel } from '@shared/components/section-expansion-panel/section-expansion-panel';
import { Chapter } from '@shared/services/node.service';

@Component({
  selector: 'app-chapter-menu',
  imports: [MatAccordion, SectionExpansionPanel],
  template: `
    <mat-accordion class="chapter-menu" multi>
      @for (section of chapter().children; track section.id) {
        <app-section-expansion-panel [section]="section"></app-section-expansion-panel>
      } @empty {
        <div class="empty-message">
          No sections available in this chapter.
        </div>
      }
    </mat-accordion>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .chapter-menu {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .empty-message {
      text-align: center;
      padding: 32px;
      color: var(--mat-sys-outline);
      font-style: italic;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterMenu {
  readonly chapter = input.required<Chapter>();
}
