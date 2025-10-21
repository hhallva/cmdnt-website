import React from 'react';
import { useNavigate } from 'react-router-dom';

import Cookies from 'js-cookie';

import styles from './Dashboard.module.css';

import type { RoleDto } from '../../types/RoleDto';
import type { UserSession } from '../../types/UserSession';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    userSession: UserSession;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, userSession }) => {
    const allRolesStr = sessionStorage.getItem('allRoles');
    const allRoles: RoleDto[] = allRolesStr ? JSON.parse(allRolesStr) : [];

    const userRoleName = allRoles.find(r => r.id === userSession.roleId)?.name?.toLowerCase() || '';

    const navigate = useNavigate();

    const handleLogout = () => {
        Cookies.remove('authToken');
        sessionStorage.clear();
        navigate('/');
    };

    const getMenuItems = () => {
        const items = [];

        items.push(
            { icon: 'bi-layout-wtf', label: 'Структура общежития', path: '/dashboard/structure', },
        );

        if (!userRoleName.includes('воспитатель')) {
            items.push(
                { icon: 'bi-people', label: 'Студенты', path: '/dashboard/students' },
                { icon: 'bi-house-door', label: 'Расселение', path: '/dashboard/settlement' },
                { icon: 'bi-file-earmark-text', label: 'Отчеты', path: '/dashboard/reports' }
            );
        }

        if (userRoleName.includes('администратор')) {
            items.push(
                { icon: 'bi-people-fill', label: 'Пользователи', path: '/dashboard/users' },
                { icon: 'bi-collection', label: 'Группы', path: '/dashboard/groups' }
            );
        }

        items.push(
            { icon: 'bi-box-arrow-right', label: 'Выйти', action: handleLogout, }
        );

        return items;
    };

    return (
        <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
            <div className={styles.sidebarHeader}>
                <button className={styles.toggleBtn} onClick={onToggle}>
                    <i className={`bi bi-list`}></i>
                </button>
            </div>

            <ul className={styles.navMenu}>
                {getMenuItems().map((item, index) => (
                    <li key={index} className={styles.navItem}>
                        <a
                            href="#"
                            className={styles.navLink}
                            onClick={(e) => {
                                e.preventDefault();
                                if (item.action) {
                                    item.action();
                                } else if (item.path) {
                                    navigate(item.path);
                                }
                            }}
                        >
                            <i className={`bi ${item.icon}`}></i>
                            <span className={styles.navText}>{item.label}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;