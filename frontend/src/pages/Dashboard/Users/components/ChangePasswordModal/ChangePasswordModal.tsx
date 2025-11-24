import React, { useState } from 'react';
import { apiClient } from '../../../../../api/client';
import type { UserDto } from '../../../../../types/UserDto';
import PasswordField from '../../../../../components/PasswordField/PasswordField';
import CommonModal from '../../../../../components/CommonModal/CommonModal';

export interface ChangePasswordModalProps {
    user: UserDto;
    onClose: () => void;
    onSuccess?: () => void;
    onError?: (message: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, onClose, onSuccess, onError }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают!');
            if (onError) onError('Пароли не совпадают!');
            return;
        }

        if (newPassword.length < 8) {
            setError('Пароль должен содержать минимум 8 символов!');
            if (onError) onError('Пароль должен содержать минимум 8 символов!');
            return;
        }

        setLoading(true);

        try {
            await apiClient.changeUserPassword(user.id, newPassword);
            console.log('Пароль успешно изменён для пользователя:', user.login);

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (err: any) {
            console.error('Ошибка при изменении пароля:', err);
            const errorMessage = err.message || 'Ошибка при изменении пароля';
            setError(errorMessage);
            if (onError) onError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommonModal title="Изменение пароля" isOpen onClose={onClose} minWidth={480}>
            <div className="border rounded bg-light p-3 mb-3">
                <div className="mb-2">
                    <span className="text-muted me-2">Пользователь:</span>
                    <strong>
                        {user.name} ({user.login})
                    </strong>
                </div>
                <div>
                    <span className="text-muted me-2">Роль:</span>
                    <strong>{user.role?.name || 'Не указана'}</strong>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <PasswordField
                    label="Новый пароль"
                    name="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                />

                <PasswordField
                    label="Подтверждение пароля"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                />

                {error && <div className="alert alert-danger mb-3">{error}</div>}

                <div className="d-flex justify-content-end gap-2 pt-2">
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
                            'Сохранить пароль'
                        )}
                    </button>
                </div>
            </form>
        </CommonModal>
    );
};

export default ChangePasswordModal;