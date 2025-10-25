import React from 'react';
import { Navigate, useLocation, useMatches } from 'react-router-dom';
import Cookies from 'js-cookie';
import type { UserSession } from '../types/UserSession';


type RouteHandle = {
    title?: string;
    requiredRole?: 'educator' | 'commandant' | 'admin'; // Минимальная роль для доступа
};

const getUserSession = (): UserSession | null => {
    const userSessionStr = sessionStorage.getItem('userSession');
    return userSessionStr ? JSON.parse(userSessionStr) : null;
};

const hasRequiredRole = (userRoleName: string | null, requiredRole: RouteHandle['requiredRole']): boolean => {
    if (!requiredRole) return true; // Если роль не требуется, доступ разрешён

    if (!userRoleName) return false; // Если роли нет, доступ запрещён

    const userRoleLower = userRoleName.toLowerCase();

    switch (requiredRole) {
        case 'admin':
            return userRoleLower.includes('администратор');
        case 'commandant':
            return userRoleLower.includes('администратор') || userRoleLower.includes('комендант');
        case 'educator':
            // Воспитатель может видеть только страницы, помеченные как educator
            return userRoleLower.includes('администратор') || userRoleLower.includes('комендант') || userRoleLower.includes('воспитатель');
        default:
            return false;
    }
};
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    const token = Cookies.get('authToken');
    if (!token) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    const userSession = getUserSession();
    if (!userSession || !userSession.token) {
        if (token) {
            Cookies.remove('authToken');
        }
        sessionStorage.clear();
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    const matches = useMatches();
    const currentMatch = matches[matches.length - 1]; // Последний маршрут - текущий
    const requiredRole = (currentMatch?.handle as RouteHandle)?.requiredRole;

    // Если маршрут требует роль, проверяем её
    if (requiredRole) {
        const userHasRole = hasRequiredRole(userSession.role?.name, requiredRole);
        if (!userHasRole) {
            console.warn(`Доступ к ${location.pathname} запрещён для роли ${userSession.role?.name}. Требуется: ${requiredRole}`);
            return <Navigate to="/dashboard/structure" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;