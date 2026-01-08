# BigCommerce Integration

This document describes how to connect a BigCommerce store to the Listing Manager.

## Supported auth
- OAuth token (X-Auth-Token header) — provide the store token as `access_token`.
- Store hash is required and is used in the base API URL: `https://api.bigcommerce.com/stores/{store_hash}`.

## API endpoints used
- Products: `GET /v3/catalog/products` (pagination via `limit` and `page`)
- Orders: `GET /v2/orders` (pagination via `limit` and `page`)

## Demo
A demo script is included at `scripts/demo/bigcommerce_mock_flow.ts` to exercise the adapter locally (mocked flow).

## Notes
- BigCommerce returns products under `data` in v3 API responses; adapter supports both `data` and `products` shapes.
- For production, ensure tokens are stored encrypted and follow BigCommerce API rate limits.
