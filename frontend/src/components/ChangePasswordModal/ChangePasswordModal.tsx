import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import type { UserDto } from '../../types/UserDto';
import styles from './ChangePasswordModal.module.css';

interface ChangePasswordModalProps {
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
            const msg = 'Пароли не совпадают!';
            setError(msg);
            if (onError) onError(msg);
            return;
        }

        if (newPassword.length < 8) {
            const msg = 'Пароль должен содержать минимум 8 символов!';
            setError(msg);
            if (onError) onError(msg);
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

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        // Используем классы из модуля для стилей
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Изменение пароля</h3>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">&times;</button>
                </div>

                <div className={styles.userInfo}>
                    <div className={styles.userInfoItem}>
                        <span className={styles.userInfoLabel}>Пользователь:</span>
                        <span className={styles.userInfoValue}>
                            {user.name} ({user.login})
                        </span>
                    </div>
                    <div className={styles.userInfoItem}>
                        <span className={styles.userInfoLabel}>Роль:</span>
                        <span className={styles.userInfoValue}>
                            {user.role?.name || 'Не указана'}
                        </span>
                    </div>
                </div>

                <form className="password-form" onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Новый пароль</label>
                        <input
                            type="password"
                            className={styles.formControl}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Подтверждение пароля</label>
                        <input
                            type="password"
                            className={styles.formControl}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="alert alert-danger mb-3">{error}</div>
                    )}

                    <div className={`${styles.formGroup} ${styles.buttonGroup}`}>
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
                                <>
                                    <i className="bi bi-save me-1"></i>
                                    Сохранить пароль
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;