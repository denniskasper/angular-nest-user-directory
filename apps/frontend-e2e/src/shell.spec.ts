import { test, expect, Page } from '@playwright/test';

/**
 * Seam 3 (spec.md, Testing Decisions): the browser. These assertions cover
 * ticket 02 — the brand theme and the responsive app shell — and run at both
 * the phone and desktop projects defined in playwright.config.mts.
 */

/** The four brand colours from the challenge brief, as the browser reports them. */
const BRAND_COLOURS = {
  primary: 'rgb(29, 164, 232)', // #1da4e8
  secondary: 'rgb(32, 210, 168)', // #20d2a8
  tertiary: 'rgb(228, 220, 70)', // #e4dc46
  error: 'rgb(211, 47, 85)', // #d32f55
};

/** Every colour the page actually paints: backgrounds, text and borders. */
function renderedColours(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const seen = new Set<string>();
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      for (const v of [
        s.backgroundColor,
        s.color,
        s.borderTopColor,
        s.borderBottomColor,
      ]) {
        seen.add(v);
      }
      for (const pseudo of ['::before', '::after']) {
        seen.add(getComputedStyle(el, pseudo).backgroundColor);
      }
    }
    return [...seen];
  });
}

/** Relative luminance (0 = black, 1 = white) of an `rgb(r, g, b)` string. */
function luminance(rgb: string): number {
  const channels = rgb.match(/\d+/g);
  if (!channels) throw new Error(`not an rgb() colour: ${rgb}`);
  const [r, g, b] = channels.map(Number).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function bodyBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test.describe('brand theme', () => {
  test('paints all four brand colours', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const painted = await renderedColours(page);
    for (const [name, value] of Object.entries(BRAND_COLOURS)) {
      expect(painted, `${name} ${value} should be painted`).toContain(value);
    }
  });

  test('follows the system colour scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const light = await bodyBackground(page);

    await page.emulateMedia({ colorScheme: 'dark' });
    const dark = await bodyBackground(page);

    expect(luminance(light)).toBeGreaterThan(0.8);
    expect(luminance(dark)).toBeLessThan(0.1);
  });
});

test.describe('app shell', () => {
  test('fills the viewport on phones and holds a reading width on desktops', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'User Directory',
    );
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Directory' }),
    ).toBeVisible();

    const viewport = page.viewportSize();
    const main = await page.getByRole('main').boundingBox();
    if (!viewport || !main) throw new Error('viewport and main must exist');

    if (test.info().project.name === 'phone') {
      // Phone: the content column is the whole viewport, edge to edge.
      expect(main.x).toBe(0);
      expect(main.width).toBe(viewport.width);
    } else {
      // Desktop: the content column is narrower than the viewport and centred.
      expect(main.width).toBeLessThan(viewport.width);
      expect(main.x).toBeGreaterThan(0);
      expect(main.x + main.width).toBeLessThan(viewport.width);
    }
    // At no width should the page scroll sideways.
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
  });
});
