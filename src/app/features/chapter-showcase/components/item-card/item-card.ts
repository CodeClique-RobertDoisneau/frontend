import { Component, input, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Tag } from '@shared/components/tag/tag';


import { NodeInfo, TYPE_LABELS, Node } from '@shared/services/node/node';


@Component({
  selector: 'app-item-card',
  imports: [MatIconModule, MatDividerModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, Tag],
  templateUrl: './item-card.html',
  styleUrl: './item-card.scss',
})

export class ItemCard {
  readonly id = input.required<string>();
  private router = inject(Router);
  private nodeService = inject(Node);

  itemInfo = this.nodeService.getNode(() => this.id());

  onCardClick(event: Event, id: string | number) {
    this.router.navigate(['/course', id]);
  }

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
    // On utilise la clé node.type pour récupérer le label, sinon on renvoie le type brut
    return TYPE_LABELS[node.type] || node.type;
  });

  difficultyLabel = computed(() => {
    const node = this.itemInfo.value();
    const diff = node?.difficulty;
    if (!diff) return null;
    if (diff <= 1) return 'Facile';
    if (diff === 2) return 'Moyen';
    return 'Difficile';
  });

  isDone = computed(() => {
    const node = this.itemInfo.value();
    if (!node) return false;
    return node.progress?.status === 'CO' || !!node.user_progress?.done;
  });

}

