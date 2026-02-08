import { Component } from '@angular/core';
import { LivePresentation } from '@shared/components/live-presentation/live-presentation';
import { Statistics } from '@shared/components/statistics/statistics';
import { MatCardModule } from '@angular/material/card';
export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}


@Component({
  selector: 'app-chapter',
  imports: [LivePresentation, Statistics, MatCardModule],
  templateUrl: './chapter.html',
  styleUrl: './chapter.scss',
})
export class Chapter {

}
