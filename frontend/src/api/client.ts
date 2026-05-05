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
import type { StructureStatisticDto, OverallStructureStatisticDto } from '../types/structures'
import type { BuildingDto, BuildingSummaryDto, PostBuildingDto } from '../types/buildings'
import type { ResettlementHistoryDto } from '../types/resettlements'
import type { StationaryTypeDto, PostStationaryTypeDto } from '../types/stationaryTypes'
import type { ExpendableTypeDto, PostExpendableTypeDto } from '../types/expendableTypes'
import type { ExpendableEquipmentDto, ExpendableEquipmentAdjustmentDto } from '../types/expendableEquipment'
import type { ExpendableDistributionDto, ExpendableDistributionUpsertDto } from '../types/expendableDistribution'
import type { StatusDto } from '../types/statuses'
import type { StationaryEquipmentDto, PostStationaryEquipmentDto, UpdateStationaryEquipmentDto } from '../types/stationaryEquipment'

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
    const error = new Error(errorMessage) as Error & { status?: number; errorCode?: number };
    error.status = response.status;
    error.errorCode = errorData.errorCode;
    throw error;
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

  //#region Расходные материалы
  getExpendableEquipment: async (): Promise<ExpendableEquipmentDto[]> => {
    return apiClient.requestWithAuth<ExpendableEquipmentDto[]>('/api/v1/ExpendableEquipment');
  },

  addExpendableEquipment: async (payload: ExpendableEquipmentAdjustmentDto): Promise<ExpendableEquipmentDto> => {
    return apiClient.requestWithAuth<ExpendableEquipmentDto>('/api/v1/ExpendableEquipment/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  subtractExpendableEquipment: async (payload: ExpendableEquipmentAdjustmentDto): Promise<ExpendableEquipmentDto> => {
    return apiClient.requestWithAuth<ExpendableEquipmentDto>('/api/v1/ExpendableEquipment/subtract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  getExpendableDistributions: async (): Promise<ExpendableDistributionDto[]> => {
    return apiClient.requestWithAuth<ExpendableDistributionDto[]>('/api/v1/ExpendableDistribution');
  },

  createExpendableDistribution: async (payload: ExpendableDistributionUpsertDto): Promise<ExpendableDistributionDto> => {
    return apiClient.requestWithAuth<ExpendableDistributionDto>('/api/v1/ExpendableDistribution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  updateExpendableDistribution: async (id: number, payload: ExpendableDistributionUpsertDto): Promise<ExpendableDistributionDto> => {
    return apiClient.requestWithAuth<ExpendableDistributionDto>(`/api/v1/ExpendableDistribution/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  deleteExpendableDistribution: async (id: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/ExpendableDistribution/${id}`, {
      method: 'DELETE',
    });
  },
  //#endregion

  //#region Типы стационарного оборудования
  getStationaryTypes: async (): Promise<StationaryTypeDto[]> => {
    return apiClient.requestWithAuth<StationaryTypeDto[]>('/api/v1/Stationary');
  },

  getStationaryTypeById: async (id: number): Promise<StationaryTypeDto> => {
    return apiClient.requestWithAuth<StationaryTypeDto>(`/api/v1/Stationary/${id}`);
  },

  createStationaryType: async (payload: PostStationaryTypeDto): Promise<StationaryTypeDto> => {
    return apiClient.requestWithAuth<StationaryTypeDto>('/api/v1/Stationary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  updateStationaryType: async (id: number, payload: StationaryTypeDto): Promise<StationaryTypeDto> => {
    return apiClient.requestWithAuth<StationaryTypeDto>(`/api/v1/Stationary/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  deleteStationaryType: async (id: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Stationary/${id}`, {
      method: 'DELETE',
    });
  },
  //#endregion

  //#region Типы расходных материалов
  getExpendableTypes: async (): Promise<ExpendableTypeDto[]> => {
    return apiClient.requestWithAuth<ExpendableTypeDto[]>('/api/v1/Expendable');
  },

  getExpendableTypeById: async (id: number): Promise<ExpendableTypeDto> => {
    return apiClient.requestWithAuth<ExpendableTypeDto>(`/api/v1/Expendable/${id}`);
  },

  createExpendableType: async (payload: PostExpendableTypeDto): Promise<ExpendableTypeDto> => {
    return apiClient.requestWithAuth<ExpendableTypeDto>('/api/v1/Expendable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  updateExpendableType: async (id: number, payload: ExpendableTypeDto): Promise<ExpendableTypeDto> => {
    return apiClient.requestWithAuth<ExpendableTypeDto>(`/api/v1/Expendable/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  deleteExpendableType: async (id: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Expendable/${id}`, {
      method: 'DELETE',
    });
  },
  //#endregion

  //#region Статусы оборудования
  getStatuses: async (): Promise<StatusDto[]> => {
    return apiClient.requestWithAuth<StatusDto[]>('/api/v1/Statuses');
  },
  //#endregion

  //#region Стационарное оборудование
  getStationaryEquipment: async (): Promise<StationaryEquipmentDto[]> => {
    return apiClient.requestWithAuth<StationaryEquipmentDto[]>('/api/v1/StationaryEquipment');
  },

  getStationaryEquipmentById: async (id: number): Promise<StationaryEquipmentDto> => {
    return apiClient.requestWithAuth<StationaryEquipmentDto>(`/api/v1/StationaryEquipment/${id}`);
  },

  createStationaryEquipment: async (payload: PostStationaryEquipmentDto): Promise<StationaryEquipmentDto> => {
    return apiClient.requestWithAuth<StationaryEquipmentDto>('/api/v1/StationaryEquipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  updateStationaryEquipment: async (id: number, payload: UpdateStationaryEquipmentDto): Promise<StationaryEquipmentDto> => {
    return apiClient.requestWithAuth<StationaryEquipmentDto>(`/api/v1/StationaryEquipment/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  assignStationaryEquipmentToRoom: async (equipmentId: number, roomId: number): Promise<StationaryEquipmentDto> => {
    return apiClient.requestWithAuth<StationaryEquipmentDto>(
      `/api/v1/StationaryEquipment/${equipmentId}/assign-room/${roomId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  evictStationaryEquipment: async (equipmentId: number): Promise<StationaryEquipmentDto> => {
    return apiClient.requestWithAuth<StationaryEquipmentDto>(
      `/api/v1/StationaryEquipment/${equipmentId}/evict-room`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  deleteStationaryEquipment: async (id: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/StationaryEquipment/${id}`, {
      method: 'DELETE',
    });
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

  getStudentResettlementHistory: async (id: number): Promise<ResettlementHistoryDto[]> => {
    return apiClient.requestWithAuth<ResettlementHistoryDto[]>(`/api/v1/Students/${id}/resettlements/history`);
  },

  deleteStudentResettlement: async (studentId: number, resettlementId: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Students/${studentId}/resettlements/${resettlementId}`, {
      method: 'DELETE',
    });
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

  //#region Общежития
  getAllBuildings: async (): Promise<BuildingDto[]> => {
    return apiClient.requestWithAuth<BuildingDto[]>('/api/v1/Buildings');
  },

  getBuildingById: async (id: number): Promise<BuildingDto> => {
    return apiClient.requestWithAuth<BuildingDto>(`/api/v1/Buildings/${id}`);
  },

  getBuildingSummary: async (id: number): Promise<BuildingSummaryDto> => {
    return apiClient.requestWithAuth<BuildingSummaryDto>(`/api/v1/Buildings/${id}/summary`);
  },

  createBuilding: async (payload: PostBuildingDto): Promise<BuildingDto> => {
    return apiClient.requestWithAuth<BuildingDto>('/api/v1/Buildings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  updateBuilding: async (id: number, payload: BuildingDto): Promise<BuildingDto> => {
    return apiClient.requestWithAuth<BuildingDto>(`/api/v1/Buildings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  deleteBuilding: async (id: number): Promise<void> => {
    await apiClient.requestWithAuth(`/api/v1/Buildings/${id}`, {
      method: 'DELETE',
    });
  },

  getUserBuildings: async (userId: number): Promise<BuildingDto[]> => {
    return apiClient.requestWithAuth<BuildingDto[]>(`/api/v1/Users/${userId}/buildings`);
  },
  //#endregion

  //#region Коммнаты
  getRoomsByBuildingId: async (buildingId: number): Promise<RoomDto[]> => {
    return apiClient.requestWithAuth<RoomDto[]>(`/api/v1/Buildings/${buildingId}/Rooms`);
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
  getStructureStatistics: async (buildingId: number): Promise<StructureStatisticDto> => {
    return apiClient.requestWithAuth<StructureStatisticDto>(`/api/v1/Structure/statistic/${buildingId}`);
  },

  getOverallStructureStatistics: async (): Promise<OverallStructureStatisticDto> => {
    return apiClient.requestWithAuth<OverallStructureStatisticDto>('/api/v1/Structure/summary');
  },


  //#endregion
};