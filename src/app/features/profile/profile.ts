import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '@shared/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    RouterLink,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isLoading = signal(true);
  isSaving = signal(false);
  isOwnProfile = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  user = signal<any>(null);

  profileForm = this.fb.group({
    username: ['', [Validators.required]],
    first_name: [''],
    last_name: [''],
    email: ['', [Validators.email]],
  });

  joinCode = signal('');
  isJoining = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isOwnProfile.set(false);
      this.authService.getUser(id).subscribe({
        next: (user) => {
          this.user.set(user);
          this.populateForm(user);
          this.profileForm.disable();
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 403) {
            this.errorMessage.set("Vous n'avez pas les droits pour voir ce profil.");
          } else if (err.status === 404) {
            this.errorMessage.set('Utilisateur introuvable.');
          } else {
            this.errorMessage.set('Erreur lors du chargement du profil.');
          }
        },
      });
    } else {
      this.isOwnProfile.set(true);
      this.authService.getMe().subscribe({
        next: (user) => {
          this.user.set(user);
          this.populateForm(user);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 401 || err.status === 403) {
            this.errorMessage.set('Vous devez être connecté pour voir votre profil.');
          } else {
            this.errorMessage.set('Erreur lors du chargement du profil.');
          }
        },
      });
    }
  }

  private populateForm(user: any) {
    this.profileForm.patchValue({
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
    });
  }

  onSave() {
    if (this.profileForm.invalid || !this.isOwnProfile()) return;

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.updateMe(this.profileForm.getRawValue()).subscribe({
      next: (user) => {
        this.user.set(user);
        this.isSaving.set(false);
        this.successMessage.set('Profil mis à jour avec succès !');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err.status === 400) {
          const errors = err.error;
          const messages = Object.entries(errors)
            .map(([key, val]) => `${key}: ${(val as string[]).join(', ')}`)
            .join(' | ');
          this.errorMessage.set(messages || 'Données invalides.');
        } else {
          this.errorMessage.set('Erreur lors de la sauvegarde.');
        }
      },
    });
  }

  onJoinClass() {
    const code = this.joinCode().trim();
    if (!code) return;

    this.isJoining.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.joinClass(code).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.populateForm(updatedUser);
        this.isJoining.set(false);
        this.joinCode.set('');
        this.successMessage.set('Vous avez rejoint la classe avec succès !');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.isJoining.set(false);
        if (err.status === 404) {
          this.errorMessage.set("Code d'invitation invalide.");
        } else if (err.status === 400) {
          this.errorMessage.set(err.error?.detail || "Erreur lors de l'ajout à la classe.");
        } else {
          this.errorMessage.set("Une erreur est survenue.");
        }
      }
    });
  }

  getGroupId(urlOrId: any): string {
    if (!urlOrId) return '';
    if (typeof urlOrId === 'object') {
      urlOrId = urlOrId.id || urlOrId.url || urlOrId;
    }
    if (typeof urlOrId === 'number') {
      return urlOrId.toString();
    }
    if (typeof urlOrId === 'string') {
      const parts = urlOrId.split('/').filter(p => !!p);
      return parts[parts.length - 1];
    }
    return String(urlOrId);
  }
}
