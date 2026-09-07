import { Injectable, signal } from '@angular/core';

/** What a notice says and how it should read. */
export interface Notice {
  tone: 'success' | 'error';
  text: string;
}

/** How long a success stays on screen before clearing itself. */
const SUCCESS_LINGERS_MS = 7000;

/**
 * The outcome of an action, announced separately from wherever the action
 * was taken (spec.md, Frontend composition): a view announces here, the
 * shell shows it, so a confirmation survives the navigation that follows a
 * successful action. A success clears itself; an error stays until it is
 * dismissed or replaced, since it asks for a decision.
 */
@Injectable({ providedIn: 'root' })
export class Notices {
  readonly current = signal<Notice | undefined>(undefined);
  private timer: ReturnType<typeof setTimeout> | undefined;

  announce(notice: Notice): void {
    clearTimeout(this.timer);
    this.current.set(notice);
    if (notice.tone === 'success') {
      this.timer = setTimeout(() => this.dismiss(), SUCCESS_LINGERS_MS);
    }
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.current.set(undefined);
  }
}
