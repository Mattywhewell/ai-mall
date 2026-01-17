const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = process.env.URL || 'http://localhost:3000/admin/dashboard?test_user=true&role=citizen';
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const html = await page.content();
  console.log('Page title:', await page.title());
  console.log('URL:', page.url());
  console.log('Snapshot snippet:\n', html.slice(0,3000));
  await page.screenshot({ path: 'tmp/admin-citizen.png', fullPage: true });
  await browser.close();
})();