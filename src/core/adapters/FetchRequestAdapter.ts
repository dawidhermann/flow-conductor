import RequestAdapter from "../../core/RequestAdapter";
import { IRequestConfig } from "core/models/RequestParams";

export default class FetchRequestAdapter extends RequestAdapter {

    public createRequest (requestConfig: IRequestConfig): Promise<any> {
        const { data, url, ...rest } = requestConfig;
        const fetchConfig: any = { ...rest };
        if (data) {
            fetchConfig.data = JSON.stringify(data);
        }
        return fetch(url, fetchConfig);
    }

}