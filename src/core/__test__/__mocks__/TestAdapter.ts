import RequestAdapter from "../../RequestAdapter";
import type { IRequestConfig } from "../../models/RequestParams";

export type TestResponse = Response & {
  customParam: string;
};

export default class TestAdapter extends RequestAdapter<
  TestResponse,
  IRequestConfig
> {
  public async createRequest(
    requestConfig: IRequestConfig
  ): Promise<TestResponse> {
    const { data, url, ...rest } = requestConfig;
    const fetchConfig: any = { ...rest };
    if (data) {
      fetchConfig.data = JSON.stringify(data);
    }
    const result = await fetch(url, { ...fetchConfig, testParam: "test" });
    return result as unknown as TestResponse;
  }

  public getResult<T>(result: TestResponse): T {
    (result as any).customParam = "testParam";
    return result as unknown as T;
  }
}
