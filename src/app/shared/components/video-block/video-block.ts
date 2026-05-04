import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video-block',
  imports: [],
  templateUrl: './video-block.html',
  styleUrl: './video-block.scss',
})
export class VideoBlock {
  private sanitizer = inject(DomSanitizer);
  link = input<string>('');
  safeLink = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.link()));
}
