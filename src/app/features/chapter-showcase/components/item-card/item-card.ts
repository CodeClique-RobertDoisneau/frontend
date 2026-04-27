import { Component, input, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';


import { NodeInfo, TYPE_LABELS } from '@shared/services/node.service';


@Component({
  selector: 'app-item-card',
  imports: [MatIconModule, MatChipsModule, MatDividerModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './item-card.html',
  styleUrl: './item-card.scss',
})

export class ItemCard {
  readonly id = input.required<string>();
  private router = inject(Router);

  itemInfo = httpResource<NodeInfo>(() => `/api/nodes/${this.id()}/`);

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

  isDone = computed(() => {
    const node = this.itemInfo.value();
    return !!node?.user_progress?.done;
  });

}

