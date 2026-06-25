import { BaseApiService } from '../core/baseApiService';
import type { GroupDto, PostGroupDto, UpdateGroupDto } from '../../types/groups';

export class GroupsService extends BaseApiService {

    getAllGroups(): Promise<GroupDto[]> {
        return this.get<GroupDto[]>(`/v1/Groups}`);
    }

    getGroupById(id: number): Promise<GroupDto> {
        return this.get<GroupDto>(`/v1/Groups/${id}`);
    }

    createGroup(payload: PostGroupDto): Promise<GroupDto> {
        return this.post<GroupDto, PostGroupDto>('/v1/Groups', payload);
    }

    deleteGroup(id: number): Promise<void> {
        return this.delete(`/v1/Groups/${id}`);
    }

    updateGroup(id: number, payload: UpdateGroupDto): Promise<GroupDto> {
        return this.put<GroupDto, UpdateGroupDto>(`/v1/Groups/${id}`, payload);
    }
}
