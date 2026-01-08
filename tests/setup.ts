import '@testing-library/jest-dom';

// Provide a default fetch mock if tests don't mock it explicitly
if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });
}