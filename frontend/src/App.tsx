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
      { path: "structure", element: <div>Структура</div>, handle: { title: 'Структура общежития', requiredRole: 'educator' } },
      { path: "students", element: <div>Управление контенгентом</div>, handle: { title: 'Управление контингентом', requiredRole: 'commandant' } },
      { path: "settlement", element: <div>Расселение</div>, handle: { title: 'Расселение', requiredRole: 'commandant' } },
      { path: "reports", element: <div>Отчеты</div>, handle: { title: 'Отчеты', requiredRole: 'commandant' } },
      { path: "users", element: <div>Пользователи</div>, handle: { title: 'Пользователи', requiredRole: 'admin' } },
      { path: "groups", element: <div>Группы</div>, handle: { title: 'Группы', requiredRole: 'admin' } },
      // Редирект с /dashboard на первый раздел, если нужно
      { index: true, element: <Navigate to="structure" replace /> },
    ],
  },
];
