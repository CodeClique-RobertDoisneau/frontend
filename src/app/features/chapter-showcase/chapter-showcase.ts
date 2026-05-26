import { Component, ChangeDetectionStrategy, input, computed, inject, effect } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NodeInfo, GRADE_LABELS, SUBJECT_LABELS, Node, NodeLinkInfo } from '@shared/services/node/node';
import { MatExpansionModule } from '@angular/material/expansion';
import { SectionCard } from './components/section-card/section-card';
import { MatListModule } from '@angular/material/list';
import { BreadcrumbService } from '@shared/services/breadcrumb.service';
import { Tag } from '@shared/components/tag/tag';

@Component({
  selector: 'app-chapter-showcase',
  imports: [MatProgressSpinnerModule, MatButtonModule, MatIconModule, MatDividerModule, MatExpansionModule, SectionCard, MatListModule, Tag],
  templateUrl: './chapter-showcase.html',
  styleUrl: './chapter-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterShowcase {
  readonly id = input.required<string>();
  private breadcrumbService = inject(BreadcrumbService);
  private nodeService = inject(Node);

  //Necessaire pour pouvoir l'utiliser dans le .html
  GRADE_LABELS = GRADE_LABELS;
  SUBJECT_LABELS = SUBJECT_LABELS;

  chapterInfo = this.nodeService.getNode(() => this.id());

  sectionIds = computed(
    () => {
      const node = this.chapterInfo.value();
      if (!node || !node.children) return [];
      return node.children.map(
        (child: NodeLinkInfo) => {
          return child.child?.id ? child.child.id.toString() : child.id.toString();
        }
      );
    }
  );

  constructor() {
    effect(() => {
      const info = this.chapterInfo.value();
      if (info) {
        this.breadcrumbService.setBreadcrumbs(this.breadcrumbService.getChapterBreadcrumbs(info.title, info.id));
        this.breadcrumbService.setLastChapter(info.id, info.title);
      }
    });
  }
}