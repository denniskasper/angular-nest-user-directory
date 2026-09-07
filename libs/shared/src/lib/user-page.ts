import { z } from 'zod';
import { storedUserSchema } from './user';

/** How many Users a page of the directory holds. */
export const USERS_PAGE_SIZE = 25;

/**
 * One page of the directory, as returned when the list is requested with
 * paging or search parameters. `total` counts every User the search matched,
 * not only those on this page, so a client can render pagination from it.
 */
export const userPageSchema = z
  .object({
    items: z.array(storedUserSchema),
    total: z.int().nonnegative(),
    page: z.int().min(1),
    pageSize: z.literal(USERS_PAGE_SIZE),
  })
  .meta({
    id: 'UserPage',
    description:
      'One page of Users. total counts every User the search matched, not only those on this page.',
  });

export type UserPage = z.infer<typeof userPageSchema>;
