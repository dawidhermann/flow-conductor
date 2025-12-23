import type RequestFlow from "core/RequestManager";

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

export interface IRequestConfig {
  url: string;
  method: HttpMethods;
  data?: any;
  [key: string]: any;
}

export interface IRequestConfigFactory<Result> {
  (previousResult: Result): IRequestConfig;
}

export interface BasePipelineStage<Result> {
  precondition?: () => boolean;
  result?: Result;
  mapper?: (result: IRequestResult) => Result;
}

export interface PipelineRequestStage<Result>
  extends BasePipelineStage<Result> {
  config: IRequestConfig | IRequestConfigFactory<Result>;
}

export interface PipelineManagerStage<Result>
  extends BasePipelineStage<Result> {
  request: RequestFlow;
}

export type IRequestResult = {};
