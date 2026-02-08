import { Component, computed, HostListener, signal, ViewEncapsulation, ChangeDetectionStrategy, inject, ElementRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { RemarkModule, KatexComponent } from 'ngx-remark';

import { CodeBlock } from 'app/shared/components/code-block/code-block';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Pyodide } from '@shared/services/pyodide/pyodide';


@Component({
  selector: 'app-live-presentation',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RemarkModule, CodeBlock, KatexComponent, MatProgressBarModule, MatCardModule],
  templateUrl: './live-presentation.html',
  styleUrls: ['./live-presentation.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LivePresentation {
  private readonly pyodide = inject(Pyodide);
  @ViewChild('presentationContainer') presentationContainer!: ElementRef;

  // State
  rawMarkdown = signal('');
  isFullscreen = signal(false);

  slides = computed(() => {
    const raw = this.rawMarkdown();
    if (!raw) return [];
    //On slide le markdown en different slide en regardant les `---`, les `#` et les `##`
    // First split by explicit separator ---
    const explicitSections = raw.split(/^---$/m);

    const result: string[] = [];
    for (const section of explicitSections) {
      // For each section, split BEFORE any # or ## using positive lookahead
      // to keep the headers at the start of the slides
      const headSections = section.split(/(?=^#{1,2}\s)/m);
      for (const s of headSections) {
        const trimmed = s.trim();
        if (trimmed) {
          result.push(trimmed);
        }
      }
    }
    return result;
  });

  currentSlideIndex = signal(0);

  currentSlide = computed(() => {
    const slides = this.slides();
    const index = this.currentSlideIndex();
    return slides[index] || '';
  });




  //-----------------------Plein ecran-----------------------
  SwitchScreenSize() {
    const element = this.presentationContainer.nativeElement;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch((err: any) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange() {
    this.isFullscreen.set(!!document.fullscreenElement);
  }




  //-----------------------Gestion pour passer d'un slide a l'autre-----------------------
  hasPrevious = computed(() => this.currentSlideIndex() > 0);
  hasNext = computed(() => this.currentSlideIndex() < this.slides().length - 1);

  // Markdow Processor
  processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

  next() {
    if (this.hasNext()) {
      this.currentSlideIndex.update(i => i + 1);
    }
  }

  prev() {
    if (this.hasPrevious()) {
      this.currentSlideIndex.update(i => i - 1);
    }
  }

  //-----------------------Temporaire | Sert a charger un fichier markdown-----------------------  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.pyodide.load();
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result as string;
        this.rawMarkdown.set(text);
        this.currentSlideIndex.set(0);
      };

      reader.readAsText(file);
    }
  }
}
