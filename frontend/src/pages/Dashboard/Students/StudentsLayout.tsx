import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { apiClient } from '../../../api/client';

import type { StudentsDto } from '../../../types/students';
import type { GroupDto } from '../../../types/groups';
import type { UserSession } from '../../../types/UserSession';
import type { BuildingDto } from '../../../types/buildings';

import Tabs from '../../../components/Tabs/Tabs';
import StudentsListTab, { StudentsListFilters } from './components/StudentsListTab';
import AddStudentTab from './components/AddStudentTab';
import ImportStudentsTab from './components/ImportStudentsTab';
import { MOBILE_IMPORT_BREAKPOINT } from './constants';
import styles from './Students.module.css';

const STUDENTS_TAB_STORAGE_KEY = 'students-active-tab';
const STUDENTS_DEFAULT_TAB_ID = 'list';

const StudentsLayout: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [students, setStudents] = useState<StudentsDto[]>([]);
    const [studentsTotalCount, setStudentsTotalCount] = useState(0);
    const [studentsPage, setStudentsPage] = useState(1);
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [buildings, setBuildings] = useState<BuildingDto[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'unassigned' | null>(null);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'all'>('all');
    const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
    const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'all'>('all');
    const [exportHandler, setExportHandler] = useState<(() => void) | null>(null);
    const hasHandledStudentsPaginationRef = useRef(false);
    const hasHandledStudentsFiltersRef = useRef(false);

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

    const fetchStudents = useCallback(async (page: number) => {
        try {
            const studentsResponse = await apiClient.getStudentsPage({
                page,
                search: searchTerm,
                buildingId: typeof selectedBuildingId === 'number' ? selectedBuildingId : undefined,
                unassigned: selectedBuildingId === 'unassigned',
                groupId: selectedGroupId === 'all' ? undefined : selectedGroupId,
                course: selectedCourse === 'all' ? undefined : selectedCourse,
                gender: selectedGender === 'all' ? undefined : selectedGender === 'male',
            });
            setStudents(studentsResponse.items);
            setStudentsTotalCount(studentsResponse.totalCount);
            setError(null);
        } catch (err: any) {
            console.error('Ошибка при обновлении списка студентов:', err);
            setError(err?.message || 'Не удалось обновить список студентов');
        }
    }, [searchTerm, selectedBuildingId, selectedCourse, selectedGender, selectedGroupId]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [studentsResponse, groupsResponse, buildingsResponse] = await Promise.all([
                    apiClient.getStudentsPage({ page: 1 }),
                    apiClient.getAllGroups(),
                    apiClient.getAllBuildings(),
                ]);
                setStudents(studentsResponse.items);
                setStudentsTotalCount(studentsResponse.totalCount);
                setGroups(groupsResponse);
                setBuildings(buildingsResponse);
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
        if (!hasHandledStudentsPaginationRef.current) {
            hasHandledStudentsPaginationRef.current = true;
            return;
        }
        void fetchStudents(studentsPage);
    }, [studentsPage]);

    useEffect(() => {
        if (!hasHandledStudentsFiltersRef.current) {
            hasHandledStudentsFiltersRef.current = true;
            return;
        }

        if (studentsPage !== 1) {
            setStudentsPage(1);
            return;
        }

        void fetchStudents(1);
    }, [fetchStudents, searchTerm, selectedBuildingId, selectedGroupId, selectedCourse, selectedGender]);


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

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedBuildingId(null);
        setSelectedGroupId('all');
        setSelectedCourse('all');
        setSelectedGender('all');
    };

    const canUseImportTab = !isEducator && !isMobileViewport;

    const tabs = useMemo(() => {
        const items: Array<{ id: string; title: string; headerContent: React.ReactNode | null, content: React.ReactNode }> = [
            {
                id: 'list',
                title: 'Список',
                headerContent: (
                    <StudentsListFilters
                        groups={groups}
                        buildings={buildings}
                        searchTerm={searchTerm}
                        selectedGroupId={selectedGroupId}
                        selectedCourse={selectedCourse}
                        selectedGender={selectedGender}
                        selectedBuildingId={selectedBuildingId}
                        isAdvancedFilterOpen={isAdvancedFilterOpen}
                        isEducator={isEducator}
                        onSearchTermChange={setSearchTerm}
                        onGroupChange={setSelectedGroupId}
                        onCourseChange={setSelectedCourse}
                        onGenderChange={setSelectedGender}
                        onBuildingChange={setSelectedBuildingId}
                        onToggleAdvancedFilters={() => setIsAdvancedFilterOpen(prev => !prev)}
                        onResetFilters={resetFilters}
                        onExport={() => exportHandler?.()}
                    />
                ),
                content: (
                    <StudentsListTab
                        students={students}
                        groups={groups}
                        isEducator={isEducator}
                        buildings={buildings}
                        selectedBuildingId={selectedBuildingId}
                        searchTerm={searchTerm}
                        selectedGroupId={selectedGroupId}
                        selectedCourse={selectedCourse}
                        selectedGender={selectedGender}
                        totalCount={studentsTotalCount}
                        currentPage={studentsPage}
                        onPageChange={setStudentsPage}
                        onExportReady={setExportHandler}
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
                        onStudentCreated={() => fetchStudents(studentsPage)}
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
                        onImportComplete={() => fetchStudents(studentsPage)}
                    />
                ),
            });
        }

        return items;
    }, [
        students,
        studentsTotalCount,
        studentsPage,
        groups,
        buildings,
        selectedBuildingId,
        searchTerm,
        selectedGroupId,
        selectedCourse,
        selectedGender,
        isAdvancedFilterOpen,
        isEducator,
        canUseImportTab,
        exportHandler,
        fetchStudents,
        handleStudentClick,
    ]);

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
        <div className={styles.tabsWrapper}>
            <Tabs
                tabs={tabs}
                activeTabId={activeTabId}
                onTabChange={handleTabChange}
            />
        </div>
    );
};

export default StudentsLayout;
