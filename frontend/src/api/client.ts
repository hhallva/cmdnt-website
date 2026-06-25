import { HttpClient } from './core/httpClient';
import { AuthService } from './services/authService';
import { UsersService } from './services/usersService';
import { StudentsService } from './services/studentsService';
import { BuildingsService } from './services/buildingsService';
import { RoomsService } from './services/roomsService';
import { StationaryService } from './services/stationaryService';
import { ExpendableService } from './services/expendableService';
import { GroupsService } from './services/groupsService';

type AnyService = object;

const bindServiceMethods = <TService extends AnyService>(service: TService): Record<string, unknown> => {
    const prototype = Object.getPrototypeOf(service) as Record<string, unknown>;
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
        name => name !== 'constructor' && typeof prototype[name] === 'function'
    );

    return methodNames.reduce<Record<string, unknown>>((acc, methodName) => {
        const method = prototype[methodName] as (...args: unknown[]) => unknown;
        acc[methodName] = method.bind(service);
        return acc;
    }, {});
};

const httpClient = new HttpClient();

const authService = new AuthService(httpClient);
const usersService = new UsersService(httpClient);
const studentsService = new StudentsService(httpClient);
const buildingsService = new BuildingsService(httpClient);
const roomsService = new RoomsService(httpClient);
const stationaryService = new StationaryService(httpClient);
const expendableService = new ExpendableService(httpClient);
const groupService = new GroupsService(httpClient);

export type ApiClient = Pick<HttpClient, 'requestWithAuth'>
    & AuthService
    & UsersService
    & StudentsService
    & BuildingsService
    & RoomsService
    & StationaryService
    & ExpendableService
    & GroupsService;

export const apiClient = {
    requestWithAuth: httpClient.requestWithAuth.bind(httpClient),
    ...bindServiceMethods(authService),
    ...bindServiceMethods(usersService),
    ...bindServiceMethods(studentsService),
    ...bindServiceMethods(buildingsService),
    ...bindServiceMethods(roomsService),
    ...bindServiceMethods(stationaryService),
    ...bindServiceMethods(expendableService),
    ...bindServiceMethods(groupService),
} as ApiClient;
