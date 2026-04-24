// src/pages/Dashboard/Students/StudentCardLayout.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { apiClient } from '../../../api/client';
import { useStudentData } from '../../../hooks/useStudentData';
import { useRoomData } from '../../../hooks/useRoomData';
import type { UserSession } from '../../../types/UserSession';

import ActionButton from '../../../components/ActionButton/ActionButton';
import { getStudentImageSrc } from '../../../utils/students';
import PersonalInfoTab from './components/PersonalInfoTab';
import HousingInfoTab from './components/HousingInfoTab';
import NotesTab from './components/NotesTab/NotesTab';

import styles from './StudentCard.module.css';
import EditStudentModal from './components/EditStudentModal/EditStudentModal';

type StudentTabKey = 'personal' | 'housing' | 'notes';

const STORAGE_DEFAULT_TAB: StudentTabKey = 'personal';
const STRUCTURE_TABS_STORAGE_KEY = 'structure-active-tab';
const STRUCTURE_SETTLEMENT_PREFILL_KEY = 'structure-settlement-prefill';
const SETTLEMENT_TAB_ID = 'settlement';
const getStoredTab = (key: string): StudentTabKey => {
    if (typeof window === 'undefined') return STORAGE_DEFAULT_TAB;
    const saved = sessionStorage.getItem(key);
    return saved === 'housing' || saved === 'notes' ? saved : STORAGE_DEFAULT_TAB;
};

const buildFullName = (...parts: Array<string | null | undefined>) => {
    return parts
        .map(part => part?.trim())
        .filter((part): part is string => Boolean(part && part.length))
        .join(' ');
};

const buildInitials = (...parts: Array<string | null | undefined>) => {
    const letters = parts
        .map(part => part?.trim().charAt(0))
        .filter((letter): letter is string => Boolean(letter))
        .map(letter => letter.toUpperCase());
    return letters.length ? letters.join('') : '';
};

const StudentCardLayout: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const studentIdNum = Number(studentId);
    const tabStorageKey = studentId ? `student-card-active-tab-${studentId}` : 'student-card-active-tab';

    const [activeTab, setActiveTab] = useState<StudentTabKey>(() => getStoredTab(tabStorageKey));
    const [editModalOpen, setEditModalOpen] = useState(false);

    useEffect(() => {
        setActiveTab(getStoredTab(tabStorageKey));
    }, [tabStorageKey]);

    useEffect(() => {
        const state = location.state as { fromSidebar?: boolean } | null;
        if (!state?.fromSidebar) {
            return;
        }

        setActiveTab(STORAGE_DEFAULT_TAB);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(tabStorageKey, STORAGE_DEFAULT_TAB);
        }

        const { fromSidebar, ...restState } = state;
        const nextState = Object.keys(restState).length ? restState : undefined;
        navigate(location.pathname, { replace: true, state: nextState });
    }, [location.state, location.pathname, navigate, tabStorageKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(tabStorageKey, activeTab);
    }, [activeTab, tabStorageKey]);

    const { student, loading, error, notFound, refetch } = useStudentData(studentIdNum);
    const { room, neighbours, loading: roomLoading, error: roomError, refetch: refetchRoomData } = useRoomData(
        student?.roomId ?? null,
        activeTab === 'housing'
    );

    // Получаем сессию
    const userSessionStr = sessionStorage.getItem('userSession');
    const userSession: UserSession = userSessionStr ? JSON.parse(userSessionStr) : null;

    useEffect(() => {
        if (Number.isNaN(studentIdNum) || studentIdNum <= 0) {
            navigate('/not-found', { replace: true });
        }
    }, [studentIdNum, navigate]);

    useEffect(() => {
        if (notFound) {
            navigate('/not-found', { replace: true });
        }
    }, [notFound, navigate]);

    // Загрузка и ошибки
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }
    if (error) return <div className="alert alert-danger m-3">{error}</div>;
    if (!student) return <div className="alert alert-info m-3">Студент не найден.</div>;

    const studentFullName = buildFullName(student.name, student.patronymic);
    const studentInitials = buildInitials(student.surname, student.name);
    const studentImageSrc = getStudentImageSrc(student.image);
    const currentUserFullName = buildFullName(userSession?.surname, userSession?.name, userSession?.patronymic) || userSession?.name || undefined;

    // Удаление студента
    const handleDeleteClick = async () => {
        if (!student?.id) return;
        const confirmed = confirm(
            'Вы уверены, что хотите удалить студента?\n' +
            'Все данные о студенте, его контактах и заселении будут безвозвратно удалены.'
        );
        if (!confirmed) return;

        try {
            await apiClient.deleteStudent(student.id);
            alert('Студент успешно удалён.');
            navigate('/dashboard/students');
        } catch (err: any) {
            alert(err.message || 'Не удалось удалить студента.');
        }
    };

    const handleEvictClick = async () => {
        if (!student?.id) return;
        const confirmed = confirm(
            'Вы уверены, что хотите выселить студента?\n'
        );
        if (!confirmed) return;

        try {
            await apiClient.evictStudent(student.id);
            alert('Студент успешно выселен.');
            refetch();
            refetchRoomData();

        } catch (err: any) {
            alert(err.message || 'Не удалось выселить студента.');
        }
    };

    const handleSettleClick = () => {
        if (!student?.id) {
            return;
        }
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(STRUCTURE_TABS_STORAGE_KEY, SETTLEMENT_TAB_ID);
            sessionStorage.setItem(STRUCTURE_SETTLEMENT_PREFILL_KEY, JSON.stringify({ studentId: student.id }));
        }
        navigate('/dashboard/accomodation');
    };

    // Рендер вкладок
    const renderTabContent = () => {
        switch (activeTab) {
            case 'personal':
                return <PersonalInfoTab student={student} contacts={student.contacts || []} />;
            case 'housing':
                return (
                    <HousingInfoTab
                        room={room}
                        neighbours={neighbours}
                        student={student}
                        loading={roomLoading}
                        error={roomError}
                    />
                );
            case 'notes':
                return (
                    <NotesTab
                        studentId={student.id}
                        studentName={studentFullName}
                        currentUserName={currentUserFullName}
                        currentUserId={userSession?.id ?? null}
                        currentUserRoleName={userSession?.role?.name ?? null}
                    />
                );
            default:
                return null;
        }
    };

    // Проверка роли: воспитатель не видит кнопки
    const isEducator = userSession?.role?.name?.toLowerCase().includes('воспитатель');

    return (
        <>
            <div className={styles.formSection}>
                {/* Заголовок */}
                <div className={styles.profileHeader}>
                    <div className={styles.studentBasicInfo}>
                        <div className={styles.studentPhoto}>
                            {studentImageSrc ? (
                                <img src={studentImageSrc} alt={student.surname || 'Фотография студента'} />
                            ) : (
                                <div className={styles.studentPhotoPlaceholder}>{studentInitials}</div>
                            )}
                        </div>
                        <div className={styles.studentNameInfo}>
                            <h2>{student.surname} <br />{studentFullName || '—'}</h2>
                        </div>
                    </div>
                </div>

                {/* Вкладки */}
                <div className={styles.profileNavigation}>
                    <div className={`${styles.navItemProfile} ${activeTab === 'personal' ? styles.active : ''}`}
                        onClick={() => setActiveTab('personal')}>
                        Личная информация
                    </div>
                    <div className={`${styles.navItemProfile} ${activeTab === 'housing' ? styles.active : ''}`}
                        onClick={() => setActiveTab('housing')}>
                        Проживание
                    </div>
                    <div className={`${styles.navItemProfile} ${activeTab === 'notes' ? styles.active : ''}`}
                        onClick={() => setActiveTab('notes')}>
                        Заметки
                    </div>
                </div>

            </div >

            <div className='mt-4 mb-4'>
                {/* Контент */}
                {renderTabContent()}
            </div>


            {/* Кнопки действий */}

            {
                !isEducator && (activeTab === 'personal' || activeTab === 'housing') && (
                    <div className={styles.formSection}>
                        <div className={`$ ${styles.actionButtonsBar}`}>
                            <div className={styles.actionButtonsGroup}>
                                {activeTab === 'personal' && (
                                    <ActionButton
                                        className={styles.actionButtonFullWidth}
                                        size='md'
                                        variant="danger" onClick={handleDeleteClick}>
                                        Удалить
                                    </ActionButton>
                                )}
                            </div>
                            {activeTab === 'housing' && (
                                student.roomId ? (
                                    <ActionButton
                                        className={styles.actionButtonFullWidth}
                                        size='md'
                                        variant="danger"
                                        onClick={handleEvictClick}>
                                        Выселить
                                    </ActionButton>
                                ) : (
                                    <ActionButton
                                        variant="primary"
                                        className={styles.actionButtonFullWidth}
                                        size='md'
                                        onClick={handleSettleClick}>
                                        Заселить
                                    </ActionButton>
                                )
                            )}
                            {activeTab === 'personal' && (
                                <ActionButton
                                    className={styles.actionButtonFullWidth}
                                    size='md'
                                    onClick={() => setEditModalOpen(true)}>
                                    Редактировать
                                </ActionButton>
                            )}

                        </div>
                    </div >
                )
            }

            {/* Модальное окно редактирования */}
            {
                editModalOpen && student && (
                    <EditStudentModal
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        student={student}
                        onSave={() => {
                            refetch();
                            setEditModalOpen(false);
                        }}
                        contacts={student.contacts || []} />
                )
            }

        </>
    );
};

export default StudentCardLayout;