# flow-pipe

A powerful TypeScript library for creating and managing request chains. Flow-pipe allows you to chain multiple HTTP requests together, transform results, and handle responses with ease.

## Features

- 🔗 **Chain Requests**: Link multiple HTTP requests in sequence
- 🔄 **Result Transformation**: Map and transform request results
- 📊 **Previous Result Access**: Each step can use the previous request's result
- 🎯 **Handler Support**: Result, error, and finish handlers
- 📦 **Batch Execution**: Execute all requests and get all results
- 🔌 **Custom Adapters**: Use custom request adapters
- 🎨 **Nested Chains**: Support for nested request managers

## Installation

```bash
npm install flow-pipe
```

## Basic Usage

### Simple GET Request

You can start a request chain using either `RequestChain.begin()` or the exported `begin()` function:

```typescript
import RequestChain, { begin } from 'flow-pipe';

// Using RequestChain.begin()
const result1 = await RequestChain.begin({
  config: { url: 'http://example.com/users', method: 'GET' }
}).execute();

// Using the begin() function (alternative syntax)
const result2 = await begin({
  config: { url: 'http://example.com/users', method: 'GET' }
}).execute();

console.log(result1.body); // Response body
console.log(result2.body); // Response body
```

### Multiple Chained Requests

Chain multiple requests together. Each request can use the result from the previous one:

```typescript
// Each step can access the previous result
const result = await RequestChain.begin({
  config: { url: 'http://example.com/users', method: 'GET' }
})
  .next({
    // Use previous result to build the next request
    config: (previousResult) => {
      const user = JSON.parse(previousResult.body);
      return { 
        url: `http://example.com/users/${user.id}/posts`, 
        method: 'GET' 
      };
    }
  })
  .next({
    // Each subsequent step receives the previous step's result
    config: (previousResult) => {
      const posts = JSON.parse(previousResult.body);
      return { 
        url: `http://example.com/posts/${posts[0].id}/comments`, 
        method: 'GET' 
      };
    }
  })
  .execute();

// Returns the result of the last request
console.log(result.body);
```

You can also use the exported `begin()` function for a more concise syntax:

```typescript
import { begin } from 'flow-pipe';

const result = await begin({
  config: { url: 'http://example.com/users', method: 'GET' }
})
  .next({
    config: (previousResult) => {
      const user = JSON.parse(previousResult.body);
      return { 
        url: `http://example.com/users/${user.id}/posts`, 
        method: 'GET' 
      };
    }
  })
  .execute();
```

### Using Previous Results

Each `.next()` call receives the result from the previous request, allowing you to build dynamic request chains:

```typescript
const result = await RequestChain.begin({
  config: { url: 'http://example.com/auth/login', method: 'POST', data: { username: 'user', password: 'pass' } }
})
  .next({
    // Second request uses the auth token from the first request
    config: (previousResult) => {
      const authData = JSON.parse(previousResult.body);
      return {
        url: 'http://example.com/api/user/profile',
        method: 'GET',
        headers: { Authorization: `Bearer ${authData.token}` }
      };
    }
  })
  .next({
    // Third request uses the user ID from the second request
    config: (previousResult) => {
      const profile = JSON.parse(previousResult.body);
      return {
        url: `http://example.com/api/users/${profile.id}/settings`,
        method: 'GET'
      };
    }
  })
  .execute();
```

### Transforming Results with Mappers

Transform request results using mapper functions. Mapped results are then available to subsequent requests:

```typescript
const result = await RequestChain.begin({
  config: { url: 'http://example.com/users', method: 'GET' }
})
  .next({
    config: { url: 'http://example.com/users', method: 'GET' },
    // Transform the result - this transformed value is passed to the next step
    mapper: (result) => JSON.parse(result.body).id
  })
  .next({
    // The previous result is now the transformed ID (number), not the full response
    config: (previousResult) => ({
      url: `http://example.com/users/${previousResult}/posts`,
      method: 'GET'
    })
  })
  .execute();

console.log(result.body);
```

## Handlers

### Result Handler

Handle successful results:

```typescript
await RequestChain.begin({
  config: { url: 'http://example.com/users', method: 'GET' }
})
  .withResultHandler((result) => {
    console.log('Request completed:', result.body);
  })
  .execute();
```

### Error Handler

Handle errors gracefully:

```typescript
await RequestChain.begin({
  config: { url: 'http://example.com/users', method: 'GET' }
})
  .withErrorHandler((error) => {
    console.error('Request failed:', error.message);
  })
  .execute()
  .catch(() => {
    // Handle promise rejection
  });
```

### Finish Handler

Execute code after request completion (success or failure):

```typescript
const finishHandler = () => {
  console.log('Request chain finished');
};

await RequestChain.begin({
  config: { url: 'http://example.com/users', method: 'GET' }
})
  .withErrorHandler((error) => {
    console.error('Error:', error.message);
  })
  .withFinishHandler(finishHandler)
  .execute()
  .catch(() => {
    // Handle promise rejection
  });
```

### Combining All Handlers

Use multiple handlers together:

```typescript
await RequestChain.begin({
  config: { url: 'http://example.com/users', method: 'GET' }
})
  .withResultHandler((result) => {
    console.log('Success:', result);
  })
  .withErrorHandler((error) => {
    console.error('Error:', error);
  })
  .withFinishHandler(() => {
    console.log('Finished');
  })
  .execute()
  .catch(() => {
    // Handle promise rejection
  });
```

## Executing All Requests

### Get All Results

Execute all requests and get all results as an array. Each step can use the previous result:

```typescript
const results = await RequestChain.begin({
  config: { url: 'http://example.com/users/1', method: 'GET' }
})
  .next({
    // Use previous result to build next request
    config: (previousResult) => {
      const user = JSON.parse(previousResult.body);
      return { 
        url: `http://example.com/users/${user.id}/posts`, 
        method: 'GET' 
      };
    }
  })
  .next({
    // Use previous result (posts) to get comments
    config: (previousResult) => {
      const posts = JSON.parse(previousResult.body);
      return { 
        url: `http://example.com/posts/${posts[0].id}/comments`, 
        method: 'GET' 
      };
    },
    mapper: (result) => JSON.parse(result.body).length // Transform to count
  })
  .executeAll();

console.log(results[0].body); // First request result (user)
console.log(results[1].body); // Second request result (posts)
console.log(results[2]);      // Third request result (transformed comment count)
```

### Execute All with Result Handler

Handle all results together. Each step builds on the previous one:

```typescript
const resultHandler = (results) => {
  console.log('All results:', results);
  results.forEach((result, index) => {
    console.log(`Request ${index + 1}:`, result);
  });
};

await RequestChain.begin({
  config: { url: 'http://example.com/users/1', method: 'GET' }
})
  .next({
    // Second request uses user ID from first request
    config: (previousResult) => {
      const user = JSON.parse(previousResult.body);
      return { 
        url: `http://example.com/users/${user.id}/posts`, 
        method: 'GET' 
      };
    }
  })
  .next({
    // Third request uses first post ID from second request
    config: (previousResult) => {
      const posts = JSON.parse(previousResult.body);
      return { 
        url: `http://example.com/posts/${posts[0].id}/comments`, 
        method: 'GET' 
      };
    },
    mapper: (result) => JSON.parse(result.body).name
  })
  .withResultHandler(resultHandler)
  .executeAll();
```

### Execute All with Error Handler

Handle errors when executing all requests. Each step depends on the previous:

```typescript
await RequestChain.begin({
  config: { url: 'http://example.com/users/1', method: 'GET' }
})
  .next({
    // Uses previous result
    config: (previousResult) => {
      const user = JSON.parse(previousResult.body);
      return { 
        url: `http://example.com/users/${user.id}/posts`, 
        method: 'GET' 
      };
    }
  })
  .next({
    // Uses previous result
    config: (previousResult) => {
      const posts = JSON.parse(previousResult.body);
      return { 
        url: `http://example.com/posts/${posts[0].id}`, 
        method: 'GET' 
      };
    }
  })
  .withResultHandler((results) => {
    console.log('Success:', results);
  })
  .withErrorHandler((error) => {
    console.error('Error occurred:', error.message);
  })
  .executeAll();
```

## Nested Request Managers

Chain request managers together. Nested chains can also use previous results:

```typescript
// Create a nested chain that uses the parent result
const nestedChain = RequestChain.begin({
  config: (previousResult) => {
    const user = JSON.parse(previousResult.body);
    return { 
      url: `http://example.com/users/${user.id}/posts`, 
      method: 'GET' 
    };
  }
});

const result = await RequestChain.begin({
  config: { url: 'http://example.com/users/1', method: 'GET' }
})
  .next({ request: nestedChain }) // Nested chain receives the previous result
  .execute();

console.log(result.body);
```

Alternatively, using the `begin()` function:

```typescript
import { begin } from 'flow-pipe';

const nestedChain = begin({
  config: { url: 'http://example.com/users', method: 'GET' }
});

const result = await begin({
  config: { url: 'http://example.com/users', method: 'GET' }
})
  .next({ request: nestedChain })
  .execute();
```

## Custom Adapters

Use custom request adapters to extend functionality:

```typescript
import RequestAdapter from 'flow-pipe/core/RequestAdapter';
import { IRequestConfig } from 'flow-pipe/core/models/RequestParams';

class CustomAdapter extends RequestAdapter {
  public async createRequest(requestConfig: IRequestConfig): Promise<any> {
    // Custom request logic
    const response = await fetch(requestConfig.url, {
      method: requestConfig.method,
      // Add custom parameters
      testParam: 'test'
    });
    return response;
  }

  public getResult(result: any): any {
    // Transform result
    return {
      ...result,
      customParam: 'testParam'
    };
  }
}

const adapter = new CustomAdapter();
const result = await RequestChain.begin({
  config: { url: 'http://example.com/users', method: 'GET' }
})
  .setRequestAdapter(adapter)
  .execute();

console.log(result.customParam); // 'testParam'
```

## API Reference

### RequestChain

#### Static Methods

- `RequestChain.begin<T extends PipelineRequestStage>(requestEntity: T): RequestChain` - Start a new request chain

#### Instance Methods

- `next<T extends PipelineRequestStage>(requestEntity: T): RequestChain` - Add the next request to the chain
- `execute(): Promise<Out>` - Execute the chain and return the last result
- `executeAll(): Promise<Types>` - Execute all requests and return all results as a tuple
- `setRequestAdapter(adapter: RequestAdapter): RequestManager` - Set a custom request adapter
- `withResultHandler(handler: IResultHandler): RequestManager` - Set result handler
- `withErrorHandler(handler: IErrorHandler): RequestManager` - Set error handler
- `withFinishHandler(handler: VoidFunction): RequestManager` - Set finish handler

### Exported Functions

- `begin<T extends PipelineRequestStage>(requestEntity: T): RequestChain` - Alternative function to start a request chain (same as `RequestChain.begin`)

### Types

#### IRequestConfig

```typescript
interface IRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';
  data?: any;
  [key: string]: any;
}
```

#### PipelineRequestStage

```typescript
interface PipelineRequestStage<Result, Out = Result> {
  config: IRequestConfig | IRequestConfigFactory<Result>;
  precondition?: () => boolean;
  mapper?: (result: Result) => Promise<Out>;
}
```

#### IRequestConfigFactory

The `config` property can be a function that receives the previous result:

```typescript
interface IRequestConfigFactory<Result> {
  (previousResult: Result): IRequestConfig;
}
```

This allows each step in the chain to dynamically build its request based on the previous step's result.

#### PipelineManagerStage

```typescript
interface PipelineManagerStage<Out> {
  request: RequestManager;
  precondition?: () => boolean;
  mapper?: (result: Out) => Promise<Out>;
}
```

## License

ISC

