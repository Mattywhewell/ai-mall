#!/usr/bin/env node

/**
 * Aiverse HTTP Status & Pipeline Audit Script
 * Crawls the site and validates HTTP responses, redirects, and navigation pipeline
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');

const BASE_URL = 'https://alverse.app';
const MAX_DEPTH = 3;
const REQUEST_TIMEOUT = 10000;
const DELAY_BETWEEN_REQUESTS = 1000; // Respectful crawling

class SiteAuditor {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.visited = new Set();
    this.urlStatus = new Map();
    this.redirects = new Map();
    this.pipelineSteps = new Map();
    this.errors = [];
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url, followRedirects = true, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Aiverse-Audit-Bot/1.0 (respectful-crawler)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: REQUEST_TIMEOUT,
      };

      const req = client.request(options, (res) => {
        const statusCode = res.statusCode;
        const location = res.headers.location;

        // Handle redirects
        if (followRedirects && (statusCode === 301 || statusCode === 302) && location && maxRedirects > 0) {
          const redirectUrl = location.startsWith('http') ? location : new URL(location, url).href;
          this.redirects.set(url, {
            destination: redirectUrl,
            type: statusCode,
            expected: this.isExpectedRedirect(url, redirectUrl)
          });

          // Follow redirect
          this.makeRequest(redirectUrl, true, maxRedirects - 1)
            .then(result => resolve(result))
            .catch(err => reject(err));
          return;
        }

        // Collect response data for link extraction
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            url,
            status: statusCode,
            headers: res.headers,
            data: data.length > 50000 ? data.substring(0, 50000) + '...' : data,
            contentType: res.headers['content-type']
          });
        });
      });

      req.on('error', (err) => {
        this.errors.push({ url, error: err.message });
        resolve({ url, status: 'ERROR', error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        this.errors.push({ url, error: 'Request timeout' });
        resolve({ url, status: 'TIMEOUT', error: 'Request timeout' });
      });

      req.end();
    });
  }

  isExpectedRedirect(source, destination) {
    // Expected redirects: trailing slash normalization, www redirects, etc.
    const sourceUrl = new URL(source);
    const destUrl = new URL(destination);

    // Trailing slash normalization
    if (sourceUrl.pathname.endsWith('/') && !destUrl.pathname.endsWith('/') && sourceUrl.pathname.slice(0, -1) === destUrl.pathname) {
      return true;
    }
    if (!sourceUrl.pathname.endsWith('/') && destUrl.pathname.endsWith('/') && sourceUrl.pathname === destUrl.pathname.slice(0, -1)) {
      return true;
    }

    // www redirects
    if (sourceUrl.hostname.startsWith('www.') && !destUrl.hostname.startsWith('www.') && sourceUrl.pathname === destUrl.pathname) {
      return true;
    }
    if (!sourceUrl.hostname.startsWith('www.') && destUrl.hostname.startsWith('www.') && sourceUrl.pathname === destUrl.pathname) {
      return true;
    }

    return false;
  }

  extractLinks(html, baseUrl) {
    const links = new Set();
    const linkRegex = /href=["']([^"']+)["']/g;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      try {
        const absoluteUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        const url = new URL(absoluteUrl);

        // Only include same domain, non-hash, non-mailto links
        if (url.hostname === new URL(baseUrl).hostname &&
            !url.hash &&
            url.protocol.startsWith('http') &&
            !href.startsWith('mailto:') &&
            !href.startsWith('tel:') &&
            !href.includes('#')) {
          links.add(absoluteUrl);
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }

    return Array.from(links);
  }

  definePipelineSteps() {
    this.pipelineSteps.set('Landing', {
      url: '/',
      next: ['City Gate']
    });

    this.pipelineSteps.set('City Gate', {
      url: '/city',
      next: ['Living Map', '3D Commons', 'Creator Exploration']
    });

    this.pipelineSteps.set('Living Map', {
      url: '/ai-city/explore',
      next: ['District']
    });

    this.pipelineSteps.set('3D Commons', {
      url: '/commons',
      next: ['District Portal']
    });

    this.pipelineSteps.set('Creator Exploration', {
      url: '/creator',
      next: ['Creator Application']
    });

    this.pipelineSteps.set('Creator Application', {
      url: '/creator/apply',
      next: ['Creator Dashboard']
    });

    // Dynamic steps (patterns)
    this.pipelineSteps.set('District', {
      pattern: /^\/districts\/[^\/]+$/,
      next: ['Product']
    });

    this.pipelineSteps.set('Product', {
      pattern: /^\/products\/[^\/]+$/,
      next: ['Checkout']
    });

    this.pipelineSteps.set('Checkout', {
      url: '/checkout',
      next: []
    });
  }

  async validatePipelineStep(stepName, expectedUrl, discoveredUrls) {
    const step = this.pipelineSteps.get(stepName);
    if (!step) return { status: 'UNKNOWN', issues: ['Step not defined'] };

    let actualUrl = step.url;
    let found = false;

    if (step.pattern) {
      // Find a URL matching the pattern
      for (const url of discoveredUrls) {
        if (step.pattern.test(new URL(url).pathname)) {
          actualUrl = url;
          found = true;
          break;
        }
      }
    } else {
      found = discoveredUrls.has(expectedUrl) || discoveredUrls.has(BASE_URL + expectedUrl);
    }

    if (!found) {
      return {
        status: 'MISSING',
        url: actualUrl,
        issues: ['URL not found in crawl']
      };
    }

    const statusInfo = this.urlStatus.get(actualUrl);
    if (!statusInfo) {
      return {
        status: 'NOT_CHECKED',
        url: actualUrl,
        issues: ['URL not checked']
      };
    }

    const issues = [];
    if (statusInfo.status !== 200) {
      issues.push(`HTTP ${statusInfo.status}`);
    }

    // Check if next steps are linked
    if (step.next && step.next.length > 0) {
      const response = statusInfo.response;
      if (response && response.data) {
        const links = this.extractLinks(response.data, actualUrl);
        for (const nextStep of step.next) {
          const nextStepInfo = this.pipelineSteps.get(nextStep);
          if (nextStepInfo) {
            let nextUrlFound = false;
            if (nextStepInfo.pattern) {
              nextUrlFound = links.some(link => nextStepInfo.pattern.test(new URL(link, BASE_URL).pathname));
            } else {
              nextUrlFound = links.some(link => {
                const linkUrl = new URL(link, BASE_URL);
                return linkUrl.pathname === nextStepInfo.url;
              });
            }

            if (!nextUrlFound) {
              issues.push(`Missing link to ${nextStep}`);
            }
          }
        }
      }
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      url: actualUrl,
      issues
    };
  }

  async crawl(url, depth = 0) {
    if (depth > MAX_DEPTH || this.visited.has(url)) {
      return;
    }

    this.visited.add(url);
    console.log(`Crawling: ${url} (depth: ${depth})`);

    try {
      const result = await this.makeRequest(url);

      this.urlStatus.set(url, {
        status: result.status,
        response: result,
        notes: this.getStatusNotes(result)
      });

      // Extract links if it's HTML and we haven't exceeded depth
      if (result.status === 200 &&
          result.contentType &&
          result.contentType.includes('text/html') &&
          result.data &&
          depth < MAX_DEPTH) {

        const links = this.extractLinks(result.data, url);

        // Prioritize important pages
        const priorityLinks = links.filter(link =>
          link.includes('/city') ||
          link.includes('/districts') ||
          link.includes('/products') ||
          link.includes('/creator') ||
          link.includes('/checkout') ||
          link.includes('/ai-city') ||
          link.includes('/commons')
        );

        const otherLinks = links.filter(link => !priorityLinks.includes(link));

        // Crawl priority links first
        for (const link of priorityLinks.slice(0, 5)) { // Limit to prevent overwhelming
          await this.sleep(DELAY_BETWEEN_REQUESTS);
          await this.crawl(link, depth + 1);
        }
      }

    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      this.urlStatus.set(url, {
        status: 'ERROR',
        error: error.message,
        notes: 'Request failed'
      });
    }
  }

  getStatusNotes(result) {
    const notes = [];

    if (result.status === 200) {
      notes.push('OK');
    } else if (result.status >= 300 && result.status < 400) {
      notes.push('Redirect');
    } else if (result.status === 404) {
      notes.push('Not Found');
    } else if (result.status >= 500) {
      notes.push('Server Error');
    } else if (result.status === 'ERROR') {
      notes.push('Request Error');
    } else if (result.status === 'TIMEOUT') {
      notes.push('Timeout');
    } else {
      notes.push(`Unexpected status: ${result.status}`);
    }

    if (result.contentType) {
      notes.push(`Content-Type: ${result.contentType}`);
    }

    return notes.join(', ');
  }

  async runAudit() {
    console.log('🚀 Starting Aiverse HTTP Status & Pipeline Audit');
    console.log(`📍 Target: ${BASE_URL}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('');

    this.definePipelineSteps();

    // Start crawling from homepage
    await this.crawl(BASE_URL);

    // Validate pipeline
    console.log('🔍 Validating navigation pipeline...');
    const pipelineResults = new Map();

    for (const [stepName, stepInfo] of this.pipelineSteps) {
      const result = await this.validatePipelineStep(stepName, stepInfo.url, this.visited);
      pipelineResults.set(stepName, result);
    }

    return {
      urlStatus: this.urlStatus,
      redirects: this.redirects,
      pipelineResults,
      errors: this.errors,
      summary: {
        totalUrls: this.visited.size,
        successful: Array.from(this.urlStatus.values()).filter(s => s.status === 200).length,
        redirects: this.redirects.size,
        errors: this.errors.length,
        notFound: Array.from(this.urlStatus.values()).filter(s => s.status === 404).length
      }
    };
  }

  generateReport(results) {
    const { urlStatus, redirects, pipelineResults, summary } = results;

    let report = '# Aiverse HTTP Status & Pipeline Audit Report\n\n';
    report += `**Audit Date:** ${new Date().toISOString()}\n`;
    report += `**Target Domain:** ${BASE_URL}\n`;
    report += `**Total URLs Discovered:** ${summary.totalUrls}\n`;
    report += `**Successful (200):** ${summary.successful}\n`;
    report += `**Redirects:** ${summary.redirects}\n`;
    report += `**Not Found (404):** ${summary.notFound}\n`;
    report += `**Errors:** ${summary.errors}\n\n`;

    // A. URL Status Table
    report += '## A. URL Status Table\n\n';
    report += '| URL | Status | Notes |\n';
    report += '|-----|--------|-------|\n';

    for (const [url, status] of urlStatus) {
      const shortUrl = url.replace(BASE_URL, '');
      report += `| ${shortUrl || '/'} | ${status.status} | ${status.notes} |\n`;
    }
    report += '\n';

    // B. Redirect Map Table
    report += '## B. Redirect Map Table\n\n';
    report += '| Source | Destination | Type | Expected? |\n';
    report += '|--------|-------------|------|-----------|\n';

    for (const [source, redirect] of redirects) {
      const shortSource = source.replace(BASE_URL, '') || '/';
      const shortDest = redirect.destination.replace(BASE_URL, '') || '/';
      report += `| ${shortSource} | ${shortDest} | ${redirect.type} | ${redirect.expected ? 'Yes' : 'No'} |\n`;
    }
    report += '\n';

    // C. Pipeline Integrity Report
    report += '## C. Pipeline Integrity Report\n\n';
    report += '| Step | Expected URL | Status | Issues |\n';
    report += '|------|--------------|--------|--------|\n';

    for (const [stepName, result] of pipelineResults) {
      const issues = result.issues.length > 0 ? result.issues.join('; ') : 'None';
      report += `| ${stepName} | ${result.url} | ${result.status} | ${issues} |\n`;
    }
    report += '\n';

    // Errors section
    if (results.errors.length > 0) {
      report += '## Errors Encountered\n\n';
      for (const error of results.errors) {
        report += `- **${error.url}**: ${error.error}\n`;
      }
      report += '\n';
    }

    return report;
  }
}

// Run the audit
async function main() {
  const auditor = new SiteAuditor(BASE_URL);

  try {
    console.log('🔍 Running comprehensive site audit...');
    const results = await auditor.runAudit();

    const report = auditor.generateReport(results);

    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `aiverse-http-audit-${timestamp}.md`;

    fs.writeFileSync(filename, report);
    console.log(`\n✅ Audit complete! Report saved to: ${filename}`);

    // Also print summary to console
    console.log('\n📊 Summary:');
    console.log(`   URLs checked: ${results.summary.totalUrls}`);
    console.log(`   Successful: ${results.summary.successful}`);
    console.log(`   Redirects: ${results.summary.redirects}`);
    console.log(`   Not Found: ${results.summary.notFound}`);
    console.log(`   Errors: ${results.summary.errors}`);

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SiteAuditor;