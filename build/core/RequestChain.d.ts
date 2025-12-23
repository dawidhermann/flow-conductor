import RequestFlow from "./RequestManager";
import { IRequestResult, PipelineRequestStage } from "./models/RequestParams";
export default class RequestChain extends RequestFlow {
    static begin: <T extends PipelineRequestStage<IRequestResult>>(requestEntity: T) => RequestChain;
    next: <T extends PipelineRequestStage<IRequestResult>>(requestEntity: T) => RequestChain;
    execute(): Promise<IRequestResult>;
    executeAll(): Promise<IRequestResult[]>;
    private addRequestEntity;
    private executeAllRequests;
    private executeSingle;
}
export declare function begin<T extends PipelineRequestStage<IRequestResult>>(requestEntity: T): RequestChain;
