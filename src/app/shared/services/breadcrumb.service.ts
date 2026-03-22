import { Injectable, signal } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  /**
   * Current breadcrumb items to display.
   */
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  /**
   * Temp storage for the last chapter visited, 
   * to allow "re-building" the breadcrumb on a course page.
   */
  private lastChapter = signal<{id: string | number, title: string} | null>(null);

  setBreadcrumbs(items: BreadcrumbItem[]) {
    this.breadcrumbs.set(items);
  }

  setLastChapter(id: string | number, title: string) {
    this.lastChapter.set({ id, title });
  }

  getLastChapter() {
    return this.lastChapter();
  }

  /**
   * Helper to build the default chapter path.
   */
  getChapterBreadcrumbs(chapterTitle: string, chapterId: string | number): BreadcrumbItem[] {
    return [
      { label: chapterTitle, url: `/chapter/${chapterId}` }
    ];
  }

}
