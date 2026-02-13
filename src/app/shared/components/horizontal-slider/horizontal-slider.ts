import { Component, ElementRef, viewChild, signal, computed } from '@angular/core';
import { ChapterCard, ChapterInfo } from '../chapter-card/chapter-card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { httpResource } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Persona } from '../persona/persona';

@Component({
  selector: 'app-horizontal-slider',
  templateUrl: './horizontal-slider.html',
  styleUrls: ['./horizontal-slider.scss'],
  imports: [ChapterCard, MatButtonModule, MatIconModule, MatProgressSpinnerModule, Persona],
})
export class HorizontalSlider {
  apiPath = '/api/chapter/';
  chapters = httpResource<ChapterInfo[]>(() => this.apiPath);
  sliderContent = viewChild<ElementRef<HTMLElement>>('sliderContent');

  hasData = computed(() => (this.chapters.value()?.length ?? 0) > 0);

  scroll(offset: number) {
    const el = this.sliderContent()?.nativeElement;
    el?.scrollBy({ left: offset, behavior: 'smooth' });
  }

  private scrollContainer = viewChild<ElementRef<HTMLElement>>('sliderContent');

  // Track the scroll position
  scrollPosition = signal(0);
  maxScroll = signal(10);

  // Determine visibility
  showLeftArrow = computed(() => this.scrollPosition() > 5);
  showRightArrow = computed(() => {
    // Hide if we are within 5px of the end
    return this.scrollPosition() < (this.maxScroll() - 5);
  });

  onScroll(event: Event) {
    const el = event.target as HTMLElement;
    this.scrollPosition.set(el.scrollLeft);
    this.maxScroll.set(el.scrollWidth - el.clientWidth);
  }

  updateMetrics() {
    const el = this.scrollContainer()?.nativeElement;
    if (el) this.maxScroll.set(el.scrollWidth - el.clientWidth);
  }
}