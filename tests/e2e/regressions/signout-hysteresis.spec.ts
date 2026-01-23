import { test, expect } from '@playwright/test';
import { ensureTestUser, ensureNoTestUser } from '../helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('regression: sign-out hysteresis', () => {
  test('prevents immediate watcher reapply when cookie is reinserted right after sign-out', async ({ page, browser }) => {
    test.setTimeout(30000);

    // Run only in CI / when test pages are enabled
    if (!(process.env.CI === 'true' || process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true')) {
      test.skip('Skipping sign-out hysteresis regression outside CI / test-pages mode');
    }

    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      console.log('BROWSER_CONSOLE:', text);
      consoleMessages.push(text);
    });

    // Ensure we start from a deterministic test user state
    await ensureTestUser(page, 'citizen');

    await page.goto(`${BASE}/profile`, { waitUntil: 'load' });

    // Precondition: client marker must show citizen
    await page.waitForSelector('#__client_test_user_status[data-role="citizen"]', { timeout: 5000 });

    // Expose a deterministic reinsert helper so we can reinsert cookie immediately AFTER signOut commits
    await page.evaluate(() => {
      // @ts-ignore
      window.__e2e_reinsertTestUser = () => {
        try {
          document.cookie = `test_user=${JSON.stringify({ role: 'citizen' })}; path=/`;
          localStorage.setItem('test_user', JSON.stringify({ role: 'citizen' }));
          window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: 'citizen' } }));
        } catch (e) {
          // ignore
        }
      };
    });

    // Trigger sign-out flow; wait for the client commit to null, then immediately reinsert the cookie to simulate the race
    // Prefer inline Sign Out button if present (profile page), otherwise use the menu path
    const inlineSignOut = page.getByRole('button', { name: /sign out/i }).first();
    if (await inlineSignOut.count() > 0) {
      // Click sign out
      await inlineSignOut.click();
    } else {
      // Fallback: open account UI then click sign out menu item
      const userText = page.getByText(/Test User/i).first();
      if (await userText.count() > 0) {
        await userText.click();
        const menuSignOut = page.getByRole('menuitem', { name: /sign out/i }).first();
        await menuSignOut.click();
      } else {
        throw new Error('Could not locate Sign Out for regression test');
      }
    }

    // Wait for the client to commit sign-out (the client marker should become null)
    await page.waitForSelector('#__client_test_user_status[data-role="null"]', { timeout: 3000 });

    // Immediately reinsert cookie and dispatch event (simulate concurrent reapply)
    await page.evaluate(() => {
      // @ts-ignore
      (window.__e2e_reinsertTestUser || (() => {}))();
    });

    // Give a short moment for the watcher/event handlers to run (but within hysteresis)
    await page.waitForTimeout(200);

    // Invariant: the client should still report null (hysteresis prevented immediate reapply)
    await expect(page.locator('#__client_test_user_status')).toHaveAttribute('data-role', 'null');

    // Ensure DIAG skip message emitted by the watcher (makes the regression high-signal)
    const skipFound = consoleMessages.some(m => m.includes('DIAG: AuthContext watcher skip commit'));
    expect(skipFound).toBeTruthy();

    // Cleanup: ensure the server is clean for subsequent tests
    await ensureNoTestUser(page);
  });
});
