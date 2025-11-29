import Cookies from 'js-cookie'
import type { ApiErrorDto } from '../types/ApiErrorDto'

import type { LoginDto, LoginResponseDto } from '../types/auth'

import type { RoleDto } from '../types/RoleDto'

import type { UserDto } from '../types/UserDto'
import type { UserStatisticDto } from '../types/UserStatisticDto'
import type { UpdateUserDto } from '../types/UpdateUserDto'
import type { PostUserDto } from '../types/PostUserDto'

import type { PostStudentDto, StudentsDto, ContactDto, UpdateStudentPayload } from '../types/students'

import type { GroupDto } from '../types/groups'
import type { RoomDto, PostRoomDto } from '../types/rooms'
import type { NoteDto, CreateNoteDto } from '../types/notes'
import type { StructureStatisticDto } from '../types/structures'

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

  //#region Получение студентов
  getAllStudents: async (): Promise<StudentsDto[]> => {
    return apiClient.requestWithAuth<StudentsDto[]>('/api/v1/Students');
  },

  getStudentById: async (id: number): Promise<StudentsDto> => {
    return apiClient.requestWithAuth<StudentsDto>(`/api/v1/Students/${id}`);
  },


  getExtStudentById: async (id: number): Promise<{ origin: string | null }> => {
    return apiClient.requestWithAuth<{ origin: string | null }>(`/api/v1/Students/${id}/extended`);
  },
  //#endregion

  //#region Создание, обновление и удаление студентов
  createStudent: async (data: PostStudentDto): Promise<StudentsDto> => {
    return apiClient.requestWithAuth<StudentsDto>('/api/v1/Students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  updateStudent: async (id: number, payload: UpdateStudentPayload): Promise<StudentsDto> => {
    return apiClient.requestWithAuth<StudentsDto>(`/api/v1/Students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  deleteStudent: async (id: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Students/${id}`, {
      method: 'DELETE',
    });
  },
  //#endregion

  //#region Работа с комнатами студентов
  evictStudent: async (studentId: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Students/${studentId}/evict-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  assignStudentToRoom: async (studentId: number, roomId: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Students/${studentId}/assign-room/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
  //#endregion

  //#region Контакты студентов
  getStudentContactsById: async (id: number): Promise<ContactDto[]> => {
    return apiClient.requestWithAuth<[ContactDto]>(`/api/v1/Students/${id}/contacts`);
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
  //#endregion

  //#region Работа с заметками студентов
  getStudentNotesById: async (id: number): Promise<NoteDto[]> => {
    return apiClient.requestWithAuth<NoteDto[]>(`/api/v1/Notes/student/${id}`);
  },

  createStudentNote: async (payload: CreateNoteDto): Promise<NoteDto> => {
    return apiClient.requestWithAuth<NoteDto>('/api/v1/Notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  deleteNote: async (noteId: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Notes/${noteId}`, {
      method: 'DELETE',
    });
  },
  //#endregion 

  //#endregion 

  //#region Группы
  getAllGroups: async (): Promise<GroupDto[]> => {
    return apiClient.requestWithAuth<GroupDto[]>('/api/v1/Groups');
  },
  //#endregion 

  //#region Коммнаты
  getAllRooms: async (): Promise<RoomDto[]> => {
    return apiClient.requestWithAuth<RoomDto[]>('/api/v1/Rooms');
  },

  getRoomById: async (id: number): Promise<RoomDto> => {
    return apiClient.requestWithAuth<RoomDto>(`/api/v1/Rooms/${id}`);
  },

  getStudentsByRoomId: async (id: number): Promise<StudentsDto[]> => {
    return apiClient.requestWithAuth<StudentsDto[]>(`/api/v1/Rooms/${id}/students`);
  },

  createRoom: async (payload: PostRoomDto): Promise<RoomDto> => {
    return apiClient.requestWithAuth<RoomDto>('/api/v1/Rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  deleteRoom: async (id: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Rooms/${id}`, {
      method: 'DELETE',
    });
  },
  //#endregion

  //#region Структура
  getStructureStatistics: async (): Promise<StructureStatisticDto> => {
    return apiClient.requestWithAuth<StructureStatisticDto>('/api/v1/Structure/statistic');
  },


  //#endregion
};