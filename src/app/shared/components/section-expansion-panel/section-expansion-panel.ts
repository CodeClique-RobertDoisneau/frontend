import { Component, ChangeDetectionStrategy, input, inject, signal, forwardRef } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
// import { RouterLink } from '@angular/router';
import { CourseService, Section, Item, NodeInfo } from '@shared/services/node.service';
import { ChapterChild } from '@shared/components/chapter-child/chapter-child';

@Component({
  selector: 'app-section-expansion-panel',
  imports: [MatExpansionModule, MatListModule, MatIconModule, MatProgressBarModule, MatButtonModule, MatChipsModule, forwardRef(() => ChapterChild)],
  templateUrl: './section-expansion-panel.html',
  styleUrl: './section-expansion-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionExpansionPanel {
  readonly section = input.required<Section>();

  private courseService = inject(CourseService);

  readonly progress = signal(Math.floor(Math.random() * 100));
  readonly items = signal<any[] | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly error = signal(false);

  private hasLoaded = false;

  onOpen() {
    if (this.hasLoaded) return;

    this.isLoading.set(true);
    this.hasLoaded = true;

    this.courseService.getNode(this.section().id).subscribe({
      next: (fullSection: NodeInfo) => {
        this.items.set(fullSection.children as any[]);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.isLoading.set(false);
      }
    });
  }

  getItemIcon(type: string | undefined): string {
    switch (type) {
      case 'LESSON': return 'menu_book';
      case 'EXERCICE': return 'code';
      case 'QUIZZ': return 'quiz';
      default: return 'article';
    }
  }

  isItemCompleted(id: any): boolean {
    return (Number(id) % 2) === 0;
  }

  getDifficultyLabel(difficulty: number | undefined): string {
    if (!difficulty || difficulty <= 1) return 'Facile';
    if (difficulty === 2) return 'Moyen';
    return 'Difficile';
  }

  getDifficultyClass(difficulty: number | undefined): string {
    if (!difficulty || difficulty <= 1) return 'easy';
    if (difficulty === 2) return 'medium';
    return 'hard';
  }
}
