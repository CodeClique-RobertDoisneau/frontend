import { ChangeDetectionStrategy, Component, input, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { httpResource } from '@angular/common/http';


export interface ChapterInfo {
  id: number;
  title: string;
  description: string;
  grade_level: string;
  created_at: Date;
  modified_at: Date;
  sections: SectionInfo[];
}


export interface SectionInfo {
  id: number;
  title: string;
  difficulty: number;
}

@Component({
  selector: 'app-chapter-card',
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './chapter-card.html',
  styleUrl: './chapter-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterCard {
  id = input<number>();

  chapterInfo = httpResource<ChapterInfo>(() => this.id() ? `/api/chapter/${this.id()}/` : undefined);
}