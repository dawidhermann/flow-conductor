import type { IRequestConfig } from "./models/RequestParams";

export default abstract class RequestAdapter<
  ExecutionResult,
  RequestConfig extends IRequestConfig = IRequestConfig
> {
  public abstract createRequest(
    requestConfig: RequestConfig
  ): Promise<ExecutionResult>;

  public getResult<T>(result: ExecutionResult | unknown): T {
    return result as unknown as T;
  }

  public executeRequest(
    requestConfig: RequestConfig
  ): Promise<ExecutionResult> {
    return this.createRequest(requestConfig);
  }
}
