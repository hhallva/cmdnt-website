import { BaseApiService } from '../core/baseApiService';
import type { PostStudentDto, StudentsDto, ContactDto, UpdateStudentPayload } from '../../types/students';
import type { ResettlementHistoryDto } from '../../types/resettlements';
import type { NoteDto, CreateNoteDto } from '../../types/notes';
import type { GroupDto } from '../../types/groups';
import type { ExpendableDistributionBatchItemDto, ExpendableDistributionDto } from '../../types/expendableDistribution';

export class StudentsService extends BaseApiService {
    getAllStudents(): Promise<StudentsDto[]> {
        return this.get<StudentsDto[]>('/api/v1/Students');
    }

    getStudentById(id: number): Promise<StudentsDto> {
        return this.get<StudentsDto>(`/api/v1/Students/${id}`);
    }

    getExtStudentById(id: number): Promise<{ origin: string | null }> {
        return this.get<{ origin: string | null }>(`/api/v1/Students/${id}/extended`);
    }

    getStudentResettlementHistory(id: number): Promise<ResettlementHistoryDto[]> {
        return this.get<ResettlementHistoryDto[]>(`/api/v1/Students/${id}/resettlements`);
    }

    deleteStudentResettlement(studentId: number, resettlementId: number): Promise<void> {
        return this.delete(`/api/v1/Students/${studentId}/resettlements/${resettlementId}`);
    }

    createStudent(data: PostStudentDto): Promise<StudentsDto> {
        return this.post<StudentsDto, PostStudentDto>('/api/v1/Students', data);
    }

    updateStudent(id: number, payload: UpdateStudentPayload): Promise<StudentsDto> {
        return this.put<StudentsDto, UpdateStudentPayload>(`/api/v1/Students/${id}`, payload);
    }

    deleteStudent(id: number): Promise<void> {
        return this.delete(`/api/v1/Students/${id}`);
    }

    evictStudent(studentId: number): Promise<void> {
        return this.delete<void>(`/api/v1/Students/${studentId}/room`);
    }

    assignStudentToRoom(studentId: number, roomId: number): Promise<void> {
        return this.post<void>(`/api/v1/Students/${studentId}/room/${roomId}`);
    }

    getStudentContactsById(id: number): Promise<ContactDto[]> {
        return this.get<ContactDto[]>(`/api/v1/Students/${id}/contacts`);
    }

    addStudentContacts(id: number, contacts: Omit<ContactDto, 'id'>[]): Promise<ContactDto[]> {
        return this.post<ContactDto[], Omit<ContactDto, 'id'>[]>(`/api/v1/Students/${id}/contacts`, contacts);
    }

    getStudentNotesById(id: number): Promise<NoteDto[]> {
        return this.get<NoteDto[]>(`/api/v1/Students/${id}/notes`);
    }

    createStudentNote(payload: CreateNoteDto): Promise<NoteDto> {
        return this.post<NoteDto, CreateNoteDto>('/api/v1/Notes', payload);
    }

    deleteNote(noteId: number): Promise<void> {
        return this.delete(`/api/v1/Notes/${noteId}`);
    }

    getAllGroups(): Promise<GroupDto[]> {
        return this.get<GroupDto[]>('/api/v1/Groups');
    }

    editExpendableDisstributions(id: number, items: ExpendableDistributionBatchItemDto[]): Promise<ExpendableDistributionDto> {
        return this.put<ExpendableDistributionDto, ExpendableDistributionBatchItemDto[]>(`/api/v1/Students/${id}/expendable`, items);
    }
}
