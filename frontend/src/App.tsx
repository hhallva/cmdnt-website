import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages//Login//LoginLayoyt';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css'


function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
