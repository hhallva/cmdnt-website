import type { GroupDto } from "./groups";

export interface StudentsDto {
    id: number
    name: string | null;
    surname: string | null;
    patronymic: string | null;
    gender: boolean;
    phone: string | null;
    birthday: string;
    group: GroupDto;
    blockNumber: string | null;
}

export interface PostStudentsDto {
    name: string | null;
    surname: string | null;
    patronymic: string | null;
    birthday: string;
    group: GroupDto | null;
    gender: boolean;
    phone: string | null;
    origin: string | null;
}