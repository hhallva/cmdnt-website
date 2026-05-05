import type { HttpClient } from './httpClient';

export abstract class BaseApiService {
    protected readonly http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    protected get<T>(url: string): Promise<T> {
        return this.http.requestWithAuth<T>(url);
    }

    protected post<TResponse, TPayload = unknown>(url: string, payload?: TPayload): Promise<TResponse> {
        return this.http.requestWithAuth<TResponse>(url, {
            method: 'POST',
            body: payload === undefined ? undefined : JSON.stringify(payload),
        });
    }

    protected put<TResponse, TPayload = unknown>(url: string, payload?: TPayload): Promise<TResponse> {
        return this.http.requestWithAuth<TResponse>(url, {
            method: 'PUT',
            body: payload === undefined ? undefined : JSON.stringify(payload),
        });
    }

    protected patch<TResponse, TPayload = unknown>(url: string, payload?: TPayload): Promise<TResponse> {
        return this.http.requestWithAuth<TResponse>(url, {
            method: 'PATCH',
            body: payload === undefined ? undefined : JSON.stringify(payload),
        });
    }

    protected delete(url: string): Promise<void> {
        return this.http.requestWithAuth<void>(url, {
            method: 'DELETE',
        });
    }
}
