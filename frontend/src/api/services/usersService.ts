import { BaseApiService } from '../core/baseApiService';
import type { UserDto } from '../../types/UserDto';
import type { UserStatisticDto } from '../../types/UserStatisticDto';
import type { UpdateUserDto } from '../../types/UpdateUserDto';
import type { PostUserDto } from '../../types/PostUserDto';
import type { BuildingDto } from '../../types/buildings';
import type { PaginatedResponse } from '../../types/pagination';

type GetUsersPageParams = {
    page: number;
    pageSize?: number;
    search?: string;
    roleId?: number;
};

export class UsersService extends BaseApiService {
    getUserStatistics(): Promise<UserStatisticDto> {
        return this.get<UserStatisticDto>('/api/v1/Users/statistic');
    }

    getAllUsers(): Promise<UserDto[]> {
        return this.get<UserDto[]>('/api/v1/Users?all=true');
    }

    getUsersPage({ page, pageSize = 50, search, roleId }: GetUsersPageParams): Promise<PaginatedResponse<UserDto>> {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });

        if (search?.trim()) params.set('search', search.trim());
        if (typeof roleId === 'number') params.set('roleId', roleId.toString());

        return this.get<PaginatedResponse<UserDto>>(`/api/v1/Users?${params.toString()}`);
    }

    getUserById(id: number): Promise<UserDto> {
        return this.get<UserDto>(`/api/v1/Users/${id}`);
    }

    deleteUser(id: number): Promise<void> {
        return this.delete(`/api/v1/Users/${id}`);
    }

    changeUserPassword(id: number, newPassword: string): Promise<void> {
        return this.patch<void, { password: string }>(`/api/v1/Users/${id}`, {
            password: newPassword,
        });
    }

    updateUser(id: number, userData: UpdateUserDto): Promise<UserDto> {
        return this.put<UserDto, UpdateUserDto>(`/api/v1/Users/${id}`, userData);
    }

    createUser(userData: PostUserDto): Promise<UserDto> {
        return this.post<UserDto, PostUserDto>('/api/v1/Users', userData);
    }

    getUserBuildings(userId: number): Promise<BuildingDto[]> {
        return this.get<BuildingDto[]>(`/api/v1/Users/${userId}/buildings`);
    }
}
