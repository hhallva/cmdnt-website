import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../../api/client';

import type { StudentsDto } from '../../../types/students';

import Tabs from '../../../components/Tabs/Tabs';

import styles from './Students.module.css';

const StudentsLayout: React.FC = () => {
    // #region Загрузка данных
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [students, setStudents] = useState<StudentsDto[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsResponse] = await Promise.all([
                    apiClient.getAllStudents(),
                ]);

                setStudents(studentsResponse);
                console.info("Получение студентов");
            } catch (err: any) {
                console.error('Ошибка при загрузке данных:', err);

                setError(err.message || 'Ошибка при загрузке данных');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const fetchStudents = async () => {
        try {
            const studentsResponse = await apiClient.getAllStudents();
            setStudents(studentsResponse);
        } catch (err: any) {
            console.error('Ошибка при загрузке студентов:', err);
            throw err;
        }
    };
    // #endregion

    // #region Поиск и фильтрация

    const filteredStudents = students

    // #endregion

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;

    const listTabContent = (
        <>
            <h3 className="mb-3">Список студентов</h3>
            <div className={styles.tableResponsive}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ФИО</th>
                            <th >Группа</th>
                            <th className="text-center">Курс</th>
                            <th className="text-center">Пол</th>
                            <th className="text-center">Блок</th>
                            <th>Телефон</th>
                            <th>Дата рождения</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <tr key={student.id}>
                                        <td>{student.surname} {student.name} {student.patronymic}</td>
                                        <td>{student.group.name}</td>
                                        <td className="text-center">{student.group.course}</td>
                                        <td className="text-center">{student.gender ? "М" : "Ж"}</td>
                                        <td className="text-center">{student.blockNumber ?? "Нет"}</td>
                                        <td>{student.phone ?? "Нет"}</td>
                                        <td>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(student.birthday))}</td>
                                        <td>
                                            <div>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnMore}`}
                                                    onClick={() => alert(`Подробная информация о студенте:\n${student.surname} ${student.name} ${student.patronymic}\nID: ${student.id}`)}
                                                >
                                                    Подробнее
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center">
                                        Студенты не найдены
                                    </td>
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
        </>
    );

    const addTabContent = (
        <>
            <h3>Добавить нового студента</h3>
            <p>Здесь будет форма для добавления нового студента.</p>
        </>
    );

    const tabs = [
        {
            id: 'list',
            title: 'Список студентов',
            content: listTabContent,
        },
        {
            id: 'add',
            title: 'Добавить студента',
            content: addTabContent,
        },
    ];

    return (
        <>
            <Tabs tabs={tabs} defaultActiveTabId="list" />
        </>
    );
};

export default StudentsLayout;