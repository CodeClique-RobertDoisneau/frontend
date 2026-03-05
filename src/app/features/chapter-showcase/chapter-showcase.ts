import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { NodeInfo } from '@shared/services/node.service';
import { ChapterChild } from '@shared/components/chapter-child/chapter-child';
import { httpResource } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';


@Component({
  selector: 'app-chapter-showcase',
  imports: [MatProgressSpinnerModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule, RouterLink, ChapterChild, MatExpansionModule],
  templateUrl: './chapter-showcase.html',
  styleUrl: './chapter-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterShowcase {
  readonly id = input.required<string>();

  chapterInfo = httpResource<NodeInfo>(() => `/api/nodes/${this.id()}/`);

  childIds = computed(
    () => {
      const node = this.chapterInfo.value();
      if (!node || !node.children) return [];
      return node.children.map(
        (child: any) => typeof child === 'object' ? child.id : child
      );
    }
  );
}