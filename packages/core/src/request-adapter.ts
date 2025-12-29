import type { IRequestConfig } from "./models/request-params";
import { validateUrl, type UrlValidationOptions } from "./utils/url-validator";

/**
 * Abstract base class for request adapters that handle HTTP requests.
 * Provides URL validation and a common interface for different HTTP client implementations.
 *
 * @template ExecutionResult - The type of result returned by the adapter's HTTP client
 * @template RequestConfig - The type of request configuration, must extend IRequestConfig
 *
 * @example
 * ```typescript
 * class MyAdapter extends RequestAdapter<Response> {
 *   async createRequest(config: IRequestConfig): Promise<Response> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export default abstract class RequestAdapter<
  ExecutionResult,
  RequestConfig extends IRequestConfig = IRequestConfig,
> {
  /**
   * URL validation options used to prevent SSRF attacks
   */
  protected urlValidationOptions: UrlValidationOptions;

  /**
   * Creates a new RequestAdapter instance.
   *
   * @param urlValidationOptions - Options for URL validation to prevent SSRF attacks
   */
  constructor(urlValidationOptions: UrlValidationOptions = {}) {
    this.urlValidationOptions = urlValidationOptions;
  }

  /**
   * Creates and executes an HTTP request using the adapter's underlying HTTP client.
   * This method must be implemented by concrete adapter classes.
   *
   * @param requestConfig - The request configuration object
   * @returns A promise that resolves to the execution result
   */
  public abstract createRequest(
    requestConfig: RequestConfig
  ): Promise<ExecutionResult>;

  /**
   * Type-safe getter for the execution result.
   * Allows casting the result to a specific type.
   *
   * @template T - The desired result type
   * @param result - The execution result to cast
   * @returns The result cast to type T
   */
  public getResult<T extends ExecutionResult>(result: ExecutionResult): T {
    return result as T;
  }

  /**
   * Executes a request with URL validation.
   * Validates the URL to prevent SSRF attacks before creating the request.
   *
   * @param requestConfig - The request configuration object
   * @returns A promise that resolves to the execution result
   * @throws {SSRFError} If the URL is invalid or potentially dangerous
   */
  public executeRequest(
    requestConfig: RequestConfig
  ): Promise<ExecutionResult> {
    // Validate URL to prevent SSRF attacks
    validateUrl(requestConfig.url, this.urlValidationOptions);
    return this.createRequest(requestConfig);
  }
}
