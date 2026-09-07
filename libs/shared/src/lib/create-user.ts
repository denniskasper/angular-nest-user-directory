import { z } from 'zod';
import {
  CONDITIONAL_REQUIREMENT_PARAMS,
  conditionalRequirementMessage,
  requiredFieldsFor,
} from './conditional-requirement';
import { Role, USER_ROLES } from './role';

/**
 * What a new User must provide. Strict on purpose, and the sole authority on
 * it: the form validates against this before submitting, the API validates
 * the body against it, so the browser and the server cannot disagree
 * (spec.md, Shared rules module; ADR-0001). Every issue carries the path of
 * the one field at fault, so a client can attach it to that control.
 *
 * `phoneNumber` and `birthDate` are optional in the shape; which Roles
 * require them is the Conditional Requirement, a refinement over the flat
 * object rather than a union keyed on Role, so each issue still names one
 * field. The refinement runs even when another field has already failed,
 * so Role-dependent issues surface alongside the others rather than after
 * them. The id is never part of the input: the server assigns it.
 */
export const createUserSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: z.email('Enter an email address, like name@example.org'),
    phoneNumber: z.string().trim().min(1, 'Enter a phone number').optional(),
    birthDate: z.iso.date('Enter a date as YYYY-MM-DD').optional(),
    role: z.enum(USER_ROLES, 'Choose admin, editor or viewer'),
  })
  .superRefine(
    (user, ctx) => {
      // With `when` the refinement also sees input that never parsed as a
      // record, and a Role that is not one.
      const role: Role | undefined = USER_ROLES.find((r) => r === user?.role);
      if (role === undefined) return;
      for (const field of requiredFieldsFor(role)) {
        if (user[field] !== undefined) continue;
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: conditionalRequirementMessage(role, field),
          params: { ...CONDITIONAL_REQUIREMENT_PARAMS, role },
        });
      }
    },
    { when: () => true },
  );

export type CreateUser = z.infer<typeof createUserSchema>;
