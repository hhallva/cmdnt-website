import type { RoleDto } from './RoleDto';

export interface NoteAuthor {
    id: number;
    name: string;
    role: RoleDto | null;
}

export interface NoteDto {
    id: number;
    studentId: number;
    text: string;
    createDate: string;
    author: NoteAuthor | null;
}

export interface CreateNoteDto {
    studentId: number;
    text: string;
    userId?: number | null;
}
