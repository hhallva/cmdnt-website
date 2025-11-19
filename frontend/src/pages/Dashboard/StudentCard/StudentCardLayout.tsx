// src/pages/Dashboard/Students/StudentCardPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiClient } from '../../../api/client';
import type { StudentsDto, ContactDto, ExtStudentData } from '../../../types/students';
import type { RoomDto } from '../../../types/rooms';
import type { UserSession } from '../../../types/UserSession';

import ActionButton from '../../../components/ActionButton/ActionButton';

import styles from './StudentCard.module.css';


const StudentCardLayout: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();

    const [student, setStudent] = useState<StudentsDto | null>(null);
    const [contacts, setContacts] = useState<ContactDto[]>([]);
    const [extStudent, setExtStudent] = useState<ExtStudentData>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [room, setRoom] = useState<RoomDto | null>(null);
    const [roomLoading, setRoomLoading] = useState(false);
    const [roomError, setRoomError] = useState<string | null>(null);

    const [neighbours, setNeighbours] = useState<StudentsDto[]>([]);

    const userSessionStr = sessionStorage.getItem('userSession');
    const userSession: UserSession = JSON.parse(userSessionStr!);

    const [activeTab, setActiveTab] = useState('personal');

    const studentIdNum = Number(studentId);

    if (isNaN(studentIdNum)) {
        return <div className="alert alert-danger m-3" role="alert">Некорректный ID студента.</div>;
    }

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [studentResponse, contactsResponse, extResponse] = await Promise.all([
                    apiClient.getStudentById(studentIdNum),
                    apiClient.getStudentContactsById(studentIdNum),
                    apiClient.getExtStudentById(studentIdNum),
                ]);

                setStudent(studentResponse);
                setContacts(contactsResponse);
                setExtStudent(extResponse);
                console.info(`Получение данных студента с ID: ${studentIdNum} и его контактов`);
            } catch (err: any) {
                console.error('Ошибка при загрузке данных студента:', err);
                setError(err.message || 'Ошибка при загрузке данных студента');
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [studentIdNum, navigate]);

    useEffect(() => {
        if (activeTab === 'housing' && student && student.roomId != null) {
            const fetchRoom = async (roomId: number) => {
                setRoomLoading(true);
                setRoomError(null);

                try {

                    const [roomResponse, neighboursResponse] = await Promise.all([
                        apiClient.getRoomById(roomId),
                        apiClient.getStudentsByRoomId(roomId),
                    ]);
                    setRoom(roomResponse);
                    setNeighbours(neighboursResponse);
                } catch (err: any) {
                    console.error('Ошибка при загрузке данных комнаты:', err);
                    setRoomError(err.message || 'Ошибка при загрузке данных комнаты');
                    setRoom(null); // Очищаем предыдущие данные
                } finally {
                    setRoomLoading(false);
                }
            };

            fetchRoom(student.roomId);
        } else if (activeTab === 'housing' && student && !student.roomId) {
            setRoom(null);
            setRoomLoading(false);
        }
        // Если вкладка не "housing", не загружаем комнату
    }, [activeTab, student]);


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
        } catch (error: any) {
            alert(error.message || 'Не удалось удалить студента.');
        }

    };

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;
    if (!student) return <div className="alert alert-info m-3" role="alert">Студент не найден.</div>;

    // --- Вкладки ---

    const calculateAge = (birthday: string): number => {
        const birthDate = new Date(birthday);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Если день рождения в этом году ещё не наступил, вычитаем 1 год
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const studentAge = student ? calculateAge(student.birthday) : null;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'personal':
                return (
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <h3 className={styles.infoCardTitle}>Основная информация</h3>
                            <div className={styles.infoItem}>
                                <div className={styles.infoLabel}>Фамилия Имя Отчество</div>
                                <div className={styles.infoValue}>{student.surname || 'Нет'} {student.name || 'Нет'} {student.patronymic}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoLabel}>Дата рождения</div>
                                <div className={styles.infoValue}>
                                    {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(student.birthday))}
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoLabel}>Возраст</div>
                                <div className={styles.infoValue}>{studentAge !== null ? `${studentAge} лет` : 'Нет данных'}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoLabel}>Пол</div>
                                <div className={styles.infoValue}>{student.gender ? 'Мужской' : 'Женский'}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoLabel}>Откуда приехал</div>
                                <div className={styles.infoValue}>{extStudent?.origin || 'Нет'}</div>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3 className={styles.infoCardTitle}>Учебная информация</h3>
                            <div className={styles.infoItem}>
                                <div className={styles.infoLabel}>Группа</div>
                                <div className={styles.infoValue}>{student.group?.name || 'Нет'}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoLabel}>Курс</div>
                                <div className={styles.infoValue}>{student.group?.course || 'Нет'}</div>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3 className={styles.infoCardTitle}>Контактная информация</h3>
                            <div className={styles.infoItem}>
                                <div className={styles.infoLabel}>Телефон</div>
                                <div className={styles.infoValue}>{student.phone || 'Нет'}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoLabel}>Контакты</div>
                                {contacts.length > 0 && (
                                    <>
                                        {contacts.map((contact, index) => (
                                            <div key={index} className={styles.infoItem}>
                                                <div className={styles.infoValue}>
                                                    {contact.comment || 'Без комментария'} <br /> {contact.phone}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                            {/* --- Отображение контактов из API --- */}

                        </div>
                    </div>
                );
            case 'housing':
                return <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                        {roomLoading && (
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                                <div className="spinner-border" role="status"><span className="visually-hidden">Загрузка комнаты...</span></div>
                            </div>
                        )}
                        {roomError && (
                            <div className="alert alert-info text-center" role="alert">
                                {roomError}
                            </div>
                        )}
                        <h3 className={styles.infoCardTitle}>Текущее проживание</h3>
                        {!roomLoading && !roomError && room && (
                            <div className={styles.housingInfo}>
                                <div className={styles.housingIcon}>
                                    <i className="bi bi-building"></i>
                                </div>
                                <div className={styles.housingDetails}>
                                    <h4>Блок {room.roomNumber || 'Нет данных'}</h4>
                                    <p>Вместимость: {room.capacity || 0}</p>
                                    <p>Этаж {room.floorNumber || 'Нет данных'}</p>
                                </div>

                            </div>
                        )}

                        {!roomLoading && !roomError && room && (
                            < div className={styles.infoItem}>
                                <h3 className={styles.infoLabel}>Соседи по комнате</h3>

                                {neighbours.length > 1 ? (
                                    neighbours
                                        .filter(neighbour => neighbour.id !== student.id)
                                        .map((neighbour) => (
                                            <div className={styles.infoValue}>
                                                <React.Fragment key={neighbour.id}>
                                                    {neighbour.surname} {neighbour.name} {neighbour.patronymic} ({neighbour.group.name})
                                                </React.Fragment>
                                            </div>
                                        ))
                                ) : (
                                    'Нет соседей'
                                )}

                            </div>
                        )}

                        {/* Если студент не привязан к комнате, но нет ошибки от API */}
                        {
                            !roomLoading && !roomError && !room && (
                                <div className="alert text-center" role="alert">
                                    Студент не заселен.
                                </div>
                            )
                        }
                    </div >

                </div >;
            // case 'notes':
            //     return <div>Содержимое вкладки "Заметки"</div>;
            default:
                return null;
        }
    };

    return (
        <div className={styles.studentProfile}>
            {/* Заголовок карточки студента */}
            <div className={styles.profileHeader}>
                <div className={styles.studentBasicInfo}>
                    <div className={styles.studentPhoto}>
                        <div className={styles.studentPhotoPlaceholder}>
                            {student.name?.charAt(0)}{student.surname?.charAt(0)}
                        </div>
                    </div>
                    <div className={styles.studentNameInfo}>
                        <h2>{student.surname || ''} {student.name || ''} {student.patronymic || ''}</h2>
                    </div>
                </div>
            </div>

            {/* Навигация по вкладкам */}
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
                {/* <div
                    className={`${styles.navItemProfile} ${activeTab === 'notes' ? styles.active : ''}`}
                    onClick={() => setActiveTab('notes')}
                >
                    Заметки
                </div> */}
            </div>

            {/* Содержимое активной вкладки */}
            <div className={styles.tabContent}>
                {renderTabContent()}
            </div>


            {
                (userSession && !userSession.role?.name?.toLowerCase().includes('воспитатель')) && (
                    <div className={styles.actionButtons}>
                        <ActionButton>
                            <i className="bi bi-pencil me-1"></i>
                            Редактировать данные
                        </ActionButton>
                        <ActionButton
                            variant="danger">
                            <i className="bi bi-box-arrow-right me-1"></i>
                            Выселить студента
                        </ActionButton>
                        <ActionButton
                            variant="danger"
                            onClick={handleDeleteClick}>
                            Удалить
                        </ActionButton>
                    </div>
                )
            }

        </div>
    );
};

export default StudentCardLayout;