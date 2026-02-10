import { Component, ElementRef, input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChapterCard } from '../chapter-card/chapter-card';
import { MatAnchor, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-horizontal-slider',
  templateUrl: './horizontal-slider.html',
  styleUrls: ['./horizontal-slider.scss'],
  imports: [ChapterCard, CommonModule, MatAnchor, MatButtonModule, MatIconModule],
})
export class HorizontalSlider {
  // On reçoit la liste des éléments (films, produits, etc.)
  items = input<any>();

  // On cible l'élément HTML qui a l'id #sliderContent
  @ViewChild('sliderContent') sliderContent!: ElementRef;

  scrollLeft() {
    this.sliderContent.nativeElement.scrollBy({
      left: -600, // Distance de défilement vers la gauche
      behavior: 'smooth',
    });
  }

  scrollRight() {
    this.sliderContent.nativeElement.scrollBy({
      left: 600, // Distance de défilement vers la droite
      behavior: 'smooth',
    });
  }
}
