import type { RoleDto } from "./RoleDto";

export interface UserSession {
  id: number;
  name: string | null;
  surname: string | null;
  patronymic: string | null;
  role: RoleDto;
  login: string | null;
  token: string | null;
}