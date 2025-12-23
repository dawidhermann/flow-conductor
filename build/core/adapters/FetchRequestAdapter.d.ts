import RequestAdapter from "../../core/RequestAdapter";
import { IRequestConfig } from "core/models/RequestParams";
export default class FetchRequestAdapter extends RequestAdapter {
    createRequest(requestConfig: IRequestConfig): Promise<any>;
}
