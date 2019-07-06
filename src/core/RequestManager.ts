import RequestAdapter from "./RequestAdapter";
import FetchRequestAdapter from "./adapters/FetchRequestAdapter";
import { IRequestResult, IBaseRequestEntity } from "./models/RequestParams";
import { IErrorHandler, IResultHandler } from "./models/Handlers";

export default abstract class RequestManager {

    protected requestList: IBaseRequestEntity[] = [];
    protected errorHandler: IErrorHandler;
    protected resultHandler: IResultHandler;
    protected finishHandler: VoidFunction;
    protected adapter: RequestAdapter = new FetchRequestAdapter();

    public abstract execute (): Promise<IRequestResult>;

    public setRequestAdapter (adapter: RequestAdapter): RequestManager {
        this.adapter = adapter;
        return this;
    }

    public addAll (requestList = []): RequestManager {
        this.requestList = this.requestList.concat(requestList);
        return this;
    }

    public withErrorHandler(errorHandler: IErrorHandler): RequestManager {
        this.errorHandler = errorHandler;
        return this;
    }

    public withResultHandler(resultHandler: IResultHandler): RequestManager {
        this.resultHandler = resultHandler;
        return this;
    }

    public withFinishHandler(finishHandler: VoidFunction): RequestManager {
        this.finishHandler = finishHandler;
        return this;
    }

}