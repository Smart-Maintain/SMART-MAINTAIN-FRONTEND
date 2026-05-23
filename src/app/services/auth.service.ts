import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export type Role = 'admin' | 'manager' | 'engineer' | 'technician' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user = signal<User | null>(null);

  constructor(private router: Router, private http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession() {
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role') as Role;
    const email = localStorage.getItem('user_email');
    if (token && role && email) {
      this.user.set({
        id: Math.random().toString(),
        name: email.split('@')[0],
        email: email,
        role: role
      });
    }
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ token: string; role: string }>('http://localhost:8888/api/identity-service/account/login', credentials).pipe(
      tap((response) => {
        let normalizedRole = response.role.toLowerCase().replace('role_', '') as any;
        if (normalizedRole === 'ingenieur') normalizedRole = 'engineer';
        if (normalizedRole === 'operateur') normalizedRole = 'technician';
        
        normalizedRole = normalizedRole as Role;

        localStorage.setItem('jwt_token', response.token);
        localStorage.setItem('user_role', normalizedRole);
        localStorage.setItem('user_email', credentials.email);

        this.user.set({
          id: Math.random().toString(),
          name: credentials.email.split('@')[0],
          email: credentials.email,
          role: normalizedRole
        });
        
        this.router.navigate(['/dashboard']);
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  register(userData: any, role: string) {
    let endpoint = 'manager';
    if (role === 'engineer') endpoint = 'ingenieur';
    if (role === 'technician') endpoint = 'operateur';
    if (role === 'admin') endpoint = 'admin';
    
    return this.http.post(`http://localhost:8888/api/identity-service/account/${endpoint}`, userData).pipe(
      catchError((error) => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(allowedRoles: Role[]): boolean {
    const currentUser = this.user();
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  }
}
