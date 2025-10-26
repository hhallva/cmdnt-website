import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { getUserSession } from '../../../components/ProtectedRoute';
import { apiClient } from '../../../api/client';

import type { UserDto } from '../../../types/UserDto';
import type { UserStatisticDto } from '../../../types/UserStatisticDto';

import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import Tabs from '../../../components/Tabs/Tabs';
import InputField from '../../../components/InputField/InputField';
import SelectField from '../../../components/SelectField/SelectField';
import CancelButton from '../../../components/CancelButton/CancelButton';
import ChangePasswordModal from '../../../components/ChangePasswordModal/ChangePasswordModal';
import EditUserModal from '../../../components/EditUserModal/EditUserModal';

import styles from './User.module.css'
import type { RoleDto } from '../../../types/RoleDto';

const UsersLayout: React.FC = () => {
    // #region Загрузка данных
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const userSession = getUserSession();

    const [statistics, setStatistics] = useState<UserStatisticDto | null>(null);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsResponse, usersResponse, rolesResponse] = await Promise.all([
                    apiClient.getUserStatistics(),
                    apiClient.getAllUsers(),
                    apiClient.getAllRoles()
                ]);

                setStatistics(statsResponse);
                setUsers(usersResponse);
                setRoles(rolesResponse);
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

    const fetchStatistics = async () => {
        try {
            const statsResponse = await apiClient.getUserStatistics();
            setStatistics(statsResponse);
        } catch (err: any) {
            console.error('Ошибка при загрузке статистики:', err);
            // Обработка ошибки статистики, если нужно отдельно
            // setError(err.message || 'Ошибка при загрузке статистики');
            // Но, возможно, лучше бросить ошибку дальше или вернуть null
            throw err; // Бросаем ошибку, чтобы вызывающий код (например, useEffect или handleDelete) мог её обработать
        }
    };

    const fetchUsers = async () => {
        try {
            const usersResponse = await apiClient.getAllUsers();
            setUsers(usersResponse);
        } catch (err: any) {
            console.error('Ошибка при загрузке пользователей:', err);
            throw err;
        }
    };
    // #endregion

    // #region Поиск и фильтрация
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<number | 'all'>('all');

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedRoleId(value === 'all' ? 'all' : Number(value));
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedRoleId('all');
    };


    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.surname?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.patronymic?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesRole = selectedRoleId === 'all' || user.role?.id === selectedRoleId;

        return matchesSearch && matchesRole;
    });

    // #endregion

    //#region Действия в таблице
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [userForEdit, setUserForEdit] = useState<UserDto | null>(null);

    const handleEditUser = async (user: UserDto) => {
        try {
            const freshUserData = await apiClient.getUserById(user.id);
            setUserForEdit(freshUserData);
            setShowEditUserModal(true);
        } catch (err: any) {
            console.error('Ошибка при загрузке данных пользователя для редактирования:', err);
            alert(err.message || 'Ошибка при загрузке данных пользователя');
        }
    };

    const handleCloseEditUserModal = () => {
        setShowEditUserModal(false);
        setUserForEdit(null);
    };

    const handleSuccessEditUser = async () => {
        console.log('Пользователь успешно обновлён. Перезагружаем список пользователей...');
        try {
            // --- Перезагружаем список пользователей ---
            await fetchUsers(); // Предполагается, что fetchUsers - асинхронная функция из твоего useEffect
        } catch (err: any) {
            console.error('Ошибка при перезагрузке списка пользователей после редактирования:', err);
            alert(err.message || 'Ошибка при обновлении списка пользователей');
            // Ошибка 401 будет перехвачена в apiClient
        }
    };

    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [userForPasswordChange, setUserForPasswordChange] = useState<UserDto | null>(null);

    const handleChangePassword = (user: UserDto) => {
        setUserForPasswordChange(user);
        setShowChangePasswordModal(true);
    };

    const handleDeleteUser = async (user: UserDto) => {
        if (window.confirm(`Вы уверены, что хотите удалить пользователя ${user.name} (${user.login})?`)) {
            try {
                await apiClient.deleteUser(user.id);
                console.log('Пользователь успешно удалён с сервера:', user);
                setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
                await fetchStatistics();
            } catch (err: any) {
                console.error('Ошибка при удалении пользователя:', err);
                alert(err.message || 'Ошибка при удалении пользователя');
            }
        }
    };
    //#endregion

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;
    if (!statistics) return <div className="alert alert-info m-3" role="alert">Статистика не найдена.</div>;

    const userStats = [
        { value: statistics.totalUsers, label: 'Всего пользователей' },
        { value: statistics.adminCount, label: 'Администраторы' },
        { value: statistics.commandantCount, label: 'Коменданты' },
        { value: statistics.educatorCount, label: 'Воспитатели' },
    ];

    const roleOptions = [
        { value: 'all', label: 'Все роли' },
        ...roles.map(role => ({
            value: role.id,
            label: role.name || `Роль ${role.id}`
        }))
    ];

    const listTabContent = (
        <>
            <div className="row g-3 mb-3">
                <div className="col-md-6">
                    <InputField
                        label="Поиск по ФИО"
                        type="text"
                        placeholder="Введите ФИО"
                        value={searchTerm}
                        onChange={handleSearchChange} />
                </div>
                <div className="col-md-3">
                    <SelectField
                        label="Роль"
                        value={selectedRoleId}
                        onChange={handleRoleChange}
                        options={roleOptions} />
                </div>
                <div className="col-md-1" >
                    <CancelButton
                        onClick={handleResetFilters}
                        label="Сбросить"
                    />
                </div>
            </div>

            <h3 className="mb-3">Список пользователей</h3>
            <div className={styles.tableResponsive}>
                <table className={styles.usersTable}>
                    <thead>
                        <tr>
                            <th>ФИО</th>
                            <th>Логин</th>
                            <th>Роль</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.surname} {user.name} {user.patronymic}</td>
                                        <td>{user.login}</td>
                                        <td>{user.role?.name}</td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                                                    onClick={() => handleEditUser(user)}
                                                    title="Редактировать"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnPassword}`}
                                                    onClick={() => handleChangePassword(user)}
                                                    title="Изменить пароль"
                                                >
                                                    <i className="bi bi-key"></i>
                                                </button>

                                                {userSession?.id != user.id ? (
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                                        onClick={() => handleDeleteUser(user)}
                                                        title="Удалить"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                ) : (<></>)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center "> {/* colSpan=4 означает, что ячейка занимает всю ширину таблицы */}
                                        Пользователи не найдены
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
        <div >
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
        }
    ];

    return (
        <>
            <StatisticsCard stats={userStats} />
            <Tabs tabs={tabs} defaultActiveTabId="list" />

            {showChangePasswordModal && userForPasswordChange && (
                <ChangePasswordModal
                    user={userForPasswordChange}
                    onClose={() => {
                        setShowChangePasswordModal(false);
                        setUserForPasswordChange(null);
                    }}
                />
            )}

            {showEditUserModal && userForEdit && (
                <EditUserModal
                    user={userForEdit}
                    roles={roles}
                    onClose={handleCloseEditUserModal}
                    onSuccess={handleSuccessEditUser}
                    onError={(msg) => {
                        alert(msg);
                    }}
                />
            )}
        </>
    );
}

export default UsersLayout;