import { BaseApiService } from '../core/baseApiService';
import type { PostStudentDto, StudentsDto, ContactDto, UpdateStudentPayload } from '../../types/students';
import type { ResettlementHistoryDto } from '../../types/resettlements';
import type { NoteDto, CreateNoteDto } from '../../types/notes';
import type { GroupDto } from '../../types/groups';
import type { ExpendableDistributionBatchItemDto, ExpendableDistributionDto } from '../../types/expendableDistribution';
import type { PaginatedResponse } from '../../types/pagination';

type GetStudentsPageParams = {
    page: number;
    pageSize?: number;
    search?: string;
    buildingId?: number;
    unassigned?: boolean;
    groupId?: number;
    course?: number;
    gender?: boolean;
};

type GetAllStudentsParams = Omit<GetStudentsPageParams, 'page' | 'pageSize'>;

export class StudentsService extends BaseApiService {
    getAllStudents({ search, buildingId, unassigned, groupId, course, gender }: GetAllStudentsParams = {}): Promise<StudentsDto[]> {
        const params = new URLSearchParams({
            all: 'true',
        });

        if (search?.trim()) params.set('search', search.trim());
        if (typeof buildingId === 'number') params.set('buildingId', buildingId.toString());
        if (unassigned) params.set('unassigned', 'true');
        if (typeof groupId === 'number') params.set('groupId', groupId.toString());
        if (typeof course === 'number') params.set('course', course.toString());
        if (typeof gender === 'boolean') params.set('gender', gender.toString());

        return this.get<StudentsDto[]>(`/v1/Students?${params.toString()}`);
    }

    getStudentsPage({
        page,
        pageSize = 50,
        search,
        buildingId,
        unassigned,
        groupId,
        course,
        gender,
    }: GetStudentsPageParams): Promise<PaginatedResponse<StudentsDto>> {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });

        if (search?.trim()) params.set('search', search.trim());
        if (typeof buildingId === 'number') params.set('buildingId', buildingId.toString());
        if (unassigned) params.set('unassigned', 'true');
        if (typeof groupId === 'number') params.set('groupId', groupId.toString());
        if (typeof course === 'number') params.set('course', course.toString());
        if (typeof gender === 'boolean') params.set('gender', gender.toString());

        return this.get<PaginatedResponse<StudentsDto>>(`/v1/Students?${params.toString()}`);
    }

    getStudentById(id: number): Promise<StudentsDto> {
        return this.get<StudentsDto>(`/v1/Students/${id}`);
    }

    getExtStudentById(id: number): Promise<{ origin: string | null }> {
        return this.get<{ origin: string | null }>(`/v1/Students/${id}/extended`);
    }

    getStudentResettlementHistory(id: number): Promise<ResettlementHistoryDto[]> {
        return this.get<ResettlementHistoryDto[]>(`/v1/Students/${id}/resettlements`);
    }

    deleteStudentResettlement(studentId: number, resettlementId: number): Promise<void> {
        return this.delete(`/v1/Students/${studentId}/resettlements/${resettlementId}`);
    }

    createStudent(data: PostStudentDto): Promise<StudentsDto> {
        return this.post<StudentsDto, PostStudentDto>('/v1/Students', data);
    }

    updateStudent(id: number, payload: UpdateStudentPayload): Promise<StudentsDto> {
        return this.put<StudentsDto, UpdateStudentPayload>(`/v1/Students/${id}`, payload);
    }

    deleteStudent(id: number): Promise<void> {
        return this.delete(`/v1/Students/${id}`);
    }

    evictStudent(studentId: number): Promise<void> {
        return this.delete<void>(`/v1/Students/${studentId}/room`);
    }

    assignStudentToRoom(studentId: number, roomId: number): Promise<void> {
        return this.post<void>(`/v1/Students/${studentId}/room/${roomId}`);
    }

    getStudentContactsById(id: number): Promise<ContactDto[]> {
        return this.get<ContactDto[]>(`/v1/Students/${id}/contacts`);
    }

    addStudentContacts(id: number, contacts: Omit<ContactDto, 'id'>[]): Promise<ContactDto[]> {
        return this.post<ContactDto[], Omit<ContactDto, 'id'>[]>(`/v1/Students/${id}/contacts`, contacts);
    }

    getStudentNotesById(id: number): Promise<NoteDto[]> {
        return this.get<NoteDto[]>(`/v1/Students/${id}/notes`);
    }

    createStudentNote(payload: CreateNoteDto): Promise<NoteDto> {
        return this.post<NoteDto, CreateNoteDto>('/v1/Notes', payload);
    }

    deleteNote(noteId: number): Promise<void> {
        return this.delete(`/v1/Notes/${noteId}`);
    }

    getAllGroups(): Promise<GroupDto[]> {
        return this.get<GroupDto[]>('/v1/Groups');
    }

    editExpendableDisstributions(id: number, items: ExpendableDistributionBatchItemDto[]): Promise<ExpendableDistributionDto> {
        return this.put<ExpendableDistributionDto, ExpendableDistributionBatchItemDto[]>(`/v1/Students/${id}/expendable`, items);
    }
}
