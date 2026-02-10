import { Component, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';

@Component({
  selector: 'app-test-viewer',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MarkdownViewer],
  templateUrl: './test-viewer.html',
  styleUrl: './test-viewer.scss',
})
export class TestViewer {
  markdown = signal<string>('');
  fileLoading = signal(false);
  fileError = signal<string | null>(null);

  async onFileSelected(event: Event): Promise<void> {
    this.fileLoading.set(true);
    this.fileError.set(null);

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.fileLoading.set(false);
      this.fileError.set('No file selected');
      return;
    }

    const markdownContent = await file.text();
    this.markdown.set(markdownContent);
    this.fileLoading.set(false);
    input.value = '';
  }
}
