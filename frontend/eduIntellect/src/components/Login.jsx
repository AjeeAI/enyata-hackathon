import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import CustomModal from './CustomModal'; // <-- IMPORT THE MODAL

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // --- Modal & Error States ---
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
    
    // Clear specific error when the user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // --- NEW: Custom Validation Logic ---
  const validateForm = () => {
    const newErrors = {};
    if (!credentials.email.trim()) newErrors.email = 'Email address is required';
    if (!credentials.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Stop submission if validation fails
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        
        if (data.school_id) {
          localStorage.setItem('school_id', data.school_id);
        }

        setModal({
          isOpen: true,
          type: 'success',
          title: 'Welcome Back!',
          message: 'Securely logging you into the dashboard...',
          onConfirm: () => navigate('/admin') 
        });
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Login Failed',
          message: data.detail || "Invalid email or password.",
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: "Could not connect to the server. Is the backend running?",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      
      {/* --- RENDER THE MODAL --- */}
      <CustomModal 
        {...modal} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Lock className="text-white w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage your school's dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {/* --- ADDED noValidate HERE --- */}
          <form className="space-y-6" onSubmit={handleLogin} noValidate>
            
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  className={`block w-full pl-10 sm:text-sm rounded-lg py-3 border outline-none transition-colors ${
                    errors.email 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white'
                  }`}
                  placeholder="admin@school.edu"
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={credentials.password}
                  className={`block w-full pl-10 pr-10 sm:text-sm rounded-lg py-3 border outline-none transition-colors ${
                    errors.password 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white'
                  }`}
                  placeholder="••••••••"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Register your school
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}