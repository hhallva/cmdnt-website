import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

import type { UserSession } from '../../../types/UserSession';

import Tabs from '../../../components/Tabs/Tabs';
import StudentsListTab, { StudentsListFilters } from './components/StudentsListTab';
import AddStudentTab from './components/AddStudentTab';
import ImportStudentsTab from './components/ImportStudentsTab';
import { MOBILE_IMPORT_BREAKPOINT } from './constants';
import {
    studentsQueryKeys,
    useStudentBuildingsQuery,
    useStudentGroupsQuery,
    useStudentsQuery,
    type StudentsFilters,
} from '../../../hooks/useStudentsQuery';
import styles from './Students.module.css';
import GroupsTab from './components/GroupsTab';
import InputField from '../../../components/InputField/InputField';
import ActionButton from '../../../components/ActionButton/ActionButton';

const STUDENTS_TAB_STORAGE_KEY = 'students-active-tab';
const STUDENTS_DEFAULT_TAB_ID = 'list';

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};

const StudentsLayout: React.FC = () => {
    const [studentsPage, setStudentsPage] = useState(1);
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'unassigned' | null>(null);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'all'>('all');
    const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
    const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'all'>('all');
    const [exportHandler, setExportHandler] = useState<(() => void) | null>(null);

    const [groupSearchTerm, setGroupSearchTerm] = useState('');


    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const userSessionStr = typeof window !== 'undefined' ? sessionStorage.getItem('userSession') : null;
    const userSession: UserSession | null = userSessionStr ? JSON.parse(userSessionStr) : null;
    const isEducator = userSession?.role?.name?.toLowerCase()?.includes('воспитатель') ?? false;
    const isAdmin = userSession?.role?.name?.toLowerCase()?.includes('администратор') ?? false;

    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return STUDENTS_DEFAULT_TAB_ID;
        }
        return sessionStorage.getItem(STUDENTS_TAB_STORAGE_KEY) || STUDENTS_DEFAULT_TAB_ID;
    });

    const filters = useMemo<StudentsFilters>(() => ({
        search: searchTerm,
        buildingId: typeof selectedBuildingId === 'number' ? selectedBuildingId : undefined,
        unassigned: selectedBuildingId === 'unassigned',
        groupId: selectedGroupId === 'all' ? undefined : selectedGroupId,
        course: selectedCourse === 'all' ? undefined : selectedCourse,
        gender: selectedGender === 'all' ? undefined : selectedGender === 'male',
    }), [searchTerm, selectedBuildingId, selectedGroupId, selectedCourse, selectedGender]);

    const { data: studentsData, isLoading: isStudentsLoading, error: studentsError } = useStudentsQuery(filters, studentsPage);
    const { data: groups = [], isLoading: areGroupsLoading, error: groupsError } = useStudentGroupsQuery();
    const { data: buildings = [], isLoading: areBuildingsLoading, error: buildingsError } = useStudentBuildingsQuery();

    const students = studentsData?.items ?? [];
    const studentsTotalCount = studentsData?.totalCount ?? 0;
    const loading = isStudentsLoading || areGroupsLoading || areBuildingsLoading;
    const error = studentsError
        ? getErrorMessage(studentsError, 'Не удалось загрузить список студентов')
        : groupsError
            ? getErrorMessage(groupsError, 'Не удалось загрузить группы')
            : buildingsError
                ? getErrorMessage(buildingsError, 'Не удалось загрузить здания')
                : null;

    const updateStudentsPage = useCallback((nextValue: string | number | 'all' | 'male' | 'female' | null, setter: (value: any) => void) => {
        setStudentsPage(1);
        setter(nextValue);
    }, []);


    const handleGroupReset = useCallback(() => {
        setGroupSearchTerm('');
    }, []);


    const handleSearchTermChange = useCallback((value: string) => {
        updateStudentsPage(value, setSearchTerm);
    }, [updateStudentsPage]);

    const handleGroupChange = useCallback((value: number | 'all') => {
        updateStudentsPage(value, setSelectedGroupId);
    }, [updateStudentsPage]);

    const handleCourseChange = useCallback((value: number | 'all') => {
        updateStudentsPage(value, setSelectedCourse);
    }, [updateStudentsPage]);

    const handleGenderChange = useCallback((value: 'male' | 'female' | 'all') => {
        updateStudentsPage(value, setSelectedGender);
    }, [updateStudentsPage]);

    const handleBuildingChange = useCallback((value: number | 'unassigned' | null) => {
        updateStudentsPage(value, setSelectedBuildingId);
    }, [updateStudentsPage]);

    const refreshStudents = useCallback(() => queryClient.invalidateQueries({ queryKey: studentsQueryKeys.lists() }), [queryClient]);


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
        setStudentsPage(1);
        setSearchTerm('');
        setSelectedBuildingId(null);
        setSelectedGroupId('all');
        setSelectedCourse('all');
        setSelectedGender('all');
    };

    const canUseImportTab = !isEducator && !isMobileViewport;

    const groupsSearchBar = (
        <div className={styles.searchPanelRow}>
            <div className={styles.searchLeft}>
                <div className={styles.searchInputWrapper}>
                    <InputField
                        label=""
                        type="text"
                        placeholder="Поиск..."
                        value={groupSearchTerm}
                        onChange={(event) => setGroupSearchTerm(event.target.value)}
                    />
                </div>
                <div className={styles.searchButtons}>
                    <ActionButton
                        variant="secondary"
                        size="md"
                        onClick={handleGroupReset}
                        className={styles.resetButton}
                    >
                        Сбросить
                    </ActionButton>
                </div>
            </div>
        </div>
    );

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
                        onSearchTermChange={handleSearchTermChange}
                        onGroupChange={handleGroupChange}
                        onCourseChange={handleCourseChange}
                        onGenderChange={handleGenderChange}
                        onBuildingChange={handleBuildingChange}
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
                        onStudentCreated={refreshStudents}
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
                        onImportComplete={refreshStudents}
                    />
                ),
            });
        }

        if (isAdmin) {
            items.push({
                id: 'groups',
                title: 'Группы',
                headerContent: groupsSearchBar,
                content: (
                    <GroupsTab searchTerm={groupSearchTerm} />
                ),
            });
        }


        return items;
    }, [
        students,
        studentsTotalCount,
        studentsPage,
        groups,
        groupSearchTerm,
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
        refreshStudents,
        handleBuildingChange,
        handleCourseChange,
        handleGenderChange,
        handleGroupChange,
        handleSearchTermChange,
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
