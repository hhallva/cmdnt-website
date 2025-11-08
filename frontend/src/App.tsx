import LoginPage from './pages/Login/LoginLayoyt';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import UsersLayout from './pages/Dashboard/Users/UserLayout';
import StudentsLayout from './pages/Dashboard/Students/StudentsLayout';
import StudentCardLayout from './pages/Dashboard/StudentCard/StudentCardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import NotFoundLayout from './pages/NotFound/NotFoundLayout';

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
      { path: "structure", element: <></>, handle: { title: 'Структура общежития', requiredRole: 'educator' } },
      { path: "students", element: <StudentsLayout />, handle: { title: 'Студенты', requiredRole: 'commandant' } },
      { path: "students/:studentId", element: <StudentCardLayout />, handle: { title: 'Карточка студента' } },
      { path: "settlement", element: <></>, handle: { title: 'Расселение', requiredRole: 'commandant' } },
      { path: "users", element: <UsersLayout />, handle: { title: 'Пользователи', requiredRole: 'admin' } },
      { path: "groups", element: <></>, handle: { title: '?Группы?', requiredRole: 'admin' } },
      // Редирект с /dashboard на первый раздел, если нужно
      { index: true, element: <Navigate to="structure" replace /> },
    ],
  },
  { path: "*", element: <NotFoundLayout /> },
];
