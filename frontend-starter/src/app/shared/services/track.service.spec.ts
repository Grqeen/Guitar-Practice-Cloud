import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TrackService } from './track.service';
import { Page } from '../models/page.model';
import { Track } from '../models/track.model';

describe('TrackService', () => {
  let service: TrackService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrackService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TrackService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('list() doit transmettre correctement les query params page et limit a /api/tracks', () => {
    const mockPage: Page<Track> = {
      items: [
        {
          id: 'track-1',
          title: 'Little Wing Backing Track',
          originalName: 'little-wing.mp3',
          mimeType: 'audio/mpeg',
          size: 4500000,
          createdAt: '2026-02-01T12:00:00.000Z',
        },
      ],
      page: 2,
      limit: 10,
      total: 15,
      pages: 2,
    };

    service.list(2, 10).subscribe((result) => {
      expect(result.items.length).toBe(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(15);
    });

    const req = httpTesting.expectOne((r) => r.url === '/api/tracks');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');

    req.flush(mockPage);
  });

  it('delete() doit emettre une requete DELETE vers /api/tracks/:id', () => {
    service.delete('track-to-delete-456').subscribe();

    const req = httpTesting.expectOne('/api/tracks/track-to-delete-456');
    expect(req.request.method).toBe('DELETE');

    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('audio() doit emettre une requete GET vers /api/tracks/:id/audio avec responseType blob', () => {
    const mockBlob = new Blob(['fake audio binary'], { type: 'audio/mpeg' });

    service.audio('track-789').subscribe((blob) => {
      expect(blob).toBeTruthy();
      expect(blob.type).toBe('audio/mpeg');
    });

    const req = httpTesting.expectOne('/api/tracks/track-789/audio');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');

    req.flush(mockBlob);
  });

  it('cover() doit emettre une requete GET vers /api/tracks/:id/cover avec responseType blob', () => {
    const mockBlob = new Blob(['fake image binary'], { type: 'image/jpeg' });

    service.cover('track-789').subscribe((blob) => {
      expect(blob).toBeTruthy();
      expect(blob.type).toBe('image/jpeg');
    });

    const req = httpTesting.expectOne('/api/tracks/track-789/cover');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');

    req.flush(mockBlob);
  });
});
