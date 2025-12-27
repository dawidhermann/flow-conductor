/**
 * @packageDocumentation
 * @module @flow-pipe/core
 * 
 * Flow-Pipe Core Package
 * 
 * A flexible request pipeline library for building sequential HTTP request chains
 * with support for conditional execution, result mapping, and error handling.
 */

// Main exports
export { default as RequestAdapter } from "./RequestAdapter";
export { default as RequestManager } from "./RequestManager";
export { default as RequestChain, begin } from "./RequestChain";
export { default } from "./RequestChain";

// Types
export type {
  IRequestConfig,
  IRequestConfigFactory,
  PipelineRequestStage,
  PipelineManagerStage,
  BasePipelineStage,
  RetryConfig,
} from "./models/RequestParams";

export type { ErrorHandler, ResultHandler } from "./models/Handlers";

// Security utilities
export { validateUrl, SSRFError } from "./utils/urlValidator";
export type { UrlValidationOptions } from "./utils/urlValidator";

// Retry utilities
export {
  getErrorStatus,
  isNetworkError,
  defaultRetryCondition,
  retryOnStatusCodes,
  retryOnNetworkOrStatusCodes,
} from "./utils/retryUtils";

