import { IRequestResult } from "./RequestParams";


export interface IErrorHandler {
    (error: Error): void;
}

export interface IResultHandler {
    (result: IRequestResult): void;
}