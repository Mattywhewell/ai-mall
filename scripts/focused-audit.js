#!/usr/bin/env node

/**
 * Aiverse HTTP Status & Pipeline Audit Script - Focused Version
 * Checks specific URLs and validates the navigation pipeline
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'https://alverse.app';
const REQUEST_TIMEOUT = 10000;

class FocusedAuditor {
  constructor() {
    this.results = new Map();
    this.redirects = new Map();
  }

  async makeRequest(url) {
    return new Promise((resolve) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'HEAD', // Use HEAD to check status without downloading content
        headers: {
          'User-Agent': 'Aiverse-Audit-Bot/1.0',
        },
        timeout: REQUEST_TIMEOUT,
      };

      const req = client.request(options, (res) => {
        const statusCode = res.statusCode;
        const location = res.headers.location;

        // Handle redirects
        if ((statusCode === 301 || statusCode === 302) && location) {
          const redirectUrl = location.startsWith('http') ? location : new URL(location, url).href;
          this.redirects.set(url, {
            destination: redirectUrl,
            type: statusCode,
            expected: this.isExpectedRedirect(url, redirectUrl)
          });
        }

        resolve({
          url,
          status: statusCode,
          headers: res.headers,
          redirected: !!(statusCode === 301 || statusCode === 302)
        });
      });

      req.on('error', (err) => {
        resolve({
          url,
          status: 'ERROR',
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          status: 'TIMEOUT',
          error: 'Request timeout'
        });
      });

      req.end();
    });
  }

  isExpectedRedirect(source, destination) {
    const sourceUrl = new URL(source);
    const destUrl = new URL(destination);

    // Trailing slash normalization
    if (sourceUrl.pathname.endsWith('/') && !destUrl.pathname.endsWith('/') &&
        sourceUrl.pathname.slice(0, -1) === destUrl.pathname) {
      return true;
    }
    if (!sourceUrl.pathname.endsWith('/') && destUrl.pathname.endsWith('/') &&
        sourceUrl.pathname === destUrl.pathname.slice(0, -1)) {
      return true;
    }

    return false;
  }

  getStatusNotes(result) {
    if (result.status === 200) return 'OK';
    if (result.status === 301) return 'Permanent Redirect';
    if (result.status === 302) return 'Temporary Redirect';
    if (result.status === 404) return 'Not Found';
    if (result.status >= 500) return 'Server Error';
    if (result.status === 'ERROR') return `Error: ${result.error}`;
    if (result.status === 'TIMEOUT') return 'Request Timeout';
    return `Status: ${result.status}`;
  }

  async auditUrls(urls) {
    console.log(`🔍 Auditing ${urls.length} URLs...`);

    for (const url of urls) {
      console.log(`Checking: ${url}`);
      const result = await this.makeRequest(url);
      this.results.set(url, result);

      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  validatePipeline() {
    const pipeline = {
      'Landing': { url: '/', next: ['City Gate'] },
      'City Gate': { url: '/city', next: ['Living Map', '3D Commons', 'Creator Exploration'] },
      'Living Map': { url: '/ai-city/explore', next: ['District'] },
      '3D Commons': { url: '/commons', next: ['District Portal'] },
      'Creator Exploration': { url: '/creator', next: ['Creator Application'] },
      'Creator Application': { url: '/creator/apply', next: [] },
      'District': { url: '/districts', next: ['Product'] }, // Check if districts page exists
      'Product': { url: '/products/123', next: ['Checkout'] }, // Test with example ID
      'Checkout': { url: '/checkout', next: [] }
    };

    const pipelineResults = new Map();

    for (const [stepName, stepInfo] of Object.entries(pipeline)) {
      const fullUrl = BASE_URL + stepInfo.url;
      const result = this.results.get(fullUrl);

      let status = 'NOT_CHECKED';
      let issues = [];

      if (result) {
        if (result.status === 200) {
          status = 'PASS';
        } else if (result.status === 404) {
          status = 'MISSING';
          issues.push('Page not found');
        } else if (result.status >= 300 && result.status < 400) {
          status = 'REDIRECT';
          issues.push(`Redirects to ${this.redirects.get(fullUrl)?.destination || 'unknown'}`);
        } else {
          status = 'ERROR';
          issues.push(`HTTP ${result.status}`);
        }
      } else {
        issues.push('URL not audited');
      }

      pipelineResults.set(stepName, {
        url: stepInfo.url,
        status,
        issues
      });
    }

    return pipelineResults;
  }

  generateReport() {
    const pipelineResults = this.validatePipeline();

    let report = '# Aiverse HTTP Status & Pipeline Audit Report\n\n';
    report += `**Audit Date:** ${new Date().toISOString()}\n`;
    report += `**Target Domain:** ${BASE_URL}\n\n`;

    // Summary
    const statusCounts = {
      200: 0,
      301: 0,
      302: 0,
      404: 0,
      error: 0
    };

    for (const result of this.results.values()) {
      if (result.status === 200) statusCounts[200]++;
      else if (result.status === 301) statusCounts[301]++;
      else if (result.status === 302) statusCounts[302]++;
      else if (result.status === 404) statusCounts[404]++;
      else statusCounts.error++;
    }

    report += '## Summary\n\n';
    report += `- **Total URLs Checked:** ${this.results.size}\n`;
    report += `- **Successful (200):** ${statusCounts[200]}\n`;
    report += `- **Redirects (301/302):** ${statusCounts[301] + statusCounts[302]}\n`;
    report += `- **Not Found (404):** ${statusCounts[404]}\n`;
    report += `- **Errors:** ${statusCounts.error}\n\n`;

    // A. URL Status Table
    report += '## A. URL Status Table\n\n';
    report += '| URL | Status | Notes |\n';
    report += '|-----|--------|-------|\n';

    for (const [url, result] of this.results) {
      const shortUrl = url.replace(BASE_URL, '') || '/';
      const notes = this.getStatusNotes(result);
      report += `| ${shortUrl} | ${result.status} | ${notes} |\n`;
    }
    report += '\n';

    // B. Redirect Map Table
    report += '## B. Redirect Map Table\n\n';
    report += '| Source | Destination | Type | Expected? |\n';
    report += '|--------|-------------|------|-----------|\n';

    for (const [source, redirect] of this.redirects) {
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

    return report;
  }

  async runAudit() {
    // Define URLs to check based on the pipeline
    const urlsToCheck = [
      BASE_URL + '/',
      BASE_URL + '/city',
      BASE_URL + '/ai-city/explore',
      BASE_URL + '/commons',
      BASE_URL + '/creator',
      BASE_URL + '/creator/apply',
      BASE_URL + '/districts',
      BASE_URL + '/products/123', // Test product page
      BASE_URL + '/checkout',
      BASE_URL + '/about',
      BASE_URL + '/contact',
      BASE_URL + '/pricing',
      BASE_URL + '/discover'
    ];

    await this.auditUrls(urlsToCheck);
    return this.generateReport();
  }
}

// Run the focused audit
async function main() {
  console.log('🚀 Starting Aiverse Focused HTTP Audit');
  console.log(`📍 Target: ${BASE_URL}`);

  const auditor = new FocusedAuditor();

  try {
    const report = await auditor.runAudit();

    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `aiverse-focused-audit-${timestamp}.md`;

    const fs = require('fs');
    fs.writeFileSync(filename, report);

    console.log(`\n✅ Audit complete! Report saved to: ${filename}`);
    console.log('\n' + '='.repeat(50));
    console.log(report);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

if (require.main === module) {
  main();
}