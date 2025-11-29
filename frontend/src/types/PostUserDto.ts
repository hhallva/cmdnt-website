export interface PostUserDto {
    roleId: number;
    surname: string | null;
    name: string | null;
    patronymic: string | null;
    login: string | null;
    password: string | null;
}