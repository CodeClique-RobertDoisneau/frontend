import { Component, ElementRef, viewChild, signal, computed, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChapterCard } from '@shared/components/chapter-card/chapter-card';
import { Persona } from '@shared/components/persona/persona';
import { NodeInfo } from '@shared/services/node.service';


@Component({
  selector: 'app-horizontal-slider',
  templateUrl: './horizontal-slider.html',
  styleUrls: ['./horizontal-slider.scss'],
  imports: [ChapterCard, MatButtonModule, MatIconModule, MatProgressSpinnerModule, Persona],
})
export class HorizontalSlider {
  id = input.required<number | string>();
  nodeInfo = httpResource<NodeInfo>(() => `/api/nodes/${this.id()}/`);

  chapters = computed(
    () => {
      const data = this.nodeInfo.value();
      if (!data || !data.children) return [];
      return data.children;
    }
  );


  getChapterId(child: any): string {
    if (typeof child === 'object') {
      return (child.child && child.child.id) ? child.child.id : child.id;
    }
    return child;
  }


  scrollContainer = viewChild<ElementRef<HTMLElement>>('sliderContent');

  scrollPosition = signal(0);
  maxScroll = signal(10);

  showLeftArrow = computed(() => this.scrollPosition() > 5);
  showRightArrow = computed(() => this.scrollPosition() < (this.maxScroll() - 5));

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
    if (el) this.maxScroll.set(el.scrollWidth - el.clientWidth);
  }
}