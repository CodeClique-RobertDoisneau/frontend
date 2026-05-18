import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Api } from '@shared/services/api/api';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { Auth } from '@shared/services/auth/auth';
import { UserInfo, MembershipInfo } from '@shared/services/node/node';

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
  private authService = inject(Auth);
  private api = inject(Api);

  isSaving = signal(false);
  isJoining = signal(false);
  joinCode = signal('');
  errorMessage = signal('');
  successMessage = signal('');

  // Dynamically select the correct endpoint reactively using ApiService
  userResource = this.api.get<UserInfo>(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? `/api/users/${id}/` : `/api/users/me/`;
  });

  isOwnProfile = computed(() => !this.route.snapshot.paramMap.get('id'));
  isLoading = computed(() => this.userResource.isLoading());
  user = computed(() => this.userResource.value());

  profileForm = this.fb.group({
    username: ['', [Validators.required]],
    first_name: [''],
    last_name: [''],
    email: ['', [Validators.email]],
  });

  constructor() {
    effect(() => {
      const user = this.user();
      if (user) {
        this.populateForm(user);
        if (!this.isOwnProfile()) {
          this.profileForm.disable();
        } else {
          this.profileForm.enable();
        }
      }
    });

    effect(() => {
      const err = this.userResource.error() as { status?: number } | undefined;
      if (err) {
        if (err.status === 401 || err.status === 403) {
          this.errorMessage.set(this.isOwnProfile() 
            ? 'Vous devez être connecté pour voir votre profil.' 
            : "Vous n'avez pas les droits pour voir ce profil.");
        } else if (err.status === 404) {
          this.errorMessage.set('Utilisateur introuvable.');
        } else {
          this.errorMessage.set('Erreur lors du chargement du profil.');
        }
      }
    });
  }

  ngOnInit() {}

  private populateForm(user: UserInfo) {
    this.profileForm.patchValue({
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
    });
  }

  async onSave() {
    if (this.profileForm.invalid || !this.isOwnProfile()) return;

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.authService.updateMe(this.profileForm.getRawValue() as Record<string, unknown>);
      this.successMessage.set('Profil mis à jour avec succès !');
      setTimeout(() => this.successMessage.set(''), 3000);
      this.userResource.reload();
    } catch (err: unknown) {
      const typedErr = err as { status?: number; error?: Record<string, unknown> };
      if (typedErr?.status === 400) {
        const errors = typedErr.error;
        const messages = Object.entries(errors || {})
          .map(([key, val]) => {
            const valStr = Array.isArray(val) ? val.join(', ') : String(val);
            return `${key}: ${valStr}`;
          })
          .join(' | ');
        this.errorMessage.set(messages || 'Données invalides.');
      } else {
        this.errorMessage.set('Erreur lors de la sauvegarde.');
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  async onJoinClass() {
    const code = this.joinCode().trim();
    if (!code) return;

    this.isJoining.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.authService.joinClass(code);
      this.joinCode.set('');
      this.successMessage.set('Vous avez rejoint la classe avec succès !');
      setTimeout(() => this.successMessage.set(''), 3000);
      this.userResource.reload();
    } catch (err: unknown) {
      const typedErr = err as { status?: number; error?: { detail?: string } };
      if (typedErr?.status === 404) {
        this.errorMessage.set("Code d'invitation invalide.");
      } else if (typedErr?.status === 400) {
        this.errorMessage.set(typedErr.error?.detail || "Erreur lors de l'ajout à la classe.");
      } else {
        this.errorMessage.set("Une erreur est survenue.");
      }
    } finally {
      this.isJoining.set(false);
    }
  }

  getGroupId(urlOrId: string | number | MembershipInfo | null | undefined): string {
    if (!urlOrId) return '';
    if (typeof urlOrId === 'number') {
      return urlOrId.toString();
    }
    if (typeof urlOrId === 'string') {
      const parts = urlOrId.split('/').filter(p => !!p);
      return parts[parts.length - 1];
    }
    return this.getGroupId(urlOrId.class_group);
  }
}
