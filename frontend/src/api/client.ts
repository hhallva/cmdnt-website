import Cookies from 'js-cookie'
import type { LoginDto, LoginResponseDto } from '../types/auth'
import type { ApiErrorDto } from '../types/ApiErrorDto'
import type { RoleDto } from '../types/RoleDto'
import type { UserDto } from '../types/UserDto'
import type { UserStatisticDto } from '../types/UserStatisticDto'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

    if (response.ok) {
      return await response.json();
    }

    const errorData: ApiErrorDto = await response.json().catch(() => ({
      timestamp: Date.now(),
      message: `Ошибка ${response.status}`,
      errorCode: response.status,
    }));

    const errorMessage = errorData.message || `Ошибка ${response.status}`;
    throw new Error(errorMessage);
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Сервер недоступен. Попробуйте позже.');
    }
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

  getAllRoles: async (): Promise<RoleDto[]> => {
    return apiClient.getWithAuth<RoleDto[]>('/api/v1/Roles');
  },

  getUserStatistics: async (): Promise<UserStatisticDto> => {
    return apiClient.getWithAuth<UserStatisticDto>('/api/v1/Users/statistic');
  },

  getAllUsers: async (): Promise<UserDto[]> => {
    return apiClient.getWithAuth<UserDto[]>('/api/v1/Users');
  },
};