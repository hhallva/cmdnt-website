import LoginPage from './pages/Login/LoginLayoyt';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import UsersLayout from './pages/Dashboard/Users/UsersLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Navigate } from 'react-router-dom';

export const routes = [
  {
    path: "/", element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    handle: { title: 'Панель управления' },
    children: [
      { path: "structure", element: <div>Структура</div>, handle: { title: 'Структура общежития' } },
      { path: "students", element: <div>Студенты</div>, handle: { title: 'Студенты' } },
      { path: "settlement", element: <div>Расселение</div>, handle: { title: 'Расселение' } },
      { path: "reports", element: <div>Отчеты</div>, handle: { title: 'Отчеты' } },
      { path: "users", element: <div>Пользователи</div>, handle: { title: 'Пользователи' } },
      { path: "groups", element: <div>Группы</div>, handle: { title: 'Группы' } },
      // Редирект с /dashboard на первый раздел, если нужно
      { index: true, element: <Navigate to="users" replace /> },
    ],
  },
  // Добавь другие основные маршруты, если нужно (например, 404)
];
