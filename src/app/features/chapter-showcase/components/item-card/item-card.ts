import { Component, input, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { NodeInfo } from '@shared/services/node.service';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-item-card',
  imports: [MatIconModule, MatChipsModule, MatDividerModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './item-card.html',
  styleUrl: './item-card.scss',
})

export class ItemCard {
  readonly id = input.required<string>();

  itemInfo = httpResource<NodeInfo>(() => `/api/nodes/${this.id()}/`);


  typeIcon = computed(() => {
    const node = this.itemInfo.value();
    if (!node) return 'article';
    switch (node.type) {
      case 'LE': case 'lesson': return 'article';
      case 'QU': case 'quiz': return 'quiz';
      case 'EX': case 'exercise': return 'play_lesson';
      default: return 'article';
    }
  });

  typeLabel = computed(() => {
    const node = this.itemInfo.value();
    if (!node) return '';
    switch (node.type) {
      case 'LE': case 'lesson': return 'Cours';
      case 'QU': case 'quiz': return 'Quiz';
      case 'EX': case 'exercise': return 'Exercice';
      default: return node.type;
    }
  });

  isDone = computed(() => {
    const node = this.itemInfo.value();
    return !!node?.user_progress?.done;
  });

}

