import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';

export interface ApiError {
  status: number;
  message: string;
  error?: Record<string, unknown> | string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private getCsrfToken(): string {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
  }

  /**
   * Performs a native browser fetch request and handles CSRF token injection,
   * JSON serialization, empty responses, and structured error throwing.
   */
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});

    // Automatically set Content-Type header unless it's a URL-encoded form or already set
    if (!headers.has('Content-Type') && !(options.body instanceof URLSearchParams)) {
      headers.set('Content-Type', 'application/json');
    }

    // Set CSRF token for security checks
    headers.set('X-CSRFToken', this.getCsrfToken());

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => res.text().catch(() => ''));
      throw {
        status: res.status,
        message: errorBody?.detail || errorBody?.message || 'Request failed',
        error: errorBody,
      } as ApiError;
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  /**
   * GET: Natively wraps Angular 19's httpResource Signal API
   */
  get<T>(urlFactory: () => string | undefined) {
    return httpResource<T>(urlFactory);
  }

  /**
   * Promisified GET: Used for parallel batch fetching (e.g. inside resource loader)
   */
  async getPromise<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { method: 'GET', ...options });
  }

  /**
   * POST: Promisified mutation
   */
  async post<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: body instanceof URLSearchParams ? body : JSON.stringify(body),
      ...options
    });
  }

  /**
   * PUT: Promisified mutation
   */
  async put<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options
    });
  }

  /**
   * PATCH: Promisified mutation
   */
  async patch<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options
    });
  }

  /**
   * DELETE: Promisified mutation
   */
  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
      ...options
    });
  }
}
