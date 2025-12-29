import type RequestAdapter from "./request-adapter";
import type {
  PipelineManagerStage,
  PipelineRequestStage,
} from "./models/request-params";
import type { ErrorHandler, ResultHandler } from "./models/handlers";
import type { IRequestConfig } from "./models/request-params";

/**
 * Abstract base class for managing request pipelines and flows.
 * Provides functionality for chaining requests, error handling, and result processing.
 *
 * @template Out - The output type of the request flow
 * @template AdapterExecutionResult - The type of result returned by the adapter
 * @template RequestConfig - The type of request configuration, must extend IRequestConfig
 */
export default abstract class RequestFlow<
  Out,
  AdapterExecutionResult = Out,
  RequestConfig extends IRequestConfig = IRequestConfig,
> {
  /**
   * List of pipeline stages to execute
   */
  protected requestList: (
    | PipelineRequestStage<any, any, any>
    | PipelineManagerStage<any, any, any>
  )[] = [];
  /**
   * Optional error handler callback
   */
  protected errorHandler?: ErrorHandler;
  /**
   * Optional result handler callback
   */
  protected resultHandler?: ResultHandler<Out | Out[]>;
  /**
   * Optional finish handler callback executed after completion
   */
  protected finishHandler?: VoidFunction;
  /**
   * The request adapter used to execute HTTP requests
   */
  protected adapter: RequestAdapter<AdapterExecutionResult, RequestConfig>;

  /**
   * Executes the request flow and returns the final result.
   * Must be implemented by concrete subclasses.
   *
   * @returns A promise that resolves to the output result
   */
  public abstract execute(): Promise<Out>;

  /**
   * Sets the request adapter to use for executing HTTP requests.
   *
   * @param adapter - The request adapter instance
   * @returns The current RequestFlow instance for method chaining
   */
  public setRequestAdapter(
    adapter: RequestAdapter<AdapterExecutionResult, RequestConfig>
  ): RequestFlow<Out, AdapterExecutionResult, RequestConfig> {
    this.adapter = adapter;
    return this;
  }

  /**
   * Adds multiple pipeline stages to the request list.
   *
   * @param requestList - Array of pipeline stages to add
   * @returns The current RequestFlow instance for method chaining
   */
  public addAll(
    requestList: Array<
      | PipelineRequestStage<AdapterExecutionResult, Out, RequestConfig>
      | PipelineManagerStage<Out, AdapterExecutionResult, RequestConfig>
    > = []
  ): RequestFlow<Out, AdapterExecutionResult, RequestConfig> {
    this.requestList = this.requestList.concat(requestList);
    return this;
  }

  /**
   * Sets an error handler callback that will be called when an error occurs during execution.
   *
   * @param errorHandler - Function to handle errors
   * @returns The current RequestFlow instance for method chaining
   */
  public withErrorHandler(
    errorHandler: ErrorHandler
  ): RequestFlow<Out, AdapterExecutionResult, RequestConfig> {
    this.errorHandler = errorHandler;
    return this;
  }

  /**
   * Sets a result handler callback that will be called with the execution result.
   *
   * @param resultHandler - Function to handle results
   * @returns The current RequestFlow instance for method chaining
   */
  public withResultHandler(
    resultHandler: ResultHandler<Out | Out[]>
  ): RequestFlow<Out, AdapterExecutionResult, RequestConfig> {
    this.resultHandler = resultHandler;
    return this;
  }

  /**
   * Sets a finish handler callback that will be called after execution completes (success or failure).
   *
   * @param finishHandler - Function to execute on completion
   * @returns The current RequestFlow instance for method chaining
   */
  public withFinishHandler(
    finishHandler: VoidFunction
  ): RequestFlow<Out, AdapterExecutionResult, RequestConfig> {
    this.finishHandler = finishHandler;
    return this;
  }
}
