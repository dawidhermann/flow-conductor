import RequestAdapter from "../../core/RequestAdapter";
export default class FetchRequestAdapter extends RequestAdapter {
    createRequest(requestConfig) {
        const { data, url, ...rest } = requestConfig;
        const fetchConfig = { ...rest };
        if (data) {
            fetchConfig.data = JSON.stringify(data);
        }
        return fetch(url, fetchConfig);
    }
}
//# sourceMappingURL=FetchRequestAdapter.js.map