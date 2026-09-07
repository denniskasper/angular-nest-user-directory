import { z } from 'zod';
import { USER_ROLES } from './role';

/**
 * A User as it may legitimately exist in the store. Tolerant on purpose:
 * `email`, `phoneNumber` and `birthDate` may be absent on a Legacy Record,
 * even where today's Conditional Requirement would demand them (ADR-0001).
 * Values that are present must be well-formed: Normalization repairs or
 * clears anything else before a record reaches the store.
 */
export const storedUserSchema = z
  .object({
    id: z.number().int(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.email().optional(),
    phoneNumber: z.string().optional(),
    birthDate: z.iso.date().optional(),
    role: z.enum(USER_ROLES),
  })
  .meta({
    id: 'User',
    description:
      'A User as stored. email, phoneNumber and birthDate may be absent on a Legacy Record that entered as Seed Data, whatever its Role would require of a new User.',
  });

export type User = z.infer<typeof storedUserSchema>;

/** A User's Full Name: firstName and lastName joined by a single space. */
export function fullName(user: Pick<User, 'firstName' | 'lastName'>): string {
  return `${user.firstName} ${user.lastName}`;
}
