/**
 * Handler function for processing errors that occur during request execution.
 *
 * @param error - The error that occurred
 */
export interface ErrorHandler {
  (error: Error): void;
}

/**
 * Handler function for processing successful request results.
 *
 * @template T - The type of result being handled
 * @param result - The result to process
 */
export interface ResultHandler<T = unknown> {
  (result: T): void;
}
