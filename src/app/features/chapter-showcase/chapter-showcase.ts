import { Component, ChangeDetectionStrategy, input, computed, inject, effect } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { NodeInfo } from '@shared/services/node.service';
import { httpResource } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { SectionCard } from './components/section-card/section-card';
import { MatListModule } from '@angular/material/list';
import { BreadcrumbService } from '@shared/services/breadcrumb.service';

@Component({
  selector: 'app-chapter-showcase',
  imports: [MatProgressSpinnerModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule, MatExpansionModule, SectionCard, MatListModule],
  templateUrl: './chapter-showcase.html',
  styleUrl: './chapter-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterShowcase {
  readonly id = input.required<string>();
  private breadcrumbService = inject(BreadcrumbService);

  chapterInfo = httpResource<NodeInfo>(() => `/api/nodes/${this.id()}/`);

  sectionIds = computed(
    () => {
      const node = this.chapterInfo.value();
      if (!node || !node.children) return [];
      return node.children.map(
        (child: any) => {
          if (typeof child === 'object') {
            return (child.child && child.child.id) ? child.child.id : child.id;
          }
          return child;
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