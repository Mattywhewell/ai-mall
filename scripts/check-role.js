const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = 'http://localhost:3000/profile?test_user=true&role=citizen';
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');

  const hasRoleBadge = await page.$('[data-testid="role-badge"]');
  console.log('role-badge element found:', !!hasRoleBadge);
  if (hasRoleBadge) {
    const text = await page.$eval('[data-testid="role-badge"]', el => el.textContent);
    console.log('role-badge text:', text);
  }

  // Dump some nav items
  const navText = await page.$$eval('nav a, header nav a, [role="navigation"] a', els => els.map(e => e.textContent.trim()));
  console.log('nav links:', navText.slice(0, 20));

  await browser.close();
})();