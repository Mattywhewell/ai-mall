import { chromium } from 'playwright';

const scripts = [
  'https://ai-mall.vercel.app/_next/static/chunks/4bd1b696-100b9d70ed4e49c1.js',
  'https://ai-mall.vercel.app/_next/static/chunks/1255-92d251dddc0429dd.js',
  'https://ai-mall.vercel.app/_next/static/chunks/main-app-b7ac91ae224968d9.js',
  'https://ai-mall.vercel.app/_next/static/chunks/app/layout-26ea8bf121110059.js',
  'https://ai-mall.vercel.app/_next/static/chunks/app/city/page-13bcc3e4bc163602.js',
  'https://ai-mall.vercel.app/_next/static/chunks/polyfills-42372ed130431b0a.js',
  'https://ai-mall.vercel.app/_next/static/chunks/webpack-3ae150d76b30e2a4.js',
  'https://ai-mall.vercel.app/_next/static/chunks/9184.445276c8032acbad.js'
];

(async () => {
  const browser = await chromium.launch();
  for (const src of scripts) {
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log('Testing', src);
    page.on('console', (msg) => console.log(`[console:${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => console.error('[pageerror]', err.message));
    page.on('response', (res) => {
      if (res.status() >= 400) console.log(`[response:${res.status()}] ${res.url()}`);
    });
    try {
      await page.goto('about:blank');
      await page.addScriptTag({ url: src });
      await page.waitForTimeout(2000);
      console.log('OK', src);
    } catch (e) {
      console.error('Error loading', src, e.message);
    } finally {
      await context.close();
    }
  }
  await browser.close();
})();