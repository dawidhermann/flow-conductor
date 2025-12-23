import RequestFlow from "./RequestManager";
import {
  IRequestResult,
  IRequestConfig,
  PipelineRequestStage,
  PipelineManagerStage,
} from "./models/RequestParams";

export default class RequestChain extends RequestFlow {
  //  #region Public methods

  public static begin = <T extends PipelineRequestStage<IRequestResult>>(
    requestEntity: T
  ): RequestChain => {
    const requestChain: RequestChain = new RequestChain();
    return requestChain.next(requestEntity);
  };

  public next = <T extends PipelineRequestStage<IRequestResult>>(
    requestEntity: T
  ): RequestChain => {
    return this.addRequestEntity(requestEntity);
  };

  public async execute(): Promise<IRequestResult> {
    try {
      const results: IRequestResult[] = await this.executeAllRequests(
        this.requestList
      );
      const result: IRequestResult = await results[results.length - 1];
      if (this.resultHandler && result) {
        this.resultHandler(result);
      }
      return result;
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler(error);
        return Promise.reject(error);
      } else {
        throw error;
      }
    } finally {
      if (this.finishHandler) {
        this.finishHandler();
      }
    }
  }

  public async executeAll(): Promise<IRequestResult[]> {
    try {
      const results: IRequestResult[] = await this.executeAllRequests(
        this.requestList
      );
      let resultList: IRequestResult[] = [];
      for (const pendingResult of results) {
        const res = await pendingResult;
        resultList.push(res);
      }
      if (this.resultHandler && results) {
        this.resultHandler(resultList);
      }
      return resultList;
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler(error);
        return Promise.resolve(error);
      } else {
        throw error;
      }
    } finally {
      if (this.finishHandler) {
        this.finishHandler();
      }
    }
  }

  //  #endregion

  //  #region Private methods

  private addRequestEntity = <T extends PipelineRequestStage<IRequestResult>>(
    requestEntity: T
  ): RequestChain => {
    this.requestList.push(requestEntity);
    return this;
  };

  private executeAllRequests = async (
    requestEntityList: (
      | PipelineRequestStage<IRequestResult>
      | PipelineManagerStage<IRequestResult>
    )[]
  ): Promise<IRequestResult[]> => {
    const results: IRequestResult[] = [];
    for (let i = 0; i < requestEntityList.length; i++) {
      const requestEntity:
        | PipelineRequestStage<IRequestResult>
        | PipelineManagerStage<IRequestResult> = requestEntityList[i];
      const previousEntity = requestEntityList[i - 1];
      const previousResult: IRequestResult | undefined = previousEntity?.result;
      const requestResult: IRequestResult = await this.executeSingle(
        requestEntity,
        previousResult
      );
      const result = requestEntity.mapper
        ? requestEntity.mapper(requestResult)
        : requestResult;
      requestEntityList[i].result = result;
      results.push(result);
    }
    return results;
  };

  private executeSingle = async (
    requestEntity:
      | PipelineRequestStage<IRequestResult>
      | PipelineManagerStage<IRequestResult>,
    previousResult?: any
  ): Promise<IRequestResult> => {
    if (isPipelineRequestStage(requestEntity)) {
      const { config } = requestEntity;
      const requestConfig: IRequestConfig =
        typeof config === "function" ? config(previousResult) : config;
      const rawResult: IRequestResult = await this.adapter.executeRequest(
        requestConfig
      );
      return this.adapter.getResult(rawResult);
    } else if (isPipelineManagerStage(requestEntity)) {
      const { request } = requestEntity;
      const rawResult: IRequestResult = await request.execute();
      return this.adapter.getResult(rawResult);
    } else {
      throw new Error("Unknown type");
    }
  };

  //  #endregion
}

export function begin<T extends PipelineRequestStage<IRequestResult>>(
  requestEntity: T
): RequestChain {
  const requestChain: RequestChain = new RequestChain();
  return requestChain.next(requestEntity);
}

function isPipelineRequestStage(
  requestEntity:
    | PipelineRequestStage<IRequestResult>
    | PipelineManagerStage<IRequestResult>
): requestEntity is PipelineRequestStage<IRequestResult> {
  return "config" in requestEntity;
}

function isPipelineManagerStage(
  requestEntity:
    | PipelineRequestStage<IRequestResult>
    | PipelineManagerStage<IRequestResult>
): requestEntity is PipelineManagerStage<IRequestResult> {
  return "request" in requestEntity;
}
