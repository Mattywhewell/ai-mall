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

    // Precondition: client marker must show citizen (check attribute rather than visibility to avoid hidden dev-only marker)
    await expect(page.locator('#__client_test_user_status')).toHaveAttribute('data-role', 'citizen', { timeout: 7000 });

    // Expose a deterministic reinsert helper so we can reinsert cookie immediately AFTER signOut commits
    await page.evaluate(() => {
      // @ts-ignore
      window.__e2e_reinsertTestUser = () => {
        try {
          // Reinsert cookie + localStorage only — do NOT dispatch the 'test_user_changed' event so the watcher path is exercised (and hysteresis applies)
          document.cookie = `test_user=${JSON.stringify({ role: 'citizen' })}; path=/`;
          localStorage.setItem('test_user', JSON.stringify({ role: 'citizen' }));
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
      // Fallback: open account UI then click sign out menu item — be robust across variants (User menu, Account, display name)
      const userMenu = page.getByRole('button', { name: /User menu|Account|Test User|devUser/i }).first();
      if (await userMenu.count() > 0) {
        await userMenu.click();
        const menuSignOut = page.getByRole('menuitem', { name: /sign out/i }).first();
        await menuSignOut.waitFor({ state: 'visible', timeout: 7000 });
        await menuSignOut.click();
      } else {
        // Last-resort: try inline Sign Out once more
        const inlineAgain = page.getByRole('button', { name: /sign out/i }).first();
        if (await inlineAgain.count() > 0) {
          await inlineAgain.click();
        } else {
          throw new Error('Could not locate Sign Out for regression test');
        }
      }
    }

    // Wait for the DIAG signOut commit, then immediately reinsert cookie (ensures we exercise watcher hysteresis deterministically)
    const waitForSignOutCommit = async (timeout = 7000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (consoleMessages.some(m => m.includes('DIAG: AuthContext commitRole') && m.includes('source: signOut') && m.includes('role: null'))) return;
        await new Promise(r => setTimeout(r, 50));
      }
      throw new Error('Timed out waiting for signOut commit DIAG');
    };
    await waitForSignOutCommit(7000);

    // Immediately reinsert cookie + localStorage (simulate concurrent reapply)
    await page.evaluate(() => {
      // @ts-ignore
      (window.__e2e_reinsertTestUser || (() => {}))();
    });

    // Wait up to 1500ms for watcher skip commit DIAG (should be emitted while within hysteresis)
    const waitForSkip = async (timeout = 1500) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (consoleMessages.some(m => m.includes('DIAG: AuthContext watcher skip commit'))) return;
        await new Promise(r => setTimeout(r, 50));
      }
      throw new Error('Timed out waiting for watcher skip DIAG');
    };
    await waitForSkip(1500);

    // Invariant: the client should still report null (hysteresis prevented immediate reapply)
    await expect(page.locator('#__client_test_user_status')).toHaveAttribute('data-role', 'null');

    // Ensure DIAG skip message emitted by the watcher (redundant check)
    const skipFound = consoleMessages.some(m => m.includes('DIAG: AuthContext watcher skip commit'));
    expect(skipFound).toBeTruthy();

    // Cleanup: ensure the server is clean for subsequent tests
    await ensureNoTestUser(page);
  });
});
