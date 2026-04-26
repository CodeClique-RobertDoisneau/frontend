import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { HorizontalSlider } from '@shared/components/horizontal-slider/horizontal-slider';


import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';


import { NodeInfo, NodeService, ClassGroupInfo, ClassGroupSyllabusInfo, SUBJECT_LABELS, GRADE_LABELS } from '@shared/services/node.service';
import { BreadcrumbService } from '@shared/services/breadcrumb.service';


// Mapping groupId → liste d'IDs syllabus // TODO
interface GroupSyllabi {
  groupId: number;
  syllabusIds: number[];
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



  // Données
  allSyllabi = signal<NodeInfo[]>([]);
  classGroups = signal<ClassGroupInfo[]>([]);       //TODO pourquoi on a besoin des classgroups ici ???? dans courses-catalog ???
  groupSyllabiMap = signal<GroupSyllabi[]>([]);     // TODO a comprendre
  isLoading = signal(true);
  error = signal<string | null>(null);

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
      const mapping = this.groupSyllabiMap().find(m => m.groupId === groupId);
      if (mapping) {
        const allowedIds = new Set(mapping.syllabusIds);
        syllabi = syllabi.filter(s => allowedIds.has(Number(s.id)));
      } else {
        syllabi = [];
      }
    }

    if (subject) {
      syllabi = syllabi.filter(s => s.subject === subject);
    }
    if (grade) {
      syllabi = syllabi.filter(s => s.grade_level === grade);
    }
    return syllabi.map(s => s.id);
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([]);

    this.route.queryParams.subscribe(params => {
      this.activeSubject.set(params['subject'] || null);
      this.activeGrade.set(params['grade'] || null);
      this.activeGroupId.set(params['group'] ? Number(params['group']) : null);
    });

    // Un seul point d'entrée : classgroupsyllabus
    this.NodeService.getClassGroupSyllabus().subscribe({
      next: (entries) => {
        if (!entries || entries.length === 0) {
          this.allSyllabi.set([]);
          this.isLoading.set(false);
          return;
        }

        // Construire le mapping groupe → nodes
        const groupMap = new Map<number, number[]>();
        for (const entry of entries) {
          if (!groupMap.has(entry.class_group)) {
            groupMap.set(entry.class_group, []);
          }
          groupMap.get(entry.class_group)!.push(entry.node);
        }
        this.groupSyllabiMap.set(
          Array.from(groupMap, ([groupId, syllabusIds]) => ({ groupId, syllabusIds }))
        );

        const uniqueGroupIds = [...groupMap.keys()];
        const uniqueNodeIds = [...new Set(entries.map(e => e.node))];

        // Fetch groups (pour le dropdown) et nodes en parallèle
        forkJoin({
          groups: forkJoin(uniqueGroupIds.map(id => this.NodeService.getClassGroup(id))),
          nodes: forkJoin(uniqueNodeIds.map(id => this.NodeService.getNode(id)))
        }).subscribe({
          next: ({ groups, nodes }) => {
            this.classGroups.set(groups);
            this.allSyllabi.set(nodes);
            this.isLoading.set(false);
          },
          error: () => {
            this.error.set('Impossible de charger les cours.');
            this.isLoading.set(false);
          }
        });
      },
      error: (err: any) => {
        if (err.status === 401 || err.status === 403) {
          this.error.set("Vous n'êtes pas autorisé à accéder à cette page.");
        } else {
          this.error.set('Impossible de charger les données.');
        }
        this.isLoading.set(false);
      }
    });
  }

  //Fonctions pour actualiser lorsque l'on clique sur les chips pour les filtres
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
      if (current[key] === null || current[key] === undefined) delete current[key];
    }
    this.router.navigate([], { queryParams: current });
  }
}
