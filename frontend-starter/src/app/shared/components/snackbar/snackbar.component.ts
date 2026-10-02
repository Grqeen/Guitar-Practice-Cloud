import { Component, inject } from '@angular/core';
import { SnackBarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  template: `
    <div class="snackbar-container" aria-live="polite" aria-atomic="true">
      @for (msg of snackbar.messages(); track msg.id) {
        <div class="snackbar-toast" [class]="'toast-' + msg.type">
          <span class="toast-icon">
            @if (msg.type === 'success') {
              ✓
            } @else if (msg.type === 'error') {
              ✕
            } @else {
              ℹ
            }
          </span>
          <span class="toast-text">{{ msg.text }}</span>
          <button
            type="button"
            class="toast-close"
            (click)="snackbar.dismiss(msg.id)"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .snackbar-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
      pointer-events: none;
    }

    .snackbar-toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      animation: slideIn 0.25s ease-out;
      transition: all 0.2s ease;
    }

    .toast-success {
      background: #14532d;
      color: #bbf7d0;
      border: 1px solid #22c55e;
    }

    .toast-error {
      background: #7f1d1d;
      color: #fecaca;
      border: 1px solid #ef4444;
    }

    .toast-info {
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #64748b;
    }

    .toast-icon {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .toast-text {
      flex: 1;
      line-height: 1.4;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: inherit;
      font-size: 1.3rem;
      cursor: pointer;
      opacity: 0.7;
      padding: 0 4px;
      line-height: 1;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `],
})
export class SnackBarComponent {
  readonly snackbar = inject(SnackBarService);
}
