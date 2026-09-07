import { test, expect } from '@playwright/test';
import { createUserForm } from './create-user-form';

/**
 * Seam 3 (spec.md, Testing Decisions): the browser. Covers ticket 08 —
 * selecting the admin Role while leaving phoneNumber empty shows an inline
 * error against that field — at both the phone and desktop projects. It
 * is the one browser spec that proves the shared rules working through
 * the whole stack. It never submits, so it does not grow the directory.
 */

test.describe('the Conditional Requirement', () => {
  test('marks the fields the chosen Role requires, as soon as it is chosen', async ({
    page,
  }) => {
    await page.goto('/users/new');
    const { form, chooseRole } = createUserForm(page);
    const phoneNumber = form.getByLabel('Phone number');
    const birthDate = form.getByLabel('Birth date');
    const phoneNumberError = form.getByText('An admin must have a phone number');
    const birthDateError = form.getByText('An admin must have a birth date');
    const posts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') posts.push(request.url());
    });

    // Nothing is at fault before a Role is chosen.
    await expect(form.getByText('must have')).toHaveCount(0);
    await expect(form.getByText('Required for')).toHaveCount(0);

    // Choosing admin, without visiting either field or submitting, marks
    // both fields required and both at fault, each against its own control.
    await chooseRole('Admin');
    await expect(phoneNumber).toHaveAccessibleName(/Required for admin/);
    await expect(birthDate).toHaveAccessibleName(/Required for admin/);
    await expect(phoneNumberError).toBeVisible();
    await expect(birthDateError).toBeVisible();
    await expect(phoneNumber).toHaveAttribute('aria-invalid', 'true');
    await expect(phoneNumber).toHaveAccessibleDescription(
      'An admin must have a phone number',
    );
    expect(posts).toEqual([]);

    // The error sits right under the line it belongs to, at every width.
    const input = await phoneNumber.boundingBox();
    const error = await phoneNumberError.boundingBox();
    if (!input || !error) throw new Error('the field must have boxes');
    expect(error.x).toBeCloseTo(input.x, 0);
    expect(error.y).toBeGreaterThanOrEqual(input.y + input.height);
    expect(error.y).toBeLessThan(input.y + input.height + 24);

    // An unrelated fault does not hide the Role-dependent one.
    const email = form.getByLabel('Email');
    await email.fill('not-an-email');
    await email.blur();
    await expect(form.getByText('Enter an email address')).toBeVisible();
    await expect(phoneNumberError).toBeVisible();
    await expect(birthDateError).toBeVisible();

    // Filling the field clears its fault; the flag stays.
    await phoneNumber.fill('+44 20 7946 0958');
    await expect(phoneNumberError).toBeHidden();
    await expect(phoneNumber).toHaveAttribute('aria-invalid', 'false');
    await expect(phoneNumber).toHaveAccessibleName(/Required for admin/);
    await expect(birthDateError).toBeVisible();

    // Editor requires only phoneNumber; viewer neither. The requirement
    // follows the Role the moment it changes.
    await chooseRole('Editor');
    await expect(birthDateError).toBeHidden();
    await expect(birthDate).not.toHaveAccessibleName(/Required for/);
    await expect(phoneNumber).toHaveAccessibleName(/Required for editor/);
    await phoneNumber.clear();
    await expect(
      form.getByText('An editor must have a phone number'),
    ).toBeVisible();

    await chooseRole('Viewer');
    await expect(form.getByText('must have')).toHaveCount(0);
    await expect(form.getByText('Required for')).toHaveCount(0);
    expect(posts).toEqual([]);
  });
});
