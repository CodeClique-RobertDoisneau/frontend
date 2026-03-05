import { ChangeDetectionStrategy, Component, input, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { httpResource } from '@angular/common/http';
import { NodeInfo } from '../../services/node.service';

@Component({
  selector: 'app-chapter-card',
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './chapter-card.html',
  styleUrl: './chapter-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterCard {
  id = input.required<number | string>();

  chapterInfo = httpResource<NodeInfo>(() => `/api/nodes/${this.id()}/`);

  constructor() {
    effect(() => {
      const ch = this.chapterInfo.value();
    });
  }
}