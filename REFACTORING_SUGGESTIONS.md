# Code Refactoring Suggestions

This document provides a comprehensive analysis of the flow-pipe codebase with prioritized refactoring suggestions.

## 🔴 Critical Issues (Must Fix)

### 1. **setupTest.ts - Linter Errors**
**Location:** `src/core/__test__/setupTest.ts`

**Issue:**
- Uses `global` which doesn't exist in Node.js ESM context
- Uses `any` type

**Current Code:**
```typescript
(global as any).fetch = mockFetch;
```

**Fix:**
```typescript
(globalThis as { fetch?: typeof fetch }).fetch = mockFetch;
```

---

### 2. **RequestChain.executeAll() - Bug in Error Handling**
**Location:** `src/core/RequestChain.ts:90`

**Issue:**
When an error occurs and `errorHandler` is present, the method returns `Promise.resolve(error)` instead of rejecting, which masks errors.

**Current Code:**
```typescript
if (this.errorHandler) {
  this.errorHandler(error);
  return Promise.resolve(error); // ❌ Should reject!
}
```

**Fix:**
```typescript
if (this.errorHandler) {
  this.errorHandler(error);
  return Promise.reject(error); // ✅ Reject the promise
}
```

---

### 3. **Missing IRequestResult Type Definition**
**Location:** `src/core/models/RequestParams.ts`

**Issue:**
Tests import `IRequestResult` but it's not defined or exported. This causes type errors.

**Fix:**
Add to `RequestParams.ts`:
```typescript
export interface IRequestResult {
  [key: string]: any;
}
```

Or make it more specific based on actual usage:
```typescript
export interface IRequestResult {
  body?: any;
  [key: string]: any;
}
```

Then export it from `src/index.ts`.

---

## 🟡 High Priority (Type Safety)

### 4. **RequestManager.addAll() - Missing Type Annotation**
**Location:** `src/core/RequestManager.ts:32`

**Issue:**
Parameter has no type annotation, defaults to `never[]`.

**Current Code:**
```typescript
public addAll(
  requestList = []  // ❌ No type annotation
): RequestFlow<Out, AdapterExecutionResult, RequestConfig>
```

**Fix:**
```typescript
public addAll(
  requestList: Array<
    | PipelineRequestStage<AdapterExecutionResult, Out, RequestConfig>
    | PipelineManagerStage<Out, AdapterExecutionResult, RequestConfig>
  > = []
): RequestFlow<Out, AdapterExecutionResult, RequestConfig>
```

---

### 5. **RequestManager.withResultHandler() - Type Mismatch**
**Location:** `src/core/RequestManager.ts:46`

**Issue:**
Accepts `ResultHandler` (generic with default `unknown`) but should accept `ResultHandler<Out | Out[]>` to match the property type.

**Current Code:**
```typescript
public withResultHandler(
  resultHandler: ResultHandler  // ❌ Should be ResultHandler<Out | Out[]>
): RequestFlow<Out, AdapterExecutionResult, RequestConfig> {
  this.resultHandler = resultHandler;  // Type mismatch!
  return this;
}
```

**Fix:**
```typescript
public withResultHandler(
  resultHandler: ResultHandler<Out | Out[]>
): RequestFlow<Out, AdapterExecutionResult, RequestConfig> {
  this.resultHandler = resultHandler;
  return this;
}
```

---

### 6. **RequestParams.mapper - Force Async**
**Location:** `src/core/models/RequestParams.ts:29`

**Issue:**
Mapper is forced to return `Promise<Out>` even for synchronous transformations.

**Current Code:**
```typescript
mapper?: (result: Result) => Promise<Out>;
```

**Fix:**
```typescript
mapper?: (result: Result) => Out | Promise<Out>;
```

Then update `RequestChain.executeAllRequests()` to handle both:
```typescript
if (requestEntity.mapper) {
  const mappedResult = requestEntity.mapper(
    requestResult as unknown as AdapterExecutionResult
  );
  result = mappedResult instanceof Promise 
    ? await mappedResult 
    : mappedResult;
}
```

---

### 7. **RequestAdapter.getResult() - Double Casting**
**Location:** `src/core/RequestAdapter.ts:11`

**Issue:**
Uses `as unknown as T` which bypasses type checking.

**Current Code:**
```typescript
public getResult<T>(result: ExecutionResult | unknown): T {
  return result as unknown as T;
}
```

**Fix Options:**

**Option A - More explicit (recommended):**
```typescript
public getResult<T extends ExecutionResult>(result: ExecutionResult): T {
  return result as T;
}
```

**Option B - With validation:**
```typescript
public getResult<T>(result: ExecutionResult | unknown): T {
  if (result === null || result === undefined) {
    throw new Error("Result is null or undefined");
  }
  return result as T;
}
```

---

## 🟢 Medium Priority (Code Quality)

### 8. **FetchRequestAdapter - Use of `any`**
**Location:** `src/core/adapters/FetchRequestAdapter.ts:12`

**Issue:**
Uses `any` type for `fetchConfig`.

**Current Code:**
```typescript
const fetchConfig: any = { ...rest };
```

**Fix:**
```typescript
const fetchConfig: RequestInit = { ...rest };
```

Also fix the `data` handling - `fetch` expects `body`, not `data`:
```typescript
public async createRequest(requestConfig: IRequestConfig): Promise<Response> {
  const { data, url, ...rest } = requestConfig;
  const fetchConfig: RequestInit = { ...rest };
  
  if (data) {
    fetchConfig.body = typeof data === 'string' ? data : JSON.stringify(data);
    fetchConfig.headers = {
      ...(fetchConfig.headers as Record<string, string>),
      'Content-Type': 'application/json',
    };
  }
  
  return fetch(url, fetchConfig);
}
```

---

### 9. **Type Guards - Improve Precision**
**Location:** `src/core/RequestChain.ts:222-252`

**Issue:**
Type guards could be more precise and handle edge cases better.

**Current Code:**
```typescript
function isPipelineRequestStage<...>(stage: ...): stage is ... {
  return "config" in stage;
}
```

**Fix:**
```typescript
function isPipelineRequestStage<
  Out,
  AdapterExecutionResult,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig
>(
  stage:
    | PipelineRequestStage<AdapterExecutionResult, Out, AdapterRequestConfig>
    | PipelineManagerStage<Out, AdapterExecutionResult, AdapterRequestConfig>
): stage is PipelineRequestStage<
  AdapterExecutionResult,
  Out,
  AdapterRequestConfig
> {
  return "config" in stage && !("request" in stage);
}

function isPipelineManagerStage<
  Out,
  AdapterExecutionResult,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig
>(
  stage:
    | PipelineRequestStage<AdapterExecutionResult, Out, AdapterRequestConfig>
    | PipelineManagerStage<Out, AdapterExecutionResult, AdapterRequestConfig>
): stage is PipelineManagerStage<
  Out,
  AdapterExecutionResult,
  AdapterRequestConfig
> {
  return "request" in stage && !("config" in stage);
}
```

---

### 10. **RequestChain.executeAllRequests() - Type Safety**
**Location:** `src/core/RequestChain.ts:132-171`

**Issue:**
- Uses `Out` generic but should use the actual result type from each stage
- Mutates `requestEntityList` by adding `result` property
- Type assertions are unsafe

**Improvements:**
```typescript
private executeAllRequests = async (
  requestEntityList: (
    | PipelineRequestStage<AdapterExecutionResult, any, AdapterRequestConfig>
    | PipelineManagerStage<any, AdapterExecutionResult, AdapterRequestConfig>
  )[]
): Promise<any[]> => {
  const results: any[] = [];
  let previousResult: any;
  
  for (let i = 0; i < requestEntityList.length; i++) {
    const requestEntity = requestEntityList[i];
    
    // Check precondition if present
    if (requestEntity.precondition && !requestEntity.precondition()) {
      continue;
    }
    
    const requestResult = await this.executeSingle(
      requestEntity,
      previousResult
    );
    
    let result = requestResult;
    if (requestEntity.mapper) {
      const mappedResult = requestEntity.mapper(
        isPipelineRequestStage(requestEntity)
          ? (requestResult as unknown as AdapterExecutionResult)
          : requestResult
      );
      result = mappedResult instanceof Promise 
        ? await mappedResult 
        : mappedResult;
    }
    
    // Store result on entity for potential future use
    (requestEntity as any).result = result;
    results.push(result);
    previousResult = result;
  }
  
  return results;
};
```

---

### 11. **RequestChain.executeSingle() - Improve Error Messages**
**Location:** `src/core/RequestChain.ts:173-197`

**Issue:**
Generic "Unknown type" error doesn't help debugging.

**Fix:**
```typescript
private executeSingle = async <Out>(
  requestEntity:
    | PipelineRequestStage<AdapterExecutionResult, Out, AdapterRequestConfig>
    | PipelineManagerStage<Out, AdapterExecutionResult, AdapterRequestConfig>,
  previousResult?: Out
): Promise<Out> => {
  if (isPipelineRequestStage(requestEntity)) {
    const { config } = requestEntity;
    const requestConfig: AdapterRequestConfig =
      typeof config === "function"
        ? (config(previousResult as AdapterExecutionResult) as AdapterRequestConfig)
        : (config as AdapterRequestConfig);
    const rawResult: AdapterExecutionResult =
      await this.adapter.executeRequest(requestConfig);
    return this.adapter.getResult(rawResult);
  } else if (isPipelineManagerStage(requestEntity)) {
    const { request } = requestEntity;
    const rawResult: Out = await request.execute();
    return this.adapter.getResult(rawResult);
  } else {
    throw new Error(
      `Unknown request entity type. Expected PipelineRequestStage or PipelineManagerStage, got: ${JSON.stringify(Object.keys(requestEntity))}`
    );
  }
};
```

---

## 🔵 Low Priority (Design Improvements)

### 12. **RequestManager.requestList - Type Safety**
**Location:** `src/core/RequestManager.ts:14`

**Issue:**
Uses `any` types, losing type information.

**Current Code:**
```typescript
protected requestList: (
  | PipelineRequestStage<any, any, any>
  | PipelineManagerStage<any, any, any>
)[] = [];
```

**Note:** This is a fundamental design limitation. The `Out` type changes as stages are added, but the array stores all stages. Consider:
- Using a tuple type that tracks the chain state
- Using a builder pattern
- Accepting the limitation but documenting it

**Partial Fix (better than `any`):**
```typescript
protected requestList: Array<
  | PipelineRequestStage<AdapterExecutionResult, Out, RequestConfig>
  | PipelineManagerStage<Out, AdapterExecutionResult, RequestConfig>
> = [];
```

This still loses precision but is better than `any`.

---

### 13. **RequestChain.addRequestEntity() - Unsafe Cast**
**Location:** `src/core/RequestChain.ts:124`

**Issue:**
Uses `as unknown as` cast due to mutable `Out` type.

**Current Code:**
```typescript
return this as unknown as RequestChain<
  NewOut,
  AdapterExecutionResult,
  AdapterRequestConfig,
  [...Types, NewOut]
>;
```

**Note:** This is necessary with the current design. Consider:
- Immutable chain pattern (returns new instance)
- Builder pattern
- Branded types for better type safety

---

### 14. **Export Missing Types**
**Location:** `src/index.ts`

**Issue:**
`IRequestResult` is used but not exported. Add to exports:
```typescript
export type { IRequestResult } from "./core/models/RequestParams";
```

---

### 15. **RequestChain.begin() - Default Adapter**
**Location:** `src/core/RequestChain.ts:17`

**Suggestion:** Consider making adapter optional and using `FetchRequestAdapter` as default:
```typescript
public static begin = <
  Out,
  AdapterExecutionResult = Response,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig
>(
  stage:
    | PipelineRequestStage<AdapterExecutionResult, Out, AdapterRequestConfig>
    | PipelineManagerStage<Out, AdapterExecutionResult, AdapterRequestConfig>,
  adapter?: RequestAdapter<AdapterExecutionResult, AdapterRequestConfig>
): RequestChain<Out, AdapterExecutionResult, AdapterRequestConfig, [Out]> => {
  const requestChain = new RequestChain<
    Out,
    AdapterExecutionResult,
    AdapterRequestConfig,
    []
  >();
  requestChain.setRequestAdapter(
    adapter ?? new FetchRequestAdapter() as RequestAdapter<AdapterExecutionResult, AdapterRequestConfig>
  );
  return requestChain.next(stage);
};
```

This would require importing `FetchRequestAdapter` and handling the type mismatch.

---

## 📋 Summary of Action Items

### Immediate (Critical)
1. ✅ Fix `setupTest.ts` linter errors
2. ✅ Fix `executeAll()` error handling bug
3. ✅ Add `IRequestResult` type definition

### High Priority
4. ✅ Add type annotation to `addAll()`
5. ✅ Fix `withResultHandler()` type signature
6. ✅ Make mapper support sync/async
7. ✅ Improve `getResult()` type safety

### Medium Priority
8. ✅ Fix `FetchRequestAdapter` types and data handling
9. ✅ Improve type guards
10. ✅ Improve error messages
11. ✅ Export `IRequestResult`

### Low Priority (Consider for Future)
12. ⚠️ Redesign `requestList` typing (architectural change)
13. ⚠️ Consider immutable chain pattern
14. ⚠️ Add default adapter support

---

## 🧪 Testing Recommendations

1. **Add tests for error scenarios:**
   - Test that `executeAll()` properly rejects on error
   - Test precondition skipping
   - Test mapper with sync/async functions

2. **Add type tests:**
   - Ensure type inference works correctly
   - Test generic constraints

3. **Add edge case tests:**
   - Empty chain
   - Chain with only preconditions
   - Nested chains with different adapters

---

## 📚 Documentation Improvements

1. **Add JSDoc comments** to public APIs
2. **Document type constraints** and limitations
3. **Add examples** for advanced use cases
4. **Document error handling** patterns

