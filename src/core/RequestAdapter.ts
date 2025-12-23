import { IRequestConfig } from "./models/RequestParams";

export default abstract class RequestAdapter {
  public abstract createRequest(requestConfig: IRequestConfig): Promise<any>;

  public getResult(result: any): any {
    return result;
  }

  public executeRequest(requestConfig: IRequestConfig): Promise<any> {
    return this.createRequest(requestConfig);
  }
}
