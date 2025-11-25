import LoginPage from './pages/Login/LoginLayoyt';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import UsersLayout from './pages/Dashboard/Users/UserLayout';
import StudentsLayout from './pages/Dashboard/Students/StudentsLayout';
import StudentCardLayout from './pages/Dashboard/StudentCard/StudentCardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import NotFoundLayout from './pages/NotFound/NotFoundLayout';

// Основной массив маршрутов приложения  
export const routes = [
  {
    // Корневой маршрут - страница входа
    path: "/", element: <LoginPage />,
  },
  {
    // Маршрут панели управления с защитой доступа
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    // Мета-данные для маршрута
    handle: { title: 'Панель управления' },
    // Вложенные маршруты внутри дашборда
    children: [
      // Раздел структуры общежития (требуется роль educator)
      { path: "structure", element: <></>, handle: { title: 'Структура общежития', requiredRole: 'educator' } },
      { path: "students", element: <StudentsLayout />, handle: { title: 'Студенты', requiredRole: 'educator' } },
      { path: "students/:studentId", element: <StudentCardLayout />, handle: { title: 'Карточка студента', requiredRole: 'educator' } },

      // Раздел студентов (требуется роль commandant)
      { path: "settlement", element: <></>, handle: { title: 'Расселение', requiredRole: 'commandant' } },

      // Раздел пользователей (требуется роль admin)
      { path: "users", element: <UsersLayout />, handle: { title: 'Пользователи', requiredRole: 'admin' } },

      // Маршрут по умолчанию для /dashboard - редирект на структуру
      { index: true, element: <Navigate to="structure" replace /> },
    ],
  },
  // Маршрут для обработки несуществующих страниц (404)
  { path: "*", element: <NotFoundLayout /> },
];
