type FetchMockResponse = string | Response;
type FetchMockError = Error;
interface FetchCall {
    url: string | URL | Request;
    options?: RequestInit;
}
declare class FetchMock {
    private responses;
    private errors;
    private calls;
    mockResponseOnce(response: FetchMockResponse): FetchMock;
    once(response: FetchMockResponse): FetchMock;
    mockReject(error: FetchMockError): FetchMock;
    reset(): void;
    getCalls(): FetchCall[];
    toBeCalledWith(url: string | URL | Request, options?: RequestInit): boolean;
    fetch(url: string | URL | Request, options?: RequestInit): Promise<any>;
}
declare const fetchMock: FetchMock;
export declare const mockFetch: any;
export declare const resetFetchMock: () => void;
export declare const getFetchCalls: () => FetchCall[];
export declare const fetchMockToBeCalledWith: (url: string | URL | Request, options?: RequestInit) => boolean;
export default fetchMock;
