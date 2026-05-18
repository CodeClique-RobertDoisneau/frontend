import { Injectable, inject } from '@angular/core';
import { Api } from '../api/api';
import { HttpResourceRef } from '@angular/common/http';
import { NodeInfo, UserInfo, ClassGroupInfo, ClassGroupSyllabusInfo } from './node.types';

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

  getNode(id: string | number): HttpResourceRef<NodeInfo | undefined> {
    return this.api.get<NodeInfo>(() => `/api/nodes/${id}/`);
  }

  getNodePromise(id: string | number): Promise<NodeInfo> {
    return this.api.getPromise<NodeInfo>(`/api/nodes/${id}/`);
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

  getUser(): HttpResourceRef<UserInfo | undefined> {
    return this.api.get<UserInfo>(() => '/api/users/me/');
  }

  getClassGroup(groupId: number): HttpResourceRef<ClassGroupInfo | undefined> {
    return this.api.get<ClassGroupInfo>(() => `/api/class-groups/${groupId}/`);
  }

  getClassGroupPromise(groupId: number): Promise<ClassGroupInfo> {
    return this.api.getPromise<ClassGroupInfo>(`/api/class-groups/${groupId}/`);
  }

  getClassGroupSyllabus(): HttpResourceRef<ClassGroupSyllabusInfo[] | undefined> {
    return this.api.get<ClassGroupSyllabusInfo[]>(() => '/api/classgroupsyllabus/');
  }

  getCodeCliqueSyllabus(): HttpResourceRef<NodeInfo[] | undefined> {
    return this.api.get<NodeInfo[]>(() => '/api/nodes/codeclique/');
  }
}
