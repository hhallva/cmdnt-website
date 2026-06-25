import Cookies from 'js-cookie';
import type { ApiErrorDto } from '../../types/ApiErrorDto';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleUnauthorized = () => {
    Cookies.remove('authToken');
    sessionStorage.clear();
    window.location.href = '/';
};

export class HttpClient {
    async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        const fullUrl = `${API_BASE_URL}${url}`;
        const headers = new Headers(options.headers);

        if (options.body !== undefined && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                handleUnauthorized();
                throw new Error('Токен недействителен. Вы будете перенаправлены на страницу входа.');
            }

            if (response.ok) {
                if (response.status === 204) {
                    return undefined as unknown as T;
                }

                const text = await response.text();
                if (!text) {
                    return undefined as unknown as T;
                }

                try {
                    return JSON.parse(text) as T;
                } catch (parseError) {
                    console.error('Ошибка парсинга JSON:', parseError);
                    console.error('Полученный текст:', text);
                    throw new Error(`Сервер вернул некорректные данные: ${parseError}`);
                }
            }

            const errorData: ApiErrorDto = await response.json().catch(() => ({
                timestamp: Date.now(),
                message: `Ошибка ${response.status}`,
                errorCode: response.status,
            }));

            const errorMessage = errorData.message || `Ошибка ${response.status}`;
            const error = new Error(errorMessage) as Error & { status?: number; errorCode?: number };
            error.status = response.status;
            error.errorCode = errorData.errorCode;
            throw error;
        } catch (error: unknown) {
            if (
                error instanceof Error
                && error.name === 'TypeError'
                && error.message.includes('fetch')
            ) {
                throw new Error('Сервер недоступен. Попробуйте позже.');
            }

            throw error;
        }
    }

    async requestWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
        const token = Cookies.get('authToken');

        return this.request<T>(url, {
            ...options,
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                ...options.headers,
            },
        });
    }
}
