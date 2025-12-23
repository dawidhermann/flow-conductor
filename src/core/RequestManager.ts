import RequestAdapter from "./RequestAdapter";
import FetchRequestAdapter from "./adapters/FetchRequestAdapter";
import {
  IRequestResult,
  PipelineManagerStage,
  PipelineRequestStage,
} from "./models/RequestParams";
import { ErrorHandler, ResultHandler } from "./models/Handlers";

export default abstract class RequestFlow {
  protected requestList: (
    | PipelineRequestStage<IRequestResult>
    | PipelineManagerStage<IRequestResult>
  )[] = [];
  protected errorHandler: ErrorHandler;
  protected resultHandler: ResultHandler;
  protected finishHandler: VoidFunction;
  protected adapter: RequestAdapter = new FetchRequestAdapter();

  public abstract execute(): Promise<IRequestResult>;

  public setRequestAdapter(adapter: RequestAdapter): RequestFlow {
    this.adapter = adapter;
    return this;
  }

  public addAll(requestList = []): RequestFlow {
    this.requestList = this.requestList.concat(requestList);
    return this;
  }

  public withErrorHandler(errorHandler: ErrorHandler): RequestFlow {
    this.errorHandler = errorHandler;
    return this;
  }

  public withResultHandler(resultHandler: ResultHandler): RequestFlow {
    this.resultHandler = resultHandler;
    return this;
  }

  public withFinishHandler(finishHandler: VoidFunction): RequestFlow {
    this.finishHandler = finishHandler;
    return this;
  }
}
