import { Component, inject, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Lesson } from '../course/components/lesson/lesson';
import { Pyodide } from '@shared/services/pyodide/pyodide';

@Component({
  selector: 'app-test-viewer',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, Lesson],
  templateUrl: './test-viewer.html',
  styleUrl: './test-viewer.scss',
  providers: [Pyodide],
})
export class TestViewer {
  pyodide = inject(Pyodide);
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
