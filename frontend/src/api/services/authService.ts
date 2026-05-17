import type { HttpClient } from '../core/httpClient';
import { BaseApiService } from '../core/baseApiService';
import type { LoginDto, LoginResponseDto } from '../../types/auth';
import type { RoleDto } from '../../types/RoleDto';

export class AuthService extends BaseApiService {
    constructor(http: HttpClient) {
        super(http);
    }

    singIn(credentials: LoginDto): Promise<LoginResponseDto> {
        return this.http.request<LoginResponseDto>('/api/v1/SingIn', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    getAllRoles(): Promise<RoleDto[]> {
        return this.get<RoleDto[]>('/api/v1/Roles');
    }
}
