import { Component, ElementRef, viewChild, signal, computed, input, inject, effect, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChapterCard } from '@shared/components/chapter-card/chapter-card';
import { Persona } from '@shared/components/persona/persona';
import { NodeInfo, Node } from '@shared/services/node/node';


@Component({
  selector: 'app-horizontal-slider',
  templateUrl: './horizontal-slider.html',
  styleUrl: './horizontal-slider.scss',
  imports: [ChapterCard, MatButtonModule, MatIconModule, MatProgressSpinnerModule, Persona],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorizontalSlider {
  id = input.required<number | string>();
  private nodeService = inject(Node);
  nodeInfo = this.nodeService.getNode(() => this.id());

  chapters = computed(
    () => {
      const data = this.nodeInfo.value();
      if (!data || !data.children) return [];
      return data.children;
    }
  );

  scrollContainer = viewChild<ElementRef<HTMLElement>>('sliderContent');

  scrollPosition = signal(0);
  maxScroll = signal(0);

  showLeftArrow = computed(() => this.scrollPosition() > 5);
  showRightArrow = computed(() => this.scrollPosition() < (this.maxScroll() - 5));

  constructor() {
    effect(() => {
      const list = this.chapters();
      if (list.length > 0) {
        setTimeout(() => this.updateMetrics(), 150);
      }
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.updateMetrics();
  }

  scroll(offset: number) {
    const el = this.scrollContainer()?.nativeElement;
    el?.scrollBy({ left: offset, behavior: 'smooth' });
  }

  onScroll(event: Event) {
    const el = event.target as HTMLElement;
    this.scrollPosition.set(el.scrollLeft);
    this.maxScroll.set(el.scrollWidth - el.clientWidth);
  }

  updateMetrics() {
    const el = this.scrollContainer()?.nativeElement;
    if (el) {
      this.maxScroll.set(el.scrollWidth - el.clientWidth);
    }
  }
}