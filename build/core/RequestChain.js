import RequestFlow from "./RequestManager";
class RequestChain extends RequestFlow {
    constructor() {
        //  #region Public methods
        super(...arguments);
        this.next = (requestEntity) => {
            return this.addRequestEntity(requestEntity);
        };
        //  #endregion
        //  #region Private methods
        this.addRequestEntity = (requestEntity) => {
            this.requestList.push(requestEntity);
            return this;
        };
        this.executeAllRequests = async (requestEntityList) => {
            const results = [];
            for (let i = 0; i < requestEntityList.length; i++) {
                const requestEntity = requestEntityList[i];
                const previousEntity = requestEntityList[i - 1];
                const previousResult = previousEntity?.result;
                const requestResult = await this.executeSingle(requestEntity, previousResult);
                const result = requestEntity.mapper
                    ? requestEntity.mapper(requestResult)
                    : requestResult;
                requestEntityList[i].result = result;
                results.push(result);
            }
            return results;
        };
        this.executeSingle = async (requestEntity, previousResult) => {
            if (isPipelineRequestStage(requestEntity)) {
                const { config } = requestEntity;
                const requestConfig = typeof config === "function" ? config(previousResult) : config;
                const rawResult = await this.adapter.executeRequest(requestConfig);
                return this.adapter.getResult(rawResult);
            }
            else if (isPipelineManagerStage(requestEntity)) {
                const { request } = requestEntity;
                const rawResult = await request.execute();
                return this.adapter.getResult(rawResult);
            }
            else {
                throw new Error("Unknown type");
            }
        };
        //  #endregion
    }
    async execute() {
        try {
            const results = await this.executeAllRequests(this.requestList);
            const result = await results[results.length - 1];
            if (this.resultHandler && result) {
                this.resultHandler(result);
            }
            return result;
        }
        catch (error) {
            if (this.errorHandler) {
                this.errorHandler(error);
                return Promise.reject(error);
            }
            else {
                throw error;
            }
        }
        finally {
            if (this.finishHandler) {
                this.finishHandler();
            }
        }
    }
    async executeAll() {
        try {
            const results = await this.executeAllRequests(this.requestList);
            let resultList = [];
            for (const pendingResult of results) {
                const res = await pendingResult;
                resultList.push(res);
            }
            if (this.resultHandler && results) {
                this.resultHandler(resultList);
            }
            return resultList;
        }
        catch (error) {
            if (this.errorHandler) {
                this.errorHandler(error);
                return Promise.resolve(error);
            }
            else {
                throw error;
            }
        }
        finally {
            if (this.finishHandler) {
                this.finishHandler();
            }
        }
    }
}
RequestChain.begin = (requestEntity) => {
    const requestChain = new RequestChain();
    return requestChain.next(requestEntity);
};
export default RequestChain;
export function begin(requestEntity) {
    const requestChain = new RequestChain();
    return requestChain.next(requestEntity);
}
function isPipelineRequestStage(requestEntity) {
    return "config" in requestEntity;
}
function isPipelineManagerStage(requestEntity) {
    return "request" in requestEntity;
}
//# sourceMappingURL=RequestChain.js.map