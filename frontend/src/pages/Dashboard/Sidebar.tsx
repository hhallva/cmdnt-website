import React, { useState, useEffect } from 'react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768 || window.innerHeight > 581);
            if (window.innerWidth > 768 || window.innerHeight > 581) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

        if (!userSession.role?.name?.includes('Воспитатель')) {
            items.push(
                { icon: 'bi-people', label: 'Студенты', path: '/dashboard/students' },
                { icon: 'bi-house-door', label: 'Расселение', path: '/dashboard/settlement' },
                { icon: 'bi-file-earmark-text', label: 'Отчеты', path: '/dashboard/reports' }
            );
        }

        if (userSession.role?.name?.includes('Администратор')) {
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

    const menuItems = getMenuItems();

    if (isMobileView) {
        return (
            <div className={`${styles.mobileSidebar} ${isMobileMenuOpen ? styles.mobileSidebarOpen : ''}`}>
                <div className={styles.mobileHeader}>
                    <button className={styles.mobileToggleBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
                    </button>
                </div>

                <ul className={`${styles.mobileNavMenu} ${isMobileMenuOpen ? styles.mobileNavMenuOpen : ''}`}>
                    {menuItems.map((item, index) => (
                        <li key={index} className={styles.mobileNavItem}>
                            <a
                                href="#"
                                className={styles.navLink}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsMobileMenuOpen(false);
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
    }

    // На десктопе — боковое меню слева
    return (
        <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
            <div className={styles.sidebarHeader}>
                <button className={styles.toggleBtn} onClick={onToggle}>
                    <i className={`bi bi-list`}></i>
                </button>
            </div>

            <ul className={styles.navMenu}>
                {menuItems.map((item, index) => (
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