import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
}

export type Section = NodeInfo;
export type Item = NodeInfo;
export type Chapter = NodeInfo;

@Injectable({
  providedIn: 'root'
})
export class NodeService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  getNode(id: string | number): Observable<NodeInfo> {
    return this.http.get<NodeInfo>(`${this.apiUrl}/nodes/${id}/`).pipe(
      map((node: NodeInfo) => {
        return node;
      })
    );
  }
}

// Alias pour CourseService
export { NodeService as CourseService };
