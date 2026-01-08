# Running Unit Tests and Snapshots

This project includes unit tests and snapshot tests using Vitest and React Testing Library.

## Install dependencies

Install dev dependencies locally:

```bash
npm ci
# or
npm install
```

## Run unit tests

- Run once (and create/update snapshots):

```bash
npm run test:unit
```

- Run in watch mode during development:

```bash
npm run test:unit:watch
```

## Notes
- Snapshot files will be created in the `tests/unit` folder automatically when tests run. Review snapshots for changes and commit them after ensuring they are expected.
- Playwright e2e tests are located under `tests/e2e` and can be run with `npm run test:e2e`.
- If you encounter issues with global `fetch` in tests, ensure the `tests/setup.ts` is loaded (Vitest config references it). It provides a fallback fetch mock when not explicitly mocked in tests.