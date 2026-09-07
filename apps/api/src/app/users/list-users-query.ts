import { z } from 'zod';

/**
 * The optional parameters of the list endpoint. Either one present turns the
 * response from the complete list into a page of matches (spec.md, API
 * contract). `page` counts from 1; `search` is matched against the Full
 * Name, case-insensitively, before paging.
 */
export const listUsersQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .describe('The page of matches to return, counting from 1'),
  search: z
    .string()
    .trim()
    .optional()
    .describe('Keeps the Users whose Full Name contains this, ignoring case'),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
