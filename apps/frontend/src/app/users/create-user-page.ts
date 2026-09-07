import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import {
  FieldTree,
  form,
  FormField,
  standardSchemaError,
  submit,
  validateTree,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import {
  createUserSchema,
  fullName,
  Role,
  User,
  USER_ROLES,
} from '@pdr-cloud/shared';
import { firstValueFrom } from 'rxjs';
import { Notices } from '../notices';

/**
 * What the form holds while a User is being described: one string per
 * control, empty until entered, so each maps onto a native input one to
 * one. The Role is empty until one is chosen.
 */
interface Draft {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  role: Role | '';
}

const EMPTY_DRAFT: Draft = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  birthDate: '',
  role: '',
};

/** The controls in reading order, for finding the first at fault. */
const FIELDS = Object.keys(EMPTY_DRAFT) as (keyof Draft)[];

/**
 * The draft as the creation schema sees it. A blank optional field is an
 * absence, not an empty string, so the value validated here is exactly the
 * value that is sent.
 */
function toInput(draft: Draft): unknown {
  return {
    ...draft,
    phoneNumber: draft.phoneNumber || undefined,
    birthDate: draft.birthDate || undefined,
  };
}

/** What to tell the person when the server did not create the User. */
function describeFailure(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 400) {
    const messages: unknown = error.error?.message;
    const detail = Array.isArray(messages) ? `: ${messages.join('; ')}` : '';
    return `The directory rejected this User${detail}.`;
  }
  return 'The User could not be added. Check the connection and try again.';
}

/**
 * The form for adding a User. It is validated by the shared creation
 * schema — the same one the API validates the body against — with each
 * issue attached to the control at its path, so the browser can never
 * accept what the server rejects, nor reject what it would accept
 * (spec.md, Shared rules module). Field-level problems appear inline; the
 * outcome of a submission is announced as a notice, and a success returns
 * to the directory searched for the new User's Full Name. A submit that
 * fails in the browser moves focus to the first control at fault, whose
 * error is read with it.
 *
 * Single column and full width on phones; from tablet up the name and the
 * contact pairs sit side by side (create-user-page.scss).
 */
@Component({
  selector: 'app-create-user-page',
  imports: [FormField, RouterLink],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateUserPage {
  protected readonly roles = USER_ROLES;
  protected readonly draft = signal<Draft>({ ...EMPTY_DRAFT });
  protected readonly form = form(this.draft, (path) => {
    validateTree(path, ({ value, fieldTreeOf }) => {
      const result = createUserSchema.safeParse(toInput(value()));
      if (result.success) return undefined;
      const root = fieldTreeOf(path);
      return result.error.issues.map((issue) =>
        standardSchemaError(issue, {
          message: issue.message,
          fieldTree: root[String(issue.path[0]) as keyof Draft] ?? root,
        }),
      );
    });
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notices = inject(Notices);

  /** The first problem with a field, once the person has been there or has tried to submit. */
  protected errorOf(field: FieldTree<unknown>): string | undefined {
    const state = field();
    return state.touched() ? state.errors()[0]?.message : undefined;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.form, {
      action: async () => {
        try {
          const user = await firstValueFrom(
            this.http.post<User>(
              '/api/users',
              createUserSchema.parse(toInput(this.draft())),
            ),
          );
          this.notices.announce({
            tone: 'success',
            text: `${fullName(user)} was added as User #${user.id}.`,
          });
          await this.router.navigate(['/'], {
            queryParams: { search: fullName(user) },
          });
        } catch (error) {
          this.notices.announce({
            tone: 'error',
            text: describeFailure(error),
          });
        }
        return undefined;
      },
      onInvalid: () => this.focusFirstInvalid(),
    });
  }

  private focusFirstInvalid(): void {
    const first = FIELDS.find((field) => this.form[field]().invalid());
    if (!first) return;
    this.host.nativeElement
      .querySelector<HTMLElement>(`[data-field="${first}"]`)
      ?.focus();
  }
}
