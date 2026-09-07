import { DatePipe } from '@angular/common';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { fullName, User } from '@pdr-cloud/shared';

/** What the detail is opened with: the id of the User to show. */
export interface UserDetailData {
  id: Signal<string>;
}

/**
 * One User's detail, fetched individually by id so what is shown is
 * current rather than whatever the list held. The content of a Material
 * dialog opened by the `users/:id` route (user-detail-route.ts): a
 * full-screen sheet on phones, a centred card from tablet up
 * (styles/_overlays.scss, user-detail.scss). Its title names the dialog.
 */
@Component({
  selector: 'app-user-detail',
  imports: [DatePipe, MatDialogModule],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetail {
  protected readonly id = inject<UserDetailData>(MAT_DIALOG_DATA).id;

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
}
