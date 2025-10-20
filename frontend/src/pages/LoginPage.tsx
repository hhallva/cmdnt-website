import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Cookies from 'js-cookie';

import type { LoginDto } from '../types/auth';
import { apiClient } from '../api/client';


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
        expires: 2, // дней
        secure: import.meta.env.PROD, // только HTTPS в продакшене
        sameSite: 'strict',
      });

      // Перенаправляем на защищённую страницу
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage('Не удалось войти. Проверьте логин и пароль.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <div className="decoration"></div>
      <div className="decoration"></div>
      <div className="decoration"></div>


      <div className="container">
        <div className="content">
          <div className="logo">
            <i className="bi bi-door-open"></i>
          </div>
          <h1>Вход в систему</h1>
          <p className="subtitle">
            Учет номерного фонда <span className="system-name">общежития</span><br />
            Войдите в систему для управления данными
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="form-label-with-error">
                <label htmlFor="username" className="form-label">Логин</label>
                {usernameError && (
                  <div className="error-message-inline">Пожалуйста, введите логин</div>
                )}
              </div>
              <div className="input-icon">
                <i className="bi bi-person"></i>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="Введите логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-with-error">
                <label htmlFor="password" className="form-label">Пароль</label>
                {passwordError && (
                  <div className="error-message-inline">Пожалуйста, введите пароль</div>
                )}
              </div>

              <div className="input-icon position-relative">
                <i className="bi bi-lock position-absolute start-0 top-50 translate-middle-y text-muted ms-3"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-control ps-5" // ← добавляем отступ слева (ps-5 = padding-start: 1.25rem)
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  //className="btn btn-link position-absolute start-100 top-50 translate-middle-y border-0 bg-transparent text-muted"
                  className='password-toggle-btn'
                  onClick={toggleShowPassword}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2 " role="status"></span>
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
        </div>
        {errorMessage && (
          <div className="alert alert-danger mt-3" role="alert">
            {errorMessage}
          </div>
        )}
      </div>
    </>
  );
};

export default LoginPage;