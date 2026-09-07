import { z } from 'zod';
import { USER_ROLES } from './role';

/**
 * What a new User must provide. Strict on purpose, and the sole authority on
 * it: the form validates against this before submitting, the API validates
 * the body against it, so the browser and the server cannot disagree
 * (spec.md, Shared rules module; ADR-0001). Every issue carries the path of
 * the one field at fault, so a client can attach it to that control.
 *
 * `phoneNumber` and `birthDate` are optional here; which Roles require them
 * is the Conditional Requirement, layered on by ticket 08. The id is never
 * part of the input: the server assigns it.
 */
export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.email('Enter an email address, like name@example.org'),
  phoneNumber: z.string().trim().min(1, 'Enter a phone number').optional(),
  birthDate: z.iso.date('Enter a date as YYYY-MM-DD').optional(),
  role: z.enum(USER_ROLES, 'Choose admin, editor or viewer'),
});

export type CreateUser = z.infer<typeof createUserSchema>;
