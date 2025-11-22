import Cookies from 'js-cookie'
import type { ApiErrorDto } from '../types/ApiErrorDto'

import type { LoginDto, LoginResponseDto } from '../types/auth'

import type { RoleDto } from '../types/RoleDto'

import type { UserDto } from '../types/UserDto'
import type { UserStatisticDto } from '../types/UserStatisticDto'
import type { UpdateUserDto } from '../types/UpdateUserDto'
import type { PostUserDto } from '../types/PostUserDto'

import type { PostStudentDto, StudentsDto, ContactDto } from '../types/students'

import type { GroupDto } from '../types/groups'
import type { RoomDto } from '../types/rooms'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const handleUnauthorized = () => {
  Cookies.remove('authToken');
  sessionStorage.clear();
  window.location.href = '/';
};

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
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        console.error("Ошибка парсинга JSON:", parseError);
        console.error("Полученный текст:", text);
        throw new Error(`Сервер вернул некорректные данные: ${parseError}`);
      }
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

  //#region 
  //#endregion

  //#region Авторизация
  singIn: async (credentials: LoginDto) => {
    return request<LoginResponseDto>('/api/v1/SignIn', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  requestWithAuth: async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    const token = Cookies.get('authToken');
    const optionsWithAuth = {
      ...options,
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    };
    return request<T>(url, optionsWithAuth);
  },
  // #endregion

  //#region Роли
  getAllRoles: async (): Promise<RoleDto[]> => {
    return apiClient.requestWithAuth<RoleDto[]>('/api/v1/Roles');
  },
  //#endregion

  //#region Пользователи
  getUserStatistics: async (): Promise<UserStatisticDto> => {
    return apiClient.requestWithAuth<UserStatisticDto>('/api/v1/Users/statistic');
  },

  getAllUsers: async (): Promise<UserDto[]> => {
    return apiClient.requestWithAuth<UserDto[]>('/api/v1/Users');
  },

  getUserById: async (id: number): Promise<UserDto> => {
    return apiClient.requestWithAuth<UserDto>(`/api/v1/Users/${id}`);
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Users/${id}`, {
      method: 'DELETE',
    });
  },

  changeUserPassword: async (id: number, newPassword: string): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });
  },

  updateUser: async (id: number, userData: UpdateUserDto): Promise<UserDto> => {
    return apiClient.requestWithAuth<UserDto>(`/api/v1/Users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  },

  createUser: async (userData: PostUserDto): Promise<UserDto> => {
    return apiClient.requestWithAuth<UserDto>('/api/v1/Users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  },
  //#endregion

  //#region Студенты
  getAllStudents: async (): Promise<StudentsDto[]> => {
    return apiClient.requestWithAuth<[StudentsDto]>('/api/v1/Students');
  },

  getStudentById: async (id: number): Promise<StudentsDto> => {
    return apiClient.requestWithAuth<StudentsDto>(`/api/v1/Students/${id}`);
  },

  createStudent: async (data: PostStudentDto): Promise<StudentsDto> => {
    return apiClient.requestWithAuth<StudentsDto>('/api/v1/Students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  addStudentContacts: async (id: number, contacts: Omit<ContactDto, 'id'>[]): Promise<ContactDto[]> => {
    return apiClient.requestWithAuth<ContactDto[]>(`/api/v1/Students/${id}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contacts),
    });
  },

  getExtStudentById: async (id: number): Promise<{ origin: string | null }> => {
    return apiClient.requestWithAuth<{ origin: string | null }>(`/api/v1/Students/${id}/extended`);
  },

  getStudentContactsById: async (id: number): Promise<ContactDto[]> => {
    return apiClient.requestWithAuth<[ContactDto]>(`/api/v1/Students/${id}/contacts`);
  },

  deleteStudent: async (id: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Students/${id}`, {
      method: 'DELETE',
    });
  },
  //#endregion

  //#region Группы
  getAllGroups: async (): Promise<GroupDto[]> => {
    return apiClient.requestWithAuth<[GroupDto]>('/api/v1/Groups');
  },
  //#endregion 

  //#region Студенты
  getRoomById: async (id: number): Promise<RoomDto> => {
    return apiClient.requestWithAuth<RoomDto>(`/api/v1/Rooms/${id}`);
  },

  getStudentsByRoomId: async (id: number): Promise<StudentsDto[]> => {
    return apiClient.requestWithAuth<StudentsDto[]>(`/api/v1/Rooms/${id}/students`);
  },
  //#endregion
};