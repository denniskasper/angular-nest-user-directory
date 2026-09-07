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
  ValidationError,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import {
  CONDITIONAL_REQUIREMENT,
  ConditionalField,
  createUserSchema,
  fullName,
  isConditionalRequirementIssue,
  isValidationFailure,
  requiredFieldsFor,
  Role,
  User,
  USER_ROLES,
  ValidationFailure,
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
 * The kinds of error a control can carry. One `standardSchemaError` makes
 * is about the person's own entry — malformed, or missing where every User
 * needs it — and waits until they have been to the control. The other two
 * are caused from outside it: the Role they chose making it required
 * (`CONDITIONAL_REQUIREMENT`, from the shared module), or the server's
 * answer. Those show at once.
 */
const STANDARD_SCHEMA = 'standardSchema';
const SERVER = 'server';

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

/** The validation failure the server answered with, if that is what this is. */
function validationFailureOf(error: unknown): ValidationFailure | undefined {
  return error instanceof HttpErrorResponse && isValidationFailure(error.error)
    ? error.error
    : undefined;
}

/**
 * The form for adding a User. It is validated by the shared creation
 * schema — the same one the API validates the body against — with each
 * issue attached to the control at its path, so the browser can never
 * accept what the server rejects, nor reject what it would accept
 * (spec.md, Shared rules module). The Conditional Requirement shows the
 * moment a Role is chosen: the fields that Role requires are flagged, and
 * one left empty is marked at fault without a visit or a submit.
 *
 * Field-level problems appear inline; the outcome of a submission is
 * announced as a notice, and a success returns to the directory searched
 * for the new User's Full Name. Should the server reject the User anyway,
 * its field-keyed messages are attached to the controls they name. A
 * submit that fails moves focus to the first control at fault, whose error
 * is read with it.
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
      return result.error.issues.map(
        (issue): ValidationError.WithOptionalFieldTree => {
          const fieldTree = root[String(issue.path[0]) as keyof Draft] ?? root;
          return isConditionalRequirementIssue(issue)
            ? { kind: CONDITIONAL_REQUIREMENT, message: issue.message, fieldTree }
            : standardSchemaError(issue, { message: issue.message, fieldTree });
        },
      );
    });
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notices = inject(Notices);

  /** The Role that makes this field required, if the chosen one does. */
  protected requiredBy(field: ConditionalField): Role | undefined {
    const role = this.draft().role;
    return role && requiredFieldsFor(role).includes(field) ? role : undefined;
  }

  /**
   * The first problem to show against a field: any once the person has
   * been there or has tried to submit; before that, only one caused from
   * outside the field.
   */
  protected errorOf(field: FieldTree<unknown>): string | undefined {
    const state = field();
    const shown = state.touched()
      ? state.errors()
      : state.errors().filter((error) => error.kind !== STANDARD_SCHEMA);
    return shown[0]?.message;
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const succeeded = await submit(this.form, {
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
          return undefined;
        } catch (error) {
          return this.reportFailure(error);
        }
      },
    });
    if (!succeeded) this.focusFirstInvalid();
  }

  /**
   * Announces why the User was not added and, when the server named the
   * fields at fault, attaches its message to each control. A message about
   * a field the form does not have is carried in the notice instead, so
   * it is never lost.
   */
  private reportFailure(error: unknown): ValidationError.WithOptionalFieldTree[] {
    const failure = validationFailureOf(error);
    if (!failure) {
      this.notices.announce({
        tone: 'error',
        text: 'The User could not be added. Check the connection and try again.',
      });
      return [];
    }
    const errors: ValidationError.WithOptionalFieldTree[] = [];
    const unplaced: string[] = [];
    for (const [field, messages] of Object.entries(failure.fields)) {
      const fieldTree = FIELDS.includes(field as keyof Draft)
        ? this.form[field as keyof Draft]
        : undefined;
      for (const message of messages) {
        if (fieldTree) errors.push({ kind: SERVER, message, fieldTree });
        else unplaced.push(`${field}: ${message}`);
      }
    }
    if (!errors.length && !unplaced.length) unplaced.push(failure.message);
    this.notices.announce({
      tone: 'error',
      text: [
        'The directory rejected this User.',
        errors.length ? 'See the fields marked.' : '',
        unplaced.length ? `${unplaced.join('; ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    });
    return errors;
  }

  private focusFirstInvalid(): void {
    const first = FIELDS.find((field) => this.form[field]().invalid());
    if (!first) return;
    this.host.nativeElement
      .querySelector<HTMLElement>(`[data-field="${first}"]`)
      ?.focus();
  }
}
