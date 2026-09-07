import { test, expect, Page } from '@playwright/test';

/**
 * Seam 3 (spec.md, Testing Decisions): the browser. Covers ticket 03 — the
 * list renders every User — at both the phone and desktop projects, and
 * asserts the presentation switch itself: stacked on phones, tabular from
 * tablet width upward.
 */

/** Whichever presentation the current viewport shows. */
function presentation(page: Page) {
  const phone = test.info().project.name === 'phone';
  return {
    shown: phone
      ? page.getByRole('list', { name: 'Users' })
      : page.getByRole('table', { name: 'Users' }),
    hidden: phone
      ? page.getByRole('table', { name: 'Users' })
      : page.getByRole('list', { name: 'Users' }),
    entries: phone
      ? page.getByRole('list', { name: 'Users' }).getByRole('listitem')
      : page
          .getByRole('table', { name: 'Users' })
          .locator('tbody')
          .getByRole('row'),
  };
}

test.describe('user list', () => {
  test('shows the stacked presentation on phones and the table on desktops', async ({
    page,
  }) => {
    await page.goto('/');
    const { shown, hidden } = presentation(page);

    await expect(shown).toBeVisible();
    await expect(hidden).toBeHidden();

    const viewport = page.viewportSize();
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(viewport?.width ?? 0);
  });

  test('lists every User with id, Full Name, email and Role', async ({
    page,
  }) => {
    await page.goto('/');
    const { entries } = presentation(page);

    await expect(entries).toHaveCount(100);
    await expect(page.getByText('100 Users')).toBeVisible();

    const sarah = entries.filter({ hasText: 'Sarah Russell' });
    await expect(sarah).toHaveCount(1);
    await expect(sarah.getByText('7', { exact: true })).toBeVisible();
    await expect(sarah).toContainText('xmills@david.org');
    await expect(sarah).toContainText('admin');

    // A Legacy Record's absent email reads as absent, not as a broken value.
    const amanda = entries.filter({ hasText: 'Amanda Miller' });
    await expect(amanda).toHaveCount(1);
    await expect(amanda).toContainText('No email');
    await expect(amanda).not.toContainText('undefined');
  });
});
