/**
 * @packageDocumentation
 * @module flow-conductor
 *
 * Flow-Conductor
 *
 * A flexible request pipeline library for building sequential HTTP request chains
 * with support for conditional execution, result mapping, and error handling.
 *
 * This is the main entry point that re-exports all core functionality.
 */

// Re-export from core package
export {
  RequestChain,
  begin,
  RequestAdapter,
  RequestManager,
} from "@flow-conductor/core";
export { default } from "@flow-conductor/core";

// Re-export types from core package
export type {
  IRequestConfig,
  IRequestConfigFactory,
  PipelineRequestStage,
  PipelineManagerStage,
  BasePipelineStage,
  ErrorHandler,
  ResultHandler,
} from "@flow-conductor/core";
