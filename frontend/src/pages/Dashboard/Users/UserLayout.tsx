import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import ChangePasswordModal from './components/ChangePasswordModal/ChangePasswordModal';
import EditUserModal from './components/EditUserModal/EditUserModal';

import styles from './User.module.css'

const MOBILE_MENU_WIDTH = 220;

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
            throw err;
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
    const getUserFullName = (user: UserDto) => {
        const fullName = `${user.surname || ''} ${user.name || ''} ${user.patronymic || ''}`.replace(/\s+/g, ' ').trim();
        return fullName || 'Нет';
    };

    const columns = [
        {
            key: 'fullName',
            title: 'ФИО',
            render: (user: UserDto) => getUserFullName(user),
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

    const rowAction = {
        icon: 'bi-three-dots-vertical',
        title: 'Дополнительные действия',
        popupActions: [
            {
                label: 'Редактировать',
                icon: 'bi-pencil',
                onClick: handleEditUser,
            },
            {
                label: 'Изменить пароль',
                icon: 'bi-key',
                onClick: handleChangePassword,
            },
            {
                label: 'Удалить',
                icon: 'bi-trash',
                variant: 'danger' as const,
                onClick: handleDeleteUser,
                isVisible: (user: UserDto) => Boolean(userSession && userSession.id !== user.id),
            },
        ],
    };
    // #endregion  

    const getVisibleRowActions = (user: UserDto) =>
        rowAction.popupActions?.filter(action => (action.isVisible ? action.isVisible(user) : true)) ?? [];

    const [activeMobileMenuUserId, setActiveMobileMenuUserId] = useState<number | null>(null);
    const [mobileMenuPosition, setMobileMenuPosition] = useState<{ top: number; left: number | null; right: number | null } | null>(null);
    const mobileMenuRef = useRef<HTMLDivElement | null>(null);
    const mobileMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

    const closeMobileMenu = useCallback(() => {
        setActiveMobileMenuUserId(null);
        setMobileMenuPosition(null);
        mobileMenuTriggerRef.current = null;
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (mobileMenuRef.current?.contains(target) || mobileMenuTriggerRef.current?.contains(target)) {
                return;
            }
            closeMobileMenu();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [closeMobileMenu]);

    useEffect(() => {
        if (!activeMobileMenuUserId) return;

        const handleViewportChange = () => {
            closeMobileMenu();
        };

        window.addEventListener('scroll', handleViewportChange, true);
        window.addEventListener('resize', handleViewportChange);

        return () => {
            window.removeEventListener('scroll', handleViewportChange, true);
            window.removeEventListener('resize', handleViewportChange);
        };
    }, [activeMobileMenuUserId, closeMobileMenu]);

    const handleMobileMenuToggle = (
        event: React.MouseEvent<HTMLButtonElement>,
        userId: number,
        hasActions: boolean,
    ) => {
        if (!hasActions) return;

        if (activeMobileMenuUserId === userId) {
            closeMobileMenu();
            return;
        }

        const buttonRect = event.currentTarget.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const shouldAlignRight = buttonRect.left + MOBILE_MENU_WIDTH > viewportWidth - 12;

        setMobileMenuPosition({
            top: buttonRect.bottom + 4,
            left: shouldAlignRight ? null : Math.max(buttonRect.left, 8),
            right: shouldAlignRight ? Math.max(viewportWidth - buttonRect.right, 8) : null,
        });
        mobileMenuTriggerRef.current = event.currentTarget;
        setActiveMobileMenuUserId(userId);
    };

    const listTabHeader = (
        <div className={styles.filterBar}>
            <div className={styles.filterField}
            >
                <InputField
                    type="text"
                    placeholder="Поиск по ФИО..."
                    value={searchTerm}
                    onChange={handleSearchChange} />
            </div>
            <div className={styles.filterField}>
                <SelectField
                    value={selectedRoleId}
                    onChange={handleRoleChange}
                    options={roleOptions} />
            </div>
            <div className={styles.filterActions}>
                <ActionButton
                    size='sm'
                    variant='secondary'
                    onClick={handleResetFilters}
                    className={styles.modilButton}
                >
                    Сбросить
                </ActionButton>
            </div>
        </div>
    );

    const listTabContent = (
        <>
            <div className={styles.desktopTable}>
                <CommonTable
                    data={filteredUsers}
                    totalCount={users.length}
                    columns={columns}
                    rowAction={rowAction}
                    emptyMessage="Пользователи не найдены"
                />
            </div>
            <div className={styles.mobileCardsWrapper}>
                {filteredUsers.length ? (
                    filteredUsers.map(user => {
                        const visibleMobileActions = getVisibleRowActions(user);
                        const hasMobileActions = visibleMobileActions.length > 0;
                        return (
                            <div key={user.id} className={styles.mobileCard}>
                                <div className={styles.mobileCardHeader}>
                                    <p className={styles.mobileCardTitle}>{getUserFullName(user)}</p>
                                    <div className={styles.mobileCardActions}>
                                        <button
                                            type="button"
                                            className={styles.mobileCardActionTrigger}
                                            title="Действия"
                                            onClick={(event) => handleMobileMenuToggle(event, user.id, hasMobileActions)}
                                            disabled={!hasMobileActions}
                                        >
                                            <i className="bi bi-three-dots-vertical"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.mobileCardDivider}></div>

                                <div className={styles.mobileCardBody}>
                                    <div className={styles.mobileCardRow}>
                                        <span className={styles.mobileCardLabel}>Роль</span>
                                        <span className={styles.mobileCardValue}>{user.role?.name ?? 'Нет'}</span>
                                    </div>
                                    <div className={styles.mobileCardRow}>
                                        <span className={styles.mobileCardLabel}>Логин</span>
                                        <span className={styles.mobileCardValue}>{user.login || 'Нет'}</span>
                                    </div>
                                </div>

                                {hasMobileActions &&
                                    activeMobileMenuUserId === user.id &&
                                    mobileMenuPosition &&
                                    createPortal(
                                        <div
                                            ref={mobileMenuRef}
                                            className={styles.mobileCardActionMenu}
                                            style={{
                                                top: mobileMenuPosition.top,
                                                left: mobileMenuPosition.left ?? undefined,
                                                right: mobileMenuPosition.right ?? undefined,
                                            }}
                                        >
                                            {visibleMobileActions.map((action, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    className={`${styles.mobileCardActionMenuItem} ${action.variant === 'danger' ? styles.mobileCardActionMenuItemDanger : ''}`}
                                                    onClick={() => {
                                                        action.onClick(user);
                                                        closeMobileMenu();
                                                    }}
                                                >
                                                    {action.icon && <i className={`bi ${action.icon}`}></i>}
                                                    <span>{action.label}</span>
                                                </button>
                                            ))}
                                        </div>,
                                        document.body
                                    )}
                            </div>
                        );
                    })
                ) : (
                    <div className={styles.mobileCardsEmpty}>Пользователи не найдены</div>
                )}
            </div>
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
            errors.roleId = 'Поле обязательно';
        }
        if (!newUser.surname?.trim()) {
            errors.surname = 'Поле обязательно';
        } else if (newUser.surname.length > 100) {
            errors.surname = 'Максимум 100 символов';
        }
        if (!newUser.name?.trim()) {
            errors.name = 'Поле обязательно';
        } else if (newUser.name.length > 100) {
            errors.name = 'Максимум 100 символов';
        }
        if (newUser.patronymic && newUser.patronymic.length > 100) {
            errors.patronymic = 'Максимум 100 символов';
        }
        if (!newUser.login?.trim()) {
            errors.login = 'Поле обязательно';
        } else if (newUser.login.length < 3 || newUser.login.length > 50) {
            errors.login = 'От 3 до 50 символов';
        } else if (!/^[a-zA-Z0-9_\-\.]+$/.test(newUser.login)) {
            errors.login = 'Только (EN 0..9 - _ .)';
        }
        if (!newUser.password) {
            errors.password = 'Поле обязательно';
        } else if (newUser.password.length < 8) {
            errors.password = 'Минимум 8 символов';
        }
        if (newUser.password !== confirmPassword) {
            errors.confirmPassword = 'Пароли не совпадают';
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
        <div>
            <form onSubmit={handleAddUserSubmit} >
                <div className={styles.formSection}>
                    <h4 className={styles.formSectionTitle}>Основное</h4>
                    <div className="row g-3">
                        <div className="col-md-4">
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
                        <div className="col-md-4">
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
                        <div className="col-md-4">
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
                        <div className="col-md-4">
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

                        <div className="col-md-4">
                            <PasswordField
                                label="Пароль"
                                name="password"
                                value={newUser.password}
                                onChange={handleAddUserChange}
                                error={addErrors.password}
                                disabled={isAdding}
                            />
                        </div>
                        <div className="col-md-4">
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
                        <div className="col-md-12">
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
                    </div>
                </div>

                <div className={styles.formSection + ' mt-4 d-flex justify-content-end'}>
                    <ActionButton
                        size='md'
                        className={styles.fullWidthMobileButton}
                        variant='secondary'
                        onClick={resetAddForm}
                        disabled={isAdding}
                    >
                        Сбросить
                    </ActionButton>
                    <ActionButton
                        size='md'
                        className={styles.fullWidthMobileButton + ' ms-2'}
                        type='submit'
                        variant='primary'
                        disabled={isAdding}
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
            title: 'Список',
            headerContent: listTabHeader,
            content: listTabContent,
        },
        {
            id: 'add',
            title: 'Новый пользователь',
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