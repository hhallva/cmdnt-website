import React from 'react';
import Cookies from 'js-cookie';

import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove('authToken');
    navigate('/');
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Добро пожаловать в панель управления!</h1>
      <p>Вы успешно вошли в систему.</p>
      <button className="btn btn-outline-danger" onClick={handleLogout}>Выйти</button>
    </div>
  );
};

export default DashboardPage;