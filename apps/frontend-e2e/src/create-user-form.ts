import { Locator, Page } from '@playwright/test';

/**
 * The form for adding a User, and how its Material controls are reached:
 * a control is the whole form field the person sees, and the Role is a
 * select whose options open in an overlay outside the form.
 */
export function createUserForm(page: Page) {
  const form = page.getByRole('form', { name: 'Add a User' });
  return {
    form,
    /** The visible control labelled so: the form field around the input. */
    field: (label: string): Locator =>
      form.locator('mat-form-field', { has: page.getByLabel(label) }),
    chooseRole: async (role: string): Promise<void> => {
      await form.getByRole('combobox', { name: 'Role' }).click();
      await page.getByRole('option', { name: role }).click();
    },
  };
}

/**
 * The snack bar the outcome of an action is shown in, by how it is read:
 * a success politely, an error interrupting. The most recent one, since
 * the one before it is still leaving while it arrives.
 */
export function snackBar(page: Page, tone: 'success' | 'error'): Locator {
  const live = tone === 'error' ? 'assertive' : 'polite';
  return page
    .locator('mat-snack-bar-container')
    .filter({ has: page.locator(`[aria-live="${live}"]`) })
    .last();
}
