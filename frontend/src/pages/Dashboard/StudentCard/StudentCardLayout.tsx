// src/pages/Dashboard/Students/StudentCardPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import type { StudentsDto } from '../../../types/students';
import styles from './StudentCard.module.css'; // Создадим файл стилей

const StudentCardLayout: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>(); // Получаем ID студента из URL
    const navigate = useNavigate(); // Для навигации назад

    const [student, setStudent] = useState<StudentsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Проверяем, что studentId — это число
    const studentIdNum = Number(studentId);

    if (isNaN(studentIdNum)) {
        return <div className="alert alert-danger m-3" role="alert">Некорректный ID студента.</div>;
    }

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const data = await apiClient.getStudentById(studentIdNum); // Вызываем метод API
                setStudent(data);
                console.info(`Получение данных студента с ID: ${studentIdNum}`);
            } catch (err: any) {
                console.error('Ошибка при загрузке данных студента:', err);
                setError(err.message || 'Ошибка при загрузке данных студента');
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [studentIdNum, navigate]); // Зависимость от studentIdNum

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    }

    if (error) {
        return <div className="alert alert-danger m-3" role="alert">{error}</div>;
    }

    if (!student) {
        return <div className="alert alert-info m-3" role="alert">Студент не найден.</div>;
    }

    return (
        <div className={styles.studentCard}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Карточка студента</h2>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    Назад
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">ID: {student.id}</h5>
                    <p className="card-text"><strong>ФИО:</strong> {student.surname} {student.name} {student.patronymic}</p>
                    <p className="card-text"><strong>Группа:</strong> {student.group?.name || 'Не указана'}</p>
                    <p className="card-text"><strong>Курс:</strong> {student.group?.course || 'Не указан'}</p>
                    <p className="card-text"><strong>Пол:</strong> {student.gender ? 'Мужской' : 'Женский'}</p>
                    <p className="card-text"><strong>Блок:</strong> {student.blockNumber || 'Не указан'}</p>
                    <p className="card-text"><strong>Телефон:</strong> {student.phone || 'Не указан'}</p>
                    <p className="card-text"><strong>Дата рождения:</strong> {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(student.birthday))}</p>
                    {/* <p className="card-text"><strong>Адрес:</strong> {student.address || 'Не указан'}</p> */}
                    {/* <p className="card-text"><strong>Родители:</strong> {student.parentsInfo || 'Не указаны'}</p> */}
                    {/* Добавь другие поля по необходимости */}
                </div>
            </div>
        </div>
    );
};

export default StudentCardLayout;