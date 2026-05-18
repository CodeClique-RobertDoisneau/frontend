import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { NodeInfo } from '@shared/services/node/node';

@Component({
  selector: 'app-chapter-card',
  imports: [CommonModule, MatCardModule, MatButtonModule, RouterLink],
  templateUrl: './chapter-card.html',
  styleUrl: './chapter-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterCard {
  chapter = input.required<NodeInfo>();
}