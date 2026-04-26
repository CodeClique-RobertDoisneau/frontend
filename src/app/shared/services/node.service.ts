import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of, switchMap } from 'rxjs';

export interface NodeInfo {
  id: number | string;
  owner?: number;
  created_at?: string;
  modified_at?: string;
  type: string;
  public?: boolean;
  title: string;
  description?: string;
  grade_level?: string;
  difficulty?: number;
  subject?: string;
  content?: any;
  children: any[];
  user_progress?: {
    done: boolean;
    score?: number;
    max_score?: number;
    modified_at: string;
  } | null;
}



export interface UserInfo {
  url: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  groups: string[];
  class_groups: MembershipInfo[];
}

export interface ClassGroupInfo {
  url: string;
  id: number;
  class_name: string;
  academic_year: string;
  users: string[];
  syllabus: string[];
  join_code: string;
}

export interface ClassGroupSyllabusInfo {
  id: number;
  class_group: number;
  node: number;
  order_index: number;
}

export interface MembershipInfo {
  url: string;
  id: number;
  user: string;
  class_group: string;
  user_status: string;
}

export const SUBJECT_LABELS: Record<string, string> = {
  'MA': 'Maths',
  'PH': 'Physique',
  'NS': 'NSI',

  //Temporaire TODO
  'Maths': 'Maths',
  'NSI': 'NSI',
  'Physique': 'Physique',
};


export const GRADE_LABELS: Record<string, string> = {
  'SE': 'Seconde',
  'PR': 'Première',
  'TE': 'Terminale',
};

@Injectable({
  providedIn: 'root'
})
export class NodeService {
  private http = inject(HttpClient);
  private API_URL = '/api';

  //GET
  getNode(id: string | number): Observable<NodeInfo> {
    return this.http.get<NodeInfo>(`${this.API_URL}/nodes/${id}/`);
  }

  //PATCH
  updateNodeContent(id: string | number, data: string): Observable<any> {
    return this.http.patch<any>(`${this.API_URL}/nodes/${id}/`, { content: { data } });
  }


  verifyNode(id: string | number, submission: any = null, modified_at: string = ''): Observable<any> {
    const payload = { answer: submission, modified_at };
    return this.http.post<any>(`${this.API_URL}/nodes/${id}/answer/`, payload);
  }

  getUser(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.API_URL}/users/me/`);
  }

  getClassGroup(groupId: number): Observable<ClassGroupInfo> {
    return this.http.get<ClassGroupInfo>(`${this.API_URL}/class-groups/${groupId}/`);
  }

  getClassGroupSyllabus(): Observable<ClassGroupSyllabusInfo[]> {
    return this.http.get<ClassGroupSyllabusInfo[]>(`${this.API_URL}/classgroupsyllabus/`);
  }


}


