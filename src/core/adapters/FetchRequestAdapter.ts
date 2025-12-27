import RequestAdapter from "../RequestAdapter";
import { IRequestConfig } from "../models/RequestParams";

export type FetchRequestConfig = IRequestConfig;

export default class FetchRequestAdapter extends RequestAdapter<
  Response,
  FetchRequestConfig
> {
  public createRequest(requestConfig: IRequestConfig): Promise<Response> {
    const { data, url, ...rest } = requestConfig;
    const fetchConfig: RequestInit = { ...rest };
    if (data) {
      fetchConfig.body = typeof data === "string" ? data : JSON.stringify(data);
      fetchConfig.headers = {
        ...(fetchConfig.headers as Record<string, string>),
        "Content-Type": "application/json",
      };
    }
    return fetch(url, fetchConfig);
  }
}
