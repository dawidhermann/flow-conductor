import RequestAdapter from "./RequestAdapter";
import RequestFlow from "./RequestManager";
import {
  IRequestConfig,
  PipelineRequestStage,
  PipelineManagerStage,
} from "./models/RequestParams";

export default class RequestChain<
  Out,
  AdapterExecutionResult = Out,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig
> extends RequestFlow<Out, AdapterExecutionResult, AdapterRequestConfig> {
  //  #region Public methods

  public static begin = <
    Out,
    AdapterExecutionResult,
    AdapterRequestConfig extends IRequestConfig = IRequestConfig
  >(
    stage: PipelineRequestStage<Out>,
    adapter: RequestAdapter<AdapterExecutionResult, AdapterRequestConfig>
  ): RequestChain<Out, AdapterExecutionResult, AdapterRequestConfig> => {
    const requestChain: RequestChain<
      Out,
      AdapterExecutionResult,
      AdapterRequestConfig
    > = new RequestChain<Out, AdapterExecutionResult, AdapterRequestConfig>();
    requestChain.setRequestAdapter(adapter);
    return requestChain.next(
      stage as unknown as
        | PipelineRequestStage<
            AdapterExecutionResult,
            Out,
            AdapterRequestConfig
          >
        | PipelineManagerStage<
            Out,
            AdapterExecutionResult,
            AdapterRequestConfig
          >
    );
  };

  public next = <NewOut>(
    stage:
      | PipelineRequestStage<
          AdapterExecutionResult,
          NewOut,
          AdapterRequestConfig
        >
      | PipelineManagerStage<
          NewOut,
          AdapterExecutionResult,
          AdapterRequestConfig
        >
  ): RequestChain<NewOut, AdapterExecutionResult, AdapterRequestConfig> => {
    return this.addRequestEntity(stage);
  };

  public execute = async (): Promise<Out> => {
    try {
      const results: Out[] = await this.executeAllRequests(this.requestList);
      const result: Out = results[results.length - 1];
      if (this.resultHandler && result) {
        this.resultHandler(result);
      }
      return result as Out;
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
  };

  public async executeAll<Middle extends unknown[]>(): Promise<
    [...Middle, Out]
  > {
    try {
      const results: Array<Out | Middle> = await this.executeAllRequests(
        this.requestList
      );
      const resultList: [...Middle, Out][] = [];
      for (const pendingResult of results) {
        resultList.push(pendingResult as [...Middle, Out]);
      }
      if (this.resultHandler && results) {
        this.resultHandler(resultList);
      }
      return resultList as [...Middle, Out];
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

  private addRequestEntity = <NewOut>(
    stage:
      | PipelineRequestStage<
          AdapterExecutionResult,
          NewOut,
          AdapterRequestConfig
        >
      | PipelineManagerStage<
          NewOut,
          AdapterExecutionResult,
          AdapterRequestConfig
        >
  ): RequestChain<NewOut, AdapterExecutionResult, AdapterRequestConfig> => {
    this.requestList.push(stage);
    return this as unknown as RequestChain<
      NewOut,
      AdapterExecutionResult,
      AdapterRequestConfig
    >;
  };

  private executeAllRequests = async <Out>(
    requestEntityList: (
      | PipelineRequestStage<AdapterExecutionResult, Out, AdapterRequestConfig>
      | PipelineManagerStage<Out, AdapterExecutionResult, AdapterRequestConfig>
    )[]
  ): Promise<Out[]> => {
    const results: Out[] = [];
    for (let i = 0; i < requestEntityList.length; i++) {
      const requestEntity:
        | PipelineRequestStage<
            AdapterExecutionResult,
            Out,
            AdapterRequestConfig
          >
        | PipelineManagerStage<
            Out,
            AdapterExecutionResult,
            AdapterRequestConfig
          > = requestEntityList[i];
      const previousEntity = requestEntityList[i - 1];
      const previousResult: Out | undefined = previousEntity?.result;
      const requestResult: Out = await this.executeSingle<Out>(
        requestEntity,
        previousResult
      );
      const result: Out = requestEntity.mapper
        ? await requestEntity.mapper(requestResult as any)
        : requestResult;
      requestEntityList[i].result = result as Out;
      results.push(result);
    }
    return results;
  };

  private executeSingle = async <Out>(
    requestEntity:
      | PipelineRequestStage<AdapterExecutionResult, Out, AdapterRequestConfig>
      | PipelineManagerStage<Out, AdapterExecutionResult, AdapterRequestConfig>,
    previousResult?: Out
  ): Promise<Out> => {
    if (isPipelineRequestStage(requestEntity)) {
      const { config } = requestEntity;
      const requestConfig: IRequestConfig = // TODO fix type
        typeof config === "function"
          ? config(previousResult as AdapterExecutionResult)
          : config;
      const rawResult: AdapterExecutionResult =
        await this.adapter.executeRequest(
          requestConfig as AdapterRequestConfig
        );
      return this.adapter.getResult(rawResult);
    } else if (isPipelineManagerStage(requestEntity)) {
      const { request } = requestEntity;
      const rawResult: Out = await request.execute();
      return this.adapter.getResult(rawResult);
    } else {
      throw new Error("Unknown type");
    }
  };

  //  #endregion
}

export function begin<
  Out,
  AdapterExecutionResult,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig
>(
  stage:
    | PipelineRequestStage<Out, AdapterRequestConfig>
    | PipelineManagerStage<Out, AdapterExecutionResult, AdapterRequestConfig>,
  adapter: RequestAdapter<AdapterExecutionResult, AdapterRequestConfig>
): RequestChain<Out, AdapterExecutionResult, AdapterRequestConfig> {
  const requestChain: RequestChain<
    Out,
    AdapterExecutionResult,
    AdapterRequestConfig
  > = new RequestChain<Out, AdapterExecutionResult, AdapterRequestConfig>();
  requestChain.setRequestAdapter(adapter);
  return requestChain.next(stage as any);
}

function isPipelineRequestStage<
  Out,
  AdapterExecutionResult,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig
>(
  stage:
    | PipelineRequestStage<AdapterExecutionResult, Out, AdapterRequestConfig>
    | PipelineManagerStage<Out, AdapterExecutionResult, AdapterRequestConfig>
): stage is PipelineRequestStage<
  AdapterExecutionResult,
  Out,
  AdapterRequestConfig
> {
  return "config" in stage;
}

function isPipelineManagerStage<
  Out,
  AdapterExecutionResult,
  AdapterRequestConfig extends IRequestConfig = IRequestConfig
>(
  stage:
    | PipelineRequestStage<Out, AdapterRequestConfig>
    | PipelineManagerStage<Out, AdapterExecutionResult, AdapterRequestConfig>
): stage is PipelineManagerStage<
  Out,
  AdapterExecutionResult,
  AdapterRequestConfig
> {
  return "request" in stage;
}
