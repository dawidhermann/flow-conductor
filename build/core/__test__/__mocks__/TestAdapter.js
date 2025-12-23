import RequestAdapter from "../../RequestAdapter";
export default class TestAdapter extends RequestAdapter {
    createRequest(requestConfig) {
        const { data, url, ...rest } = requestConfig;
        const fetchConfig = { ...rest };
        if (data) {
            fetchConfig.data = JSON.stringify(data);
        }
        return fetch(url, { ...fetchConfig, testParam: 'test' });
    }
    getResult(result) {
        result.customParam = "testParam";
        return result;
    }
}
//# sourceMappingURL=TestAdapter.js.map