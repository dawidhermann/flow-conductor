# Creating a New Adapter Package

This guide will help you create a new adapter package for flow-pipe.

## Package Structure

Create a new directory under `packages/` with the following structure:

```
packages/adapter-{name}/
├── src/
│   ├── {Name}RequestAdapter.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Step 1: Create package.json

```json
{
  "name": "@flow-pipe/adapter-{name}",
  "version": "1.0.0",
  "type": "module",
  "description": "{Description} adapter for flow-pipe",
  "main": "./build/index.js",
  "types": "./build/index.d.ts",
  "exports": {
    ".": {
      "types": "./build/index.d.ts",
      "import": "./build/index.js"
    }
  },
  "files": [
    "build/**/*.js",
    "build/**/*.d.ts",
    "build/**/*.js.map",
    "README.md",
    "LICENSE"
  ],
  "keywords": [
    "flow-pipe",
    "request",
    "adapter",
    "{name}",
    "typescript"
  ],
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf build",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "prepublishOnly": "npm run clean && npm run lint && npm run type-check && npm run build"
  },
  "author": "Dawid Hermann",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/dawidhermann/flow-pipe.git",
    "directory": "packages/adapter-{name}"
  },
  "sideEffects": false,
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "@flow-pipe/core": "^1.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.2",
    "@flow-pipe/core": "workspace:*",
    "@typescript-eslint/eslint-plugin": "^8.50.1",
    "@typescript-eslint/parser": "^8.50.1",
    "eslint": "^9.39.2",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.4",
    "prettier": "^3.7.4",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.50.1"
  }
}
```

## Step 2: Create tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "rootDir": "./src",
    "outDir": "./build",
    "module": "ESNext",
    "target": "ES2020",
    "lib": ["ES2020", "dom"],
    "sourceMap": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictNullChecks": true,
    "moduleResolution": "node",
    "declaration": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["./src/**/*"],
  "exclude": ["./build"]
}
```

## Step 3: Create the Adapter

Create `src/{Name}RequestAdapter.ts`:

```typescript
import { RequestAdapter } from "@flow-pipe/core";
import type { IRequestConfig } from "@flow-pipe/core";

export type {Name}RequestConfig = IRequestConfig & {
  // Add any custom configuration options here
};

export default class {Name}RequestAdapter extends RequestAdapter<
  {ResponseType},
  {Name}RequestConfig
> {
  public async createRequest(
    requestConfig: {Name}RequestConfig
  ): Promise<{ResponseType}> {
    // Implement your adapter logic here
    // ...
  }
}
```

## Step 4: Create index.ts

Create `src/index.ts`:

```typescript
export { default, {Name}RequestConfig } from "./{Name}RequestAdapter";
```

## Step 5: Add to Root Workspace

The package will be automatically included if it's in the `packages/` directory and has a valid `package.json` with a name starting with `@flow-pipe/`.

## Step 6: Update Root Exports (Optional)

If you want to export the adapter from the main `flow-pipe` package, add it to `src/index.ts`:

```typescript
export {
  default as {Name}RequestAdapter,
  {Name}RequestConfig,
} from "@flow-pipe/adapter-{name}";
```

## Publishing

Each adapter can be published independently:

```bash
cd packages/adapter-{name}
npm publish
```

Make sure to:
1. Update the version number
2. Run `npm run prepublishOnly` to build and verify
3. Ensure `@flow-pipe/core` is listed as a peer dependency

