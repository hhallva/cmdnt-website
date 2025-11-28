import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import type { LoginDto } from '../../types/auth';
import { apiClient } from '../../api/client';
import InputField from '../../components/InputField/InputField';

import styles from './Login.module.css';


const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [usernameError, setUsernameError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isUsernameValid = username.trim() !== '';
        const isPasswordValid = password.trim() !== '';

        setUsernameError(!isUsernameValid);
        setPasswordError(!isPasswordValid);
        setErrorMessage('');

        if (!isUsernameValid || !isPasswordValid) return;

        setIsLoading(true);

        try {
            const credentials: LoginDto = { login: username, password };
            const response = await apiClient.singIn(credentials);
            const token = response.token;

            if (!token) {
                throw new Error('Сервер не вернул токен');
            }

            Cookies.set('authToken', token, {
                expires: 2,
                secure: import.meta.env.PROD,
                sameSite: 'strict',
            });

            sessionStorage.setItem('userSession', JSON.stringify(response));

            navigate('/dashboard');
        } catch (err) {
            setErrorMessage('Не удалось войти. Проверьте логин и пароль.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleShowPassword = () => setShowPassword((prev) => !prev);

    return (
        <div className={styles.loginPage}>
            {/* Декорации */}
            <div className={styles.decoration}></div>
            <div className={styles.decoration}></div>
            <div className={styles.decoration}></div>

            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.logo}>
                        <i className="bi bi-door-open"></i>
                    </div>
                    <h1>Вход в систему</h1>
                    <p className={styles.subtitle}>
                        Учет номерного фонда <span className={styles.systemname}>общежития</span><br />
                        Войдите в систему для управления данными
                    </p>

                    <form className={styles.loginForm} onSubmit={handleSubmit}>
                        {/* Логин */}
                        <div className={styles.formGroup}>
                            <InputField
                                label="Логин"
                                name="username"
                                id="username"
                                type="text"
                                placeholder="Введите логин"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                error={usernameError ? 'Пожалуйста, введите логин' : undefined}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Пароль */}
                        <div className={styles.formGroup}>
                            <InputField
                                label="Пароль"
                                name="password"
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Введите пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                error={passwordError ? 'Пожалуйста, введите пароль' : undefined}
                                disabled={isLoading}
                            >
                                <button
                                    type="button"
                                    className={styles.passwordToggleBtn}
                                    onClick={toggleShowPassword}
                                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                                >
                                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                            </InputField>
                        </div>
                        {/* Кнопка */}
                        <button type="submit" className={`${styles.btnPrimary} ${styles.btn} `} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Вход...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right me-2"></i>
                                    Войти
                                </>
                            )}
                        </button>
                    </form>

                    {/* Общая ошибка */}
                    {errorMessage && (
                        <div className="alert alert-danger mt-3" role="alert" style={{ color: '#e74c3c' }}>
                            {errorMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;