import { Component, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChapterCard, ChapterInfo } from '../chapter-card/chapter-card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { httpResource } from '@angular/common/http';

@Component({
  selector: 'app-horizontal-slider',
  templateUrl: './horizontal-slider.html',
  styleUrls: ['./horizontal-slider.scss'],
  imports: [ChapterCard, CommonModule, MatButtonModule, MatIconModule],
})
export class HorizontalSlider {
  // Lien api pour trouver la liste des chapitres
  apiPath = computed(() => 'http://localhost/api/chapter/');

  // Récupère les chapitres
  chapters = httpResource<ChapterInfo[]>(() => this.apiPath());

  // On cible l'élément HTML qui a l'id #sliderContent
  @ViewChild('sliderContent') sliderContent!: ElementRef;

  scrollLeft() {
    this.sliderContent.nativeElement.scrollBy({
      left: -600,
      behavior: 'smooth',
    });
  }

  scrollRight() {
    this.sliderContent.nativeElement.scrollBy({
      left: 600,
      behavior: 'smooth',
    });
  }
}
