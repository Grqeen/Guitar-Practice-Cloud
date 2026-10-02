import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  ngOnInit(): void {
    // Si l'utilisateur est déjà en mémoire, on préremplit le formulaire
    const current = this.auth.currentUser();
    if (current) {
      this.form.setValue({ name: current.name });
    }
    // Chargement automatique de /api/users/me lorsque le profil est demandé
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.profile().subscribe({
      next: (user) => {
        this.loading.set(false);
        console.debug('[ProfilePage] Profil chargé', user.id);
        this.form.setValue({ name: user.name });
      },
      error: (error) => {
        this.loading.set(false);
        console.error('[ProfilePage] Chargement impossible', error);
        this.errorMessage.set(error.error?.message ?? 'Impossible de charger le profil');
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const newName = this.form.getRawValue().name;
    this.auth.update(newName).subscribe({
      next: (user) => {
        this.saving.set(false);
        console.debug('[ProfilePage] Profil enregistré', user.id);
        this.successMessage.set('Votre nom a été modifié avec succès !');
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (error) => {
        this.saving.set(false);
        console.error('[ProfilePage] Enregistrement impossible', error);
        this.errorMessage.set(error.error?.message ?? 'Échec de la modification du profil');
      },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}

