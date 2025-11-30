import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import Cookies from 'js-cookie';

import styles from './Dashboard.module.css';

import type { UserSession } from '../../types/UserSession';

type MenuItem = {
    icon: string;
    label: string;
    path?: string;
    action?: () => void;
};

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    userSession: UserSession;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, userSession }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 756);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 756;
            setIsMobileView(mobile);
            if (!mobile) {
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

    const getMenuItems = (): MenuItem[] => {
        const items: MenuItem[] = [];

        items.push(
            { icon: 'bi-layout-wtf', label: 'Общежитие', path: '/dashboard/accomodation', },
            { icon: 'bi-people', label: 'Студенты', path: '/dashboard/students' },
        );

        if (userSession.role?.name?.includes('Администратор')) {
            items.push(
                { icon: 'bi-people-fill', label: 'Пользователи', path: '/dashboard/users' },
            );
        }

        items.push(
            { icon: 'bi-box-arrow-right', label: 'Выйти', action: handleLogout, }
        );

        return items;
    };

    const menuItems = getMenuItems();

    const isPathActive = (path?: string) => {
        if (!path) {
            return false;
        }
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const buildLinkClasses = (isActiveFromNavLink: boolean) => [
        styles.navLink,
        isActiveFromNavLink ? styles.navLinkActive : '',
    ].filter(Boolean).join(' ');

    const renderMenuItem = (
        item: MenuItem,
        index: number,
        variant: 'mobile' | 'desktop'
    ) => {
        const isActive = isPathActive(item.path);
        const baseClass = variant === 'mobile' ? styles.mobileNavItem : styles.navItem;
        const activeClass = isActive
            ? variant === 'mobile'
                ? styles.mobileNavItemActive
                : styles.navItemActive
            : '';
        const listClasses = [baseClass, activeClass].filter(Boolean).join(' ');

        if (item.path) {
            return (
                <li key={index} className={listClasses}>
                    <NavLink
                        to={item.path}
                        className={({ isActive: navLinkActive }) => buildLinkClasses(navLinkActive || isActive)}
                        onClick={variant === 'mobile' ? () => setIsMobileMenuOpen(false) : undefined}
                    >
                        <i className={`bi ${item.icon}`}></i>
                        <span className={styles.navText}>{item.label}</span>
                    </NavLink>
                </li>
            );
        }

        const commonButtonClasses = [styles.navLink, styles.navLinkButton]
            .filter(Boolean)
            .join(' ');

        const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            if (variant === 'mobile') {
                setIsMobileMenuOpen(false);
            }
            item.action?.();
        };

        return (
            <li key={index} className={listClasses}>
                <button type="button" className={commonButtonClasses} onClick={handleButtonClick}>
                    <i className={`bi ${item.icon}`}></i>
                    <span className={styles.navText}>{item.label}</span>
                </button>
            </li>
        );
    };

    if (isMobileView) {
        return (
            <div className={`${styles.mobileSidebar} ${isMobileMenuOpen ? styles.mobileSidebarOpen : ''}`}>
                <div className={styles.mobileHeader}>
                    <button className={styles.mobileToggleBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
                    </button>
                </div>

                <ul className={`${styles.mobileNavMenu} ${isMobileMenuOpen ? styles.mobileNavMenuOpen : ''}`}>
                    {menuItems.map((item, index) => renderMenuItem(item, index, 'mobile'))}
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
                {menuItems.map((item, index) => renderMenuItem(item, index, 'desktop'))}
            </ul>
        </div>
    );
};

export default Sidebar;