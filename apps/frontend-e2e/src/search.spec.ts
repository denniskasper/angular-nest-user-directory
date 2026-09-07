import { test, expect, Page } from '@playwright/test';

/**
 * Seam 3 (spec.md, Testing Decisions): the browser. Covers ticket 06 —
 * search narrows the results — at both the phone and desktop projects.
 */

/** The Users shown in whichever presentation the current viewport uses. */
function entries(page: Page) {
  return test.info().project.name === 'phone'
    ? page.getByRole('list', { name: 'Users' }).getByRole('listitem')
    : page
        .getByRole('table', { name: 'Users' })
        .locator('tbody')
        .getByRole('row');
}

test.describe('search', () => {
  test('narrows the directory by Full Name and pages the matches', async ({
    page,
  }) => {
    await page.goto('/');
    const shown = entries(page);
    const search = page.getByRole('searchbox', { name: 'Search by Full Name' });
    const pager = page.getByRole('navigation', { name: 'Pagination' });
    await expect(shown).toHaveCount(25);

    // Part of a first name, a space, the start of a last name — in the
    // wrong case — finds the one person, and the total reports the match.
    await search.fill('SARAH r');
    await expect(shown).toHaveCount(1);
    await expect(shown.first()).toContainText('Sarah Russell');
    await expect(page.getByText('1 match', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\?search=SARAH(\+|%20)r$/);
    await expect(pager).toBeHidden();

    // A broad search stays navigable: the total counts every match, and the
    // matches are paged.
    await search.fill('an');
    await expect(page.getByText('29 matches')).toBeVisible();
    await expect(shown).toHaveCount(25);
    await expect(pager).toContainText('Page 1 of 2');
    await pager.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(/\?search=an&page=2$/);
    await expect(shown).toHaveCount(4);
    await expect(pager).toContainText('Showing 26–29 of 29');
    for (const name of await shown.getByRole('link').allInnerTexts()) {
      expect(name.toLowerCase()).toContain('an');
    }

    // A new search starts again from the first page, and no match reads as
    // no match rather than as an empty directory.
    await search.fill('zz');
    await expect(page).toHaveURL(/\?search=zz$/);
    await expect(page.getByText('0 matches')).toBeVisible();
    await expect(
      page.getByText('No User’s Full Name contains “zz”'),
    ).toBeVisible();
    await expect(shown).toHaveCount(0);

    // Clearing the search returns the whole directory.
    await search.fill('');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('100 Users')).toBeVisible();
    await expect(shown).toHaveCount(25);
  });

  test('reproduces a search and page from the URL', async ({ page }) => {
    await page.goto('/?search=an&page=2');

    await expect(
      page.getByRole('searchbox', { name: 'Search by Full Name' }),
    ).toHaveValue('an');
    await expect(entries(page)).toHaveCount(4);
    await expect(
      page.getByRole('navigation', { name: 'Pagination' }),
    ).toContainText('Page 2 of 2');
  });
});
