import type RequestFlow from "../RequestManager";

/**
 * Supported HTTP methods for requests
 */
type HttpMethods =
  | "GET"
  | "POST"
  | "PATCH"
  | "PUT"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "CONNECT"
  | "TRACE";

/**
 * Base interface for HTTP request configuration.
 * Extend this interface to add adapter-specific configuration options.
 *
 * @example
 * ```typescript
 * interface MyRequestConfig extends IRequestConfig {
 *   timeout?: number;
 *   retries?: number;
 * }
 * ```
 */
export interface IRequestConfig {
  /** The URL to make the request to */
  url: string;
  /** The HTTP method to use */
  method: HttpMethods;
  /** Optional request body data */
  data?: any;
  /** Additional adapter-specific configuration options */
  [key: string]: any;
}

/**
 * Factory function type for creating request configurations dynamically based on previous results.
 *
 * @template Result - The type of the previous result
 * @template AdapterRequestConfig - The type of request configuration to create
 * @param previousResult - The result from the previous pipeline stage (optional)
 * @returns The request configuration object
 */
export type IRequestConfigFactory<
  Result,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig,
> = (previousResult?: Result) => AdapterRequestConfig;

/**
 * Base interface for pipeline stages.
 * Defines common properties shared by all pipeline stage types.
 *
 * @template Result - The type of result from the stage
 * @template Out - The output type after mapping (defaults to Result)
 */
export interface BasePipelineStage<Result, Out = Result> {
  /**
   * Optional precondition function. If provided and returns false, the stage will be skipped.
   */
  precondition?: () => boolean;
  /**
   * The result produced by this stage (set after execution)
   */
  result?: Out;
  /**
   * Optional mapper function to transform the stage result.
   * Can return a value or a promise.
   */
  mapper?: (result: Result) => Out | Promise<Out>;
}

/**
 * Pipeline stage that executes an HTTP request using the adapter.
 *
 * @template Result - The type of result from the adapter
 * @template Out - The output type after mapping (defaults to Result)
 * @template AdapterRequestConfig - The type of request configuration
 */
export interface PipelineRequestStage<
  Result,
  Out = Result,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig,
> extends BasePipelineStage<Result, Out> {
  /**
   * Request configuration. Can be a static config object or a factory function
   * that creates the config based on previous results.
   */
  config:
    | AdapterRequestConfig
    | IRequestConfigFactory<Result, AdapterRequestConfig>;
}

/**
 * Pipeline stage that executes a nested request flow/chain.
 *
 * @template Out - The output type of the nested request flow
 * @template AdapterExecutionResult - The type of result returned by the adapter
 * @template AdapterRequestConfig - The type of request configuration
 */
export interface PipelineManagerStage<
  Out,
  AdapterExecutionResult,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig,
> extends BasePipelineStage<Out> {
  /**
   * The nested request flow to execute
   */
  request: RequestFlow<Out, AdapterExecutionResult, AdapterRequestConfig>;
}
