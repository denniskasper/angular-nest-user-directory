import { Page, test } from '@playwright/test';

/**
 * Whichever presentation of the Users the current viewport shows: the
 * stacked list on the phone project, the table on the desktop one.
 */
export function presentation(page: Page) {
  const phone = test.info().project.name === 'phone';
  const list = page.getByRole('list', { name: 'Users' });
  const table = page.getByRole('table', { name: 'Users' });
  return {
    phone,
    shown: phone ? list : table,
    hidden: phone ? table : list,
    /** One per User shown: a list item on phones, a table row otherwise. */
    entries: phone
      ? list.getByRole('listitem')
      : table.locator('tbody').getByRole('row'),
  };
}
