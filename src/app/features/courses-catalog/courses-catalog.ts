import { Component, inject, signal, computed, resource, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HorizontalSlider } from '@shared/components/horizontal-slider/horizontal-slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { NodeInfo, NodeService, ClassGroupInfo, ClassGroupSyllabusInfo, SUBJECT_LABELS, GRADE_LABELS } from '@shared/services/node.service';
import { BreadcrumbService } from '@shared/services/breadcrumb.service';

interface GroupSyllabi {
  groupId: number;
  syllabusIds: (string | number)[];
}

interface CatalogValue {
  groups: ClassGroupInfo[];
  allSyllabi: NodeInfo[];
  groupSyllabiMap: GroupSyllabi[];
}

@Component({
  selector: 'app-courses-catalog',
  imports: [HorizontalSlider, MatChipsModule, MatIconModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './courses-catalog.html',
  styleUrl: './courses-catalog.scss',
})
export class CoursesCatalog implements OnInit {
  private NodeService = inject(NodeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private breadcrumbService = inject(BreadcrumbService);

  // 1. Primary resources retrieved reactively via NodeService httpResource GET calls
  classGroupSyllabusResource = this.NodeService.getClassGroupSyllabus();
  codeCliqueSyllabusResource = this.NodeService.getCodeCliqueSyllabus();

  // 2. Custom Page-Specific Parallel Resource Orchestration
  catalogResource = resource<CatalogValue, { entries: ClassGroupSyllabusInfo[]; codeClique: NodeInfo[] } | null>({
    params: () => {
      const entries = this.classGroupSyllabusResource.value();
      const codeClique = this.codeCliqueSyllabusResource.value();
      return (entries && codeClique) ? { entries, codeClique } : null;
    },
    loader: async ({ params }) => {
      if (!params) {
        return { groups: [], allSyllabi: [], groupSyllabiMap: [] };
      }
      const { entries, codeClique } = params;

      const groupMap = new Map<number, (string | number)[]>();
      for (const entry of entries) {
        if (!groupMap.has(entry.class_group)) {
          groupMap.set(entry.class_group, []);
        }
        groupMap.get(entry.class_group)!.push(entry.node);
      }

      const uniqueGroupIds = [...groupMap.keys()];
      const uniqueNodeIds = [...new Set(entries.map(e => e.node))];

      // Dynamic concurrent fetching in parallel
      const [groups, classGroupNodes] = await Promise.all([
        Promise.all(uniqueGroupIds.map(id => this.NodeService.getClassGroupPromise(id))),
        Promise.all(uniqueNodeIds.map(id => this.NodeService.getNodePromise(id)))
      ]);

      // Deduplicate the merged syllabi list
      const nodeMap = new Map<number | string, NodeInfo>();
      for (const n of classGroupNodes) {
        nodeMap.set(n.id, n);
      }
      for (const n of codeClique) {
        const cleanedNode = { ...n, children: [] };
        if (!nodeMap.has(cleanedNode.id)) {
          nodeMap.set(cleanedNode.id, cleanedNode);
        }
      }

      return {
        groups,
        allSyllabi: [...nodeMap.values()],
        groupSyllabiMap: Array.from(groupMap, ([groupId, syllabusIds]) => ({ groupId, syllabusIds } as GroupSyllabi))
      };
    }
  });

  // 3. Derived Reactive Computeds
  allSyllabi = computed(() => this.catalogResource.value()?.allSyllabi || []);
  classGroups = computed(() => this.catalogResource.value()?.groups || []);
  groupSyllabiMap = computed(() => this.catalogResource.value()?.groupSyllabiMap || []);

  isLoading = computed(() => {
    return this.classGroupSyllabusResource.isLoading() || 
           this.codeCliqueSyllabusResource.isLoading() || 
           this.catalogResource.isLoading();
  });

  error = computed(() => {
    const err1 = this.classGroupSyllabusResource.error();
    const err2 = this.codeCliqueSyllabusResource.error();
    const err3 = this.catalogResource.error();
    const rawErr = err1 || err2 || err3;

    if (rawErr) {
      const typedErr = rawErr as { status?: number };
      if (typedErr?.status === 401 || typedErr?.status === 403) {
        return "Vous n'êtes pas autorisé à accéder à cette page.";
      }
      return "Impossible de charger les données.";
    }
    return null;
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
