// Setup file for Node.js test runner - replaces setupJest.ts
import { mockFetch } from "./__mocks__/fetch-mock";

// Make fetch available globally
(globalThis as { fetch?: typeof fetch }).fetch = mockFetch;
