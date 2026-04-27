import { Component, ChangeDetectionStrategy, input, inject, computed, effect, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Location } from '@angular/common';


import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';


import { QuizComponent } from '@shared/components/quiz/quiz';
import { NodeService, NodeInfo } from '@shared/services/node.service';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { CustomPaginatorIntl } from '@shared/providers/custom-paginator-intl';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { BreadcrumbService, BreadcrumbItem } from '@shared/services/breadcrumb.service';
import { AuthService } from '@shared/services/auth.service';

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
    MatSidenavModule,
    FormsModule,
    MarkdownViewer,
    QuizComponent
  ],
  templateUrl: './course.html',
  styleUrl: './course.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [Pyodide, { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }]
})
export class Course {
  readonly id = input.required<string>(); // Item ID from route
  pyodide = inject(Pyodide);

  private NodeService = inject(NodeService);
  private location = inject(Location);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private breadcrumbService = inject(BreadcrumbService);
  private authService = inject(AuthService);

  reviewMode = signal(false);
  restartMode = signal(false);



  error = signal('');
  isVerifying = signal(false);
  successMessage = signal('');

  // Tree control for TOC
  treeControl = new NestedTreeControl<TocNode>((node: TocNode) => node.children);
  dataSource = new MatTreeNestedDataSource<TocNode>();

  // Combined data signal: Item + Section (using the first section as context)
  readonly data = toSignal(
    toObservable(this.id).pipe(
      switchMap((id: string) => this.NodeService.getNode(id)),
      switchMap((item: NodeInfo) => {
        // If item has no children (sections), return just item with undefined section
        if (!item.children || item.children.length === 0) {
          return [{ item, section: undefined }];
        }
        // Extract section ID (could be number or NodeInfo object)
        const firstSection = item.children[0];
        const sectionId = typeof firstSection === 'object' ? firstSection.id : firstSection;
        return this.NodeService.getNode(sectionId).pipe(
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
    const content = this.data()?.item.content?.content;
    if (!content || typeof content !== 'string') return [];
    return this.buildToc(content);
  });

  constructor() {
    // Update tree data source and breadcrumb when data changes
    effect(() => {
      const d = this.data();
      if (d?.item) {
        // Build breadcrumb
        const lastChapter = this.breadcrumbService.getLastChapter();
        const crumbs: BreadcrumbItem[] = [];

        if (lastChapter) {
          crumbs.push({ label: lastChapter.title, url: `/chapter/${lastChapter.id}` });
        }
        crumbs.push({ label: d.item.title });
        this.breadcrumbService.setBreadcrumbs(crumbs);


        console.log('Current item:', d.item);
        console.log('Item type:', d.item.type);
      }
      this.dataSource.data = this.toc();
      this.treeControl.dataNodes = this.toc();
      this.treeControl.expandAll(); // Default to expanded
    });

    // Ensure we have the user state for isEditor()
    if (!this.authService.currentUser()) {
      this.authService.getMe().subscribe();
    }

    // Check initial queryParams for ?review=true, ?restart=true
    this.route.queryParams.subscribe(params => {
      this.reviewMode.set(params['review'] === 'true');
      this.restartMode.set(params['restart'] === 'true');
    });

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

  doRestart() {
    this.router.navigate([], { relativeTo: this.route, queryParams: { restart: 'true', review: null }, queryParamsHandling: 'merge' });
  }

  onVerify() {
    this.isVerifying.set(true);
    // For now, support lessons verification (empty submission).
    const d = this.data();
    if (!d) {
      this.isVerifying.set(false);
      return;
    }

    this.NodeService.verifyNode(this.id(), null, d.item.modified_at).subscribe({
      next: (res) => {
        this.isVerifying.set(false);
        this.successMessage.set('Terminé !');
        // Let user see success message for a brief moment before moving to next item
        setTimeout(() => {
          this.successMessage.set('');
        }, 1500);
      },
      error: () => {
        this.isVerifying.set(false);
        this.error.set("Erreur lors de la validation.");
      }
    });
  }

  hasChild = (_: number, node: TocNode) => !!node.children && node.children.length > 0;

  //Permet de scroller automatiquement avec le sommaire
  scrollToHeader(name: string) {
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
