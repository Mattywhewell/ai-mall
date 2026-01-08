# WooCommerce Integration

This document describes how to connect a WooCommerce store to the Listing Manager.

## Supported auth
- Consumer Key & Consumer Secret (REST API keys) — supported via query string (consumer_key/consumer_secret).
- Bearer token (for OAuth plugins) — supported via Authorization: Bearer <token>

## API endpoints used
- Products: `GET /wp-json/wc/v3/products` (pagination via `per_page` and `page`)
- Orders: `GET /wp-json/wc/v3/orders` (pagination via `per_page` and `page`)

## Demo
A demo script is included at `scripts/demo/woocommerce_mock_flow.ts` to exercise the adapter locally (mocked flow).

## Notes
- WooCommerce allows per_page up to 100 items; adapter paginates until no more results.
- For production, ensure HTTPS store_url and secure storage of keys.
