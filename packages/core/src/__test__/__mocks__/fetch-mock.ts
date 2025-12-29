// Fetch mock utility to replace jest-fetch-mock for Node.js test runner

type FetchMockResponse = string | Response;
type FetchMockError = Error;

interface FetchCall {
  url: string | URL | Request;
  options?: RequestInit;
}

class FetchMock {
  private responses: FetchMockResponse[] = [];
  private errors: FetchMockError[] = [];
  private calls: FetchCall[] = [];

  public mockResponseOnce(response: FetchMockResponse): FetchMock {
    this.responses.push(response);
    return this;
  }

  public once(response: FetchMockResponse): FetchMock {
    return this.mockResponseOnce(response);
  }

  public mockReject(error: FetchMockError): FetchMock {
    this.errors.push(error);
    return this;
  }

  public reset(): void {
    this.responses = [];
    this.errors = [];
    this.calls = [];
  }

  public getCalls(): FetchCall[] {
    return this.calls;
  }

  public toBeCalledWith(
    url: string | URL | Request,
    options?: RequestInit
  ): boolean {
    return this.calls.some((call) => {
      const callUrl =
        typeof call.url === "string" ? call.url : call.url.toString();
      const expectedUrl = typeof url === "string" ? url : url.toString();
      if (callUrl !== expectedUrl) {
        return false;
      }
      if (options) {
        // Do partial matching - check if all expected options are present in the actual call
        const callOptions = call.options || {};
        const expectedOptions = options;

        // Check each property in expectedOptions
        for (const key in expectedOptions) {
          if (key in expectedOptions) {
            const expectedValue = (expectedOptions as Record<string, unknown>)[
              key
            ];
            const actualValue = (callOptions as Record<string, unknown>)[key];

            // For objects, do deep comparison
            if (typeof expectedValue === "object" && expectedValue !== null) {
              if (
                JSON.stringify(actualValue) !== JSON.stringify(expectedValue)
              ) {
                return false;
              }
            } else if (actualValue !== expectedValue) {
              return false;
            }
          }
        }
        return true;
      }
      return true;
    });
  }

  public async fetch(
    url: string | URL | Request,
    options?: RequestInit
  ): Promise<
    | Response
    | {
        body: string;
        ok: boolean;
        status: number;
        statusText: string;
        headers: Headers;
        json: () => Promise<unknown>;
        text: () => Promise<string>;
      }
  > {
    this.calls.push({ url, options });

    if (this.errors.length > 0) {
      const error = this.errors.shift();
      if (error) {
        throw error;
      }
    }

    if (this.responses.length > 0) {
      const response = this.responses.shift();
      if (!response) {
        throw new Error("No response available");
      }
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
export const fetchMockToBeCalledWith = (
  url: string | URL | Request,
  options?: RequestInit
) => fetchMock.toBeCalledWith(url, options);

// Export the mock instance for chaining
export default fetchMock;
