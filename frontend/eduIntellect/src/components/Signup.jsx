import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, Key, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import CustomModal from './CustomModal'; 

// --- UPGRADED: InputField now accepts and displays inline errors ---
const InputField = ({ icon: Icon, label, type, name, placeholder, value, onChange, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className={`h-5 w-5 ${error ? 'text-red-400' : 'text-gray-400'}`} />
      </div>
      <input
        type={type}
        name={name}
        value={value}
        className={`block w-full pl-10 sm:text-sm rounded-lg py-2.5 border outline-none transition-colors ${
          error 
            ? 'border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50' 
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white'
        }`}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />{error}
      </p>
    )}
  </div>
);

export default function Signup() {
  const [formData, setFormData] = useState({
    schoolName: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    interswitchClientId: '', 
    interswitchSecretKey: '',
    interswitchMerchantCode: '', 
    interswitchPayItemId: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  
  // --- NEW: Inline Error State ---
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear the specific error when the user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // --- NEW: Custom Validation Logic ---
  const validateForm = () => {
    const newErrors = {};
    if (!formData.schoolName.trim()) newErrors.schoolName = 'School Name is required';
    if (!formData.email.trim()) newErrors.email = 'Admin Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
    if (!formData.interswitchClientId.trim()) newErrors.interswitchClientId = 'Client ID is required';
    if (!formData.interswitchSecretKey.trim()) newErrors.interswitchSecretKey = 'Secret Key is required';
    if (!formData.interswitchMerchantCode.trim()) newErrors.interswitchMerchantCode = 'Merchant Code is required';
    if (!formData.interswitchPayItemId.trim()) newErrors.interswitchPayItemId = 'Pay Item ID is required';

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Stop submission if validation fails
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Registration Successful!',
        message: 'Your school environment has been successfully created. You can now log in.',
        onConfirm: () => navigate('/login')
      });
    } catch (error) {
      console.error('Signup failed', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Registration Failed',
        message: error.message || "Could not connect to the server."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative">
      
      <CustomModal 
        {...modal} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        <div className="bg-blue-600 px-8 py-6 text-white text-center">
          <h2 className="text-3xl font-bold">Register School</h2>
          <p className="mt-2 text-blue-100">Set up your administrative environment</p>
        </div>

        {/* --- ADDED noValidate HERE --- */}
        <form onSubmit={handleSignup} noValidate className="px-8 py-8 space-y-8">
          
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                icon={Building2} label="Name of School" type="text" name="schoolName" 
                placeholder="Greenwood High" value={formData.schoolName} onChange={handleChange}
                error={errors.schoolName}
              />
              <InputField 
                icon={Mail} label="Admin Email" type="email" name="email" 
                placeholder="admin@greenwood.edu" value={formData.email} onChange={handleChange}
                error={errors.email}
              />
              
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* --- CUSTOM PASSWORD FIELD WITH INLINE ERRORS --- */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      className={`block w-full pl-10 pr-10 sm:text-sm rounded-lg py-2.5 border outline-none transition-colors ${
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
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.password}
                    </p>
                  )}
                </div>

                <InputField 
                  icon={Lock} label="Confirm Password" type="password" name="confirmPassword" 
                  placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange}
                  error={errors.confirmPassword}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Interswitch Configuration */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Interswitch Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField 
                icon={Key} label="Client ID" type="text" name="interswitchClientId" 
                placeholder="IKIAB..." value={formData.interswitchClientId} onChange={handleChange}
                error={errors.interswitchClientId}
              />
              <InputField 
                icon={Key} label="Secret Key" type="password" name="interswitchSecretKey" 
                placeholder="••••••••" value={formData.interswitchSecretKey} onChange={handleChange}
                error={errors.interswitchSecretKey}
              />
              <InputField 
                icon={Key} label="Merchant Code" type="text" name="interswitchMerchantCode" 
                placeholder="MX123..." value={formData.interswitchMerchantCode} onChange={handleChange}
                error={errors.interswitchMerchantCode}
              />
              <InputField 
                icon={Key} label="Pay Item ID" type="text" name="interswitchPayItemId" 
                placeholder="940..." value={formData.interswitchPayItemId} onChange={handleChange}
                error={errors.interswitchPayItemId}
              />
            </div>
            <p className="mt-3 text-xs text-gray-500 italic">
              Use the "General Integration" test keys from the Interswitch docs for sandbox testing.
            </p>
          </div>

          <div className="pt-2 flex flex-col items-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </button>
            <p className="mt-4 text-sm text-gray-600">
              Already registered? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in here</Link>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}