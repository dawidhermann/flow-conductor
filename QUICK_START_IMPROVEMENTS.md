# Quick Start: Implementing Structure Improvements

This guide provides step-by-step instructions for implementing the recommended improvements.

## Phase 1: Critical Improvements (Start Here)

### 1. Add ESLint Configuration

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier
```

Create `.eslintrc.json`:
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
  "ignorePatterns": ["build/**", "node_modules/**"]
}
```

### 2. Add Prettier Configuration

```bash
npm install --save-dev prettier
```

Create `.prettierrc.json`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

Create `.prettierignore`:
```
node_modules
build
coverage
*.md
```

### 3. Add EditorConfig

Create `.editorconfig`:
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### 4. Add Node Version File

Create `.nvmrc`:
```
20
```

### 5. Update package.json Scripts

Add these scripts to `package.json`:
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "test:watch": "node --test --import tsx/esm --watch 'src/**/*.test.ts'"
  }
}
```

Add `engines` field:
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 6. Add CI/CD Workflow

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run type-check
      - run: npm run build
      - run: npm test
```

## Phase 2: Test Coverage

### Add Test Coverage Tool

```bash
npm install --save-dev c8
```

Update `package.json`:
```json
{
  "scripts": {
    "test:coverage": "c8 npm test",
    "test:coverage:report": "c8 report --reporter=html"
  }
}
```

Add to `.gitignore`:
```
coverage/
```

## Phase 3: Documentation Structure (Optional)

### Create Documentation Directory

```bash
mkdir -p docs/{api,guides,examples}
```

Move/update documentation:
- Keep `README.md` at root
- Move detailed guides to `docs/guides/`
- Add API docs to `docs/api/`
- Add examples to `docs/examples/`

## Phase 4: Barrel Exports (Optional)

### Create Barrel Files

Create `src/core/adapters/index.ts`:
```typescript
export { default as FetchRequestAdapter } from "./FetchRequestAdapter";
export { default as RequestAdapter } from "../RequestAdapter";
```

Create `src/core/models/index.ts`:
```typescript
export * from "./RequestParams";
export * from "./Handlers";
```

Update `src/index.ts` to use barrels:
```typescript
// Re-export from barrels for convenience
export * from "./core/models";
export * from "./core/adapters";
```

## Verification Checklist

After implementing Phase 1, verify:

- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] CI workflow runs successfully

## Next Steps

1. Review `PROJECT_STRUCTURE_ANALYSIS.md` for detailed recommendations
2. Review `STRUCTURE_SUMMARY.md` for visual overview
3. Review `REFACTORING_SUGGESTIONS.md` and `TYPE_IMPROVEMENTS.md` for code-level improvements

## Estimated Time

- Phase 1: 30-45 minutes
- Phase 2: 15 minutes
- Phase 3: 30-60 minutes (optional)
- Phase 4: 15 minutes (optional)

**Total: ~1-2 hours for all improvements**

