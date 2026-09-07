import { Location } from '@angular/common';
import { NoopScrollStrategy } from '@angular/cdk/overlay';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserDetail, UserDetailData } from './user-detail';

/**
 * The `users/:id` route. It renders nothing itself: it opens the User's
 * detail in a Material dialog over the list, which stays mounted
 * underneath with its page and search intact, and returns to the list when
 * the dialog is dismissed — so a deep link opens the detail and dismissing
 * always leads back. Leaving the route (browser back, a new URL) closes the
 * dialog without navigating again.
 */
@Component({
  selector: 'app-user-detail-route',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailRoute implements OnDestroy {
  /** The route parameter, bound by the router. */
  readonly id = input.required<string>();

  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private ref: MatDialogRef<UserDetail> | undefined;
  private dismissed = false;

  constructor() {
    afterNextRender(() => {
      this.ref = this.dialog.open<UserDetail, UserDetailData>(UserDetail, {
        data: { id: this.id },
        // Full screen on phones, a centred card from tablet up: the pane is
        // sized in styles/_overlays.scss, so nothing here may cap it.
        maxWidth: '100vw',
        panelClass: 'user-detail-pane',
        backdropClass: 'user-detail-backdrop',
        // The page is held where it is by styles, not by moving it, so
        // browsing position survives untouched (styles.scss).
        scrollStrategy: new NoopScrollStrategy(),
      });
      this.ref.afterClosed().subscribe(() => this.onClosed());
    });
  }

  /**
   * The dialog closing — Close, Escape, the backdrop — returns to the list.
   * Opened from the list, that is one step back in history, so Back after
   * dismissing does not reopen the dialog; opened directly from a link,
   * there is nothing behind it, so the list is navigated to instead.
   */
  private onClosed(): void {
    if (this.dismissed) return;
    this.dismissed = true;
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/'], { queryParamsHandling: 'preserve' });
    }
  }

  ngOnDestroy(): void {
    this.dismissed = true;
    this.ref?.close();
  }
}
