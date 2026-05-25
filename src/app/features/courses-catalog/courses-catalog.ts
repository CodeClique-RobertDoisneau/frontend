import { Component, inject, signal, computed, resource, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HorizontalSlider } from '@shared/components/horizontal-slider/horizontal-slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { NodeInfo, Node, ClassGroupInfo, CatalogValue, GroupSyllabi, SUBJECT_LABELS, GRADE_LABELS } from '@shared/services/node/node';
import { BreadcrumbService } from '@shared/services/breadcrumb.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-courses-catalog',
  imports: [HorizontalSlider, MatChipsModule, MatIconModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './courses-catalog.html',
  styleUrl: './courses-catalog.scss',
})
export class CoursesCatalog implements OnInit {
  private NodeService = inject(Node);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private breadcrumbService = inject(BreadcrumbService);

  // Expose the single unified catalog resource from Node domain service
  catalogResource = this.NodeService.getCatalog();

  // Derived Reactive Computeds
  allSyllabi = computed(() => this.catalogResource.value()?.allSyllabi || []);
  classGroups = computed(() => this.catalogResource.value()?.groups || []);
  groupSyllabiMap = computed(() => this.catalogResource.value()?.groupSyllabiMap || []);

  isLoading = computed(() => this.catalogResource.isLoading());

  error = computed(() => {
    const err = this.catalogResource.error();
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401 || err.status === 403) {
        return "Vous n'êtes pas autorisé à accéder à cette page.";
      }
      return "Impossible de charger les données.";
    }
    return err ? "Impossible de charger les données." : null;
  });

  // Filtres actifs
  activeSubject = signal<string | null>(null);
  activeGrade = signal<string | null>(null);
  activeGroupId = signal<number | null>(null);

  // Options de filtres
  subjects = Object.entries(SUBJECT_LABELS);
  grades = Object.entries(GRADE_LABELS);

  // Syllabi filtrés
  filteredSyllabiIds = computed(() => {
    let syllabi = this.allSyllabi();
    const subject = this.activeSubject();
    const grade = this.activeGrade();
    const groupId = this.activeGroupId();

    // Filtre par class group
    if (groupId) {
      const mapping = this.groupSyllabiMap().find((m: GroupSyllabi) => m.groupId === groupId);
      if (mapping) {
        const allowedIds = new Set(mapping.syllabusIds);
        syllabi = syllabi.filter((s: NodeInfo) => allowedIds.has(Number(s.id)));
      } else {
        syllabi = [];
      }
    }

    if (subject) {
      syllabi = syllabi.filter((s: NodeInfo) => s.subject === subject);
    }
    if (grade) {
      syllabi = syllabi.filter((s: NodeInfo) => s.grade_level === grade);
    }
    return syllabi.map((s: NodeInfo) => s.id);
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([]);

    this.route.queryParams.subscribe(params => {
      this.activeSubject.set(params['subject'] || null);
      this.activeGrade.set(params['grade'] || null);
      this.activeGroupId.set(params['group'] ? Number(params['group']) : null);
    });
  }

  toggleSubject(code: string) {
    const newVal = this.activeSubject() === code ? null : code;
    this.updateQueryParams({ subject: newVal });
  }

  toggleGrade(code: string) {
    const newVal = this.activeGrade() === code ? null : code;
    this.updateQueryParams({ grade: newVal });
  }

  onGroupChange(groupId: number | null) {
    this.updateQueryParams({ group: groupId ? String(groupId) : null });
  }

  clearFilters() {
    this.updateQueryParams({ subject: null, grade: null, group: null });
  }

  hasActiveFilters(): boolean {
    return !!(this.activeSubject() || this.activeGrade() || this.activeGroupId());
  }

  private updateQueryParams(params: Record<string, string | null>) {
    const current = { ...this.route.snapshot.queryParams };
    Object.assign(current, params);
    for (const key of Object.keys(current)) {
      if (current[key] === null || current[key] === undefined) {
        delete current[key];
      }
    }
    this.router.navigate([], { queryParams: current });
  }
}
