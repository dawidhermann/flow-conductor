import { IRequestResult } from "./RequestParams";

export interface ErrorHandler {
  (error: Error): void;
}

export interface ResultHandler {
  (result: IRequestResult): void;
}
