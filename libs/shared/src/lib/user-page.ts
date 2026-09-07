import { User } from './user';

/** How many Users a page of the directory holds. */
export const USERS_PAGE_SIZE = 25;

/**
 * One page of the directory, as returned when the list is requested with
 * paging or search parameters. `total` counts every User the search matched,
 * not only those on this page, so a client can render pagination from it.
 */
export interface UserPage {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
}
