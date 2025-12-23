import { IRequestConfig } from "./models/RequestParams";
export default abstract class RequestAdapter {
    abstract createRequest(requestConfig: IRequestConfig): Promise<any>;
    getResult(result: any): any;
    executeRequest(requestConfig: IRequestConfig): Promise<any>;
}
