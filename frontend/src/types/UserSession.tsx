export interface UserSession {
  id: number;
  name: string | null;
  surname: string | null;
  patronymic: string | null;
  roleId: number;
  login: string | null;
  token: string | null;
}