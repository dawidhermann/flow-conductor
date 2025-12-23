// Fetch mock utility to replace jest-fetch-mock for Node.js test runner
class FetchMock {
    constructor() {
        this.responses = [];
        this.errors = [];
        this.calls = [];
    }
    mockResponseOnce(response) {
        this.responses.push(response);
        return this;
    }
    once(response) {
        return this.mockResponseOnce(response);
    }
    mockReject(error) {
        this.errors.push(error);
        return this;
    }
    reset() {
        this.responses = [];
        this.errors = [];
        this.calls = [];
    }
    getCalls() {
        return this.calls;
    }
    toBeCalledWith(url, options) {
        return this.calls.some((call) => {
            const callUrl = typeof call.url === "string" ? call.url : call.url.toString();
            const expectedUrl = typeof url === "string" ? url : url.toString();
            if (callUrl !== expectedUrl) {
                return false;
            }
            if (options) {
                return JSON.stringify(call.options) === JSON.stringify(options);
            }
            return true;
        });
    }
    async fetch(url, options) {
        this.calls.push({ url, options });
        if (this.errors.length > 0) {
            const error = this.errors.shift();
            throw error;
        }
        if (this.responses.length > 0) {
            const response = this.responses.shift();
            if (typeof response === "string") {
                // Return a plain object with body property (similar to jest-fetch-mock behavior)
                // This matches what the tests expect: result.body to be a string
                return Promise.resolve({
                    body: response,
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    headers: new Headers({ "Content-Type": "application/json" }),
                    json: () => Promise.resolve(JSON.parse(response)),
                    text: () => Promise.resolve(response),
                });
            }
            return Promise.resolve(response);
        }
        // Default response if no mock is set
        return Promise.resolve({
            body: "{}",
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "Content-Type": "application/json" }),
            json: () => Promise.resolve({}),
            text: () => Promise.resolve("{}"),
        });
    }
}
// Create singleton instance
const fetchMock = new FetchMock();
// Export the mock fetch function
export const mockFetch = fetchMock.fetch.bind(fetchMock);
// Export utility methods
export const resetFetchMock = () => fetchMock.reset();
export const getFetchCalls = () => fetchMock.getCalls();
export const fetchMockToBeCalledWith = (url, options) => fetchMock.toBeCalledWith(url, options);
// Export the mock instance for chaining
export default fetchMock;
//# sourceMappingURL=fetchMock.js.map