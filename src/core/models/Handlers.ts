export interface ErrorHandler {
  (error: Error): void;
}

export interface ResultHandler {
  (result: any): void;
}
