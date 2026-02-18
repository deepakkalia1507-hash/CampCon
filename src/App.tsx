import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Student } from './types';
import { storage } from './utils/storage';
import { apiClient } from './api/client';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';

type Page = 'login' | 'register' | 'student-dashboard' | 'admin-dashboard';

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<Student | null>(null);

  useEffect(() => {
    const savedUser = storage.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      setCurrentPage('student-dashboard');
    }
  }, []);

  const handleStudentLogin = (student: Student) => {
    setCurrentUser(student);
    setCurrentPage('student-dashboard');
  };

  const handleAdminLogin = () => {
    setCurrentPage('admin-dashboard');
  };

  const handleRegister = async (student: Student) => {
    try {
      await apiClient.register(student);
      setCurrentPage('login');
      // Optional: Show success message
    } catch (error: any) {
      console.error('Registration failed:', error);
      const message = error.response?.data?.error || error.response?.data?.register_number?.[0] || error.message || 'Registration failed. Please try again.';
      alert(`Registration failed: ${message}`);
    }
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage
            onStudentLogin={handleStudentLogin}
            onAdminLogin={handleAdminLogin}
            onSwitchToRegister={() => setCurrentPage('register')}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onRegister={handleRegister}
            onBackToLogin={() => setCurrentPage('login')}
          />
        );
      case 'student-dashboard':
        return currentUser ? (
          <StudentDashboard student={currentUser} onLogout={handleLogout} />
        ) : (
          <LoginPage
            onStudentLogin={handleStudentLogin}
            onAdminLogin={handleAdminLogin}
            onSwitchToRegister={() => setCurrentPage('register')}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard onLogout={handleLogout} />
        );
      default:
        return (
          <LoginPage
            onStudentLogin={handleStudentLogin}
            onAdminLogin={handleAdminLogin}
            onSwitchToRegister={() => setCurrentPage('register')}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen text-gray-900 dark:text-white transition-colors duration-300">
        <ThemeToggle />
        {renderPage()}
      </div>
    </ThemeProvider>
  );
}
