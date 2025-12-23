import RequestAdapter from "../../RequestAdapter";
import { IRequestConfig } from "../../models/RequestParams";
export default class TestAdapter extends RequestAdapter {
    createRequest(requestConfig: IRequestConfig): Promise<any>;
    getResult(result: any): any;
}
