// src/components/EditUserModal/EditUserModal.tsx
import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import type { UserDto } from '../../types/UserDto';
import type { UpdateUserDto } from '../../types/UpdateUserDto';
import type { RoleDto } from '../../types/RoleDto';
import InputField from '../InputField/InputField';
import SelectField from '../SelectField/SelectField';
import styles from './EditUserModal.module.css';

interface FormErrors {
    roleId?: string | null;
    surname?: string | null;
    name?: string | null;
    patronymic?: string | null;
    login?: string | null;
    form?: string | null;
}

interface EditUserModalProps {
    user: UserDto;
    roles: RoleDto[];
    onClose: () => void;
    onSuccess: () => void; // Теперь без аргументов
    onError?: (message: string) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, roles, onClose, onSuccess, onError }) => {
    const [formData, setFormData] = useState<UpdateUserDto>({
        roleId: user.role?.id || 0,
        surname: user.surname || '',
        name: user.name || '',
        patronymic: user.patronymic || '',
        login: user.login || '',
    });

    // --- Состояние для ошибок валидации ---
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    // Подготавливаем опции для SelectField
    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.name || `Роль ${role.id}`,
    }));

    // --- Функция валидации отдельного поля ---
    const validateField = (name: keyof UpdateUserDto, value: any): string | null => {
        switch (name) {
            case 'roleId':
                if (value == null || value === '') {
                    return 'Идентификатор роли обязателен.';
                }
                const roleIdNum = Number(value);
                if (isNaN(roleIdNum) || roleIdNum < 1 || roleIdNum > 3) {
                    return 'Идентификатор роли должен быть числом от 1 до 3.';
                }
                return null;
            case 'surname':
                if (!value || value.trim() === '') {
                    return 'Фамилия обязательна.';
                }
                if (typeof value !== 'string' || value.length < 1 || value.length > 100) {
                    return 'Фамилия должна содержать от 1 до 100 символов.';
                }
                return null;
            case 'name':
                if (!value || value.trim() === '') {
                    return 'Имя обязательно.';
                }
                if (typeof value !== 'string' || value.length < 1 || value.length > 100) {
                    return 'Имя должно содержать от 1 до 100 символов.';
                }
                return null;
            case 'patronymic':
                if (value && typeof value === 'string' && value.length > 100) {
                    return 'Отчество не должно превышать 100 символов.';
                }
                return null;
            case 'login':
                if (!value || value.trim() === '') {
                    return 'Логин обязателен.';
                }
                if (typeof value !== 'string' || value.length < 3 || value.length > 50) {
                    return 'Логин должен содержать от 3 до 50 символов.';
                }
                const loginRegex = /^[a-zA-Z0-9_\-\.]+$/;
                if (!loginRegex.test(value)) {
                    return 'Логин может содержать только латиницу, цифры, подчёркивания, дефисы и точки.';
                }
                return null;
            default:
                return null;
        }
    };

    // --- Функция валидации всей формы ---
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        (Object.keys(formData) as Array<keyof UpdateUserDto>).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const fieldName = name as keyof UpdateUserDto;

        setFormData(prev => ({
            ...prev,
            [fieldName]: fieldName === 'roleId' ? Number(value) : value,
        }));

        if (errors[fieldName]) {
            const error = validateField(fieldName, fieldName === 'roleId' ? Number(value) : value);
            setErrors(prev => ({
                ...prev,
                [fieldName]: error,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            console.log('Форма содержит ошибки валидации:', errors);
            return;
        }

        setLoading(true);

        try {
            await apiClient.updateUser(user.id, formData);
            console.log('Пользователь успешно обновлён на сервере:', user.login);

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Ошибка при обновлении пользователя:', err);
            const errorMessage = err.message || 'Ошибка при обновлении пользователя';
            setErrors(prev => ({ ...prev, form: errorMessage }));
            if (onError) onError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Редактирование пользователя</h3>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* --- Поля ввода с отображением ошибок --- */}
                    <InputField
                        label="Фамилия"
                        type="text"
                        name="surname"
                        value={formData.surname || ''}
                        onChange={handleChange}
                        disabled={loading}
                        // Передаём ошибку для этого поля, если она есть
                        error={errors.surname || undefined} // Передаём как string | undefined
                    />
                    <InputField
                        label="Имя"
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        disabled={loading}
                        error={errors.name || undefined}
                    />
                    <InputField
                        label="Отчество"
                        type="text"
                        name="patronymic"
                        value={formData.patronymic || ''}
                        onChange={handleChange}
                        disabled={loading}
                        error={errors.patronymic || undefined} // Может быть null/undefined, что скроет сообщение об ошибке
                    />
                    <InputField
                        label="Логин"
                        type="text"
                        name="login"
                        value={formData.login || ''}
                        onChange={handleChange}
                        disabled={loading}
                        error={errors.login || undefined}
                    />
                    <SelectField
                        label="Роль"
                        name="roleId"
                        value={formData.roleId}
                        onChange={handleChange}
                        options={roleOptions}
                        disabled={loading}
                        // Передаём ошибку для этого поля, если она есть
                        error={errors.roleId || undefined} // Передаём как string | undefined
                    />
                    {/* --- Конец полей ввода --- */}

                    {/* --- Отображение ошибок --- */}
                    {/* Общая ошибка формы (например, от сервера) */}
                    {errors.form && (
                        <div className="alert alert-danger mb-3">{errors.form}</div>
                    )}

                    <div className={styles.buttonGroup}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Отмена
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Сохранение...
                                </>
                            ) : (
                                'Сохранить'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;