import { Injectable, signal } from '@angular/core';

export interface SnackBarMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class SnackBarService {
  private nextId = 1;
  readonly messages = signal<SnackBarMessage[]>([]);

  show(text: string, type: 'success' | 'error' | 'info' = 'info', durationMs = 4000): void {
    const id = this.nextId++;
    const message: SnackBarMessage = { id, text, type };
    this.messages.update((list) => [...list, message]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  success(text: string, durationMs = 4000): void {
    this.show(text, 'success', durationMs);
  }

  error(text: string, durationMs = 5000): void {
    this.show(text, 'error', durationMs);
  }

  info(text: string, durationMs = 4000): void {
    this.show(text, 'info', durationMs);
  }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((m) => m.id !== id));
  }
}
