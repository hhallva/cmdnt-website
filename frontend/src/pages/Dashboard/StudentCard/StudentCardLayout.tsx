// src/pages/Dashboard/Students/StudentCardLayout.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiClient } from '../../../api/client';
import { useStudentData } from '../../../hooks/useStudentData';
import { useRoomData } from '../../../hooks/useRoomData';
import type { UserSession } from '../../../types/UserSession';

import ActionButton from '../../../components/ActionButton/ActionButton';
import PersonalInfoTab from './components/PersonalInfoTab';
import HousingInfoTab from './components/HousingInfoTab';

import styles from './StudentCard.module.css';

const StudentCardLayout: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const studentIdNum = Number(studentId);
    const [activeTab, setActiveTab] = useState('personal');

    const { student, loading, error } = useStudentData(studentIdNum);
    const { room, neighbours, loading: roomLoading, error: roomError } = useRoomData(
        student?.roomId ?? null,
        activeTab === 'housing'
    );

    // Получаем сессию
    const userSessionStr = sessionStorage.getItem('userSession');
    const userSession: UserSession = userSessionStr ? JSON.parse(userSessionStr) : null;

    // Валидация ID
    if (isNaN(studentIdNum)) {
        return <div className="alert alert-danger m-3">Некорректный ID студента.</div>;
    }

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
            // Обновляем данные студента после выселения
            // Можно вызвать повторное получение данных или обновить состояние вручную
            // Здесь для простоты просто перезагрузим страницу
            window.location.reload();

        } catch (err: any) {
            alert(err.message || 'Не удалось выселить студента.');
        }
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
            default:
                return null;
        }
    };

    // Проверка роли: воспитатель не видит кнопки
    const isEducator = userSession?.role?.name?.toLowerCase().includes('воспитатель');

    return (
        <div className={styles.studentProfile}>
            {/* Заголовок */}
            <div className={styles.profileHeader}>
                <div className={styles.studentBasicInfo}>
                    <div className={styles.studentPhoto}>
                        <div className={styles.studentPhotoPlaceholder}>
                            {student.name?.charAt(0) || '?'}
                            {student.surname?.charAt(0) || '?'}
                        </div>
                    </div>
                    <div className={styles.studentNameInfo}>
                        <h2>
                            {student.surname || ''} {student.name || ''} {student.patronymic || ''}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Вкладки */}
            <div className={styles.profileNavigation}>
                <div
                    className={`${styles.navItemProfile} ${activeTab === 'personal' ? styles.active : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    Личная информация
                </div>
                <div
                    className={`${styles.navItemProfile} ${activeTab === 'housing' ? styles.active : ''}`}
                    onClick={() => setActiveTab('housing')}
                >
                    Проживание
                </div>
            </div>

            {/* Контент */}
            <div className={styles.tabContent}>{renderTabContent()}</div>

            {/* Кнопки действий */}
            {!isEducator && (
                <div className={styles.actionButtons} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {activeTab === 'personal' && (
                            <ActionButton >
                                <i className="bi bi-pencil me-1"></i>
                                Редактировать данные
                            </ActionButton>
                        )}
                        {activeTab === 'housing' && (
                            student.roomId ? (
                                <ActionButton variant="danger" onClick={handleEvictClick}>
                                    <i className="bi bi-box-arrow-right me-1"></i>
                                    Выселить студента
                                </ActionButton>
                            ) : (
                                <ActionButton variant="success">
                                    <i className="bi bi-house-door me-1"></i>
                                    Заселить студента
                                </ActionButton>
                            )
                        )}
                    </div>
                    <ActionButton variant="danger" onClick={handleDeleteClick}>
                        Удалить
                    </ActionButton>
                </div>
            )}
        </div>
    );
};

export default StudentCardLayout;