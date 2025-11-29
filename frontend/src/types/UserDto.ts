import type { RoleDto } from "./RoleDto";

export interface UserDto {
    id: number;
    name: string | null;
    surname: string | null;
    patronymic: string | null;
    role: RoleDto | null;
    login: string | null;
}