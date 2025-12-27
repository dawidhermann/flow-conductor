import RequestAdapter from "../RequestAdapter";
import { IRequestConfig } from "../models/RequestParams";

export type FetchRequestConfig = IRequestConfig;

export default class FetchRequestAdapter extends RequestAdapter<
  Response,
  FetchRequestConfig
> {
  public createRequest(requestConfig: IRequestConfig): Promise<Response> {
    const { data, url, ...rest } = requestConfig;
    const fetchConfig: any = { ...rest };
    if (data) {
      fetchConfig.data = JSON.stringify(data);
    }
    return fetch(url, fetchConfig);
  }
}
