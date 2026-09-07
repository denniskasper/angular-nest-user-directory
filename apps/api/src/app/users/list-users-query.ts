import { z } from 'zod';

/**
 * The optional parameters of the list endpoint. Either one present turns the
 * response from the complete list into a page of matches (spec.md, API
 * contract). `page` counts from 1; `search` is matched against the Full
 * Name, case-insensitively, before paging.
 */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().trim().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
