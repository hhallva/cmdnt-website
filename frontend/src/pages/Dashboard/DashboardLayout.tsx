import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, useMatches, useParams } from 'react-router-dom';
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
    const location = useLocation();
    const { buildingId } = useParams<{ buildingId?: string }>();

    const matches = useMatches();
    const currentMatch = matches[matches.length - 1];
    const title = (currentMatch?.handle as RouteHandle)?.title || 'Панель управления';

    let buildingHeader: { name: string; address: string } | null = null;
    if (location.pathname.startsWith('/dashboard/accomodation/') && buildingId) {
        const stored = sessionStorage.getItem('active-building');
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as { id: number; name: string; address: string };
                if (parsed && parsed.id === Number(buildingId)) {
                    buildingHeader = { name: parsed.name, address: parsed.address };
                }
            } catch {
                buildingHeader = null;
            }
        }
    }

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
                    {buildingHeader ? (
                        <div className={styles.headerTitleGroup}>
                            <button
                                type="button"
                                className={styles.headerBackButton}
                                onClick={() => {
                                    sessionStorage.removeItem('active-building');
                                    navigate('/dashboard/accomodation');
                                }}
                                aria-label="Назад к зданиям"
                            >
                                <i className="bi bi-arrow-left"></i>
                            </button>
                            <h1 title={buildingHeader.address}>{buildingHeader.name}</h1>
                        </div>
                    ) : (
                        <h1>{title}</h1>
                    )}
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {userSession.name?.charAt(0) || ''}{userSession.surname?.charAt(0) || ''}
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