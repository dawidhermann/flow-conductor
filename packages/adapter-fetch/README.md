# @flow-pipe/adapter-fetch

Fetch API adapter for flow-pipe.

## Installation

```bash
npm install @flow-pipe/adapter-fetch @flow-pipe/core
```

## Usage

```typescript
import { RequestChain } from "@flow-pipe/core";
import { FetchRequestAdapter } from "@flow-pipe/adapter-fetch";

const result = await RequestChain.begin(
  {
    config: {
      url: "https://api.example.com/users",
      method: "GET",
    },
  },
  new FetchRequestAdapter()
).execute();
```

## Configuration

The `FetchRequestAdapter` accepts standard `IRequestConfig` objects compatible with the Fetch API:

```typescript
interface FetchRequestConfig extends IRequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  data?: any; // Will be JSON stringified for non-GET requests
  headers?: Record<string, string>;
  // ... other fetch options
}
```

