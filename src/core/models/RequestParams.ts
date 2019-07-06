import RequestManager from "core/RequestManager";

type HttpMethods = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface IRequestConfig {
    url: string;
    method: HttpMethods;
    data?: any;
    [ key: string ]: any;
}

export interface IRequestConfigFactory<Result = any> {
    (previousResult: Result): IRequestConfig;
}

export interface IBaseRequestEntity<Result = any> {
    precondition?: () => boolean;
    result?: Result;
    mapper?: (result: IRequestResult) => Result;
}

export interface IRequestEntity<Result = any> extends IBaseRequestEntity<Result> {
    config: IRequestConfig|IRequestConfigFactory;
}

export interface IRequestManagerEntity<Result = any> extends IBaseRequestEntity<Result> {
    request: RequestManager;
}

export interface IRequestResult {

}