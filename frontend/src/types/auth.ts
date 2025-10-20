// src/types/auth.ts

export interface LoginDto {
    login: string;
    password: string;
}

export interface LoginResponseDto {
    id: number;
    name: string | null;
    surname: string | null;
    patronymic: string | null;
    roleId: number;
    login: string | null;
    token: string | null;
}