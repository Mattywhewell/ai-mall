import { chromium } from 'playwright';

(async () => {
  const url = process.argv[2] || 'https://ai-mall.vercel.app/city';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    const info = await page.evaluate(() => {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      return {
        location: location.href,
        reactType: typeof (window as any).React,
        reactDOMType: typeof (window as any).ReactDOM,
        hasDevtoolsHook: !!hook,
        devtoolsHookKeys: hook ? Object.keys(hook) : null,
        devtoolsRenderers: hook ? Object.keys(hook._renderers || {}) : null,
        errors: (window as any).__clientErrors || null,
      };
    });

    console.log('Client runtime info:', info);
  } catch (e) {
    console.error('Error during inspect:', e.message);
  } finally {
    await browser.close();
  }
})();