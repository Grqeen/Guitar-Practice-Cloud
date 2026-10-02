import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

/** Formats MIME types into short readable badges (MP3, WAV, etc.) */
function getFormatBadge(mimeType: string, filename: string): string {
  if (mimeType.includes('mpeg') || filename.endsWith('.mp3')) return 'MP3';
  if (mimeType.includes('wav') || filename.endsWith('.wav')) return 'WAV';
  if (mimeType.includes('ogg') || filename.endsWith('.ogg')) return 'OGG';
  if (mimeType.includes('mp4') || mimeType.includes('m4a') || filename.endsWith('.m4a')) return 'M4A';
  return 'AUDIO';
}

/** Formats byte size into human readable string (Mo / Ko) */
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
  return `${Math.round(bytes / 1024)} Ko`;
}

/** Formats ISO date into French locale format */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnInit, OnDestroy {
  private readonly service = inject(TrackService);

  // Signaux pour la pagination et la bibliothèque
  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly total = signal(0);
  readonly limit = signal(5);
  readonly loading = signal(false);
  readonly error = signal('');

  // Signaux pour l'upload
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal('');
  file?: File;

  // Contrôles de formulaire
  readonly title = new FormControl('', { nonNullable: true });
  readonly searchFilter = new FormControl('', { nonNullable: true });

  // Signaux pour le lecteur audio
  readonly currentTrack = signal<Track | null>(null);
  readonly audioUrl = signal('');
  readonly audioLoading = signal(false);
  readonly audioError = signal('');

  // Pistes filtrées par recherche locale
  readonly displayedTracks = computed(() => {
    const query = this.searchFilter.value.trim().toLowerCase();
    if (!query) return this.tracks();
    return this.tracks().filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.originalName.toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    // Révocation impérative de l'URL finale pour libérer la mémoire du navigateur
    const url = this.audioUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.service.list(this.page(), this.limit()).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[TracksPage] Chargement impossible', err);
        this.error.set('Impossible de charger les pistes depuis le serveur.');
        this.loading.set(false);
      },
    });
  }

  go(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.pages() || pageNumber === this.page()) {
      return;
    }
    this.page.set(pageNumber);
    this.load();
  }

  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0];
    this.uploadError.set('');
    this.uploadSuccess.set('');

    if (!selectedFile) {
      this.file = undefined;
      return;
    }

    // Validation 1 : Vérification de la taille (25 Mo max)
    if (selectedFile.size > MAX_FILE_SIZE) {
      this.uploadError.set(
        `Le fichier est trop volumineux (${formatFileSize(selectedFile.size)}). La taille maximale autorisée est de 25 Mo.`,
      );
      this.file = undefined;
      input.value = '';
      return;
    }

    // Validation 2 : Vérification du type MIME / extension
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    const isExtensionValid = ['mp3', 'wav', 'ogg', 'm4a', 'mp4'].includes(extension ?? '');
    const isMimeValid = ALLOWED_MIME_TYPES.has(selectedFile.type);

    if (!isMimeValid && !isExtensionValid) {
      this.uploadError.set(
        `Format audio '${selectedFile.type || extension}' non supporté. Formats acceptés : MP3, WAV, OGG, M4A.`,
      );
      this.file = undefined;
      input.value = '';
      return;
    }

    this.file = selectedFile;

    // Pré-remplir le titre si vide
    if (!this.title.value.trim()) {
      const cleanTitle = selectedFile.name.replace(/\.[^/.]+$/, '');
      this.title.setValue(cleanTitle);
    }
  }

  upload(fileInput: HTMLInputElement): void {
    if (!this.file) {
      this.uploadError.set('Veuillez sélectionner un fichier audio.');
      return;
    }

    this.uploading.set(true);
    this.uploadError.set('');
    this.uploadSuccess.set('');

    const trackTitle = this.title.value.trim() || this.file.name;

    this.service.upload(this.file, trackTitle).subscribe({
      next: (track) => {
        console.debug('[TracksPage] Piste envoyée avec succès', track.id);
        this.uploadSuccess.set(`Le morceau « ${track.title} » a été ajouté à votre bibliothèque !`);
        this.title.setValue('');
        this.file = undefined;
        fileInput.value = '';
        this.uploading.set(false);

        // Retour en page 1 et rafraîchissement
        this.page.set(1);
        this.load();

        setTimeout(() => this.uploadSuccess.set(''), 5000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.uploading.set(false);
        console.error('[TracksPage] Envoi impossible', err);
        this.uploadError.set(
          err.error?.message ?? "Une erreur est survenue lors de l'envoi du fichier audio.",
        );
      },
    });
  }

  play(track: Track): void {
    // Si c'est déjà la piste en cours de lecture
    if (this.currentTrack()?.id === track.id && this.audioUrl()) {
      return;
    }

    this.audioLoading.set(true);
    this.audioError.set('');

    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé avec succès', track.id);
        // Révocation de l'ancienne URL pour libérer la mémoire vive
        const previousUrl = this.audioUrl();
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }

        const newUrl = URL.createObjectURL(blob);
        this.audioUrl.set(newUrl);
        this.currentTrack.set(track);
        this.audioLoading.set(false);
      },
      error: (err) => {
        console.error('[TracksPage] Lecture audio impossible', err);
        this.audioLoading.set(false);
        this.audioError.set(`Impossible de lire le morceau « ${track.title} » (accès refusé ou fichier indisponible).`);
      },
    });
  }

  deleteTrack(track: Track): void {
    const confirmation = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement le morceau « ${track.title} » ?`,
    );
    if (!confirmation) return;

    // Si le morceau supprimé était en cours de lecture, stopper l'audio
    if (this.currentTrack()?.id === track.id) {
      const url = this.audioUrl();
      if (url) URL.revokeObjectURL(url);
      this.audioUrl.set('');
      this.currentTrack.set(null);
    }

    this.service.delete(track.id).subscribe({
      next: () => {
        console.debug('[TracksPage] Piste supprimée', track.id);
        // Si c'était la dernière piste de la page et qu'on n'est pas sur la page 1
        if (this.tracks().length === 1 && this.page() > 1) {
          this.page.update((p) => p - 1);
        }
        this.load();
      },
      error: (err) => {
        console.error('[TracksPage] Erreur lors de la suppression', err);
        this.error.set("Impossible de supprimer la piste. Vérifiez vos autorisations.");
      },
    });
  }

  // Fonctions utilitaires exposées au template
  formatSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  formatDate(iso: string): string {
    return formatDate(iso);
  }

  getBadge(mimeType: string, filename: string): string {
    return getFormatBadge(mimeType, filename);
  }
}

