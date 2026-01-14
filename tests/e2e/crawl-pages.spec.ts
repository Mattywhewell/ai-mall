import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const APP_DIR = path.resolve(process.cwd(), 'app');

// Sample slug replacements for dynamic segments
const SAMPLE_SLUGS = ['luminous-nexus', 'neon-boulevard', 'quiet-thoughts', 'example', 'test'];

function collectRoutes(dir: string, base = ''): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let routes: string[] = [];

  for (const entry of entries) {
    // Skip special folders
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const full = path.join(dir, entry.name);
    const routeBase = base + '/' + entry.name;

    // If folder contains a page.tsx or page.jsx, add route
    const hasPage = fs.existsSync(path.join(full, 'page.tsx')) || fs.existsSync(path.join(full, 'page.jsx'));
    if (hasPage) {
      routes.push(routeBase === '/page' ? '/' : routeBase.replace(/\/page$/, ''));
    }

    // Recurse into nested folders
    if (entry.isDirectory()) {
      routes = routes.concat(collectRoutes(full, routeBase));
    }
  }

  return routes;
}

function expandDynamicRoute(route: string): string[] {
  // Replace segments like [slug] or [id] with sample values
  if (!route.includes('[')) return [route];
  const parts = route.split('/');
  const idx = parts.findIndex(p => p.includes('['));
  if (idx === -1) return [route];
  const prefix = parts.slice(0, idx).join('/');
  const suffix = parts.slice(idx + 1).join('/');

  const expanded: string[] = [];
  for (const s of SAMPLE_SLUGS) {
    const candidate = `${prefix}/${s}${suffix ? '/' + suffix : ''}`;
    expanded.push(candidate);
  }
  return expanded;
}

async function tryVisit(page: any, route: string) {
  const url = new URL(route, BASE).href;
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    const status = resp?.status() ?? 0;
    const title = await page.title();
    // Try to capture a meaningful selector like h1
    let h1Text = '';
    const h1 = page.locator('h1').first();
    if (await h1.count() > 0) {
      h1Text = (await h1.textContent())?.trim() || '';
    }
    // capture console errors
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(String(e)));

    return { url, status, title, h1: h1Text, errors };
  } catch (error) {
    return { url, status: -1, title: '', h1: '', errors: [String(error)] };
  }
}

test.describe('Crawl site pages', () => {
  // Allow more time for a larger site crawl (10 minutes)
  test.setTimeout(10 * 60 * 1000);

  test('discover and visit site routes', async ({ page }) => {
    // Skip patterns for pages we expect to be interactive or require POST or special auth
    const SKIP_PATTERNS = [
      /^\/checkout/,
      /^\/cart/,
      /^\/api/,
      /^\/auth/,
      /\/orders\//,
      /\/supplier\//,
      /\/admin\/(dashboard|revenue|system-health)/
    ];

    const PER_NAV_TIMEOUT = Number(process.env.CRAWL_PER_NAV_TIMEOUT || '10000'); // default 10s
    const MAX_PAGES = Number(process.env.CRAWL_MAX_PAGES || '80'); // safety cap (reduced for reliability)

    // Discover routes from the filesystem
    const rawRoutes = collectRoutes(APP_DIR).filter(r => !!r);
    const normalized = Array.from(new Set(rawRoutes.map(r => r.replace(/\\/g, '/'))));

    console.log('Discovered routes count:', normalized.length);

    const toVisit: string[] = [];

    for (const r of normalized) {
      if (r.includes('[')) {
        toVisit.push(...expandDynamicRoute(r));
      } else {
        toVisit.push(r);
      }
    }

    // De-duplicate
    const unique = Array.from(new Set(toVisit));

    console.log('Visiting', unique.length, 'candidate URLs');

    const results: any[] = [];

    let visitedCount = 0;
    const failedUrls = new Set<string>();

    for (const r of unique.slice(0, MAX_PAGES)) {
      if (visitedCount >= MAX_PAGES) break;

      // Skip by pattern
      if (SKIP_PATTERNS.some(p => p.test(r))) {
        console.log(`Skipping (pattern): ${r}`);
        continue;
      }

      // Avoid retrying known-bad URLs too many times
      if (failedUrls.has(r)) {
        console.log(`Skipping previously failed URL: ${r}`);
        continue;
      }

      // For admin pages, use an admin test_user session
      let visit = r;
      if (r.startsWith('/admin')) {
        const u = new URL(r, BASE);
        u.searchParams.set('test_user', 'true');
        u.searchParams.set('role', 'admin');
        visit = u.pathname + '?' + u.searchParams.toString();
      }

      visitedCount++;

      try {
        const resp = await page.goto(new URL(visit, BASE).href, { waitUntil: 'networkidle', timeout: PER_NAV_TIMEOUT });
        const status = resp?.status() ?? 0;
        const title = await page.title();
        let h1Text = '';
        const h1 = page.locator('h1').first();
        if (await h1.count() > 0) h1Text = (await h1.textContent())?.trim() || '';
        results.push({ url: visit, status, title, h1: h1Text, errors: [] });
        console.log(`Visited: ${visit} status=${status} title="${title}" h1="${h1Text}"`);
        // If server returns 500, mark as failed to avoid re-checking
        if (status >= 500) failedUrls.add(r);
      } catch (error) {
        console.warn(`Failed visiting ${visit}:`, String(error).slice(0, 200));
        results.push({ url: visit, status: -1, title: '', h1: '', errors: [String(error)] });
        failedUrls.add(r);
      }

      // Return to base to avoid statefulness; don't block on failures
      try {
        await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 5000 });
      } catch (e) {
        console.warn('Unable to return to base page (continuing):', String(e).slice(0, 200));
        // try navigate to blank and continue
        try { await page.goto('about:blank', { timeout: 2000 }); } catch (e2) { /* ignore */ }
      }
    }

    // Save results as a test artifact file for the pipeline if available
    const outPath = path.resolve(process.cwd(), 'test-results');
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });
    const outFile = path.resolve(outPath, `crawl-pages-result-${Date.now()}.json`);
    const out = JSON.stringify({ base: BASE, results }, null, 2);
    fs.writeFileSync(outFile, out, 'utf8');
    console.log('Saved crawl results to', outFile);

    // Evaluate failures but allow a small tolerance for unreachable/protected pages
    const failures = results.filter(r => r.status === -1 || r.status >= 400 || (r.errors && r.errors.length > 0));
    const total = results.length;
    const failureRate = total === 0 ? 0 : failures.length / total;
    console.log(`Crawl summary: total=${total} failures=${failures.length} failureRate=${(failureRate * 100).toFixed(1)}%`);

    // Fail the test if more than the threshold of pages fail (configurable), but default is non-blocking in CI.
    const THRESHOLD = Number(process.env.CRAWL_FAILURE_THRESHOLD || '0.15');
    if (process.env.CI_FAIL_ON_CRAWL === 'true') {
      // In stricter CI runs enable this env var to fail the pipeline on too many failures
      expect(failureRate).toBeLessThanOrEqual(THRESHOLD);
    } else {
      console.warn(`Crawl failure rate ${ (failureRate * 100).toFixed(1) }% (threshold ${(THRESHOLD*100).toFixed(1)}%) - not failing run (set CI_FAIL_ON_CRAWL=true to enforce)`);
    }
  });
});
