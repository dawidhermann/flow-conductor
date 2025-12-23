import RequestAdapter from "./RequestAdapter";
import { IRequestResult, PipelineManagerStage, PipelineRequestStage } from "./models/RequestParams";
import { ErrorHandler, ResultHandler } from "./models/Handlers";
export default abstract class RequestFlow {
    protected requestList: (PipelineRequestStage<IRequestResult> | PipelineManagerStage<IRequestResult>)[];
    protected errorHandler: ErrorHandler;
    protected resultHandler: ResultHandler;
    protected finishHandler: VoidFunction;
    protected adapter: RequestAdapter;
    abstract execute(): Promise<IRequestResult>;
    setRequestAdapter(adapter: RequestAdapter): RequestFlow;
    addAll(requestList?: never[]): RequestFlow;
    withErrorHandler(errorHandler: ErrorHandler): RequestFlow;
    withResultHandler(resultHandler: ResultHandler): RequestFlow;
    withFinishHandler(finishHandler: VoidFunction): RequestFlow;
}
