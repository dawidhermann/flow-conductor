import { describe, test } from "node:test";
import * as assert from "node:assert";
import RequestChain, { begin } from "../RequestChain";
import type { ResultHandler } from "core/models/Handlers";
import type RequestAdapter from "core/RequestAdapter";
import fetchMock, {
  resetFetchMock,
  fetchMockToBeCalledWith,
} from "./__mocks__/fetchMock";
import type { FetchRequestConfig } from "core/adapters/FetchRequestAdapter";
import FetchRequestAdapter from "core/adapters/FetchRequestAdapter";
import TestAdapter from "./__mocks__/TestAdapter";

const firstUser = { id: 1, name: "John Smith" };
const secondUser = { id: 2, name: "Bruce Wayne" };
const thirdUser = { id: 3, name: "Tony Stark" };

// Extended request result type based on actual usage in tests
interface TestRequestResult<T> {
  body: string;
  customParam?: string;
  json: () => Promise<T>;
}

// Mock function utility to replace jest.fn()
interface MockFunction {
  (...args: unknown[]): void;
  calls: unknown[][];
  toHaveBeenCalled: () => boolean;
  toHaveBeenCalledTimes: (n: number) => boolean;
}

function createMockFn(): MockFunction {
  const calls: unknown[][] = [];
  const fn = (...args: unknown[]) => {
    calls.push(args);
  };
  (fn as MockFunction).calls = calls;
  (fn as MockFunction).toHaveBeenCalled = () => calls.length > 0;
  (fn as MockFunction).toHaveBeenCalledTimes = (n: number) =>
    calls.length === n;
  return fn as MockFunction;
}

// Setup fetch mock globally
(globalThis as { fetch?: typeof fetch }).fetch =
  fetchMock.fetch.bind(fetchMock);

describe("Request chain test", () => {
  test("Basic GET request", async () => {
    resetFetchMock();
    const response: string = JSON.stringify(firstUser);
    fetchMock.mockResponseOnce(response);
    const result = await RequestChain.begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    ).execute();
    const jsonResult = await result.json();
    assert.deepStrictEqual(jsonResult, firstUser);
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("Multiple GET requests", async () => {
    resetFetchMock();
    fetchMock
      .once(JSON.stringify(firstUser))
      .once(JSON.stringify(secondUser))
      .once(JSON.stringify(thirdUser));
    const result: TestRequestResult<typeof thirdUser> =
      await RequestChain.begin<
        TestRequestResult<typeof thirdUser>,
        Response,
        FetchRequestConfig
      >(
        {
          config: { url: "http://example.com/users", method: "GET" },
        },
        new FetchRequestAdapter()
      )
        .next<TestRequestResult<typeof secondUser>>({
          config: { url: "http://example.com/users", method: "GET" },
        })
        .next<TestRequestResult<typeof thirdUser>>({
          config: { url: "http://example.com/users", method: "GET" },
        })
        .execute();
    assert.strictEqual(result.body, JSON.stringify(thirdUser));
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("GET requests with mapper", async () => {
    resetFetchMock();
    fetchMock
      .once(JSON.stringify(firstUser))
      .once(JSON.stringify(secondUser))
      .once(JSON.stringify(thirdUser));
    const result = await RequestChain.begin<
      typeof firstUser,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<typeof firstUser>({
        config: { url: "http://example.com/users", method: "GET" },
        mapper: (result: Response) => JSON.parse(result.body as any),
      })
      .next<string>({
        config: { url: "http://example.com/users", method: "GET" },
        mapper: (result: Response) => JSON.parse(result.body as any).name,
      })
      .execute();
    assert.strictEqual(result, thirdUser.name);
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });
});

describe("Handlers test", () => {
  test("Finish handler test", async () => {
    resetFetchMock();
    const response: string = JSON.stringify(firstUser);
    fetchMock.mockResponseOnce(response);
    await RequestChain.begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .withResultHandler((result: unknown): void => {
        assert.strictEqual(
          (result as TestRequestResult<typeof firstUser>).body,
          response
        );
        assert.ok(
          fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
        );
      })
      .execute();
  });

  test("Error handler test", async () => {
    resetFetchMock();
    fetchMock.mockReject(new Error("fake error message"));
    await RequestChain.begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .withErrorHandler((error: Error): void => {
        assert.strictEqual(error.message, "fake error message");
      })
      .execute()
      .catch(() => {
        // Catch used only for tests
      });
  });

  test("Finish handler test", async () => {
    resetFetchMock();
    fetchMock.mockReject(new Error("fake error message"));
    const finishHandler = createMockFn();
    await RequestChain.begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .withErrorHandler((error: Error): void => {
        assert.strictEqual(error.message, "fake error message");
      })
      .withFinishHandler(finishHandler)
      .execute()
      .catch(() => {
        // Catch used only for tests
      });
    assert.ok(finishHandler.toHaveBeenCalled());
  });

  test("Finish handler test with all handlers", async () => {
    resetFetchMock();
    fetchMock.mockReject(new Error("fake error message"));
    const resultHandler = createMockFn();
    const errorHandler = createMockFn();
    const finishHandler = createMockFn();
    await RequestChain.begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .withResultHandler(resultHandler)
      .withErrorHandler(errorHandler)
      .withFinishHandler(finishHandler)
      .execute()
      .catch(() => {
        // Catch used only for tests
      });
    assert.ok(!resultHandler.toHaveBeenCalled());
    assert.ok(errorHandler.toHaveBeenCalled());
    assert.ok(finishHandler.toHaveBeenCalled());
  });
});

describe("Returning all requests", () => {
  test("Execute all", async () => {
    resetFetchMock();
    fetchMock
      .once(JSON.stringify(firstUser))
      .once(JSON.stringify(secondUser))
      .once(JSON.stringify(thirdUser));
    const result = await RequestChain.begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof secondUser>>({
        config: { url: "http://example.com/users", method: "GET" },
      })
      .next<string>({
        config: { url: "http://example.com/users", method: "GET" },
        mapper: (result: Response) => JSON.parse(result.body as any).name,
      })
      .executeAll();
    assert.strictEqual(JSON.parse(result[0].body).name, firstUser.name);
    assert.strictEqual(JSON.parse(result[1].body).name, secondUser.name);
    assert.strictEqual(result[2], thirdUser.name);
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("Execute all with result handler", async () => {
    resetFetchMock();
    const resultHandler: ResultHandler = (result: unknown): void => {
      const results = result as Array<
        TestRequestResult<typeof firstUser> | string
      >;
      assert.strictEqual(
        JSON.parse((results[0] as TestRequestResult<typeof firstUser>).body)
          .name,
        firstUser.name
      );
      assert.strictEqual(
        JSON.parse((results[1] as TestRequestResult<typeof secondUser>).body)
          .name,
        secondUser.name
      );
      assert.strictEqual(results[2] as string, thirdUser.name);
    };
    fetchMock
      .once(JSON.stringify(firstUser))
      .once(JSON.stringify(secondUser))
      .once(JSON.stringify(thirdUser));
    const requestChain = RequestChain.begin<
      string,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof firstUser>>({
        config: { url: "http://example.com/users", method: "GET" },
      })
      .next<string>({
        config: { url: "http://example.com/users", method: "GET" },
        mapper: (result: Response) => JSON.parse(result.body as any).name,
      });
    requestChain.withResultHandler(resultHandler);
    await requestChain.executeAll();
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("Execute all with error handler", async () => {
    resetFetchMock();
    const resultHandler = createMockFn();
    fetchMock
      .once(JSON.stringify(firstUser))
      .mockReject(new Error("fake error message"))
      .once(JSON.stringify(thirdUser));
    const requestChain = RequestChain.begin<
      string,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof firstUser>>({
        config: { url: "http://example.com/users", method: "GET" },
      })
      .next<string>({
        config: { url: "http://example.com/users", method: "GET" },
        mapper: (result: Response) => JSON.parse(result.body as any).name,
      });
    requestChain
      .withResultHandler(resultHandler)
      .withErrorHandler((error: Error): void => {
        assert.strictEqual(error.message, "fake error message");
      });
    await requestChain.executeAll();
    assert.ok(!resultHandler.toHaveBeenCalled());
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });
});

describe("Nested request manager test", () => {
  test("Basic GET request", async () => {
    resetFetchMock();
    const response: string = JSON.stringify(firstUser);
    const secondResponse: string = JSON.stringify(secondUser);
    fetchMock.mockResponseOnce(response).mockResponseOnce(secondResponse);
    const requestChain = RequestChain.begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    );
    const result = await RequestChain.begin<
      TestRequestResult<typeof secondUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof secondUser>>({ request: requestChain })
      .execute();
    assert.strictEqual(result.body, secondResponse);
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });
});

describe("Custom adapter test", () => {
  test("Basic GET request with custom adapter", async () => {
    resetFetchMock();
    const response: string = JSON.stringify(firstUser);
    fetchMock.mockResponseOnce(response);
    const result = await RequestChain.begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new TestAdapter()
    ).execute();
    assert.strictEqual(result.body, response);
    assert.strictEqual(result.customParam, "testParam");
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", {
        method: "GET",
        testParam: "test",
      } as RequestInit)
    );
  });
});

describe("Exported begin function test", () => {
  test("Basic GET request", async () => {
    resetFetchMock();
    const response: string = JSON.stringify(firstUser);
    fetchMock.mockResponseOnce(response);
    const result = (await begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    ).execute()) as TestRequestResult<typeof firstUser>;
    assert.strictEqual(result.body, response);
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("Multiple GET requests", async () => {
    resetFetchMock();
    fetchMock
      .once(JSON.stringify(firstUser))
      .once(JSON.stringify(secondUser))
      .once(JSON.stringify(thirdUser));
    const result = (await begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof firstUser>>({
        config: { url: "http://example.com/users", method: "GET" },
      })
      .next<TestRequestResult<typeof secondUser>>({
        config: { url: "http://example.com/users", method: "GET" },
      })
      .execute()) as TestRequestResult<typeof thirdUser>;
    assert.strictEqual(result.body, JSON.stringify(thirdUser));
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("GET requests with mapper", async () => {
    resetFetchMock();
    fetchMock
      .once(JSON.stringify(firstUser))
      .once(JSON.stringify(secondUser))
      .once(JSON.stringify(thirdUser));
    const result = await begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof firstUser>>({
        config: { url: "http://example.com/users", method: "GET" },
      })
      .next<TestRequestResult<typeof secondUser>>({
        config: { url: "http://example.com/users", method: "GET" },
        mapper: (result: Response) => JSON.parse(result.body as any).name,
      })
      .execute();
    assert.strictEqual(result, thirdUser.name);
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("Result handler test", async () => {
    resetFetchMock();
    const response: string = JSON.stringify(firstUser);
    fetchMock.mockResponseOnce(response);
    await begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .withResultHandler((result: unknown): void => {
        assert.strictEqual(
          (result as TestRequestResult<typeof firstUser>).body,
          response
        );
        assert.ok(
          fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
        );
      })
      .execute();
  });

  test("Error handler test", async () => {
    resetFetchMock();
    fetchMock.mockReject(new Error("fake error message"));
    await begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .withErrorHandler((error: Error): void => {
        assert.strictEqual(error.message, "fake error message");
      })
      .execute()
      .catch(() => {
        // Catch used only for tests
      });
  });

  test("Finish handler test", async () => {
    resetFetchMock();
    fetchMock.mockReject(new Error("fake error message"));
    const finishHandler = createMockFn();
    await begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .withErrorHandler((error: Error): void => {
        assert.strictEqual(error.message, "fake error message");
      })
      .withFinishHandler(finishHandler)
      .execute()
      .catch(() => {
        // Catch used only for tests
      });
    assert.ok(finishHandler.toHaveBeenCalled());
  });

  test("All handlers test", async () => {
    resetFetchMock();
    fetchMock.mockReject(new Error("fake error message"));
    const resultHandler = createMockFn();
    const errorHandler = createMockFn();
    const finishHandler = createMockFn();
    await begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .withResultHandler(resultHandler)
      .withErrorHandler(errorHandler)
      .withFinishHandler(finishHandler)
      .execute()
      .catch(() => {
        // Catch used only for tests
      });
    assert.ok(!resultHandler.toHaveBeenCalled());
    assert.ok(errorHandler.toHaveBeenCalled());
    assert.ok(finishHandler.toHaveBeenCalled());
  });

  test("Execute all", async () => {
    resetFetchMock();
    fetchMock
      .once(JSON.stringify(firstUser))
      .once(JSON.stringify(secondUser))
      .once(JSON.stringify(thirdUser));
    const result = (await begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof firstUser>>({
        config: { url: "http://example.com/users", method: "GET" },
      })
      .next<string>({
        config: { url: "http://example.com/users", method: "GET" },
        mapper: (result: Response) => JSON.parse(result.body as any).name,
      })
      .executeAll()) as Array<TestRequestResult<typeof firstUser> | string>;
    assert.strictEqual(
      JSON.parse((result[0] as TestRequestResult<typeof firstUser>).body).name,
      firstUser.name
    );
    assert.strictEqual(
      JSON.parse((result[1] as TestRequestResult<typeof secondUser>).body).name,
      secondUser.name
    );
    assert.strictEqual(result[2] as string, thirdUser.name);
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("Execute all with result handler", async () => {
    resetFetchMock();
    const resultHandler: ResultHandler = (result: unknown): void => {
      const results = result as Array<
        TestRequestResult<typeof firstUser> | string
      >;
      assert.strictEqual(
        JSON.parse((results[0] as TestRequestResult<typeof firstUser>).body)
          .name,
        firstUser.name
      );
      assert.strictEqual(
        JSON.parse((results[1] as TestRequestResult<typeof secondUser>).body)
          .name,
        secondUser.name
      );
      assert.strictEqual(results[2] as string, thirdUser.name);
    };
    fetchMock
      .once(JSON.stringify(firstUser))
      .once(JSON.stringify(secondUser))
      .once(JSON.stringify(thirdUser));
    const requestChain = begin<string, Response, FetchRequestConfig>(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof firstUser>>({
        config: { url: "http://example.com/users", method: "GET" },
      })
      .next<string>({
        config: { url: "http://example.com/users", method: "GET" },
        mapper: (result: Response) => JSON.parse(result.body as any).name,
      });
    requestChain.withResultHandler(resultHandler);
    await requestChain.executeAll();
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("Execute all with error handler", async () => {
    resetFetchMock();
    const resultHandler = createMockFn();
    fetchMock
      .once(JSON.stringify(firstUser))
      .mockReject(new Error("fake error message"))
      .once(JSON.stringify(thirdUser));
    const requestChain = begin<string, Response, FetchRequestConfig>(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof firstUser>>({
        config: { url: "http://example.com/users", method: "GET" },
      })
      .next<string>({
        config: { url: "http://example.com/users", method: "GET" },
        mapper: (result: Response) => JSON.parse(result.body as any).name,
      });
    requestChain
      .withResultHandler(resultHandler)
      .withErrorHandler((error: Error): void => {
        assert.strictEqual(error.message, "fake error message");
      });
    await requestChain.executeAll();
    assert.ok(!resultHandler.toHaveBeenCalled());
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("Nested request manager", async () => {
    resetFetchMock();
    const response: string = JSON.stringify(firstUser);
    const secondResponse: string = JSON.stringify(secondUser);
    fetchMock.mockResponseOnce(response).mockResponseOnce(secondResponse);
    const requestChain = begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    );
    const result = await begin<
      TestRequestResult<typeof secondUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new FetchRequestAdapter()
    )
      .next<TestRequestResult<typeof secondUser>>({ request: requestChain })
      .execute();
    assert.strictEqual(result.body, secondResponse);
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", { method: "GET" })
    );
  });

  test("Basic GET request with custom adapter", async () => {
    resetFetchMock();
    const adapter: RequestAdapter<Response, FetchRequestConfig> =
      new TestAdapter();
    const response: string = JSON.stringify(firstUser);
    fetchMock.mockResponseOnce(response);
    const result = await begin<
      TestRequestResult<typeof firstUser>,
      Response,
      FetchRequestConfig
    >(
      {
        config: { url: "http://example.com/users", method: "GET" },
      },
      new TestAdapter()
    )
      .setRequestAdapter(adapter)
      .execute();
    assert.strictEqual(result.body, response);
    assert.strictEqual(result.customParam, "testParam");
    assert.ok(
      fetchMockToBeCalledWith("http://example.com/users", {
        method: "GET",
        testParam: "test",
      } as RequestInit)
    );
  });
});
