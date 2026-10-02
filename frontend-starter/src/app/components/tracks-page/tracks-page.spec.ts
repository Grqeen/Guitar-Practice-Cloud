import '../../../test-setup';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TracksPageComponent } from './tracks-page';
import { TrackService } from '../../shared/services/track.service';
import { SnackBarService } from '../../shared/services/snackbar.service';
import { Track } from '../../shared/models/track.model';
import { Page } from '../../shared/models/page.model';

describe('TracksPageComponent', () => {
  let component: TracksPageComponent;
  let trackServiceMock: Partial<Record<keyof TrackService, any>>;
  let snackbarService: SnackBarService;

  const sampleTrack: Track = {
    id: 'track-abc',
    title: 'Autumn Leaves Backing Track',
    originalName: 'autumn.mp3',
    mimeType: 'audio/mpeg',
    size: 5000000,
    createdAt: '2026-03-01T10:00:00.000Z',
  };

  const samplePage: Page<Track> = {
    items: [sampleTrack],
    page: 1,
    limit: 5,
    total: 1,
    pages: 1,
  };

  beforeEach(() => {
    trackServiceMock = {
      list: vi.fn().mockReturnValue(of(samplePage)),
      delete: vi.fn().mockReturnValue(of(undefined)),
      upload: vi.fn(),
      audio: vi.fn(),
      cover: vi.fn().mockReturnValue(of(new Blob(['fake-img'], { type: 'image/png' }))),
    };

    TestBed.configureTestingModule({
      imports: [TracksPageComponent],
      providers: [
        { provide: TrackService, useValue: trackServiceMock },
        SnackBarService,
      ],
    });

    snackbarService = TestBed.inject(SnackBarService);
    const fixture = TestBed.createComponent(TracksPageComponent);
    component = fixture.componentInstance;
  });

  it('ngOnInit() doit charger la liste des morceaux depuis TrackService', () => {
    component.ngOnInit();

    expect(trackServiceMock.list).toHaveBeenCalledWith(1, 5);
    expect(component.tracks().length).toBe(1);
    expect(component.tracks()[0].title).toBe('Autumn Leaves Backing Track');
    expect(component.total()).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('deleteTrack() doit demander confirmation, appeler TrackService.delete() et notifier via SnackBar', () => {
    // Simule la confirmation utilisateur "OK"
    window.confirm = vi.fn().mockReturnValue(true);
    const snackbarSuccessSpy = vi.spyOn(snackbarService, 'success');

    component.tracks.set([sampleTrack]);
    component.deleteTrack(sampleTrack);

    expect(trackServiceMock.delete).toHaveBeenCalledWith('track-abc');
    expect(snackbarSuccessSpy).toHaveBeenCalledWith(
      expect.stringContaining('supprimé avec succès'),
    );
  });

  it('deleteTrack() doit afficher une erreur adaptee si la piste a deja ete supprimee (erreur 404)', () => {
    window.confirm = vi.fn().mockReturnValue(true);
    const snackbarErrorSpy = vi.spyOn(snackbarService, 'error');
    (trackServiceMock.delete as any).mockReturnValue(
      throwError(() => ({ status: 404 })),
    );

    component.deleteTrack(sampleTrack);

    expect(snackbarErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("n'existe plus"),
    );
  });

  it('chooseCover() doit valider le format de limage et generer une preview', () => {
    const fakeFile = new File(['fake-img-content'], 'cover.png', { type: 'image/png' });
    const event = {
      target: {
        files: [fakeFile],
        value: 'cover.png',
      },
    } as unknown as Event;

    // Mock URL.createObjectURL et revokeObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-uuid');
    window.URL.revokeObjectURL = vi.fn();

    component.chooseCover(event);

    expect(component.coverFile).toBe(fakeFile);
    expect(component.coverPreviewUrl()).toBe('blob:http://localhost/fake-uuid');

    // Test de removeCover()
    component.removeCover();
    expect(component.coverFile).toBeUndefined();
    expect(component.coverPreviewUrl()).toBe('');
  });
});
