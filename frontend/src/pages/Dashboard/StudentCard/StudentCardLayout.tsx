// src/pages/Dashboard/Students/StudentCardPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import type { StudentsDto, ContactDto } from '../../../types/students';
import styles from './StudentCard.module.css'; // Создадим файл стилей
import ActionButton from '../../../components/ActionButton/ActionButton';

const StudentCardLayout: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('personal');

    const [student, setStudent] = useState<StudentsDto | null>(null);
    const [contacts, setContacts] = useState<ContactDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const studentIdNum = Number(studentId);

    if (isNaN(studentIdNum)) {
        return <div className="alert alert-danger m-3" role="alert">Некорректный ID студента.</div>;
    }

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [studentResponse, contactsResponse] = await Promise.all([
                    apiClient.getStudentById(studentIdNum),
                    apiClient.getStudentContactsById(studentIdNum), // Предполагаем, что метод существует
                ]);

                setStudent(studentResponse);
                setContacts(contactsResponse);
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
                                <div className={styles.infoValue}>{student.origin || 'Нет'}</div>
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
            // case 'housing':
            //     return <div>Содержимое вкладки "Проживание"</div>;
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
                            {student.name?.charAt(0) || '?'}{student.surname?.charAt(0) || '?'}
                        </div>
                    </div>
                    <div className={styles.studentNameInfo}>
                        <h2>{student.surname || ''} {student.name || ''} {student.patronymic || ''}</h2>
                        <p>Группа: {student.group?.name || 'Нет'} | Курс: {student.group?.course || 'Нет'}</p>
                        <p>Дата рождения: {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(student.birthday))} | Пол: {student.gender ? 'Мужской' : 'Женский'}</p>
                        <p>Откуда приехал: {student.origin || 'Нет'}</p>
                    </div>
                </div>
                {/* <div className={`${styles.studentStatus} ${student.isActive ? styles.statusResident : styles.statusEvicted}`}>
                    {student.isActive ? 'Проживает' : 'Выселен'}
                </div> */}
            </div>

            {/* Навигация по вкладкам */}
            <div className={styles.profileNavigation}>
                <div
                    className={`${styles.navItemProfile} ${activeTab === 'personal' ? styles.active : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    Личная информация
                </div>
                {/* <div
                    className={`${styles.navItemProfile} ${activeTab === 'housing' ? styles.active : ''}`}
                    onClick={() => setActiveTab('housing')}
                >
                    Проживание
                </div>
                <div
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

            {/* Кнопки действий */}
            <div className={styles.actionButtons}>
                <ActionButton>
                    <i className="bi bi-pencil me-1"></i>
                    Редактировать данные
                </ActionButton>
                <ActionButton
                    variant="dark">
                    <i className="bi bi-printer me-1"></i>
                    Распечатать карточку
                </ActionButton>
                <ActionButton
                    variant="dark">
                    <i className="bi bi-file-earmark-pdf me-1"></i>
                    Экспорт в PDF
                </ActionButton>
                <ActionButton
                    variant="danger">
                    <i className="bi bi-box-arrow-right me-1"></i>
                    Выселить студента
                </ActionButton>
                <ActionButton
                    variant="danger">
                    Удалить
                </ActionButton>
            </div>
        </div>
    );
};

export default StudentCardLayout;