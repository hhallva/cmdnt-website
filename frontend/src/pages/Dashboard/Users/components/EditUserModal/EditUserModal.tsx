import React, { useState } from 'react';
import { apiClient } from '../../../../../api/client';
import type { UserDto } from '../../../../../types/UserDto';
import type { UpdateUserDto } from '../../../../../types/UpdateUserDto';
import type { RoleDto } from '../../../../../types/RoleDto';
import InputField from '../../../../../components/InputField/InputField';
import SelectField from '../../../../../components/SelectField/SelectField';
import CommonModal from '../../../../../components/CommonModal/CommonModal';
import ActionButton from '../../../../../components/ActionButton/ActionButton';

interface FormErrors {
    roleId?: string | null;
    surname?: string | null;
    name?: string | null;
    patronymic?: string | null;
    login?: string | null;
    form?: string | null;
}

export interface EditUserModalProps {
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

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.name || `Роль ${role.id}`,
    }));

    const validateField = (name: keyof UpdateUserDto, value: any): string | null => {
        switch (name) {
            case 'roleId': {
                if (value == null || value === '') return 'Идентификатор роли обязателен.';
                const roleIdNum = Number(value);
                if (Number.isNaN(roleIdNum) || roleIdNum < 1 || roleIdNum > 3)
                    return 'Идентификатор роли должен быть числом от 1 до 3.';
                return null;
            }
            case 'surname':
                if (!value?.trim()) return 'Фамилия обязательна.';
                if (value.length < 1 || value.length > 100)
                    return 'Фамилия должна содержать от 1 до 100 символов.';
                return null;
            case 'name':
                if (!value?.trim()) return 'Имя обязательно.';
                if (value.length < 1 || value.length > 100)
                    return 'Имя должно содержать от 1 до 100 символов.';
                return null;
            case 'patronymic':
                if (value && value.length > 100)
                    return 'Отчество не должно превышать 100 символов.';
                return null;
            case 'login':
                if (!value?.trim()) return 'Логин обязателен.';
                if (value.length < 3 || value.length > 50)
                    return 'Логин должен содержать от 3 до 50 символов.';
                if (!/^[a-zA-Z0-9_\-\.]+$/.test(value))
                    return 'Логин может содержать только латиницу, цифры, подчёркивания, дефисы и точки.';
                return null;
            default:
                return null;
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        (Object.keys(formData) as Array<keyof UpdateUserDto>).forEach((key) => {
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

        setFormData((prev) => ({
            ...prev,
            [fieldName]: fieldName === 'roleId' ? Number(value) : value,
        }));

        if (errors[fieldName]) {
            const error = validateField(fieldName, fieldName === 'roleId' ? Number(value) : value);
            setErrors((prev) => ({
                ...prev,
                [fieldName]: error,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) return;

        setLoading(true);

        try {
            await apiClient.updateUser(user.id, formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Ошибка при обновлении пользователя:', err);
            const errorMessage = err.message || 'Ошибка при обновлении пользователя';
            setErrors((prev) => ({ ...prev, form: errorMessage }));
            onError?.(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommonModal title="Редактирование пользователя" isOpen onClose={onClose} minWidth={520}>
            <form onSubmit={handleSubmit}>
                <InputField
                    label="Фамилия"
                    type="text"
                    name="surname"
                    value={formData.surname || ''}
                    onChange={handleChange}
                    disabled={loading}
                    error={errors.surname || undefined}
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
                    error={errors.patronymic || undefined}
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
                    error={errors.roleId || undefined}
                />

                {errors.form && <div className="alert alert-danger mb-3">{errors.form}</div>}

                <div className="d-flex justify-content-end gap-2 pt-2">
                    <ActionButton
                        size='md'
                        disabled={loading}
                        onClick={onClose}
                        variant='secondary'
                        type="button">
                        Отмена
                    </ActionButton>

                    <ActionButton
                        size='md'
                        type="submit"
                        disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Сохранение...
                            </>
                        ) : (
                            'Сохранить'
                        )}
                    </ActionButton>
                </div>
            </form>
        </CommonModal >
    );
};

export default EditUserModal;