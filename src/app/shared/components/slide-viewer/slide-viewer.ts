import { Component, input, OnInit, ViewEncapsulation, signal, computed, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';

import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { Pyodide } from '@shared/services/pyodide/pyodide';

@Component({
  selector: 'app-slide-viewer',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MarkdownViewer
  ],
  templateUrl: './slide-viewer.html',
  styleUrls: ['./slide-viewer.scss', '../markdown-viewer/markdown.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SlideViewer implements OnInit, AfterViewInit {
  pyodide = input<Pyodide>();
  initialMarkdown = input<string>('', { alias: 'markdown' });
  packages = input<string[]>([]);

  rawMarkdown = signal<string>('');
  fileLoading = signal<boolean>(false);
  fileError = signal<string | null>(null);
  currentSlideIndex = signal<number>(0);
  isFullscreen = signal<boolean>(false);

  @ViewChild('presentationContainer') presentationContainer!: ElementRef;

  constructor() {
    effect(() => {
      const initial = this.initialMarkdown();
      if (initial) {
        this.rawMarkdown.set(initial);
      }
    });

    effect(() => {
      // Reset index when content changes
      this.rawMarkdown();
      this.currentSlideIndex.set(0);
    });
  }

  ngOnInit() {
    const engine = this.pyodide();
    engine?.init(this.packages());
  }

  ngAfterViewInit() {
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen.set(!!document.fullscreenElement);
    });
  }

  slides = computed(() => {
    const content = this.rawMarkdown();
    if (!content) return [];

    // Split by explicit separator ---
    const explicitSections = content.split(/^---$/m);

    const allSlides: string[] = [];
    explicitSections.forEach(section => {
      // Further split by headers # or ## using positive lookahead
      const headerSections = section.split(/(?=^#{1,2}\s)/m);
      headerSections.forEach(s => {
        const trimmed = s.trim();
        if (trimmed.length > 0) {
          allSlides.push(trimmed);
        }
      });
    });

    return allSlides;
  });

  currentMarkdown = computed(() => {
    const s = this.slides();
    const idx = this.currentSlideIndex();
    return s[idx] || '';
  });

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.fileLoading.set(true);
    this.fileError.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.rawMarkdown.set(e.target?.result as string);
      this.fileLoading.set(false);
    };
    reader.onerror = () => {
      this.fileError.set('Error reading file');
      this.fileLoading.set(false);
    };
    reader.readAsText(file);
  }

  next() {
    if (this.currentSlideIndex() < this.slides().length - 1) {
      this.currentSlideIndex.update(i => i + 1);
    }
  }

  prev() {
    if (this.currentSlideIndex() > 0) {
      this.currentSlideIndex.update(i => i - 1);
    }
  }

  SwitchScreenSize() {
    const container = this.presentationContainer.nativeElement;
    if (!this.isFullscreen()) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}
