import { DatePipe, Location } from '@angular/common';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { fullName, User } from '@pdr-cloud/shared';

/**
 * One User's detail, fetched individually by id so what is shown is
 * current rather than whatever the list held. Presented in a native modal
 * dialog: a full-screen sheet on phones, a centred card from tablet up
 * (user-detail.scss). Dismissing — the Close button, Escape, the backdrop —
 * returns to the list, which stays mounted underneath.
 */
@Component({
  selector: 'app-user-detail',
  imports: [DatePipe],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetail implements OnDestroy {
  /** The route parameter, bound by the router. */
  readonly id = input.required<string>();

  protected readonly user = httpResource<User>(() => `/api/users/${this.id()}`);
  /**
   * The API answers not-found for an id no User holds and rejects an id that
   * is not a number; to the person reading, both mean there is no such User,
   * as opposed to the directory being broken.
   */
  protected readonly absent = computed(() => {
    const status = (this.user.error() as HttpErrorResponse | undefined)?.status;
    return status === 404 || status === 400;
  });
  protected readonly broken = computed(
    () => this.user.error() !== undefined && !this.absent(),
  );
  protected readonly title = computed(() => {
    if (this.user.hasValue()) return fullName(this.user.value());
    if (this.absent()) return `No User with id ${this.id()}`;
    if (this.broken()) return 'This User could not be loaded';
    return 'Loading…';
  });

  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private dismissed = false;

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  /** A click on the backdrop lands on the dialog element itself, not its content. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /**
   * The dialog's native close — however triggered — returns to the list.
   * Opened from the list, that is one step back in history, so Back after
   * dismissing does not reopen the dialog; opened directly from a link,
   * there is nothing behind it, so the list is navigated to instead.
   */
  protected onClosed(): void {
    if (this.dismissed) return;
    this.dismissed = true;
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/'], { queryParamsHandling: 'preserve' });
    }
  }

  /** Leaving the route (browser back, a new URL) closes the dialog without navigating again. */
  ngOnDestroy(): void {
    this.dismissed = true;
    this.dialog().nativeElement.close();
  }
}
