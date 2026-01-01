# Flow-Conductor Superagent Adapter Example

This example project demonstrates how to use `@flow-conductor/core` with `@flow-conductor/adapter-superagent` to create sequential HTTP request chains using the [JSONPlaceholder API](https://jsonplaceholder.typicode.com/).

## Installation

```bash
npm install
```

This will install:
- `@flow-conductor/core` - Core flow-conductor library
- `@flow-conductor/adapter-superagent` - Superagent adapter for flow-conductor
- `superagent` - HTTP client library

## Usage

Run the example:

```bash
npm start
```

Or run in watch mode:

```bash
npm run dev
```

## Examples Included

### Example 1: Simple Chain
Fetches a post and then fetches its comments in a sequential chain.

### Example 2: Multi-Step Chain
Demonstrates a longer chain: fetch user → fetch user's posts → fetch user's todos.

### Example 3: POST Request Chain
Creates a new post and then fetches it back to verify creation.

### Example 4: Error Handling
Shows how to handle errors in request chains using error handlers.

### Example 5: Conditional Chain
Demonstrates conditional execution of next steps based on previous results.

## Key Concepts

### Creating a Request Chain

```typescript
import { begin } from "@flow-conductor/core";
import SuperagentRequestAdapter from "@flow-conductor/adapter-superagent";

const adapter = new SuperagentRequestAdapter();

const result = await begin(
  {
    config: {
      url: "https://jsonplaceholder.typicode.com/posts/1",
      method: "GET",
    },
    mapper: (result) => result.body,
  },
  adapter
)
  .next({
    config: async (previousResult) => {
      const post = previousResult;
      return {
        url: `https://jsonplaceholder.typicode.com/posts/${post.id}/comments`,
        method: "GET",
      };
    },
    mapper: (result) => result.body,
  })
  .execute();
```

### Accessing Previous Results

Each `.next()` callback receives the previous request's mapped result. The mapper extracts data from the Superagent `Response` object via `result.body`.

### Conditional Execution

Use the `condition` property to conditionally execute the next step:

```typescript
.next({
  condition: async (previousResult) => {
    return previousResult.length > 0;
  },
  config: async (previousResult) => {
    // This only runs if condition returns true
    return { url: "...", method: "GET" };
  },
})
```

### Error Handling

Add error handlers to catch and handle errors:

```typescript
.withErrorHandler((error) => {
  console.error("Request failed:", error);
})
```

## Learn More

- [Flow-Conductor Documentation](../../DOCUMENTATION.md)
- [JSONPlaceholder API](https://jsonplaceholder.typicode.com/)
- [Superagent Documentation](https://visionmedia.github.io/superagent/)

