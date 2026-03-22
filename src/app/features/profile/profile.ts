import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
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

    this.authService.updateMe(this.profileForm.value).subscribe({
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
}
