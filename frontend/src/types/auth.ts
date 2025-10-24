// src/types/auth.ts

import type { RoleDto } from "./RoleDto";

export interface LoginDto {
    login: string;
    password: string;
}

export interface LoginResponseDto {
    id: number;
    name: string | null;
    surname: string | null;
    patronymic: string | null;
    role: RoleDto | null;
    login: string | null;
    token: string | null;
}