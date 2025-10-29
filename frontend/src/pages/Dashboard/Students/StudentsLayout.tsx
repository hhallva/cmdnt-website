import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../../api/client';

import type { StudentsDto } from '../../../types/students';
import type { GroupDto } from '../../../types/groups';

import Tabs from '../../../components/Tabs/Tabs';
import CommonTable from '../../../components/CommonTable/CommonTable'

import styles from './Students.module.css';

const StudentsLayout: React.FC = () => {
    // #region Загрузка данных
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [students, setStudents] = useState<StudentsDto[]>([]);
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsResponse, groupsResponse] = await Promise.all([
                    apiClient.getAllStudents(),
                    apiClient.getAllGroups()
                ]);

                setStudents(studentsResponse);
                setGroups(groupsResponse);
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

    // #region Таблица
    const studentColumns = [
        {
            key: 'fullName',
            title: 'ФИО',
            render: (student: StudentsDto) => `${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.trim() || 'Нет',
        },
        {
            key: 'group.name',
            title: 'Группа',
        },
        {
            key: 'group.course',
            title: 'Курс',
            className: 'text-center',
        },
        {
            key: 'gender',
            title: 'Пол',
            className: 'text-center',
            render: (student: StudentsDto) => student.gender ? "М" : "Ж",
        },
        {
            key: 'blockNumber',
            title: 'Блок',
            className: 'text-center',
            render: (student: StudentsDto) => student.blockNumber ?? "Нет",
        },
        {
            key: 'phone',
            title: 'Телефон',
            render: (student: StudentsDto) => student.phone ?? "Нет",
        },
        {
            key: 'birthday',
            title: 'Дата рождения',
            render: (student: StudentsDto) =>
                new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(student.birthday)),
        },
    ];

    const studentActions = [
        {
            render: (student: StudentsDto) => (
                <button
                    className={`${styles.actionBtn} ${styles.actionBtnMore}`}
                    onClick={() => alert(`Подробная информация о студенте:\n${student.surname} ${student.name} ${student.patronymic}\nID: ${student.id}`)}
                >
                    Подробнее
                </button>
            ),
        },
    ];

    // #endregion


    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;

    const listTabContent = (
        <>
            <CommonTable
                title="Список студентов"
                data={students}
                totalCount={students.length}
                columns={studentColumns}
                actions={studentActions}
                emptyMessage="Студенты не найдены"
            />
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