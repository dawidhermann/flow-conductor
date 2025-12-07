import type RequestManager from "core/RequestManager";

type HttpMethods = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface IRequestConfig {
  url: string;
  method: HttpMethods;
  data?: any;
  [key: string]: any;
}

export interface IRequestConfigFactory<Result> {
  (previousResult: Result): IRequestConfig;
}

export interface IBaseRequestEntity<Result> {
  precondition?: () => boolean;
  result?: Result;
  mapper?: (result: IRequestResult) => Result;
}

export interface IRequestEntity<Result> extends IBaseRequestEntity<Result> {
  config: IRequestConfig | IRequestConfigFactory<Result>;
}

export interface IRequestManagerEntity<Result>
  extends IBaseRequestEntity<Result> {
  request: RequestManager;
}

export type IRequestResult = {};
