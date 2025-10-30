import React, { useState } from 'react';
import { Outlet, useNavigate, useMatches } from 'react-router-dom';
import Cookies from 'js-cookie';
import Sidebar from './Sidebar';
import styles from './Dashboard.module.css';
import type { UserSession } from '../../types/UserSession';

type RouteHandle = {
    title?: string;
};

const DashboardLayout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const navigate = useNavigate();

    const matches = useMatches();
    const currentMatch = matches[matches.length - 1];
    const title = (currentMatch?.handle as RouteHandle)?.title || 'Панель управления';

    const userSessionStr = sessionStorage.getItem('userSession');
    const userSession: UserSession = JSON.parse(userSessionStr!);

    if (!userSession || !userSession.token) {
        if (Cookies.get('authToken')) {
            Cookies.remove('authToken');
        }
        sessionStorage.clear();
        navigate('/');
        return null;
    }

    return (
        <div className={styles.container}>
            <Sidebar
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
                userSession={userSession}
            />
            <div className={`${styles.mainContentDesktop} ${isCollapsed ? styles.expanded : ''}`}>
                <div className={styles.header}>
                    <h1>{title}</h1>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {userSession.name?.charAt(0) || ''}{userSession.patronymic?.charAt(0) || ''}
                        </div>
                        <span>{userSession.role?.name}</span>
                    </div>
                </div>

                <Outlet />
            </div>
        </div>
    );
};

export default DashboardLayout;