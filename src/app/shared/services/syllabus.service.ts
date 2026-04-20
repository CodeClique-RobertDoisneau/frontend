import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { NodeInfo, NodeService } from './node.service';

export interface UserInfo {
    url: string;
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    groups: string[];
    class_groups: string[];
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

@Injectable({
    providedIn: 'root'
})
export class SyllabusService {
    private http = inject(HttpClient);       // pour user + class-groups uniquement
    private nodeService = inject(NodeService); // pour les nodes
    private apiUrl = '/api';

    /**
     * Récupère les infos de l'utilisateur.
     */
    getUser(userId: number): Observable<UserInfo> {
        return this.http.get<UserInfo>(`${this.apiUrl}/users/${userId}/`);
    }

    /**
     * Récupère un class-group par son ID.
     */
    getClassGroup(groupId: number): Observable<ClassGroupInfo> {
        return this.http.get<ClassGroupInfo>(`${this.apiUrl}/class-groups/${groupId}/`);
    }

    /**
     * Extrait l'ID numérique d'une URL de type "http://backend:3000/api/xxx/42/".
     */
    private extractId(urlOrId: any): number {
        if (!urlOrId) return 0;
        if (typeof urlOrId === 'number') return urlOrId;
        if (typeof urlOrId === 'object') {
            urlOrId = urlOrId.node || urlOrId.class_group || urlOrId.id || urlOrId.url || urlOrId;
        }
        if (typeof urlOrId === 'number') return urlOrId;
        if (typeof urlOrId === 'string') {
            const parts = urlOrId.replace(/\/$/, '').split('/');
            return parseInt(parts[parts.length - 1], 10);
        }
        return Number(urlOrId) || 0;
    }

    /**
     * Récupère tous les syllabus (nodes) pour un utilisateur donné.
     *
     * Flux : user → class_groups → syllabus URLs → nodes (via NodeService)
     */
    getUserSyllabi(userId: number): Observable<NodeInfo[]> {
        return this.getUser(userId).pipe(
            switchMap((user: UserInfo) => {
                if (!user.class_groups || user.class_groups.length === 0) {
                    return of([]);
                }
                const groupIds = user.class_groups.map((url: string) => this.extractId(url));
                return forkJoin(groupIds.map((id: number) => this.getClassGroup(id)));
            }),
            switchMap((groups: ClassGroupInfo[]) => {
                const allSyllabusUrls: string[] = [];
                for (const group of groups) {
                    if (group.syllabus) {
                        allSyllabusUrls.push(...group.syllabus);
                    }
                }
                if (allSyllabusUrls.length === 0) {
                    return of([]);
                }
                const uniqueIds = [...new Set(allSyllabusUrls.map((url: string) => this.extractId(url)))];
                return forkJoin(uniqueIds.map((id: number) => this.nodeService.getNode(id)));
            })
        );
    }

    /**
     * Récupère les class-groups d'un utilisateur.
     */
    getUserClassGroups(userId: number): Observable<ClassGroupInfo[]> {
        return this.getUser(userId).pipe(
            switchMap((user: UserInfo) => {
                if (!user.class_groups || user.class_groups.length === 0) {
                    return of([]);
                }
                const groupIds = user.class_groups.map((url: string) => this.extractId(url));
                return forkJoin(groupIds.map((id: number) => this.getClassGroup(id)));
            })
        );
    }

    /**
     * Récupère les syllabi d'un class-group spécifique.
     */
    getClassGroupSyllabi(groupId: number): Observable<NodeInfo[]> {
        return this.getClassGroup(groupId).pipe(
            switchMap((group: ClassGroupInfo) => {
                if (!group.syllabus || group.syllabus.length === 0) {
                    return of([]);
                }
                const ids = group.syllabus.map((url: string) => this.extractId(url));
                return forkJoin(ids.map((id: number) => this.nodeService.getNode(id)));
            })
        );
    }

    extractIdPublic(urlOrId: any): number {
        return this.extractId(urlOrId);
    }
}
