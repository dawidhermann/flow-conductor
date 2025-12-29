/**
 * @packageDocumentation
 * @module request-orchestrator
 *
 * Request-Orchestrator
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
} from "@request-orchestrator/core";
export { default } from "@request-orchestrator/core";

// Re-export types from core package
export type {
  IRequestConfig,
  IRequestConfigFactory,
  PipelineRequestStage,
  PipelineManagerStage,
  BasePipelineStage,
  ErrorHandler,
  ResultHandler,
} from "@request-orchestrator/core";
