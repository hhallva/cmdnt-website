import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getUserSession } from '../../../components/ProtectedRoute';
import { apiClient } from '../../../api/client';

import type { UserDto } from '../../../types/UserDto';
import type { UserStatisticDto } from '../../../types/UserStatisticDto';
import type { RoleDto } from '../../../types/RoleDto';
import type { PostUserDto } from '../../../types/PostUserDto';

import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import Tabs from '../../../components/Tabs/Tabs';
import CommonTable from '../../../components/CommonTable/CommonTable';
import InputField from '../../../components/InputField/InputField';
import PasswordField from '../../../components/PasswordField/PasswordField';
import SelectField from '../../../components/SelectField/SelectField';
import ActionButton from '../../../components/ActionButton/ActionButton';
import ChangePasswordModal from '../../../components/ChangePasswordModal/ChangePasswordModal';
import EditUserModal from '../../../components/EditUserModal/EditUserModal';

import styles from './User.module.css'

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

    // #region Список пользователей 

    // #region Поиск и фильтрация
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<number | 'all'>('all');

    const roleOptions = [
        { value: 'all', label: 'Все роли' },
        ...roles.map(role => ({
            value: role.id,
            label: role.name || `Роль ${role.id}`
        }))
    ];

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

    // #region Действия в таблице
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

    // #region Таблица
    const columns = [
        {
            key: 'fullName',
            title: 'ФИО',
            render: (user: UserDto) => `${user.surname || ''} ${user.name || ''} ${user.patronymic || ''}`.trim() || 'Нет',
        },
        {
            key: 'login',
            title: 'Логин',
        },
        {
            key: 'role.name',
            title: 'Роль',
            render: (user: UserDto) => user.role?.name ?? "Нет",
        },
    ];

    const actions = [
        {
            render: (user: UserDto) => (
                <button
                    className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                    onClick={() => handleEditUser(user)}
                    title="Редактировать"
                >
                    <i className="bi bi-pencil"></i>
                </button>
            ),
        },
        {
            render: (user: UserDto) => (
                <button
                    className={`${styles.actionBtn} ${styles.actionBtnPassword}`}
                    onClick={() => handleChangePassword(user)}
                    title="Изменить пароль"
                >
                    <i className="bi bi-key"></i>
                </button>
            ),
        },
        {
            render: (user: UserDto) => {
                if (userSession && userSession.id !== user.id) {
                    return (
                        <button
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            onClick={() => handleDeleteUser(user)}
                            title="Удалить"
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    );
                }
                return null;
            },
        },
    ];
    // #endregion  

    const listTabContent = (
        <>
            <div className="row g-3 mb-3">
                <div className="col-md-6">
                    <InputField
                        type="text"
                        placeholder="Поиск по ФИО..."
                        value={searchTerm}
                        onChange={handleSearchChange} />
                </div>
                <div className="col-md-3">
                    <SelectField
                        value={selectedRoleId}
                        onChange={handleRoleChange}
                        options={roleOptions} />
                </div>
                <div className="col-md-2 " >
                    <ActionButton
                        variant='dark'
                        onClick={handleResetFilters}
                    >
                        Сбросить
                    </ActionButton>
                </div>
            </div>

            <CommonTable
                title="Список пользователей"
                data={filteredUsers}
                totalCount={users.length}
                columns={columns}
                actions={actions}
                emptyMessage="Пользователи не найдены"
            />

        </>
    );

    //#endregion 

    // #region Добавление пользователя
    const [newUser, setNewUser] = useState<Omit<PostUserDto, 'password'> & { password: string }>({
        roleId: 0,
        surname: '',
        name: '',
        patronymic: '',
        login: '',
        password: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [addErrors, setAddErrors] = useState<Record<string, string>>({});
    const [isAdding, setIsAdding] = useState(false);

    const handleAddUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setNewUser(prev => ({
            ...prev,
            [name]: name === 'roleId' ? Number(val) : val,
        }));

        if (addErrors[name]) {
            setAddErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const resetAddForm = () => {
        setNewUser({
            roleId: 0,
            surname: '',
            name: '',
            patronymic: '',
            login: '',
            password: '',
        });
        setAddErrors({});
    };

    const validateAddUserForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!newUser.roleId || newUser.roleId <= 0) {
            errors.roleId = 'Пожалуйста, выберите роль.';
        }
        if (!newUser.surname?.trim()) {
            errors.surname = 'Фамилия обязательна.';
        } else if (newUser.surname.length > 100) {
            errors.surname = 'Фамилия должна содержать не более 100 символов.';
        }
        if (!newUser.name?.trim()) {
            errors.name = 'Имя обязательно.';
        } else if (newUser.name.length > 100) {
            errors.name = 'Имя должно содержать не более 100 символов.';
        }
        if (newUser.patronymic && newUser.patronymic.length > 100) {
            errors.patronymic = 'Отчество должно содержать не более 100 символов.';
        }
        if (!newUser.login?.trim()) {
            errors.login = 'Логин обязателен.';
        } else if (newUser.login.length < 3 || newUser.login.length > 50) {
            errors.login = 'Логин должен содержать от 3 до 50 символов.';
        } else if (!/^[a-zA-Z0-9_\-\.]+$/.test(newUser.login)) {
            errors.login = 'Логин может содержать только латиницу, цифры, подчёркивания, дефисы и точки.';
        }
        if (!newUser.password) {
            errors.password = 'Пароль обязателен.';
        } else if (newUser.password.length < 8) {
            errors.password = 'Пароль должен содержать минимум 8 символов.';
        }
        if (newUser.password !== confirmPassword) {
            errors.confirmPassword = 'Пароли не совпадают.';
        }

        setAddErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAddUserForm()) {
            return;
        }

        setIsAdding(true);
        try {
            const userDataToSend: PostUserDto = {
                ...newUser,
            };

            await apiClient.createUser(userDataToSend);
            alert('Новый пользователь успешно добавлен!');
            // Сброс формы
            setNewUser({
                roleId: 0,
                surname: '',
                name: '',
                patronymic: '',
                login: '',
                password: '',
            });
            setConfirmPassword('');
            setAddErrors({});
            // Перезагружаем список пользователей и статистику
            await fetchUsers();
            await fetchStatistics();
        } catch (err: any) {
            console.error('Ошибка при добавлении пользователя:', err);
            alert(err.message || 'Ошибка при добавлении пользователя');
            // Ошибка 401 будет перехвачена в apiClient
        } finally {
            setIsAdding(false);
        }
    };

    const addTabContent = (
        <div className="p-3">
            <h3 className="h5 mb-3">Добавить нового пользователя</h3>
            <form onSubmit={handleAddUserSubmit}>
                <div className="row g-3">
                    <div className="col-md-6">
                        <InputField
                            label="Фамилия"
                            type="text"
                            name="surname"
                            value={newUser.surname || ''}
                            onChange={handleAddUserChange}
                            error={addErrors.surname}
                            disabled={isAdding}
                        />
                    </div>
                    <div className="col-md-6">
                        <InputField
                            label="Имя"
                            type="text"
                            name="name"
                            value={newUser.name || ''}
                            onChange={handleAddUserChange}
                            error={addErrors.name}
                            disabled={isAdding}
                        />
                    </div>
                    <div className="col-md-6">
                        <InputField
                            label="Отчество"
                            type="text"
                            name="patronymic"
                            value={newUser.patronymic || ''}
                            onChange={handleAddUserChange}
                            error={addErrors.patronymic}
                            disabled={isAdding}
                        />
                    </div>
                    <div className="col-md-6">
                        <InputField
                            label="Логин"
                            type="text"
                            name="login"
                            value={newUser.login || ''}
                            onChange={handleAddUserChange}
                            error={addErrors.login}
                            disabled={isAdding}
                        />
                    </div>
                    <div className="col-md-6">
                        <SelectField
                            label="Роль"
                            name="roleId"
                            value={newUser.roleId}
                            onChange={handleAddUserChange}
                            options={roleOptions}
                            error={addErrors.roleId}
                            disabled={isAdding}
                        />
                    </div>
                    <div className="col-md-6">
                        <PasswordField
                            label="Пароль"
                            name="password"
                            value={newUser.password}
                            onChange={handleAddUserChange}
                            error={addErrors.password}
                            disabled={isAdding}
                        />
                    </div>
                    <div className="col-md-6">
                        <PasswordField
                            label="Подтверждение пароля"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (addErrors.confirmPassword) {
                                    setAddErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.confirmPassword;
                                        return newErrors;
                                    });
                                }
                            }}
                            error={addErrors.confirmPassword}
                            disabled={isAdding}
                        />
                    </div>
                </div>
                {/* Кнопки действия */}
                <div className="d-flex justify-content-end mt-4 pt-2">
                    <ActionButton
                        variant='dark'
                        onClick={resetAddForm}
                        disabled={isAdding}
                    >
                        Сбросить
                    </ActionButton>
                    <ActionButton
                        type='submit'
                        variant='primary'
                        className="ms-2"
                    >
                        Добавить
                    </ActionButton>
                </div>
            </form>
        </div>
    );
    // #endregion 

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;
    if (!statistics) return <div className="alert alert-info m-3" role="alert">Статистика не найдена.</div>;

    const userStats = [
        { value: statistics.totalUsers, label: 'Всего пользователей' },
        { value: statistics.adminCount, label: 'Администраторы' },
        { value: statistics.commandantCount, label: 'Коменданты' },
        { value: statistics.educatorCount, label: 'Воспитатели' },
    ]

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