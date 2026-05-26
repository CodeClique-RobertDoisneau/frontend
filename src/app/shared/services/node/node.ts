import { Injectable, inject, resource, ResourceRef } from '@angular/core';
import { Api } from '../api/api';
import { HttpResourceRef } from '@angular/common/http';
import { NodeInfo, UserInfo, ClassGroupInfo, ClassGroupSyllabusInfo, CatalogValue, GroupSyllabi } from './node.types';
import { firstValueFrom } from 'rxjs';

export * from './node.types';

export const SUBJECT_LABELS: Record<string, string> = {
  'MA': 'Maths',
  'PH': 'Physique',
  'CO': 'NSI'
};

export const GRADE_LABELS: Record<string, string> = {
  'SE': 'Seconde',
  'PR': 'Première',
  'TE': 'Terminale',
};

export const TYPE_LABELS: Record<string, string> = {
  'LE': 'Cours',
  'QU': 'Quiz',
  'EX': 'Exercice',
};

@Injectable({
  providedIn: 'root'
})
export class Node {
  private api = inject(Api);

  getNode(id: string | number | (() => string | number)): HttpResourceRef<NodeInfo | undefined> {
    return this.api.get<NodeInfo>(() => {
      const resolvedId = typeof id === 'function' ? id() : id;
      return `/api/nodes/${resolvedId}/`;
    });
  }

  updateNodeContent(id: string | number, payload: string | Record<string, unknown>): Promise<NodeInfo> {
    return this.api.patch<NodeInfo>(`/api/nodes/${id}/`, { content: payload });
  }

  verifyNode(
    id: string | number,
    submission: Record<string, unknown> | string | null = null,
    modified_at: string = ''
  ): Promise<Record<string, unknown>> {
    return this.api.post<Record<string, unknown>>(`/api/nodes/${id}/answer/`, { answer: submission, modified_at });
  }

  getAttempts(id: string | number | (() => string | number | undefined)): HttpResourceRef<any[] | undefined> {
    return this.api.get<any[]>(() => {
      const resolvedId = typeof id === 'function' ? id() : id;
      if (!resolvedId) return undefined;
      return `/api/nodes/${resolvedId}/answer/`;
    });
  }

  submitAnswer(id: string | number, answer: boolean[][], modified_at: string): Promise<any> {
    return this.api.post(`/api/nodes/${id}/answer/`, { answer, modified_at });
  }

  updateProgress(id: string | number, action: string = 'completed'): Promise<any> {
    return this.api.post(`/api/nodes/${id}/progress/`, { action_performed: action });
  }

  getUser(): HttpResourceRef<UserInfo | undefined> {
    return this.api.get<UserInfo>(() => '/api/users/me/');
  }

  getClassGroup(groupId: number | (() => number)): HttpResourceRef<ClassGroupInfo | undefined> {
    return this.api.get<ClassGroupInfo>(() => {
      const resolvedId = typeof groupId === 'function' ? groupId() : groupId;
      return `/api/class-groups/${resolvedId}/`;
    });
  }

  getClassGroupSyllabus(): HttpResourceRef<ClassGroupSyllabusInfo[] | undefined> {
    return this.api.get<ClassGroupSyllabusInfo[]>(() => '/api/classgroupsyllabus/');
  }

  getCodeCliqueSyllabus(): HttpResourceRef<NodeInfo[] | undefined> {
    return this.api.get<NodeInfo[]>(() => '/api/nodes/codeclique/');
  }

  /**
   * Aggregates the entire catalog datasets sequentially to keep components completely thin,
   * avoiding complex parallel and map-orchestration in the view layer.
   */
  getCatalog(): ResourceRef<CatalogValue | undefined> {
    return resource<CatalogValue, null>({
      loader: async () => {
        // 1. Fetch raw syllabus mappings and codeclique list
        const entries = await firstValueFrom(this.api.http.get<ClassGroupSyllabusInfo[]>('/api/classgroupsyllabus/'));
        const codeClique = await firstValueFrom(this.api.http.get<NodeInfo[]>('/api/nodes/codeclique/'));

        const uniqueGroupIds = [...new Set(entries.map(e => e.class_group))];
        const uniqueNodeIds = [...new Set(entries.map(e => e.node))];

        // 2. Load ClassGroups details sequentially
        const groups: ClassGroupInfo[] = [];
        for (const id of uniqueGroupIds) {
          groups.push(await firstValueFrom(this.api.http.get<ClassGroupInfo>(`/api/class-groups/${id}/`)));
        }

        // 3. Load syllabus Node details sequentially
        const classGroupNodes: NodeInfo[] = [];
        for (const id of uniqueNodeIds) {
          classGroupNodes.push(await firstValueFrom(this.api.http.get<NodeInfo>(`/api/nodes/${id}/`)));
        }

        // 4. Merge class group nodes with codeclique nodes, keeping deduplicated lists
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

        // 5. Build group syllabi maps
        const groupMap = new Map<number, (string | number)[]>();
        for (const entry of entries) {
          if (!groupMap.has(entry.class_group)) {
            groupMap.set(entry.class_group, []);
          }
          groupMap.get(entry.class_group)!.push(entry.node);
        }

        return {
          groups,
          allSyllabi: [...nodeMap.values()],
          groupSyllabiMap: Array.from(groupMap, ([groupId, syllabusIds]) => ({ groupId, syllabusIds } as GroupSyllabi))
        };
      }
    });
  }
}
