import Cookies from 'js-cookie';
import type { LoginDto, LoginResponseDto } from '../types/auth';
import type { ApiErrorDto } from '../types/ApiErrorDto';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Универсальный метод запроса
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Если ответ OK — парсим JSON
    if (response.ok) {
      return await response.json();
    }

    // Если ответ пришёл, но с ошибкой (4xx, 5xx)
    const errorData: ApiErrorDto = await response.json().catch(() => ({
      timestamp: Date.now(),
      message: `Ошибка ${response.status}`,
      errorCode: response.status,
    }));

    // Выбрасываем ошибку с понятным сообщением
    const errorMessage = errorData.message || `Ошибка ${response.status}`;
    throw new Error(errorMessage);
  } catch (error: any) {
    // Если fetch не смог даже отправить запрос (сервер выключен, CORS и т.д.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Сервер недоступен. Попробуйте позже.');
    }

    // Иначе — пробрасываем ошибку дальше (например, из JSON-парсинга)
    throw error;
  }
}

export const apiClient = {
  singIn: async (credentials: LoginDto) => {
    return request<LoginResponseDto>('/api/v1/SignIn', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getWithAuth: async <T>(url: string): Promise<T> => {
    const token = Cookies.get('authToken');
    return request<T>(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  },
};