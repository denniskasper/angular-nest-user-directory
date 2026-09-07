import { test, expect } from '@playwright/test';
import { presentation } from './presentation';

/**
 * Seam 3 (spec.md, Testing Decisions): the browser. Covers ticket 07 —
 * creating a User succeeds, the confirmation appears and the new User is
 * visible — at both the phone and desktop projects. It runs after the specs
 * that count the directory, since it grows it (playwright.config.mts).
 */

test.describe('create a User', () => {
  test('adds a User from the form, confirms it, and shows it in the directory', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Add a User' })
      .click();
    await expect(page).toHaveURL(/\/users\/new$/);
    const { phone, entries } = presentation(page);
    const form = page.getByRole('form', { name: 'Add a User' });
    const firstName = form.getByLabel('First name');
    const lastName = form.getByLabel('Last name');
    const add = form.getByRole('button', { name: 'Add User' });

    // Single column and full width on phones; two columns from tablet up.
    const viewport = page.viewportSize();
    const first = await firstName.boundingBox();
    const last = await lastName.boundingBox();
    if (!viewport || !first || !last)
      throw new Error('the fields must have boxes');
    if (phone) {
      expect(first.width).toBeGreaterThanOrEqual(viewport.width * 0.85);
      expect(last.x).toBe(first.x);
      expect(last.y).toBeGreaterThanOrEqual(first.y + first.height);
    } else {
      expect(last.x).toBeGreaterThanOrEqual(first.x + first.width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);

    // An empty form is rejected in the browser, against the fields at
    // fault, before anything is sent.
    const posts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') posts.push(request.url());
    });
    await add.click();
    await expect(form.getByText('First name is required')).toBeVisible();
    await expect(form.getByText('Last name is required')).toBeVisible();
    await expect(
      form.getByText('Choose admin, editor or viewer'),
    ).toBeVisible();
    expect(posts).toEqual([]);

    await firstName.fill('Ada');
    await lastName.fill('Lovelace');
    await form.getByLabel('Email').fill('not-an-email');
    await form.getByLabel('Phone number').fill('+44 20 7946 0958');
    await form.getByLabel('Birth date').fill('1815-12-10');
    await form.getByRole('radio', { name: 'Editor' }).check();
    await add.click();
    await expect(form.getByText('Enter an email address')).toBeVisible();
    expect(posts).toEqual([]);
    await form.getByLabel('Email').fill('ada@example.org');

    // A failure is reported clearly, and the form stays as it was.
    await page.route('**/api/users', (route) => route.abort('failed'));
    await add.click();
    await expect(page.getByRole('status')).toContainText(
      'The User could not be added',
    );
    await expect(page).toHaveURL(/\/users\/new$/);
    await expect(firstName).toHaveValue('Ada');
    await page.unroute('**/api/users');

    // Success: the confirmation names the User and the id the server gave
    // them, and the directory shows them.
    const response = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().endsWith('/api/users'),
    );
    await add.click();
    expect((await response).status()).toBe(201);
    const { id } = (await (await response).json()) as { id: number };
    expect(id).toBeGreaterThan(100);

    await expect(page).toHaveURL(/\/\?search=Ada(\+|%20)Lovelace$/);
    await expect(page.getByRole('status')).toContainText(
      `Ada Lovelace was added as User #${id}`,
    );
    const ada = entries.filter({
      has: page.getByText(String(id), { exact: true }),
    });
    await expect(ada).toHaveCount(1);
    await expect(ada).toContainText('Ada Lovelace');
    await expect(ada).toContainText('ada@example.org');
    await expect(ada).toContainText('editor');
  });
});
