import RequestChain from "../RequestChain";
import { IRequestResult, IRequestEntity, IRequestManagerEntity } from "core/models/RequestParams";
import { IResultHandler } from "core/models/Handlers";
import RequestAdapter from "core/RequestAdapter";
import TestAdapter from "./__mocks__/TestAdapter";

const firstUser = { id: 1, name: 'John Smith' };
const secondUser = { id: 2, name: 'Bruce Wayne' };
const thirdUser = { id: 3, name: 'Tony Stark' };

describe('Request chain test', () => {

    test('Basic GET request', async () => {
        const response: string = JSON.stringify(firstUser);
        (fetch as any).mockResponseOnce(response);
        const result: any = await RequestChain
            .begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } }).execute();
        expect(result.body).toBe(response);
        expect(fetch).toBeCalledWith("http://example.com/users", {"method": "GET"});
    });

    test('Multiple GET requests', async () => {
        (fetch as any)
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const result: any = await RequestChain
            .begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .execute()
        expect(result.body).toBe(JSON.stringify(thirdUser));
        expect(fetch).toBeCalledWith("http://example.com/users", {"method": "GET"});
    });

    test('GET requests with mapper', async () => {
        (fetch as any)
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const result = await RequestChain
            .begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" }, mapper: (result: any) => JSON.parse(result.body).name })
            .execute()
        expect(result).toBe(thirdUser.name);
        expect(fetch).toBeCalledWith("http://example.com/users", {"method": "GET"});
    });

});

describe('Handlers test', () => {

    test("Finish handler test", () => {
        const response: string = JSON.stringify(firstUser);
        (fetch as any).mockResponseOnce(response);
        RequestChain
            .begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .withResultHandler((result: IRequestResult): void => {
                expect((result as any).body).toBe(response);
                expect(fetch).toBeCalledWith("http://example.com/users", {"method": "GET"});
            })
            .execute();
    });

    test("Error handler test", () => {
        (fetch as any).mockReject(new Error('fake error message'));
        RequestChain
            .begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .withErrorHandler((error: Error): void => {
                expect(error.message).toBe('fake error message');
            })
            .execute()
            .catch(error => {
                // Catch used only for tests
            });
    });

    test("Finish handler test", async () => {
        (fetch as any).mockReject(new Error('fake error message'));
        const finishHandler = jest.fn();
        await RequestChain
            .begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .withErrorHandler((error: Error): void => {
                expect(error.message).toBe('fake error message');
            })
            .withFinishHandler(finishHandler)
            .execute()
            .catch(error => {
                // Catch used only for tests
            });
            expect(finishHandler).toHaveBeenCalled();
    });

    test("Finish handler test with all handlers", async () => {
        (fetch as any).mockReject(new Error('fake error message'));
        const resultHandler = jest.fn();
        const errorHandler = jest.fn();
        const finishHandler = jest.fn();
        await RequestChain
            .begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .withResultHandler(resultHandler)
            .withErrorHandler(errorHandler)
            .withFinishHandler(finishHandler)
            .execute()
            .catch(error => {
                // Catch used only for tests
            });
        expect(resultHandler).not.toHaveBeenCalled();
        expect(errorHandler).toHaveBeenCalled();
        expect(finishHandler).toHaveBeenCalled();
    });

});


describe('Returning all requests', () => {

    test('Execute all', async () => {
        (fetch as any)
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const result: any[] = await RequestChain.begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" }, mapper: (result: any) => JSON.parse(result.body).name })
            .executeAll()
        expect(JSON.parse(result[0].body).name).toBe(firstUser.name);
        expect(JSON.parse(result[1].body).name).toBe(secondUser.name);
        expect((result[2] as string)).toBe(thirdUser.name);
        expect(fetch).toBeCalledWith("http://example.com/users", { "method": "GET" });
    });

    test('Execute all with result handler', async () => {
        const resultHandler: IResultHandler = (result: any): void => {
            expect(JSON.parse(result[0].body).name).toBe(firstUser.name);
            expect(JSON.parse(result[1].body).name).toBe(secondUser.name);
            expect((result[2] as string)).toBe(thirdUser.name);
        };
        (fetch as any)
            .once(JSON.stringify(firstUser))
            .once(JSON.stringify(secondUser))
            .once(JSON.stringify(thirdUser));
        const requestChain: RequestChain = RequestChain.begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" }, mapper: (result: any) => JSON.parse(result.body).name });
        requestChain.withResultHandler(resultHandler);
        requestChain.executeAll()
        expect(fetch).toBeCalledWith("http://example.com/users", { "method": "GET" });
    });

    test('Execute all with error handler', async () => {
        const resultHandler = jest.fn();
        (fetch as any)
            .once(JSON.stringify(firstUser))
            .mockReject(new Error("fake error message"))
            .once(JSON.stringify(thirdUser));
        const requestChain: RequestChain = RequestChain.begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" }, mapper: (result: any) => JSON.parse(result.body).name });
        requestChain
            .withResultHandler(resultHandler)
            .withErrorHandler((error: Error): void => {
                expect(error.message).toBe('fake error message');
            });
        await requestChain.executeAll();
        expect(resultHandler).not.toHaveBeenCalled();
        expect(fetch).toBeCalledWith("http://example.com/users", { "method": "GET" });
    });
});

describe('Nested request manager test', () => {

    test('Basic GET request', async () => {
        const response: string = JSON.stringify(firstUser);
        const secondResponse: string = JSON.stringify(secondUser);
        (fetch as any).mockResponseOnce(response).mockResponseOnce(secondResponse);
        const requestChain = RequestChain.begin<any>({ config: { url: 'http://example.com/users', method: "GET" } });
        const result: any = await RequestChain
            .begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .next<IRequestManagerEntity>({ request: requestChain })
            .execute();
        expect(result.body).toBe(secondResponse);
        expect(fetch).toBeCalledWith("http://example.com/users", {"method": "GET"});
    });
});

describe('Custom adapter test', () => {

    test('Basic GET request with custom adapter', async () => {
        const adapter: RequestAdapter = new TestAdapter();
        const response: string = JSON.stringify(firstUser);
        (fetch as any).mockResponseOnce(response);
        const result: any = await RequestChain
            .begin<IRequestEntity>({ config: { url: 'http://example.com/users', method: "GET" } })
            .setRequestAdapter(adapter)
            .execute();
        expect(result.body).toBe(response);
        expect(result.customParam).toBe("testParam");
        expect(fetch).toBeCalledWith("http://example.com/users", {"method": "GET", "testParam": "test"});
    });
});
// Add cases with custom adapters