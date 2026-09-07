import { test, expect, Page } from '@playwright/test';

/**
 * Seam 3 (spec.md, Testing Decisions): the browser. Covers ticket 03 — the
 * list renders every User — and ticket 05 — a User's detail opens from it —
 * at both the phone and desktop projects, and asserts the presentation
 * switch itself: stacked on phones, tabular from tablet width upward.
 */

/** Whichever presentation the current viewport shows. */
function presentation(page: Page) {
  const phone = test.info().project.name === 'phone';
  return {
    phone,
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

  test('lists every User with id, Full Name, email and Role, and opens one', async ({
    page,
  }) => {
    await page.goto('/');
    const { phone, entries } = presentation(page);

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

    // Selecting a User opens their detail, fetched individually by id.
    // User 74 sits deep enough in the list that opening and dismissing
    // would visibly lose the place if browsing position were not kept.
    const phillip = entries.filter({ hasText: 'Phillip Ayers' });
    await phillip.scrollIntoViewIfNeeded();

    const detailRequest = page.waitForResponse('**/api/users/74');
    await phillip.getByRole('link', { name: 'Phillip Ayers' }).click();
    expect((await detailRequest).status()).toBe(200);
    await expect(page).toHaveURL(/\/users\/74$/);

    const dialog = page.getByRole('dialog', { name: 'Phillip Ayers' });
    await expect(dialog).toBeVisible();
    // Where browsing was when the detail opened: the click itself may nudge
    // the page to bring the link fully into view, so this is read after it.
    const scrolledTo = await page.evaluate(() => window.scrollY);
    expect(scrolledTo).toBeGreaterThan(0);
    await expect(dialog).toContainText('brian15@yahoo.com');
    await expect(dialog).toContainText('+1-438-200-3046x31310');
    await expect(dialog.locator('time')).toHaveAttribute(
      'datetime',
      '1979-01-20',
    );
    await expect(dialog).toContainText('January 20, 1979');
    await expect(dialog).toContainText('admin');

    // Full screen on phones; a centred dialog from tablet up. Measured once
    // the entrance animation has settled, against the layout viewport.
    await dialog.evaluate((el) =>
      Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)),
    );
    const layout = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    }));
    const box = await dialog.boundingBox();
    if (!box) throw new Error('the dialog must have a box');
    if (phone) {
      expect(box).toEqual({ x: 0, y: 0, ...layout });
    } else {
      // Centred over the content column, which is what the eye measures
      // against; the column itself sits inside the reserved scrollbar gutter.
      const column = await page.getByRole('main').boundingBox();
      if (!column) throw new Error('the content column must have a box');
      expect(box.width).toBeLessThan(layout.width);
      expect(box.x).toBeGreaterThan(0);
      expect(box.x + box.width / 2).toBeCloseTo(column.x + column.width / 2, 0);
    }

    // Dismissing returns to the list where browsing left off.
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
    await expect(entries).toHaveCount(100);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolledTo);

    // An id no User holds reads as absent, not as a broken directory.
    await page.goto('/users/101');
    await expect(page.getByRole('dialog')).toContainText('No User with id 101');
  });
});
