#!/usr/bin/env node

/**
 * Aiverse URL & HTTP Audit Script
 * Comprehensive audit of sitemap, APIs, URLs, and pipeline integrity
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

// Main audit function
async function runAudit() {
  console.log('🚀 Starting Aiverse URL & HTTP Audit');
  console.log('=' .repeat(50));
  console.log(`Target: ${BASE_URL}`);
  console.log('');

  // 1. SITEMAP AUDIT
  console.log('📄 1. SITEMAP AUDIT');
  console.log('-'.repeat(30));

  try {
    const sitemapResponse = await makeRequest(SITEMAP_URL);
    console.log(`Sitemap Status: ${sitemapResponse.status}`);

    if (sitemapResponse.status === 200) {
      const sitemapUrls = parseSitemap(sitemapResponse.data);
      console.log(`Found ${sitemapUrls.length} URLs in sitemap`);

      console.log('\nSitemap URL Status Check:');
      console.log('URL'.padEnd(60), 'Status', 'Redirect', 'Notes');
      console.log('-'.repeat(100));

      for (const url of sitemapUrls.slice(0, 10)) { // Check first 10 for brevity
        try {
          const result = await makeRequest(url, 'HEAD');
          const shortUrl = url.length > 55 ? url.substring(0, 52) + '...' : url;
          const redirect = result.redirected ? 'YES' : 'NO';
          const notes = result.status !== 200 ? `HTTP ${result.status}` : '';

          console.log(
            shortUrl.padEnd(60),
            String(result.status).padStart(6),
            redirect.padStart(7),
            notes
          );
        } catch (error) {
          console.log(
            (url.length > 55 ? url.substring(0, 52) + '...' : url).padEnd(60),
            'ERROR'.padStart(6),
            'NO'.padStart(7),
            error.message.substring(0, 20)
          );
        }
      }
    }
  } catch (error) {
    console.log(`❌ Sitemap fetch failed: ${error.message}`);
  }

  // 2. API ENDPOINT DISCOVERY
  console.log('\n🔌 2. API ENDPOINT AUDIT');
  console.log('-'.repeat(30));

  const apiEndpoints = [
    '/api/health',
    '/api/citizens',
    '/api/rituals',
    '/api/districts',
    '/api/presence',
    '/api/user/avatar',
    '/api/admin/assets',
    '/api/stripe/webhook',
    '/api/auth/verify-email'
  ];

  console.log('API Endpoint Status Check:');
  console.log('Endpoint'.padEnd(25), 'Method', 'Status', 'Auth?', 'Notes');
  console.log('-'.repeat(80));

  for (const endpoint of apiEndpoints) {
    const methods = ['GET', 'POST'];
    for (const method of methods) {
      try {
        const result = await makeRequest(`${BASE_URL}${endpoint}`, method);
        const authRequired = result.status === 401 || result.status === 403;
        const notes = result.status >= 500 ? 'Server Error' :
                     result.status === 404 ? 'Not Found' :
                     result.status >= 400 ? 'Client Error' : '';

        console.log(
          endpoint.padEnd(25),
          method.padStart(6),
          String(result.status).padStart(6),
          (authRequired ? 'YES' : 'NO').padStart(5),
          notes
        );

        // Only test one method per endpoint to avoid spam
        break;
      } catch (error) {
        console.log(
          endpoint.padEnd(25),
          method.padStart(6),
          'ERROR'.padStart(6),
          'UNK'.padStart(5),
          error.message.substring(0, 25)
        );
        break;
      }
    }
  }

  // 3. INTERNAL URL CRAWL
  console.log('\n🕷️  3. INTERNAL URL CRAWL');
  console.log('-'.repeat(30));

  const crawlUrls = [
    '/',
    '/city',
    '/districts',
    '/creator',
    '/about',
    '/contact',
    '/pricing',
    '/discover'
  ];

  console.log('Internal URL Status Check:');
  console.log('Path'.padEnd(20), 'Status', 'Redirect', 'Content-Type');
  console.log('-'.repeat(70));

  for (const path of crawlUrls) {
    try {
      const result = await makeRequest(`${BASE_URL}${path}`);
      const contentType = result.headers['content-type'] || 'unknown';
      const shortType = contentType.split(';')[0];

      console.log(
        path.padEnd(20),
        String(result.status).padStart(6),
        (result.redirected ? 'YES' : 'NO').padStart(7),
        shortType
      );
    } catch (error) {
      console.log(
        path.padEnd(20),
        'ERROR'.padStart(6),
        'NO'.padStart(7),
        error.message.substring(0, 20)
      );
    }
  }

  // 4. PIPELINE INTEGRITY
  console.log('\n🔄 4. PIPELINE INTEGRITY VALIDATION');
  console.log('-'.repeat(40));

  const pipelineSteps = [
    { name: 'Landing Page', url: '/', expected: 200 },
    { name: 'City Gate', url: '/city', expected: 200 },
    { name: 'Districts Hub', url: '/districts', expected: 200 },
    { name: 'Creator Portal', url: '/creator', expected: 200 }
  ];

  console.log('Pipeline Step Validation:');
  console.log('Step'.padEnd(20), 'URL'.padEnd(15), 'Status', 'Expected', 'Pass/Fail');
  console.log('-'.repeat(80));

  for (const step of pipelineSteps) {
    try {
      const result = await makeRequest(`${BASE_URL}${step.url}`);
      const pass = result.status === step.expected;
      const status = pass ? '✅ PASS' : '❌ FAIL';

      console.log(
        step.name.padEnd(20),
        step.url.padEnd(15),
        String(result.status).padStart(6),
        String(step.expected).padStart(8),
        status
      );
    } catch (error) {
      console.log(
        step.name.padEnd(20),
        step.url.padEnd(15),
        'ERROR'.padStart(6),
        String(step.expected).padStart(8),
        '❌ FAIL'
      );
    }
  }

  console.log('\n🎉 Audit Complete!');
  console.log('=' .repeat(50));
}

// Run the audit
runAudit().catch(console.error);