import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  /**
   * Reads the CSRF token from the 'csrftoken' cookie.
   */
  private getCsrfToken(): string {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
  }

  /**
   * Step 1: GET the login page so Django sets the csrftoken cookie.
   * Step 2: POST username + password with the CSRF token.
   * Step 3: Verify login worked by calling GET /api/users/me/.
   *
   * DRF's login endpoint returns HTML, not JSON, so we use responseType: 'text'.
   * On success it redirects (302) which fetch follows automatically.
   * We verify the login actually worked by calling getMe() afterward.
   */
  login(username: string, password: string): Observable<any> {
    // First, GET the login page to ensure the CSRF cookie is set
    return this.http.get(`${this.apiUrl}/auth/login/`, { responseType: 'text' }).pipe(
      switchMap(() => {
        // Now we have the CSRF cookie — build the POST
        const body = new URLSearchParams();
        body.set('username', username);
        body.set('password', password);

        const headers = new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': this.getCsrfToken(),
        });

        return this.http.post(`${this.apiUrl}/auth/login/`, body.toString(), {
          headers,
          responseType: 'text', // DRF returns HTML, not JSON
        });
      }),
      // After POST succeeded (or redirected), verify we're actually logged in
      switchMap(() => this.getMe()),
      catchError((err) => {
        // If getMe() returns 401/403, login credentials were wrong
        if (err.status === 401 || err.status === 403) {
          return throwError(() => ({ status: 401, message: 'Invalid credentials' }));
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Logout — destroys the session server-side.
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout/`, null, {
      responseType: 'text',
    });
  }

  /**
   * Get the current authenticated user's info.
   * Returns user data if authenticated, 401/403 if not.
   */
  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me/`);
  }

  /**
   * Update the current user's profile.
   */
  updateMe(data: Record<string, any>): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/me/`, data);
  }

  /**
   * Get a specific user by ID (admin only).
   */
  getUser(id: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}/`);
  }

  /**
   * Join a class group via a code.
   */
  joinClass(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/class-groups/join-code/${code}/`, null);
  }
}

