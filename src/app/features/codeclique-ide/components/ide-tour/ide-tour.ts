import { Component, input, output, signal, computed, ChangeDetectionStrategy, effect, HostListener } from '@angular/core';
import { NgStyle } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TourStep {
  title: string;
  content: string;
  selector?: string;
  position?: 'center' | 'left' | 'right' | 'bottom' | 'top';
  icon?: string;
}

@Component({
  selector: 'app-ide-tour',
  imports: [
    NgStyle,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './ide-tour.html',
  styleUrl: './ide-tour.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdeTour {
  steps = input.required<TourStep[]>();
  tourStep = signal<number>(0);
  
  close = output<void>();

  private trigger = signal<number>(0);
  private pollInterval: any = null;

  constructor() {
    effect((onCleanup) => {
      this.tourStep();
      this.steps();

      this.startPolling();

      onCleanup(() => {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      });
    });
  }

  private startPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    let count = 0;
    this.pollInterval = setInterval(() => {
      this.trigger.update(v => v + 1);
      count++;
      if (count >= 5) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    }, 100);
  }

  @HostListener('window:resize')
  onResize() {
    this.startPolling();
  }

  currentStep = computed(() => {
    const idx = this.tourStep();
    const list = this.steps();
    return idx >= 0 && idx < list.length ? list[idx] : null;
  });

  spotlightStyle = computed(() => {
    this.trigger();
    const step = this.currentStep();
    if (!step || !step.selector) return null;
    const el = document.querySelector(step.selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    };
  });

  cardStyle = computed(() => {
    this.trigger();
    const step = this.currentStep();
    if (!step) return null;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = 340; 
    const cardHeight = 220;

    if (viewportWidth <= 768) {
      return {
        bottom: '96px',
        left: '50%',
        transform: 'translateX(-50%)',
        position: 'fixed'
      };
    }

    if (!step.selector) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed'
      };
    }

    const el = document.querySelector(step.selector);
    if (!el) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed'
      };
    }

    const rect = el.getBoundingClientRect();
    let top = 0;
    let left = 0;

    if (step.position === 'left') {
      top = rect.top + rect.height / 2 - cardHeight / 2;
      left = rect.left - cardWidth - 20;
    } else if (step.position === 'right') {
      top = rect.top + rect.height / 2 - cardHeight / 2;
      left = rect.right + 20;
    } else if (step.position === 'top') {
      top = rect.top - cardHeight - 20;
      left = rect.left + rect.width / 2 - cardWidth / 2;
    } else {
      top = rect.bottom + 20;
      left = rect.left + rect.width / 2 - cardWidth / 2;
    }

    const padding = 20;
    left = Math.max(padding, Math.min(left, viewportWidth - cardWidth - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - cardHeight - padding));

    return {
      top: `${top}px`,
      left: `${left}px`,
      position: 'fixed'
    };
  });

  nextStep() {
    const nextIdx = this.tourStep() + 1;
    if (nextIdx < this.steps().length) {
      this.tourStep.set(nextIdx);
    } else {
      this.finishTour();
    }
  }

  prevStep() {
    const prevIdx = this.tourStep() - 1;
    if (prevIdx >= 0) {
      this.tourStep.set(prevIdx);
    }
  }

  finishTour() {
    this.close.emit();
  }
}
