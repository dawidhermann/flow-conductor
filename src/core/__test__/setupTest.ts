// Setup file for Node.js test runner - replaces setupJest.ts
import { mockFetch } from './__mocks__/fetchMock';

// Make fetch available globally
(global as any).fetch = mockFetch;

