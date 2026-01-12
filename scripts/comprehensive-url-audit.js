#!/usr/bin/env node

/**
 * Aiverse Comprehensive URL & HTTP Audit Script
 * Complete audit of sitemap, APIs, URLs, and pipeline integrity
 * Output format: 4 detailed sections as requested
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'https://ai-mall.vercel.app';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

// Utility function for HTTP requests
function makeRequest(url, method = 'GET', followRedirects = true, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.request(url, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = {
          url,
          status: res.statusCode,
          headers: res.headers,
          data: data.length > 500 ? data.substring(0, 500) + '...' : data,
          redirected: false,
          finalUrl: url,
          redirectChain: [url]
        };

        // Handle redirects
        if (followRedirects && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (maxRedirects > 0) {
            const redirectUrl = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, url).href;

            result.redirectChain.push(redirectUrl);

            makeRequest(redirectUrl, method, followRedirects, maxRedirects - 1)
              .then(redirectResult => {
                result.redirected = true;
                result.finalUrl = redirectResult.finalUrl;
                result.status = redirectResult.status;
                result.redirectChain = result.redirectChain.concat(redirectResult.redirectChain.slice(1));
                resolve(result);
              })
              .catch(reject);
          } else {
            result.status = res.statusCode;
            resolve(result);
          }
        } else {
          resolve(result);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// Parse sitemap XML
function parseSitemap(xmlContent) {
  const urls = [];
  const locMatches = xmlContent.match(/<loc>(.*?)<\/loc>/g);
  if (locMatches) {
    locMatches.forEach(match => {
      const url = match.replace(/<\/?loc>/g, '');
      urls.push(url);
    });
  }
  return urls;
}

// Extract internal links from HTML content
function extractInternalLinks(html, baseUrl) {
  const links = new Set();
  const linkRegex = /href=["']([^"']+)["']/g;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('/') && !href.startsWith('//')) {
      // Internal relative link
      links.add(href);
    } else if (href.startsWith(baseUrl)) {
      // Internal absolute link
      const path = href.replace(baseUrl, '');
      links.add(path);
    }
  }

  return Array.from(links);
}

// Comprehensive API endpoint discovery
async function discoverApiEndpoints() {
  const knownEndpoints = [
    '/api/health',
    '/api/citizens',
    '/api/rituals',
    '/api/districts',
    '/api/presence',
    '/api/user/avatar',
    '/api/admin/assets',
    '/api/stripe/webhook',
    '/api/auth/verify-email',
    '/api/world/evolution',
    '/api/world/city',
    '/api/auto-listing/extract',
    '/api/cron/update-world',
    '/api/cron/evolve-spirits',
    '/api/cron/regenerate-content',
    '/api/cron/aggregate-analytics'
  ];

  return knownEndpoints;
}

// Crawl internal URLs
async function crawlInternalUrls(startUrls) {
  const visited = new Set();
  const toVisit = [...startUrls];
  const results = [];

  while (toVisit.length > 0 && results.length < 50) { // Limit crawl depth
    const currentPath = toVisit.shift();
    if (visited.has(currentPath)) continue;

    visited.add(currentPath);

    try {
      const result = await makeRequest(`${BASE_URL}${currentPath}`);
      results.push({
        path: currentPath,
        status: result.status,
        redirected: result.redirected,
        finalUrl: result.finalUrl,
        contentType: result.headers['content-type'] || 'unknown'
      });

      // Extract more links if it's HTML
      if (result.headers['content-type']?.includes('text/html')) {
        const newLinks = extractInternalLinks(result.data, BASE_URL);
        for (const link of newLinks) {
          if (!visited.has(link) && !toVisit.includes(link)) {
            toVisit.push(link);
          }
        }
      }
    } catch (error) {
      results.push({
        path: currentPath,
        status: 'ERROR',
        redirected: false,
        finalUrl: currentPath,
        contentType: 'unknown',
        error: error.message
      });
    }
  }

  return results;
}

// Main audit function
async function runComprehensiveAudit() {
  console.log('🚀 AIVERSE COMPREHENSIVE URL & HTTP AUDIT');
  console.log('='.repeat(60));
  console.log(`Target Domain: ${BASE_URL}`);
  console.log(`Audit Date: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('');

  // =====================================================
  // A. SITEMAP AUDIT TABLE
  // =====================================================
  console.log('📄 SECTION A: SITEMAP AUDIT TABLE');
  console.log('='.repeat(60));

  let sitemapUrls = [];
  try {
    const sitemapResponse = await makeRequest(SITEMAP_URL);
    console.log(`Sitemap Status: ${sitemapResponse.status}`);

    if (sitemapResponse.status === 200) {
      sitemapUrls = parseSitemap(sitemapResponse.data);
      console.log(`Found ${sitemapUrls.length} URLs in sitemap`);
      console.log('');

      console.log('Sitemap URL Status Check:');
      console.log('URL'.padEnd(60), 'Status', 'Redirect?', 'Final Destination'.padEnd(40), 'Notes');
      console.log('='.repeat(150));

      for (const url of sitemapUrls) {
        try {
          const result = await makeRequest(url, 'HEAD');
          const shortUrl = url.length > 55 ? url.substring(0, 52) + '...' : url;
          const redirect = result.redirected ? 'YES' : 'NO';
          const finalDest = result.finalUrl.length > 35 ? result.finalUrl.substring(0, 32) + '...' : result.finalUrl;

          let notes = '';
          if (result.status !== 200) notes += `HTTP ${result.status}`;
          if (result.redirected) notes += notes ? ', Redirected' : 'Redirected';
          if (result.status >= 500) notes += notes ? ', Server Error' : 'Server Error';
          if (result.status === 404) notes += notes ? ', Not Found' : 'Not Found';

          console.log(
            shortUrl.padEnd(60),
            String(result.status).padStart(6),
            redirect.padStart(8),
            finalDest.padEnd(40),
            notes || 'OK'
          );
        } catch (error) {
          const shortUrl = url.length > 55 ? url.substring(0, 52) + '...' : url;
          console.log(
            shortUrl.padEnd(60),
            'ERROR'.padStart(6),
            'NO'.padStart(8),
            'N/A'.padEnd(40),
            `Error: ${error.message.substring(0, 20)}`
          );
        }
      }
    } else {
      console.log(`❌ Sitemap fetch failed with status: ${sitemapResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Sitemap fetch failed: ${error.message}`);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('');

  // =====================================================
  // B. API ENDPOINT AUDIT TABLE
  // =====================================================
  console.log('🔌 SECTION B: API ENDPOINT AUDIT TABLE');
  console.log('='.repeat(60));

  const apiEndpoints = await discoverApiEndpoints();
  console.log(`Testing ${apiEndpoints.length} API endpoints`);
  console.log('');

  console.log('API Endpoint Status Check:');
  console.log('Endpoint'.padEnd(30), 'Method', 'Status', 'Auth?', 'Notes');
  console.log('='.repeat(100));

  for (const endpoint of apiEndpoints) {
    // Test GET first, then POST if GET fails
    const methods = ['GET', 'POST'];

    for (const method of methods) {
      try {
        const result = await makeRequest(`${BASE_URL}${endpoint}`, method);
        const authRequired = result.status === 401 || result.status === 403;
        let notes = '';

        if (result.status >= 500) notes = 'Server Error';
        else if (result.status === 404) notes = 'Not Found';
        else if (result.status === 405) notes = 'Method Not Allowed';
        else if (result.status >= 400) notes = 'Client Error';
        else if (result.status === 200) notes = 'OK';
        else notes = `HTTP ${result.status}`;

        if (authRequired) notes += notes ? ', Requires Auth' : 'Requires Auth';

        console.log(
          endpoint.padEnd(30),
          method.padStart(6),
          String(result.status).padStart(6),
          (authRequired ? 'YES' : 'NO').padStart(5),
          notes
        );

        // If GET works, don't test POST to avoid unnecessary requests
        if (result.status === 200) break;
      } catch (error) {
        console.log(
          endpoint.padEnd(30),
          method.padStart(6),
          'ERROR'.padStart(6),
          'UNK'.padStart(5),
          `Error: ${error.message.substring(0, 25)}`
        );
        // Try next method
      }
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('');

  // =====================================================
  // C. INTERNAL URL CRAWL REPORT
  // =====================================================
  console.log('🕷️  SECTION C: INTERNAL URL CRAWL REPORT');
  console.log('='.repeat(60));

  const startUrls = ['/', '/city', '/districts', '/creator', '/about', '/contact', '/pricing', '/discover'];
  console.log(`Starting crawl from ${startUrls.length} seed URLs`);
  console.log('');

  const crawledUrls = await crawlInternalUrls(startUrls);
  console.log(`Crawled ${crawledUrls.length} URLs`);
  console.log('');

  console.log('Internal URL Status Check:');
  console.log('Path'.padEnd(25), 'Status', 'Redirect?', 'Content-Type'.padEnd(20), 'Notes');
  console.log('='.repeat(100));

  for (const result of crawledUrls) {
    const contentType = result.contentType.split(';')[0];
    let notes = '';

    if (result.status !== 200 && result.status !== 'ERROR') {
      notes = `HTTP ${result.status}`;
    } else if (result.status === 'ERROR') {
      notes = `Error: ${result.error}`;
    }

    if (result.redirected) {
      notes += notes ? ', Redirected' : 'Redirected';
    }

    console.log(
      result.path.padEnd(25),
      String(result.status).padStart(6),
      (result.redirected ? 'YES' : 'NO').padStart(9),
      contentType.padEnd(20),
      notes || 'OK'
    );
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('');

  // =====================================================
  // D. PIPELINE INTEGRITY REPORT
  // =====================================================
  console.log('🔄 SECTION D: PIPELINE INTEGRITY REPORT');
  console.log('='.repeat(60));

  // Define the complete Aiverse pipeline
  const pipelineSteps = [
    // Main pipeline
    { name: 'Landing Page', url: '/', expected: 200, description: 'Entry point' },
    { name: 'City Gate', url: '/city', expected: 200, description: 'City access point' },
    { name: 'Districts Hub', url: '/districts', expected: 200, description: 'District selection' },
    { name: 'Creator Portal', url: '/creator', expected: 200, description: 'Creator access' },
    { name: 'Creator Apply', url: '/creator/apply', expected: 200, description: 'Creator application' },

    // Wander path
    { name: 'Living Map', url: '/ai-city/explore', expected: 200, description: 'City exploration' },
    { name: '3D Commons', url: '/commons', expected: 200, description: '3D space access' },

    // Seek path
    { name: 'Discover', url: '/discover', expected: 200, description: 'Content discovery' },

    // Create path
    { name: 'About', url: '/about', expected: 200, description: 'Platform info' },
    { name: 'Contact', url: '/contact', expected: 200, description: 'Contact page' },
    { name: 'Pricing', url: '/pricing', expected: 200, description: 'Pricing info' }
  ];

  console.log('Aiverse Pipeline Validation:');
  console.log('Step'.padEnd(20), 'URL'.padEnd(20), 'Status', 'Expected', 'Pass/Fail', 'Description');
  console.log('='.repeat(120));

  let passedSteps = 0;
  let failedSteps = 0;

  for (const step of pipelineSteps) {
    try {
      const result = await makeRequest(`${BASE_URL}${step.url}`);
      const pass = result.status === step.expected;
      const status = pass ? '✅ PASS' : '❌ FAIL';

      if (pass) passedSteps++;
      else failedSteps++;

      console.log(
        step.name.padEnd(20),
        step.url.padEnd(20),
        String(result.status).padStart(6),
        String(step.expected).padStart(8),
        status.padStart(9),
        step.description
      );
    } catch (error) {
      failedSteps++;
      console.log(
        step.name.padEnd(20),
        step.url.padEnd(20),
        'ERROR'.padStart(6),
        String(step.expected).padStart(8),
        '❌ FAIL'.padStart(9),
        `${step.description} - ${error.message.substring(0, 30)}`
      );
    }
  }

  console.log('');
  console.log(`Pipeline Summary: ${passedSteps} passed, ${failedSteps} failed`);
  console.log('');

  // =====================================================
  // E. ORPHANED PAGES & DEAD ENDS
  // =====================================================
  console.log('🕵️  SECTION E: ORPHANED PAGES & DEAD ENDS');
  console.log('='.repeat(60));

  // Identify potentially orphaned URLs (URLs that exist but might not be linked)
  const potentiallyOrphaned = [
    '/api/debug/api-logs',
    '/api/test',
    '/consciousness-demo',
    '/growth',
    '/loyalty',
    '/visual-layers'
  ];

  console.log('Potentially Orphaned URLs (exist but may not be linked):');
  console.log('URL'.padEnd(25), 'Status', 'Likely Orphaned?', 'Notes');
  console.log('='.repeat(80));

  for (const url of potentiallyOrphaned) {
    try {
      const result = await makeRequest(`${BASE_URL}${url}`);
      const isOrphaned = result.status === 200 ? 'Possibly' : 'N/A';
      const notes = result.status === 200 ? 'URL exists, check linking' : `HTTP ${result.status}`;

      console.log(
        url.padEnd(25),
        String(result.status).padStart(6),
        isOrphaned.padStart(15),
        notes
      );
    } catch (error) {
      console.log(
        url.padEnd(25),
        'ERROR'.padStart(6),
        'N/A'.padStart(15),
        `Error: ${error.message.substring(0, 25)}`
      );
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('');

  // =====================================================
  // FINAL SUMMARY
  // =====================================================
  console.log('🎯 AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Sitemap URLs: ${sitemapUrls.length}`);
  console.log(`API Endpoints Tested: ${apiEndpoints.length}`);
  console.log(`URLs Crawled: ${crawledUrls.length}`);
  console.log(`Pipeline Steps: ${pipelineSteps.length} (${passedSteps} passed, ${failedSteps} failed)`);
  console.log('');
  console.log('✅ AUDIT COMPLETE');
  console.log('='.repeat(60));
}

// Run the comprehensive audit
runComprehensiveAudit().catch(console.error);