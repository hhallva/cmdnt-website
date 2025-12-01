import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { apiClient } from '../../../api/client';

import type { StudentsDto } from '../../../types/students';
import type { GroupDto } from '../../../types/groups';
import type { UserSession } from '../../../types/UserSession';

import Tabs from '../../../components/Tabs/Tabs';
import StudentsListTab from './components/StudentsListTab';
import AddStudentTab from './components/AddStudentTab';
import ImportStudentsTab from './components/ImportStudentsTab';
import { MOBILE_IMPORT_BREAKPOINT } from './constants';

const STUDENTS_TAB_STORAGE_KEY = 'students-active-tab';
const STUDENTS_DEFAULT_TAB_ID = 'list';

const StudentsLayout: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [students, setStudents] = useState<StudentsDto[]>([]);
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [isMobileViewport, setIsMobileViewport] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const userSessionStr = typeof window !== 'undefined' ? sessionStorage.getItem('userSession') : null;
    const userSession: UserSession | null = userSessionStr ? JSON.parse(userSessionStr) : null;
    const isEducator = userSession?.role?.name?.toLowerCase()?.includes('воспитатель') ?? false;

    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return STUDENTS_DEFAULT_TAB_ID;
        }
        return sessionStorage.getItem(STUDENTS_TAB_STORAGE_KEY) || STUDENTS_DEFAULT_TAB_ID;
    });

    const fetchStudents = useCallback(async () => {
        try {
            const studentsResponse = await apiClient.getAllStudents();
            setStudents(studentsResponse);
            setError(null);
        } catch (err: any) {
            console.error('Ошибка при обновлении списка студентов:', err);
            setError(err?.message || 'Не удалось обновить список студентов');
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [studentsResponse, groupsResponse] = await Promise.all([
                    apiClient.getAllStudents(),
                    apiClient.getAllGroups(),
                ]);
                setStudents(studentsResponse);
                setGroups(groupsResponse);
                setError(null);
            } catch (err: any) {
                console.error('Ошибка при загрузке данных:', err);
                setError(err?.message || 'Ошибка при загрузке данных');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const updateViewport = () => setIsMobileViewport(window.innerWidth <= MOBILE_IMPORT_BREAKPOINT);
        updateViewport();
        window.addEventListener('resize', updateViewport);
        return () => window.removeEventListener('resize', updateViewport);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        sessionStorage.setItem(STUDENTS_TAB_STORAGE_KEY, activeTabId);
    }, [activeTabId]);

    const handleStudentClick = useCallback((studentId: number) => {
        navigate(`/dashboard/students/${studentId}`);
    }, [navigate]);

    const canUseImportTab = !isEducator && !isMobileViewport;

    const tabs = useMemo(() => {
        const items: Array<{ id: string; title: string; headerContent: React.ReactNode | null, content: React.ReactNode }> = [
            {
                id: 'list',
                title: 'Список',
                headerContent: null,
                content: (
                    <StudentsListTab
                        students={students}
                        groups={groups}
                        isEducator={isEducator}
                        onStudentClick={handleStudentClick}
                    />
                ),
            },
        ];

        if (!isEducator) {
            items.push({
                id: 'add',
                title: 'Новый студент',
                headerContent: null,
                content: (
                    <AddStudentTab
                        groups={groups}
                        onStudentCreated={fetchStudents}
                    />
                ),
            });
        }

        if (canUseImportTab) {
            items.push({
                id: 'import',
                title: 'Импорт студентов',
                headerContent: null,
                content: (
                    <ImportStudentsTab
                        groups={groups}
                        onImportComplete={fetchStudents}
                    />
                ),
            });
        }

        return items;
    }, [students, groups, isEducator, canUseImportTab, fetchStudents, handleStudentClick]);

    useEffect(() => {
        const state = location.state as { fromSidebar?: boolean } | null;
        if (!state?.fromSidebar) {
            return;
        }

        setActiveTabId(STUDENTS_DEFAULT_TAB_ID);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(STUDENTS_TAB_STORAGE_KEY, STUDENTS_DEFAULT_TAB_ID);
        }

        const { fromSidebar, ...restState } = state;
        const nextState = Object.keys(restState).length ? restState : undefined;
        navigate(location.pathname, { replace: true, state: nextState });
    }, [location.state, location.pathname, navigate]);

    useEffect(() => {
        if (tabs.some(tab => tab.id === activeTabId)) {
            return;
        }
        const fallbackTabId = tabs[0]?.id ?? STUDENTS_DEFAULT_TAB_ID;
        setActiveTabId(fallbackTabId);
    }, [tabs, activeTabId]);

    const handleTabChange = (tabId: string) => {
        if (tabs.some(tab => tab.id === tabId)) {
            setActiveTabId(tabId);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3" role="alert">
                {error}
            </div>
        );
    }

    return (
        <Tabs
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={handleTabChange}
        />
    );
};

export default StudentsLayout;
