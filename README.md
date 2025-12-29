# request-orchestrator

A powerful TypeScript library for creating and managing request chains. Request-orchestrator allows you to chain multiple HTTP requests together, transform results, and handle responses with ease.

## TL;DR

**request-orchestrator** is **not** a new library for API calls—it's a **wrapper** that helps orchestrate complex REST data flows. Built with TypeScript-first design, request-orchestrator wraps your existing HTTP libraries (Fetch, Axios, Superagent, etc.) to simplify chaining multiple requests together. Each request in the chain can access and use results from previous requests, making it perfect for authentication flows, data aggregation, and sequential API orchestration.

**Best suited for:** Backend services and CLI applications where sequential API calls are common. Can also be used in frontend applications for complex data fetching scenarios.

### Core Concept

Instead of nested callbacks or complex Promise chains, request-orchestrator provides a fluent API to chain requests:

```typescript
import { RequestChain } from 'request-orchestrator';
import { FetchRequestAdapter } from 'request-orchestrator/adapter-fetch';

const adapter = new FetchRequestAdapter();

// Chain requests - each step can use the previous result
const result = await RequestChain.begin(
  { config: { url: 'https://api.example.com/users/1', method: 'GET' } },
  adapter
)
  .next({
    config: async (previousResult) => {
      const user = await previousResult.json();
      return { url: `https://api.example.com/users/${user.id}/posts`, method: 'GET' };
    }
  })
  .execute();
```

### Request Adapters

request-orchestrator uses a **modular adapter system** - you choose which HTTP library to use. Each adapter is a separate package:

- **`FetchRequestAdapter`** - Native Fetch API (Node.js 18+, browsers) - Zero dependencies
- **`NodeFetchRequestAdapter`** - node-fetch package (Node.js only)
- **`AxiosRequestAdapter`** - Axios with automatic JSON parsing
- **`SuperagentRequestAdapter`** - Superagent for cross-platform support

**Installation:**
```bash
npm install @request-orchestrator/core @request-orchestrator/adapter-fetch
```

**Usage:**
```typescript
// All adapters share the same API - easy to switch!
const fetchAdapter = new FetchRequestAdapter();
const axiosAdapter = new AxiosRequestAdapter();

// Use any adapter with the same code
const result = await RequestChain.begin(
  { config: { url: '...', method: 'GET' } },
  fetchAdapter // or axiosAdapter, etc.
).execute();
```

### Key Features

**1. Chain Requests with Previous Results**
```typescript
const result = await RequestChain.begin(
  { config: { url: 'https://api.example.com/auth/login', method: 'POST', data: {...} } },
  adapter
)
  .next({
    config: async (previousResult) => {
      const auth = await previousResult.json();
      return {
        url: 'https://api.example.com/user/profile',
        method: 'GET',
        headers: { Authorization: `Bearer ${auth.token}` }
      };
    }
  })
  .execute();
```

**2. Transform Results with Mappers**
```typescript
.next({
  config: { url: 'https://api.example.com/users/1', method: 'GET' },
  mapper: async (result) => {
    const data = await result.json();
    return data.id; // Transform to just the ID
  }
})
```

**3. Automatic Retry with Exponential Backoff**
```typescript
const result = await RequestChain.begin(
  {
    config: { url: 'https://api.example.com/users', method: 'GET' },
    retry: {
      maxRetries: 5,
      retryDelay: 1000,
      exponentialBackoff: true,
      retryCondition: retryOnNetworkOrStatusCodes(500, 502, 503, 504, 429)
    }
  },
  adapter
).execute();
```

**4. Execute All Requests**
```typescript
const results = await RequestChain.begin(...)
  .next(...)
  .next(...)
  .executeAll(); // Returns array of all results
```

**5. Error Handling**
```typescript
await RequestChain.begin(...)
  .withResultHandler((result) => console.log('Success:', result))
  .withErrorHandler((error) => console.error('Error:', error))
  .withFinishHandler(() => console.log('Done'))
  .execute();
```

**6. Result Interceptors for Side Effects**
```typescript
.next({
  config: { url: 'https://api.example.com/users/1', method: 'GET' },
  mapper: async (result) => {
    const data = await result.json();
    return data.id; // Transform result
  },
  resultInterceptor: async (mappedResult) => {
    // Perform side effects: logging, caching, analytics
    console.log('User ID fetched:', mappedResult);
    await cache.set(`user:${mappedResult}`, mappedResult);
  }
})
```

### Response Formats

Different adapters return different response formats:

- **Fetch/Node-Fetch**: Returns standard `Response` - use `.json()` to parse
- **Axios**: Returns `AxiosResponse` - data is already parsed in `.data` property
- **Superagent**: Returns `SuperagentResponse` - data is already parsed in `.body` property

### Security

Built-in SSRF protection blocks private IPs and localhost by default. Configure for development:

```typescript
const adapter = new FetchRequestAdapter({
  allowLocalhost: true // For local development only
});
```

### Quick Example: Authentication Flow

```typescript
import { RequestChain } from 'request-orchestrator';
import { FetchRequestAdapter } from 'request-orchestrator/adapter-fetch';

const adapter = new FetchRequestAdapter();

const userData = await RequestChain.begin(
  {
    config: {
      url: 'https://api.example.com/auth/login',
      method: 'POST',
      data: { username: 'user', password: 'pass' }
    }
  },
  adapter
)
  .next({
    config: async (previousResult) => {
      const auth = await previousResult.json();
      return {
        url: 'https://api.example.com/user/profile',
        method: 'GET',
        headers: { Authorization: `Bearer ${auth.token}` }
      };
    }
  })
  .execute();

console.log(await userData.json());
```

---

## Features

- 🔗 **Chain Requests**: Link multiple HTTP requests in sequence
- 🔄 **Result Transformation**: Map and transform request results
- 🎬 **Result Interceptors**: Perform side effects on results (logging, caching, analytics)
- 📊 **Previous Result Access**: Each step can use the previous request's result
- 🎯 **Handler Support**: Result, error, and finish handlers
- 🔁 **Automatic Retry**: Configurable retry mechanism with exponential backoff
- 📦 **Batch Execution**: Execute all requests and get all results
- 🌊 **Progressive Chunk Processing**: Process large streaming responses incrementally without loading everything into memory
- 🔌 **Modular Adapters**: Choose from Fetch, Axios, or Superagent adapters (or create your own)
- 🎨 **Nested Chains**: Support for nested request managers
- ⚡ **TypeScript First**: Full TypeScript support with type inference
- 🔒 **Built-in SSRF Protection**: Automatic URL validation to prevent Server-Side Request Forgery attacks

## Installation

### Main Package

Install the main package for core functionality. **Note**: Adapters are NOT included in the main export and must be imported separately using subpath exports or individual packages.

```bash
npm install request-orchestrator
```

### Individual Packages (Modular Installation)

You can install packages individually:

```bash
# Core package (required)
npm install @request-orchestrator/core

# Choose your adapter (install only what you need):
npm install @request-orchestrator/adapter-fetch         # Native Fetch API (Node.js 18+ / browsers)
npm install @request-orchestrator/adapter-node-fetch    # node-fetch adapter (Node.js only)
npm install @request-orchestrator/adapter-axios         # Axios adapter
npm install @request-orchestrator/adapter-superagent    # Superagent adapter
```

**Benefits of modular installation:**
- 🎯 **Smaller bundles**: Only include the adapter you use
- 🔄 **Flexibility**: Switch adapters without changing your code
- 📦 **Independent versioning**: Each adapter can be updated independently

## Quick Start

Here's a minimal example to get you started:

```typescript
// Option 1: Using the main package with subpath exports
import { RequestChain } from 'request-orchestrator';
import { FetchRequestAdapter } from 'request-orchestrator/adapter-fetch';

// Option 2: Using individual packages
// import { RequestChain } from '@request-orchestrator/core';
// import { FetchRequestAdapter } from '@request-orchestrator/adapter-fetch';

// Create a simple GET request chain
const adapter = new FetchRequestAdapter();
const result = await RequestChain.begin(
  {
    config: { 
      url: 'https://api.example.com/users/1', 
      method: 'GET' 
    }
  },
  adapter
).execute();

console.log(await result.json()); // User data
```

**Important**: 
- You must provide a request adapter when starting a chain. Adapters handle the actual HTTP requests.
- Choose the adapter that fits your needs: `FetchRequestAdapter` (native Fetch), `NodeFetchRequestAdapter` (node-fetch), `AxiosRequestAdapter`, or `SuperagentRequestAdapter`.
- See the [Adapters](#adapters) section in the full documentation for details on each adapter and when to use them.

## Documentation

For complete documentation, including:
- Detailed usage examples
- Advanced features (retry, chunk processing, nested chains)
- Adapter comparison and configuration
- API reference
- Common patterns
- Security guidelines
- Troubleshooting

See **[DOCUMENTATION.md](./DOCUMENTATION.md)**.

## License

ISC
