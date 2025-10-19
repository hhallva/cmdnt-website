import React, { useState } from 'react';


const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isUsernameValid = username.trim() !== '';
    const isPasswordValid = password.trim() !== '';

    setUsernameError(!isUsernameValid);
    setPasswordError(!isPasswordValid);

    if (isUsernameValid && isPasswordValid) {
      console.log('Попытка входа:', { username, password });

      // Здесь позже будет вызов API для аутентификации
      // Например: await login({ username, password });
    }
  };

  return (
    <div>
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
            Учет номерного фонда общежития<br />
            Войдите в систему для управления данными
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Логин
              </label>
              <div className="input-icon">
                <i className="bi bi-person"></i>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="Введите логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              {usernameError && (
                <div className="error-message">Пожалуйста, введите логин</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Пароль (Добавить скрытие отображение пароля)
              </label>
              <div className="input-icon">
                <i className="bi bi-lock"></i>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {passwordError && (
                <div className="error-message">Пожалуйста, введите пароль</div>
              )}
            </div>

            <button type="submit" className="btn btn-primary">
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Войти
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;