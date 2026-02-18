
import { useState } from 'react';
import { storage } from '../utils/storage';
import { Student } from '../types';
import { apiClient } from '../api/client';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginPageProps {
  onStudentLogin: (student: Student) => void;
  onAdminLogin: () => void;
  onSwitchToRegister: () => void;
}

const ADMIN_EMAIL = 'rajayanand54@gmail.com';
const ADMIN_PASSWORD = 'Ajay121005';

export function LoginPage({ onStudentLogin, onAdminLogin, onSwitchToRegister }: LoginPageProps) {
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!registerNumber) {
      setError('Please enter your register number.');
      setIsLoading(false);
      return;
    }

    try {
      const student = await apiClient.login(registerNumber, password);

      if (!student) {
        setError('Invalid credentials or student not found.');
        return;
      }

      storage.setCurrentUser(student);
      onStudentLogin(student);
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email;

      if (!email) {
        setError('No email found from Google account.');
        return;
      }

      // Check if student exists in backend by email
      // We need a new API endpoint for this or just try to register?
      // Actually, for now let's try to find a student with this email.
      // Since our simple backend doesn't have a "get by email", we might need to fetch all and filter (inefficient but works for mini project)
      // OR update backend to support it. 
      // Let's implement getAllStudents filtering for now to be safe without backend changes first.

      const allStudents = await apiClient.getAllStudents();
      const existingStudent = allStudents.find(s => s.email === email);

      if (existingStudent) {
        storage.setCurrentUser(existingStudent);
        onStudentLogin(existingStudent);
      } else {
        // Redirect to register, pre-filling email
        // We can pass state to parent or alert user.
        // For this simple app, let's alert.
        alert(`Hello ${user.displayName}! You are new here. Please register your details.`);
        onSwitchToRegister();
        // In a real app, we would pre-fill the register form with Google data.
      }

    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const errorMessage = err.message || 'Google Sign-In failed.';
      setError(errorMessage);
      alert(`Login Error: ${errorMessage}`); // Show error content to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email !== ADMIN_EMAIL) {
      setError('Only authorized admin can login. Access denied.');
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      setError('Invalid admin password.');
      return;
    }

    onAdminLogin();
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (loginType === 'student') {
      handleStudentLogin(e);
    } else {
      handleAdminLogin(e);
    }
  };

  return (
    <div className="min-h-screen app-background flex items-center justify-center p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md transition-colors duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Campus Connect</h1>
          <p className="text-gray-600 dark:text-gray-300">Event & Placement Management</p>
        </div>

        <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          <button
            onClick={() => { setLoginType('student'); setError(''); }}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${loginType === 'student'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
          >
            Student Login
          </button>
          <button
            onClick={() => { setLoginType('admin'); setError(''); }}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${loginType === 'admin'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
          >
            Admin Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginType === 'student' && (
            <>
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:shadow-md flex items-center justify-center gap-2 mb-4 transition-all"
                disabled={isLoading}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </button>

              <div className="relative flex items-center justify-center my-4">
                <hr className="w-full border-gray-300" />
                <span className="absolute bg-white dark:bg-gray-800 px-3 text-xs text-gray-500">OR</span>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                Login with Register Number
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Register Number
                </label>
                <input
                  type="text"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter your register number"
                  required
                />
              </div>
            </>
          )}

          {loginType === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="admin@example.com"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          {loginType === 'student' && (
            <div className="text-center mt-4">
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Register Now
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
