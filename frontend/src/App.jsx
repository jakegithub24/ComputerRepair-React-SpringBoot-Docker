import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import LandingPage from './pages/LandingPage';
import RegisterForm from './pages/RegisterForm';
import LoginForm from './pages/LoginForm';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
