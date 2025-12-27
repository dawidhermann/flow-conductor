import { RequestAdapter } from "@flow-pipe/core";
import type { IRequestConfig, UrlValidationOptions } from "@flow-pipe/core";
import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

/**
 * Extended request configuration type that combines IRequestConfig with Axios-specific options.
 * Allows using all Axios configuration options while maintaining compatibility with flow-pipe.
 */
export type AxiosRequestConfigType = IRequestConfig & Partial<AxiosRequestConfig>;

/**
 * Request adapter implementation using Axios as the underlying HTTP client.
 * Provides seamless integration between flow-pipe and Axios.
 *
 * @example
 * ```typescript
 * const adapter = new AxiosRequestAdapter();
 * const chain = begin(
 *   { config: { url: 'https://api.example.com/users', method: 'GET' } },
 *   adapter
 * );
 * ```
 */
export default class AxiosRequestAdapter extends RequestAdapter<
  AxiosResponse,
  AxiosRequestConfigType
> {
  /**
   * Creates a new AxiosRequestAdapter instance.
   *
   * @param urlValidationOptions - Optional URL validation options to prevent SSRF attacks
   */
  constructor(urlValidationOptions?: UrlValidationOptions) {
    super(urlValidationOptions);
  }

  /**
   * Creates and executes an HTTP request using Axios.
   * Converts flow-pipe request configuration to Axios format.
   *
   * @param requestConfig - The request configuration object
   * @returns A promise that resolves to an AxiosResponse
   */
  public async createRequest(
    requestConfig: AxiosRequestConfigType
  ): Promise<AxiosResponse> {
    const { url, method, data, ...rest } = requestConfig;
    
    const axiosConfig: AxiosRequestConfig = {
      url,
      method: method.toLowerCase() as AxiosRequestConfig["method"],
      data,
      ...rest,
    };

    return axios(axiosConfig);
  }
}

