// src/components/ChangePasswordModal/ChangePasswordModal.tsx
import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import type { UserDto } from '../../types/UserDto';
import styles from './ChangePasswordModal.module.css'; // Импортируем стили

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
    // --- Состояния для отображения пароля ---
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

            onClose(); // Закрываем модальное окно после успеха
        } catch (err: any) {
            console.error('Ошибка при изменении пароля:', err);
            const errorMessage = err.message || 'Ошибка при изменении пароля';
            setError(errorMessage);
            if (onError) onError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- Функции для переключения отображения пароля ---
    const toggleShowNewPassword = () => {
        setShowNewPassword(!showNewPassword);
    };

    const toggleShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        // Используем стили из модуля
        <div className={styles.modalOverlay}> {/* Закрытие при клике вне модального окна */}
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}> {/* Останавливаем всплытие клика внутри */}
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Изменение пароля</h3>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.userInfo}>
                    <div className={styles.userInfoItem}>
                        <span className={styles.userInfoLabel}>Пользователь:</span>
                        <span className={styles.userInfoValue}>{user.name} ({user.login})</span>
                    </div>
                    <div className={styles.userInfoItem}>
                        <span className={styles.userInfoLabel}>Роль:</span>
                        <span className={styles.userInfoValue}>{user.role?.name || 'Не указана'}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* --- Поле ввода нового пароля с иконкой глаза --- */}
                    <div className={`${styles.formGroup} position-relative`}> {/* Добавляем position-relative для иконки */}
                        <label className={styles.formLabel}>Новый пароль</label>
                        <input
                            type={showNewPassword ? "text" : "password"} // Переключаем тип
                            className={`${styles.formControl} pe-5`} // Добавляем pe-5 для отступа под иконку
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <button
                            className={styles.passwordToggleBtn} // Стили Bootstrap для иконки
                            type="button"
                            onClick={toggleShowNewPassword}
                            tabIndex={-1} // Исключаем из табуляции
                            style={{ zIndex: 10 }} // Поверх input
                        >
                            {showNewPassword ? (
                                <i className="bi bi-eye-slash"></i> // Иконка "скрыть"
                            ) : (
                                <i className="bi bi-eye"></i> // Иконка "показать"
                            )}
                        </button>
                    </div>

                    {/* --- Поле ввода подтверждения пароля с иконкой глаза --- */}
                    <div className={`${styles.formGroup} position-relative`}>
                        <label className={styles.formLabel}>Подтверждение пароля</label>
                        <input
                            type={showConfirmPassword ? "text" : "password"} // Переключаем тип
                            className={`${styles.formControl} pe-5`}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <button
                            className={styles.passwordToggleBtn}
                            type="button"
                            onClick={toggleShowConfirmPassword}
                            tabIndex={-1}
                            style={{ zIndex: 10 }}
                        >
                            {showConfirmPassword ? (
                                <i className="bi bi-eye-slash"></i>
                            ) : (
                                <i className="bi bi-eye"></i>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-danger mb-3">{error}</div> // Сообщение об ошибке
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
                                'Сохранить пароль'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;