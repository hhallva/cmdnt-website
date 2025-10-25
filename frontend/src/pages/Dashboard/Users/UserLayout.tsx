import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';

import type { UserDto } from '../../../types/UserDto';
import type { UserStatisticDto } from '../../../types/UserStatisticDto';

import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import Tabs from '../../../components/Tabs/Tabs';

const UsersLayout: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [statistics, setStatistics] = useState<UserStatisticDto | null>(null);
    const [users, setUsers] = useState<UserDto[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsResponse, usersResponse] = await Promise.all([
                    apiClient.getUserStatistics(),
                    apiClient.getAllUsers()
                ]);

                setStatistics(statsResponse);
                setUsers(usersResponse);
                console.info("Получение статистики и пользователей");
            } catch (err: any) {
                console.error('Ошибка при загрузке данных:', err);
                setError(err.message || 'Ошибка при загрузке данных');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;
    if (!statistics) return <div className="alert alert-info m-3" role="alert">Статистика не найдена.</div>;

    const userStats = [
        { value: statistics.totalUsers, label: 'Всего пользователей' },
        { value: statistics.adminCount, label: 'Администраторы' },
        { value: statistics.commandantCount, label: 'Коменданты' },
        { value: statistics.educatorCount, label: 'Воспитатели' },
    ];

    const listTabContent = (
        <>

            <div className="users-table-container mt-4">
                <h3 className="mb-3">Список пользователей</h3> {/* Добавим отступ снизу */}
                {users.length > 0 ? (
                    <table className="users-table table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>ФИО</th>
                                <th>Логин</th>
                                <th>Роль</th>
                                {/* Добавь другие столбцы по необходимости */}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.surname} {user.name} {user.patronymic}</td>
                                    <td>{user.login}</td>
                                    <td>{user.role?.name || 'Не указана'}</td>
                                    {/* Добавь другие ячейки по необходимости */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Пользователи не найдены.</p>
                )}
            </div>
        </>
    );

    // Содержимое вкладки "Добавить пользователя" (заглушка)
    const addTabContent = (
        <div className="form-section bg-light p-3 rounded">
            <h3 className="h5 mb-3">Добавить нового пользователя</h3>
        </div>
    );

    const tabs = [
        {
            id: 'list',
            title: 'Список пользователей',
            content: listTabContent,
        },
        {
            id: 'add',
            title: 'Добавить пользователя',
            content: addTabContent,
        },
    ];

    return (
        <>
            <StatisticsCard stats={userStats} />
            <Tabs tabs={tabs} defaultActiveTabId="list" />
        </>
    );
}

export default UsersLayout;