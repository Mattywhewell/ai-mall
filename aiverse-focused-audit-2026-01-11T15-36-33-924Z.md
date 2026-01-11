# Aiverse HTTP Status & Pipeline Audit Report

**Audit Date:** 2026-01-11T15:36:33.921Z
**Target Domain:** https://alverse.app

## Summary

- **Total URLs Checked:** 13
- **Successful (200):** 11
- **Redirects (301/302):** 0
- **Not Found (404):** 2
- **Errors:** 0

## A. URL Status Table

| URL | Status | Notes |
|-----|--------|-------|
| / | 200 | OK |
| /city | 200 | OK |
| /ai-city/explore | 200 | OK |
| /commons | 200 | OK |
| /creator | 404 | Not Found |
| /creator/apply | 200 | OK |
| /districts | 404 | Not Found |
| /products/123 | 200 | OK |
| /checkout | 200 | OK |
| /about | 200 | OK |
| /contact | 200 | OK |
| /pricing | 200 | OK |
| /discover | 200 | OK |

## B. Redirect Map Table

| Source | Destination | Type | Expected? |
|--------|-------------|------|-----------|

## C. Pipeline Integrity Report

| Step | Expected URL | Status | Issues |
|------|--------------|--------|--------|
| Landing | / | PASS | None |
| City Gate | /city | PASS | None |
| Living Map | /ai-city/explore | PASS | None |
| 3D Commons | /commons | PASS | None |
| Creator Exploration | /creator | MISSING | Page not found |
| Creator Application | /creator/apply | PASS | None |
| District | /districts | MISSING | Page not found |
| Product | /products/123 | PASS | None |
| Checkout | /checkout | PASS | None |

