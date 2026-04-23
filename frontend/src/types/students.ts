import type { GroupDto } from "./groups";

export interface StudentsDto {
    id: number;
    name: string | null;
    surname: string | null;
    patronymic: string | null;
    gender: boolean | null;
    phone: string | null;
    birthday: string;
    group: GroupDto;
    roomId: number | null;
    buildingId?: number | null;
    roomCapacity?: number | null;
    blockNumber: string | null;
    origin?: string | null;
    contacts?: ContactDto[];
}

export interface PostStudentDto {
    name: string | null;
    surname: string | null;
    patronymic: string | null;
    birthday: string;
    groupId: number | null;
    gender: boolean | null;
    phone: string | null;
    origin: string | null;
}

export interface ContactDto {
    comment: string;
    phone: string;
}

export interface UpdateStudentPayload {
    student: StudentsDto;
    contacts: ContactDto[];
}

