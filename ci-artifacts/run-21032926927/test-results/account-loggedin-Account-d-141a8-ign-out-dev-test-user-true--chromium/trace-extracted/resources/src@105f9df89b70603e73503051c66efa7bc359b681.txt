import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Account dropdown (logged-in)', () => {
  test('shows user name and allows sign out (dev test_user=true)', async ({ page }) => {
    // Capture browser console
    page.on('console', (msg) => console.log('BROWSER_CONSOLE:', msg.text()));

    await page.goto(`${BASE}/?test_user=true`, { waitUntil: 'load' });

    // Dump a snippet of the content for debugging
    const html = await page.content();
    console.log('PAGE_HTML_SNIPPET:', html.slice(0, 1500));
    console.log('PAGE_URL:', page.url());

    const heroHtml = await page.evaluate(() => {
      const el = document.querySelector('.relative.max-w-7xl');
      return el ? (el as HTMLElement).innerHTML.slice(0, 800) : null;
    });
    console.log('HERO_HTML_SNIPPET:', heroHtml);

    // Narrow scope to header and use flexible button name matching
    const header = page.locator('header');
    const accountBtn = header.getByRole('button', { name: /user menu|account menu|account|test user/i });

    // Debug: check presence via page.evaluate for any aria-labels
    const ariaLabels = await page.evaluate(() => Array.from(document.querySelectorAll('[aria-label]')).map(el => ({tag: el.tagName, label: el.getAttribute('aria-label'), outer: (el as HTMLElement).outerHTML.slice(0,120)})));
    console.log('ARIA_LABELS:', JSON.stringify(ariaLabels, null, 2));

    // Wait for client hydration and element attachment
    await page.waitForLoadState('networkidle');

    // Debug screenshot before interaction
    await page.screenshot({ path: 'before-open.png', fullPage: true }).catch(()=>{});

    // Try locating the visible username text first and click its nearest clickable ancestor
    const userText = page.getByText(/Test User/i).first();
    let clicked = false;
    if (await userText.count() > 0) {
      try {
        await userText.waitFor({ state: 'visible', timeout: 20000 });
        // Try button ancestor, then link ancestor, then click the text itself
        let clickable = userText.locator('xpath=ancestor::button[1]');
        if (await clickable.count() === 0) clickable = userText.locator('xpath=ancestor::a[1]');
        if (await clickable.count() > 0) {
          await clickable.first().click();
          clicked = true;
        } else {
          await userText.click();
          clicked = true;
        }
      } catch (e) {
        console.log('Could not click username element directly:', e.message);
      }
    }

    // Fallback: try header button (older behavior)
    if (!clicked) {
      try {
        await accountBtn.waitFor({ state: 'attached', timeout: 5000 });
        await accountBtn.waitFor({ state: 'visible', timeout: 5000 });
        await accountBtn.click();
        clicked = true;
      } catch (e) {
        console.log('Fallback accountBtn failed:', e.message);
      }
    }

    // If still not clicked, capture artifacts and fail early
    if (!clicked) {
      await page.screenshot({ path: 'test-failure-no-click.png', fullPage: true }).catch(()=>{});
      const dom = await page.content();
      const fs = require('fs');
      fs.writeFileSync('test-failure-dom.html', dom);
      throw new Error('Could not open account menu: no clickable element found');
    }

    // Find the menu (fallback to any menu if name unknown)
    let menu = page.getByRole('menu', { name: /user menu list|account menu list/i }).first();
    if (await menu.count() === 0) menu = page.getByRole('menu').first();

    // Try to assert the username and sign out, with debug captures on failure
    try {
      const name = menu.getByText(/Test User/i);
      await expect(name).toBeVisible({ timeout: 5000 });

      // Click Sign Out (case-insensitive match)
      await menu.getByRole('menuitem', { name: /sign out/i }).click();
    } catch (err) {
      // Capture artifacts for debugging
      await page.screenshot({ path: 'test-failure-account.png', fullPage: true }).catch(()=>{});
      const dom = await page.content();
      const fs = require('fs');
      fs.writeFileSync('test-failure-dom.html', dom);
      console.log('Saved test-failure-account.png and test-failure-dom.html');
      throw err;
    }

    // After sign out, verify header has a login link
    const accountLink = page.getByRole('link', { name: 'Account' });
    await expect(accountLink).toBeVisible();
    const href = await accountLink.getAttribute('href');
    expect(href).toBe('/login');
  });
});