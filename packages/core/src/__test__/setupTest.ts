// Setup file for Node.js test runner - replaces setupJest.ts
import { mockFetch } from "./__mocks__/fetchMock";

// Make fetch available globally
(globalThis as { fetch?: typeof fetch }).fetch = mockFetch;
