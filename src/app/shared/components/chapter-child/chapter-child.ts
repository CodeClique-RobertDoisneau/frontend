import { Component, ChangeDetectionStrategy, input, computed, forwardRef } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NodeInfo } from '@shared/services/node.service';
import { SectionExpansionPanel } from '@shared/components/section-expansion-panel/section-expansion-panel';

@Component({
  selector: 'app-chapter-child',
  imports: [MatListModule, MatIconModule, MatChipsModule, RouterLink, MatProgressSpinnerModule, forwardRef(() => SectionExpansionPanel)],
  template: `
    @if (nodeInfo.isLoading()) {
      <div class="child-loading">Chargement...</div>
    } @else if (nodeInfo.value(); as node) {
      @if (isDirectContent()) {
        <!-- LE / QU / EX → item cliquable directement -->
        <a mat-list-item [routerLink]="['/course', node.id]" class="direct-item">
          <mat-icon matListItemIcon>{{ typeIcon() }}</mat-icon>
          <div matListItemTitle class="item-content">
            <span class="item-title">{{ node.title }}</span>
            <span class="item-type-badge">{{ typeLabel() }}</span>
          </div>
          @if (node.difficulty) {
            <div matListItemMeta class="meta-container">
              <mat-chip-set>
                <mat-chip class="compact-chip" [class]="difficultyClass()" highlighted disabled>
                  {{ difficultyLabel() }}
                </mat-chip>
              </mat-chip-set>
            </div>
          }
        </a>
      } @else {
        <!-- SE (section/partie) → expansion panel -->
        <app-section-expansion-panel [section]="node"></app-section-expansion-panel>
      }
    } @else if (nodeInfo.error()) {
      <div class="child-error">Erreur de chargement</div>
    }
  `,
  styles: [`
    .direct-item {
      cursor: pointer;
      border-radius: 8px;
      margin-bottom: 4px;
    }
    .direct-item:hover {
      background: var(--mat-sys-surface-variant, rgba(0,0,0,0.04));
    }
    .item-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .item-type-badge {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      background: var(--mat-sys-secondary-container, #e8def8);
      color: var(--mat-sys-on-secondary-container, #1d192b);
      font-weight: 500;
    }
    .meta-container {
      display: flex;
      align-items: center;
    }
    ::ng-deep .compact-chip .mdc-evolution-chip__cell {
      padding: 0 8px;
    }
    ::ng-deep .compact-chip .mdc-evolution-chip__text-label {
      font-size: 0.75rem;
    }
    .child-loading, .child-error {
      padding: 12px 16px;
      color: var(--mat-sys-outline);
      font-style: italic;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterChild {
  readonly id = input.required<number | string>();

  nodeInfo = httpResource<NodeInfo>(() => `/api/nodes/${this.id()}/`);

  isDirectContent = computed(() => {
    const node = this.nodeInfo.value();
    if (!node) return false;
    const t = node.type;
    return t === 'LE' || t === 'QU' || t === 'EX'
      || t === 'lesson' || t === 'quiz' || t === 'exercise';
  });

  typeIcon = computed(() => {
    const node = this.nodeInfo.value();
    if (!node) return 'article';
    switch (node.type) {
      case 'LE': case 'lesson': return 'menu_book';
      case 'QU': case 'quiz': return 'quiz';
      case 'EX': case 'exercise': return 'code';
      default: return 'article';
    }
  });

  typeLabel = computed(() => {
    const node = this.nodeInfo.value();
    if (!node) return '';
    switch (node.type) {
      case 'LE': case 'lesson': return 'Cours';
      case 'QU': case 'quiz': return 'Quiz';
      case 'EX': case 'exercise': return 'Exercice';
      default: return node.type;
    }
  });

  difficultyLabel = computed(() => {
    const d = this.nodeInfo.value()?.difficulty;
    if (!d || d <= 1) return 'Facile';
    if (d === 2) return 'Moyen';
    return 'Difficile';
  });

  difficultyClass = computed(() => {
    const d = this.nodeInfo.value()?.difficulty;
    if (!d || d <= 1) return 'easy';
    if (d === 2) return 'medium';
    return 'hard';
  });
}
