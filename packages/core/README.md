# @flow-pipe/core

Core types and base classes for flow-pipe request adapters.

## Installation

```bash
npm install @flow-pipe/core
```

## Usage

This package provides the foundational types and classes for building request adapters:

- `RequestAdapter` - Base class for all adapters
- `RequestChain` - Main class for chaining requests
- `RequestManager` - Base class for request management
- Type definitions for request configurations and pipeline stages

## Creating a Custom Adapter

To create a custom adapter, extend the `RequestAdapter` class:

```typescript
import { RequestAdapter, IRequestConfig } from "@flow-pipe/core";

export default class MyCustomAdapter extends RequestAdapter<
  MyResponseType,
  MyRequestConfig
> {
  public async createRequest(
    requestConfig: MyRequestConfig
  ): Promise<MyResponseType> {
    // Implement your custom request logic
    // ...
  }
}
```

See the [adapter-fetch](../adapter-fetch) package for a complete example.

