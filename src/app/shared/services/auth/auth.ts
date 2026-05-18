import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Api } from '../api/api';
import { UserInfo } from '../node/node.types';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private router = inject(Router);
  private api = inject(Api);
  private apiUrl = '/api';

  currentUser = signal<UserInfo | null>(null);

  async login(username: string, password: string): Promise<UserInfo> {
    await fetch(`${this.apiUrl}/auth/login/`);

    const body = new URLSearchParams({ username, password });
    await this.api.post<string>(`${this.apiUrl}/auth/login/`, body);

    return this.getMe();
  }

  async logout(): Promise<void> {
    try {
      await this.api.post<string>(`${this.apiUrl}/auth/logout/`);
    } finally {
      this.currentUser.set(null);
      this.router.navigate(['/']);
    }
  }

  async getMe(): Promise<UserInfo> {
    try {
      const user = await this.api.getPromise<UserInfo>(`${this.apiUrl}/users/me/`);
      this.currentUser.set(user);
      return user;
    } catch (err) {
      this.currentUser.set(null);
      throw err;
    }
  }

  async updateMe(data: Record<string, unknown>): Promise<UserInfo> {
    const user = await this.api.put<UserInfo>(`${this.apiUrl}/users/me/`, data);
    this.currentUser.set(user);
    return user;
  }

  getUser(id: number | string) {
    return this.api.get<UserInfo>(() => `${this.apiUrl}/users/${id}/`);
  }

  async joinClass(code: string): Promise<UserInfo> {
    const encoded = encodeURIComponent(code);
    const user = await this.api.post<UserInfo>(`${this.apiUrl}/class-groups/join-code/${encoded}/`);
    this.currentUser.set(user);
    return user;
  }
}
