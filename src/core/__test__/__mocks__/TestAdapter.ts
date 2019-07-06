import RequestAdapter from "../../RequestAdapter";
import { IRequestConfig } from "../../models/RequestParams";

export default class TestAdapter extends RequestAdapter {
    public createRequest (requestConfig: IRequestConfig): Promise<any> {
        const { data, url, ...rest } = requestConfig;
        const fetchConfig: any = { ...rest };
        if (data) {
            fetchConfig.data = JSON.stringify(data);
        }
        return fetch(url, { ...fetchConfig, testParam: 'test' });
    }

    public getResult (result: any): any {
        result.customParam = "testParam";
        return result;
    }

}