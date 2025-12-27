# Monorepo Migration Guide

This project has been restructured as a monorepo to allow independent development and publishing of adapters.

## New Structure

```
flow-pipe/
├── packages/
│   ├── core/              # @flow-pipe/core - Core types and classes
│   │   ├── src/
│   │   │   ├── RequestAdapter.ts
│   │   │   ├── RequestManager.ts
│   │   │   ├── RequestChain.ts
│   │   │   ├── models/
│   │   │   └── __test__/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── adapter-fetch/      # @flow-pipe/adapter-fetch - Fetch adapter
│   │   ├── src/
│   │   │   ├── FetchRequestAdapter.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ADAPTER_TEMPLATE.md # Template for creating new adapters
├── src/                    # Root package re-exports
│   └── index.ts
└── package.json           # Root workspace configuration
```

## Packages

### @flow-pipe/core

Core package containing:
- `RequestAdapter` - Base class for all adapters
- `RequestChain` - Main request chaining class
- `RequestManager` - Base request manager class
- Type definitions (`IRequestConfig`, `PipelineRequestStage`, etc.)

**Installation:**
```bash
npm install @flow-pipe/core
```

### @flow-pipe/adapter-fetch

Fetch API adapter implementation.

**Installation:**
```bash
npm install @flow-pipe/adapter-fetch @flow-pipe/core
```

**Usage:**
```typescript
import { RequestChain } from "@flow-pipe/core";
import { FetchRequestAdapter } from "@flow-pipe/adapter-fetch";

const result = await RequestChain.begin(
  { config: { url: "https://api.example.com", method: "GET" } },
  new FetchRequestAdapter()
).execute();
```

### flow-pipe (Root Package)

The main package that re-exports everything for convenience. Users can install `flow-pipe` to get everything, or install individual packages as needed.

## Creating New Adapters

See `packages/ADAPTER_TEMPLATE.md` for a complete guide on creating new adapter packages.

Quick steps:
1. Create a new directory under `packages/adapter-{name}/`
2. Follow the template structure
3. Extend `RequestAdapter` from `@flow-pipe/core`
4. Publish independently as `@flow-pipe/adapter-{name}`

## Development

### Building

Build all packages:
```bash
npm run build
```

Build specific package:
```bash
npm run build:core
npm run build:adapter-fetch
```

### Testing

Run all tests:
```bash
npm test
```

Run tests for specific package:
```bash
npm test --workspace=@flow-pipe/core
```

### Publishing

Each package can be published independently:

```bash
cd packages/core
npm publish

cd packages/adapter-fetch
npm publish
```

The root `flow-pipe` package can also be published separately.

## Migration Notes

- Old imports from `flow-pipe/core/...` still work via the root package
- New adapters should depend on `@flow-pipe/core` as a peer dependency
- Each adapter package is independent and can be versioned separately

