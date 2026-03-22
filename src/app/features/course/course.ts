import { Component, ChangeDetectionStrategy, input, inject, computed, effect, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CourseService, Item, Section, NodeInfo } from '../../shared/services/node.service';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Location } from '@angular/common';
import { CustomPaginatorIntl } from '@shared/providers/custom-paginator-intl';
import { Pyodide } from '@shared/services/pyodide/pyodide';

interface TocNode {
  name: string;
  level: number;
  children?: TocNode[];
}

@Component({
  selector: 'app-course',
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTreeModule,
    MarkdownViewer
  ],
  templateUrl: './course.html',
  styleUrl: './course.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [Pyodide, { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }]
})
export class Course {
  readonly id = input.required<string>(); // Item ID from route
  pyodide = inject(Pyodide);

  private courseService = inject(CourseService);
  private location = inject(Location);
  private router = inject(Router);

  error = signal('');
  isVerifying = signal(false);
  successMessage = signal('');

  // Tree control for TOC
  treeControl = new NestedTreeControl<TocNode>((node: TocNode) => node.children);
  dataSource = new MatTreeNestedDataSource<TocNode>();

  // Combined data signal: Item + Section (using the first section as context)
  readonly data = toSignal(
    toObservable(this.id).pipe(
      switchMap((id: string) => this.courseService.getNode(id)),
      switchMap((item: NodeInfo) => {
        // If item has no children (sections), return just item with undefined section
        if (!item.children || item.children.length === 0) {
          return [{ item, section: undefined }];
        }
        // Extract section ID (could be number or NodeInfo object)
        const firstSection = item.children[0];
        const sectionId = typeof firstSection === 'object' ? firstSection.id : firstSection;
        return this.courseService.getNode(sectionId).pipe(
          map((section: NodeInfo) => ({ item, section }))
        );
      }),
      catchError((err: any) => {
        if (err.status === 403) {
          this.error.set("Vous n'êtes pas autorisé à accéder à cette page.");
        } else {
          this.error.set('Erreur lors du chargement du cours.');
        }
        return of(null);
      })
    )
  );

  // Compute TOC from markdown content
  readonly toc = computed(() => {
    const content = this.data()?.item.content?.data;
    if (!content || typeof content !== 'string') return [];
    return this.buildToc(content);
  });

  // Compute current page index for paginator
  readonly currentIndex = computed(() => {
    const d = this.data();
    if (!d || !d.section || !d.section.children) return 0;
    const index = d.section.children.findIndex((i: any) => i.id === d.item.id);
    return index >= 0 ? index : 0;
  });

  constructor() {
    // Update tree data source when toc changes
    effect(() => {
      const d = this.data();
      if (d?.item) {
        console.log('Current item:', d.item);
        console.log('Item type:', d.item.type);
      }
      this.dataSource.data = this.toc();
      this.treeControl.dataNodes = this.toc();
      this.treeControl.expandAll(); // Default to expanded
    });
  }

  goBack() {
    const d = this.data();
    if (d && d.section && d.section.children && d.section.children.length > 0) {
      // Navigate to the first parent chapter
      this.router.navigate(['/chapter', d.section.children[0]]);
    } else {
      // Fallback to simpler history back if no chapter context is found
      this.location.back();
    }
  }

  onPageChange(event: PageEvent) {
    const d = this.data();
    if (!d || !d.section || !d.section.children) return;

    // MatPaginator index is 0-based, matches array index
    const nextItem = d.section.children[event.pageIndex] as any;
    if (nextItem) {
      this.router.navigate(['/course', nextItem.id || nextItem]);
    }
  }

  onVerify() {
    this.isVerifying.set(true);
    // For now, support lessons verification (empty submission). Quizzes and Exercises will need specific submissions later.
    this.courseService.verifyNode(this.id()).subscribe({
      next: (res) => {
        this.isVerifying.set(false);
        this.successMessage.set('Terminé !');
        // Let user see success message for a brief moment before moving to next item
        setTimeout(() => {
          this.successMessage.set('');
          this.goToNext();
        }, 1500);
      },
      error: () => {
        this.isVerifying.set(false);
        this.error.set("Erreur lors de la validation.");
      }
    });
  }

  goToNext() {
    const d = this.data();
    if (!d || !d.section || !d.section.children) return;
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex < d.section.children.length) {
      const nextItem = d.section.children[nextIndex] as any;
      if (nextItem) {
        this.router.navigate(['/course', nextItem.id || nextItem]);
      }
    } else {
      // Si fin de section, revenir au chapitre
      this.goBack();
    }
  }

  hasChild = (_: number, node: TocNode) => !!node.children && node.children.length > 0;

  scrollToHeader(name: string) {
    // Simple scroll by text content matching
    // In a real app with marked, we might use slugs, but this works for "jump to header"
    const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const target = elements.find(el => el.textContent?.trim() === name.trim());
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private buildToc(content: string): TocNode[] {
    const lines = content.split('\n');
    const root: TocNode = { name: 'root', level: 0, children: [] };
    const stack: TocNode[] = [root];

    const headerRegex = /^(#{1,6})\s+(.+)$/;

    for (const line of lines) {
      const match = line.match(headerRegex);
      if (match) {
        const level = match[1].length;
        const name = match[2];
        const node: TocNode = { name, level, children: [] };

        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        const parent = stack[stack.length - 1];
        if (parent.children) {
          parent.children.push(node);
        }
        stack.push(node);
      }
    }

    return root.children || [];
  }

  readonly isAlreadyFinished = computed(() => {
    const d = this.data();
    return !!d?.item.user_progress?.done;
  });
}

