import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { httpResource, HttpResourceOptions, HttpResourceRef } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  public http = inject(HttpClient);

  /**
   * Performs a GET request using Angular's new signal-based resource API.
   * Leverages internal caching, reactive dependency tracking, and automatic resource cleanup.
   */
  get<T>(url: () => string | undefined, options?: HttpResourceOptions<T, unknown>): HttpResourceRef<T | undefined> {
    return httpResource<T>(url, options);
  }

  /**
   * Performs a POST request returning a Promise.
   * Handles URLSearchParams automatically to ensure proper form encoding headers.
   */
  post<T>(
    url: string,
    body?: unknown,
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
    }
  ): Promise<T> {
    let requestBody = body;
    let requestHeaders = options?.headers;

    if (body instanceof URLSearchParams) {
      requestBody = body.toString();
      let headersMap = requestHeaders instanceof HttpHeaders
        ? requestHeaders
        : new HttpHeaders(requestHeaders as { [header: string]: string | string[] } | undefined);
      if (!headersMap.has('Content-Type')) {
        headersMap = headersMap.set('Content-Type', 'application/x-www-form-urlencoded');
      }
      requestHeaders = headersMap;
    }

    return firstValueFrom(this.http.post<T>(url, requestBody, { ...options, headers: requestHeaders }));
  }

  /**
   * Performs a PUT request returning a Promise.
   */
  put<T>(
    url: string,
    body?: unknown,
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
    }
  ): Promise<T> {
    return firstValueFrom(this.http.put<T>(url, body, options));
  }

  /**
   * Performs a PATCH request returning a Promise.
   */
  patch<T>(
    url: string,
    body?: unknown,
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
    }
  ): Promise<T> {
    return firstValueFrom(this.http.patch<T>(url, body, options));
  }

  /**
   * Performs a DELETE request returning a Promise.
   */
  delete<T>(
    url: string,
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
    }
  ): Promise<T> {
    return firstValueFrom(this.http.delete<T>(url, options));
  }
}
