import { describe, test } from "node:test";
import * as assert from "node:assert";
import RequestChain, { begin } from "../RequestChain";
import TestAdapter from "./__mocks__/TestAdapter";
import fetchMock, { resetFetchMock, fetchMockToBeCalledWith, } from "./__mocks__/fetchMock";
const firstUser = { id: 1, name: "John Smith" };
const secondUser = { id: 2, name: "Bruce Wayne" };
const thirdUser = { id: 3, name: "Tony Stark" };
// Mock function utility to replace jest.fn()
function createMockFn() {
    const calls = [];
    const fn = (...args) => {
        calls.push(args);
    };
    fn.calls = calls;
    fn.toHaveBeenCalled = () => calls.length > 0;
    fn.toHaveBeenCalledTimes = (n) => calls.length === n;
    return fn;
}
// Setup fetch mock globally
global.fetch = fetchMock.fetch.bind(fetchMock);
describe("Request chain test", () => {
    test("Basic GET request", async () => {
        resetFetchMock();
        const response = JSON.stringify(firstUser);
        fetchMock.mockResponseOnce(response);
        const result = await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        }).execute();
        assert.strictEqual(result.body, response);
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("Multiple GET requests", async () => {
        resetFetchMock();
        fetchMock
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const result = await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .execute();
        assert.strictEqual(result.body, JSON.stringify(thirdUser));
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("GET requests with mapper", async () => {
        resetFetchMock();
        fetchMock
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const result = await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
            mapper: (result) => JSON.parse(result.body).name,
        })
            .execute();
        assert.strictEqual(result, thirdUser.name);
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
});
describe("Handlers test", () => {
    test("Finish handler test", async () => {
        resetFetchMock();
        const response = JSON.stringify(firstUser);
        fetchMock.mockResponseOnce(response);
        await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .withResultHandler((result) => {
            assert.strictEqual(result.body, response);
            assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
        })
            .execute();
    });
    test("Error handler test", async () => {
        resetFetchMock();
        fetchMock.mockReject(new Error("fake error message"));
        await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .withErrorHandler((error) => {
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
        await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .withErrorHandler((error) => {
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
        await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
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
        const result = await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
            mapper: (result) => JSON.parse(result.body).name,
        })
            .executeAll();
        assert.strictEqual(JSON.parse(result[0].body).name, firstUser.name);
        assert.strictEqual(JSON.parse(result[1].body).name, secondUser.name);
        assert.strictEqual(result[2], thirdUser.name);
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("Execute all with result handler", async () => {
        resetFetchMock();
        const resultHandler = (result) => {
            assert.strictEqual(JSON.parse(result[0].body).name, firstUser.name);
            assert.strictEqual(JSON.parse(result[1].body).name, secondUser.name);
            assert.strictEqual(result[2], thirdUser.name);
        };
        fetchMock
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const requestChain = RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
            mapper: (result) => JSON.parse(result.body).name,
        });
        requestChain.withResultHandler(resultHandler);
        await requestChain.executeAll();
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("Execute all with error handler", async () => {
        resetFetchMock();
        const resultHandler = createMockFn();
        fetchMock
            .once(JSON.stringify(firstUser))
            .mockReject(new Error("fake error message"))
            .once(JSON.stringify(thirdUser));
        const requestChain = RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
            mapper: (result) => JSON.parse(result.body).name,
        });
        requestChain
            .withResultHandler(resultHandler)
            .withErrorHandler((error) => {
            assert.strictEqual(error.message, "fake error message");
        });
        await requestChain.executeAll();
        assert.ok(!resultHandler.toHaveBeenCalled());
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
});
describe("Nested request manager test", () => {
    test("Basic GET request", async () => {
        resetFetchMock();
        const response = JSON.stringify(firstUser);
        const secondResponse = JSON.stringify(secondUser);
        fetchMock.mockResponseOnce(response).mockResponseOnce(secondResponse);
        const requestChain = RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        });
        const result = await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({ request: requestChain })
            .execute();
        assert.strictEqual(result.body, secondResponse);
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
});
describe("Custom adapter test", () => {
    test("Basic GET request with custom adapter", async () => {
        resetFetchMock();
        const adapter = new TestAdapter();
        const response = JSON.stringify(firstUser);
        fetchMock.mockResponseOnce(response);
        const result = await RequestChain.begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .setRequestAdapter(adapter)
            .execute();
        assert.strictEqual(result.body, response);
        assert.strictEqual(result.customParam, "testParam");
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", {
            method: "GET",
            testParam: "test",
        }));
    });
});
describe("Exported begin function test", () => {
    test("Basic GET request", async () => {
        resetFetchMock();
        const response = JSON.stringify(firstUser);
        fetchMock.mockResponseOnce(response);
        const result = await begin({
            config: { url: "http://example.com/users", method: "GET" },
        }).execute();
        assert.strictEqual(result.body, response);
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("Multiple GET requests", async () => {
        resetFetchMock();
        fetchMock
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const result = await begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .execute();
        assert.strictEqual(result.body, JSON.stringify(thirdUser));
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("GET requests with mapper", async () => {
        resetFetchMock();
        fetchMock
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const result = await begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
            mapper: (result) => JSON.parse(result.body).name,
        })
            .execute();
        assert.strictEqual(result, thirdUser.name);
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("Result handler test", async () => {
        resetFetchMock();
        const response = JSON.stringify(firstUser);
        fetchMock.mockResponseOnce(response);
        await begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .withResultHandler((result) => {
            assert.strictEqual(result.body, response);
            assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
        })
            .execute();
    });
    test("Error handler test", async () => {
        resetFetchMock();
        fetchMock.mockReject(new Error("fake error message"));
        await begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .withErrorHandler((error) => {
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
        await begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .withErrorHandler((error) => {
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
        await begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
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
        const result = await begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
            mapper: (result) => JSON.parse(result.body).name,
        })
            .executeAll();
        assert.strictEqual(JSON.parse(result[0].body).name, firstUser.name);
        assert.strictEqual(JSON.parse(result[1].body).name, secondUser.name);
        assert.strictEqual(result[2], thirdUser.name);
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("Execute all with result handler", async () => {
        resetFetchMock();
        const resultHandler = (result) => {
            assert.strictEqual(JSON.parse(result[0].body).name, firstUser.name);
            assert.strictEqual(JSON.parse(result[1].body).name, secondUser.name);
            assert.strictEqual(result[2], thirdUser.name);
        };
        fetchMock
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const requestChain = begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
            mapper: (result) => JSON.parse(result.body).name,
        });
        requestChain.withResultHandler(resultHandler);
        await requestChain.executeAll();
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("Execute all with error handler", async () => {
        resetFetchMock();
        const resultHandler = createMockFn();
        fetchMock
            .once(JSON.stringify(firstUser))
            .mockReject(new Error("fake error message"))
            .once(JSON.stringify(thirdUser));
        const requestChain = begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({
            config: { url: "http://example.com/users", method: "GET" },
            mapper: (result) => JSON.parse(result.body).name,
        });
        requestChain
            .withResultHandler(resultHandler)
            .withErrorHandler((error) => {
            assert.strictEqual(error.message, "fake error message");
        });
        await requestChain.executeAll();
        assert.ok(!resultHandler.toHaveBeenCalled());
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("Nested request manager", async () => {
        resetFetchMock();
        const response = JSON.stringify(firstUser);
        const secondResponse = JSON.stringify(secondUser);
        fetchMock.mockResponseOnce(response).mockResponseOnce(secondResponse);
        const requestChain = begin({
            config: { url: "http://example.com/users", method: "GET" },
        });
        const result = await begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .next({ request: requestChain })
            .execute();
        assert.strictEqual(result.body, secondResponse);
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", { method: "GET" }));
    });
    test("Basic GET request with custom adapter", async () => {
        resetFetchMock();
        const adapter = new TestAdapter();
        const response = JSON.stringify(firstUser);
        fetchMock.mockResponseOnce(response);
        const result = await begin({
            config: { url: "http://example.com/users", method: "GET" },
        })
            .setRequestAdapter(adapter)
            .execute();
        assert.strictEqual(result.body, response);
        assert.strictEqual(result.customParam, "testParam");
        assert.ok(fetchMockToBeCalledWith("http://example.com/users", {
            method: "GET",
            testParam: "test",
        }));
    });
});
//# sourceMappingURL=RequestChain.test.js.map