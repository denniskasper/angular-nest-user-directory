import { test, expect } from '@playwright/test';
import { presentation } from './presentation';

/**
 * Seam 3 (spec.md, Testing Decisions): the browser. Covers ticket 03 — the
 * list renders — ticket 06 — it pages — and ticket 05 — a User's detail
 * opens from it — at both the phone and desktop projects, and asserts the
 * presentation switch itself: stacked on phones, tabular from tablet width
 * upward.
 */

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

  test('lists Users with id, Full Name, email and Role, pages through them, and opens one', async ({
    page,
  }) => {
    await page.goto('/');
    const { phone, entries } = presentation(page);

    // The first page of 25, and the size of the whole directory.
    await expect(entries).toHaveCount(25);
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

    // Paging: the next 25, cut on the server, with the position reported.
    const pager = page.getByRole('navigation', { name: 'Pagination' });
    await expect(pager).toContainText('Page 1 of 4');
    await expect(
      pager.getByRole('button', { name: 'Previous' }),
    ).toBeDisabled();
    const next = pager.getByRole('button', { name: 'Next' });
    await next.click();
    await expect(page).toHaveURL(/\?page=2$/);
    await expect(entries).toHaveCount(25);
    await expect(entries.first()).toContainText('Heather Kidd');
    await expect(
      entries.first().getByText('26', { exact: true }),
    ).toBeVisible();
    await expect(pager).toContainText('Showing 26–50 of 100');
    await expect(pager).toContainText('Page 2 of 4');

    // The controls stay reachable and tappable at every width: on phones
    // the pager holds the bottom of the screen, so it is visible wherever
    // browsing is, and each button is at least a fingertip tall.
    await entries.last().scrollIntoViewIfNeeded();
    const viewport = page.viewportSize();
    const nextBox = await next.boundingBox();
    if (!viewport || !nextBox) throw new Error('viewport and Next must exist');
    expect(nextBox.height).toBeGreaterThanOrEqual(44);
    expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(viewport.height);
    expect(nextBox.x + nextBox.width).toBeLessThanOrEqual(viewport.width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);

    // Selecting a User opens their detail, fetched individually by id.
    // User 74 sits deep enough in the third page that opening and dismissing
    // would visibly lose the place if browsing position were not kept.
    await page.goto('/?page=3');
    await expect(pager).toContainText('Page 3 of 4');
    const phillip = entries.filter({ hasText: 'Phillip Ayers' });
    await phillip.scrollIntoViewIfNeeded();

    const detailRequest = page.waitForResponse('**/api/users/74');
    await phillip.getByRole('link', { name: 'Phillip Ayers' }).click();
    expect((await detailRequest).status()).toBe(200);
    await expect(page).toHaveURL(/\/users\/74\?page=3$/);

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
      // against; the column itself sits inside the reserved scrollbar gutter,
      // and is hidden from assistive technology while the dialog is open.
      const column = await page
        .getByRole('main', { includeHidden: true })
        .boundingBox();
      if (!column) throw new Error('the content column must have a box');
      expect(box.width).toBeLessThan(layout.width);
      expect(box.x).toBeGreaterThan(0);
      expect(box.x + box.width / 2).toBeCloseTo(column.x + column.width / 2, 0);
    }

    // Dismissing returns to the list — the same page, where browsing left off.
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/\?page=3$/);
    await expect(entries).toHaveCount(25);
    await expect(phillip).toHaveCount(1);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolledTo);

    // An id no User holds reads as absent, not as a broken directory.
    await page.goto('/users/101');
    await expect(page.getByRole('dialog')).toContainText('No User with id 101');
  });
});
