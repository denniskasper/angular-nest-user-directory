import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
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

/**
 * What the form holds while a User is being described: one string per
 * control, empty until entered, so each maps onto an input one to one.
 * The Role is empty until one is chosen.
 */
interface Draft {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  role: Role | '';
}

type Field = keyof Draft;

/** The controls in reading order, for finding the first at fault. */
const FIELDS: readonly Field[] = [
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
  'birthDate',
  'role',
];

function isField(name: string): name is Field {
  return (FIELDS as readonly string[]).includes(name);
}

/**
 * The kinds of error a control can carry, keyed in its `errors`. A `schema`
 * error is about the person's own entry — malformed, or missing where
 * every User needs it — and waits until they have been to the control.
 * The other two are caused from outside it: the Role they chose making it
 * required (`CONDITIONAL_REQUIREMENT`, from the shared module), or the
 * server's answer. Those show at once.
 */
const SCHEMA = 'schema';
const SERVER = 'server';

/**
 * Whether a control's errors are shown: any once the person has been
 * there or has tried to submit; before that, only one caused from outside
 * the control.
 */
function showsErrors(
  control: AbstractControl | null,
  submitted: boolean,
): boolean {
  if (!control?.invalid) return false;
  if (control.touched || submitted) return true;
  return Object.keys(control.errors ?? {}).some((kind) => kind !== SCHEMA);
}

/**
 * Material shows a field's errors, and marks its control invalid, while
 * the field is in "error state". By default that waits for a visit or a
 * submit; this matcher also lets an error caused from outside the control
 * through, so a field the chosen Role has just made required is marked at
 * fault the moment the Role is chosen.
 */
class OutsideCausedErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: AbstractControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    return showsErrors(control, !!form?.submitted);
  }
}

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

/** A success confirms and clears itself; an error stays until it is dismissed, since it asks for a decision. */
const SUCCESS: MatSnackBarConfig = {
  duration: 7000,
  politeness: 'polite',
  panelClass: 'notice--success',
};
const FAILURE: MatSnackBarConfig = {
  politeness: 'assertive',
  panelClass: 'notice--error',
};

/**
 * The form for adding a User: a Reactive Form of Material form fields,
 * validated by the shared creation schema — the same one the API validates
 * the body against — with each issue attached to the control at its path,
 * so the browser can never accept what the server rejects, nor reject what
 * it would accept (spec.md, Shared rules module). The Conditional
 * Requirement shows the moment a Role is chosen: the fields that Role
 * requires are flagged, and one left empty is marked at fault without a
 * visit or a submit.
 *
 * Field-level problems appear inline; the outcome of a submission is shown
 * in a snack bar, and a success returns to the directory searched for the
 * new User's Full Name. Should the server reject the User anyway, its
 * field-keyed messages are attached to the controls they name. A submit
 * that fails moves focus to the first control at fault, whose error is read
 * with it.
 *
 * Single column and full width on phones; from tablet up the name and the
 * contact pairs sit side by side (create-user-page.scss).
 */
@Component({
  selector: 'app-create-user-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
  ],
  providers: [
    { provide: ErrorStateMatcher, useClass: OutsideCausedErrorStateMatcher },
  ],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateUserPage {
  protected readonly roles = USER_ROLES;
  protected readonly submitting = signal(false);

  /**
   * What the server last rejected, held so its messages stay on the
   * controls they name until the value it rejected is changed.
   */
  private rejected: { value: Draft; fields: Partial<Record<Field, string>> } =
    { value: {} as Draft, fields: {} };

  /**
   * One rule for the whole group: parse the draft with the creation schema
   * and write each issue onto the control at its path. It runs on any value
   * change, so a Role-dependent issue lands on its field the moment the
   * Role changes, on controls nobody has visited yet.
   */
  private readonly validateDraft: ValidatorFn = (group) => {
    const draft = group.value as Draft;
    const result = createUserSchema.safeParse(toInput(draft));
    const issues: Partial<Record<Field, ValidationErrors>> = {};
    for (const issue of result.success ? [] : result.error.issues) {
      const field = String(issue.path[0]);
      if (!isField(field)) continue;
      const kind = isConditionalRequirementIssue(issue)
        ? CONDITIONAL_REQUIREMENT
        : SCHEMA;
      issues[field] = { ...issues[field], [kind]: issue.message };
    }
    for (const field of FIELDS) {
      const server = this.rejected.fields[field];
      const unchanged = this.rejected.value[field] === draft[field];
      const errors: ValidationErrors = {
        ...issues[field],
        ...(server && unchanged ? { [SERVER]: server } : {}),
      };
      group
        .get(field)
        ?.setErrors(Object.keys(errors).length ? errors : null, {
          emitEvent: false,
        });
    }
    return null;
  };

  protected readonly form = new FormGroup(
    {
      firstName: new FormControl('', { nonNullable: true }),
      lastName: new FormControl('', { nonNullable: true }),
      email: new FormControl('', { nonNullable: true }),
      phoneNumber: new FormControl('', { nonNullable: true }),
      birthDate: new FormControl('', { nonNullable: true }),
      role: new FormControl<Role | ''>('', { nonNullable: true }),
    },
    { validators: this.validateDraft },
  );

  /** The Role chosen, as a signal so the flags follow it under OnPush. */
  private readonly role = toSignal(this.form.controls.role.valueChanges, {
    initialValue: this.form.controls.role.value,
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** The Role that makes this field required, if the chosen one does. */
  protected requiredBy(field: ConditionalField): Role | undefined {
    const role = this.role();
    return role && requiredFieldsFor(role).includes(field) ? role : undefined;
  }

  /** The first problem against a field; the field shows it only while in error state. */
  protected errorOf(field: Field): string | undefined {
    const errors = this.form.controls[field].errors;
    return errors ? String(Object.values(errors)[0]) : undefined;
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    this.submitting.set(true);
    try {
      const user = await firstValueFrom(
        this.http.post<User>(
          '/api/users',
          createUserSchema.parse(toInput(this.form.getRawValue())),
        ),
      );
      this.snackBar.open(
        `${fullName(user)} was added as User #${user.id}.`,
        undefined,
        SUCCESS,
      );
      await this.router.navigate(['/'], {
        queryParams: { search: fullName(user) },
      });
    } catch (error) {
      this.reportFailure(error);
      this.focusFirstInvalid();
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Says why the User was not added and, when the server named the fields
   * at fault, attaches its message to each control. A message about a
   * field the form does not have is carried in the snack bar instead, so
   * it is never lost.
   */
  private reportFailure(error: unknown): void {
    const failure = validationFailureOf(error);
    if (!failure) {
      this.snackBar.open(
        'The User could not be added. Check the connection and try again.',
        'Dismiss',
        FAILURE,
      );
      return;
    }
    const fields: Partial<Record<Field, string>> = {};
    const unplaced: string[] = [];
    for (const [field, messages] of Object.entries(failure.fields)) {
      if (isField(field)) fields[field] = messages.join(' ');
      else unplaced.push(`${field}: ${messages.join('; ')}`);
    }
    const placed = Object.keys(fields).length > 0;
    if (!placed && !unplaced.length) unplaced.push(failure.message);
    this.rejected = { value: this.form.getRawValue(), fields };
    this.form.updateValueAndValidity();
    this.snackBar.open(
      [
        'The directory rejected this User.',
        placed ? 'See the fields marked.' : '',
        unplaced.length ? `${unplaced.join('; ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      'Dismiss',
      FAILURE,
    );
  }

  private focusFirstInvalid(): void {
    const first = FIELDS.find((field) => this.form.controls[field].invalid);
    if (!first) return;
    this.host.nativeElement
      .querySelector<HTMLElement>(`[data-field="${first}"]`)
      ?.focus();
  }
}
