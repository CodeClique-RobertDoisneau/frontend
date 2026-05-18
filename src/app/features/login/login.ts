import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Auth } from '@shared/services/auth/auth';
import { ApiError } from '@shared/services/api/api';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(Auth);

  showPassword = signal(false);
  showForgotPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  /** The URL to redirect to after successful login */
  private redirectUrl = '/dashboard';

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    const next = this.route.snapshot.queryParamMap.get('next');
    if (next) {
      this.redirectUrl = next;
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { username, password } = this.loginForm.value;

    try {
      await this.authService.login(username!, password!);
      this.isLoading.set(false);
      this.router.navigateByUrl(this.redirectUrl);
    } catch (err: unknown) {
      this.isLoading.set(false);
      const typedErr = err as ApiError;
      if (typedErr.status === 401 || typedErr.status === 403 || typedErr.message === 'Invalid credentials') {
        this.errorMessage.set("Nom d'utilisateur ou mot de passe incorrect.");
      } else if (typedErr.status === 0) {
        this.errorMessage.set('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
        this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  }
}
