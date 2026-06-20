import { Component, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import '@splinetool/viewer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  mode: 'login' | 'register' = 'login';
  // Start with empty fields to avoid accidental concatenation with typed input
  username = '';
  password = '';
  registerName = '';
  registerEmail = '';
  registerRole = 'engineer';
  registerPassword = '';
  confirmPassword = '';
  error = '';
  notice = '';
  isPending = false;

  temporaryLoginOptions = [
    { username: "admin1@smartm.com", password: "password123" },
    { username: "admin2@smartm.com", password: "password123" },
    { username: "manager1@smartm.com", password: "password123" },
    { username: "manager2@smartm.com", password: "password123" },
    { username: "ingenieur1@smartm.com", password: "password123" },
    { username: "ingenieur2@smartm.com", password: "password123" },
    { username: "operateur1@smartm.com", password: "password123" },
    { username: "operateur2@smartm.com", password: "password123" },
  ];

  constructor(private router: Router, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  switchMode(nextMode: 'login' | 'register') {
    this.mode = nextMode;
    this.error = '';
    this.notice = '';
  }

  get authTitle() {
    return this.mode === 'login' ? 'Authentication Required' : 'Request Access';
  }

  useTemporary(option: any) {
    this.username = option.username;
    this.password = option.password;
    this.notice = '';
  }

  handleSubmit() {
    if (!this.username || !this.password) {
      this.error = 'Email and password are required';
      return;
    }
    
    this.isPending = true;
    
    // Convert generic username to email format for temporary testing if needed,
    // assuming username is either an email or a test username like 'admin'
    const email = this.username.includes('@') ? this.username : `${this.username}@test.com`;

    this.auth.login({ email: email, password: this.password }).subscribe({
      next: () => {
        this.isPending = false;
        // Navigation is handled inside auth.service.ts
      },
      error: (err) => {
        this.isPending = false;
        let errorMessage = 'Invalid credentials or server error';
        if (err && err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          } else if (err.error.text) {
            errorMessage = err.error.text;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        } else if (err && err.message) {
          errorMessage = err.message;
        }
        this.error = errorMessage;
        // Ensure Angular updates the view immediately
        try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
      }
    });
  }

  handleRegisterSubmit() {
    if (!this.registerName || !this.registerEmail || !this.registerPassword || !this.confirmPassword) {
      this.error = 'All registration fields are required';
      return;
    }
    if (this.registerPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.isPending = true;
    this.error = '';

    const nameParts = this.registerName.trim().split(' ');
    const prenom = nameParts[0];
    const nom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    const userData = {
      nom: nom,
      prenom: prenom,
      email: this.registerEmail,
      motDePasse: this.registerPassword
    };

    this.auth.register(userData, this.registerRole).subscribe({
      next: () => {
        this.isPending = false;
        this.notice = 'Account created successfully! You can now sign in.';
        this.username = this.registerEmail;
        this.password = this.registerPassword;
        this.mode = 'login';
      },
      error: (err) => {
        this.isPending = false;
        this.error = err.error || 'Failed to create account. Email may already be in use.';
      }
    });
  }
}
