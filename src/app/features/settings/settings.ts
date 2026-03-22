import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@shared/services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoggingOut = signal(false);

  onLogout() {
    this.isLoggingOut.set(true);
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut.set(false);
        this.router.navigateByUrl('/connexion');
      },
      error: () => {
        this.isLoggingOut.set(false);
        // Even on error, redirect to login
        this.router.navigateByUrl('/connexion');
      },
    });
  }
}
