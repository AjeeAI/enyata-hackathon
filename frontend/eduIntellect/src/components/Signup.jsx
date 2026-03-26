import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, Key, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    schoolName: '', email: '', password: '', confirmPassword: '',
    interswitchClientId: '', interswitchSecretKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    setIsLoading(true);
    try {
      await fetch('https://demo-api.com/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      navigate('/login');
    } catch (error) {
      console.error('Signup failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ icon: Icon, label, type, name, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type={type}
          name={name}
          required
          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none transition-colors bg-gray-50 focus:bg-white"
          placeholder={placeholder}
          onChange={handleChange}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 px-8 py-6 text-white text-center">
          <h2 className="text-3xl font-bold">Register School</h2>
          <p className="mt-2 text-blue-100">Set up your administrative environment</p>
        </div>

        <form onSubmit={handleSignup} className="px-8 py-8 space-y-8">
          
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField icon={Building2} label="Name of School" type="text" name="schoolName" placeholder="Greenwood High" />
              <InputField icon={Mail} label="Admin Email" type="email" name="email" placeholder="admin@greenwood.edu" />
              
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none bg-gray-50 focus:bg-white"
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
                </div>
                <InputField icon={Lock} label="Confirm Password" type="password" name="confirmPassword" placeholder="••••••••" />
              </div>
            </div>
          </div>

          {/* Section 2: Integration Keys */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Interswitch Configuration
            </h3>
            <div className="space-y-4">
              <InputField icon={Key} label="Client ID" type="text" name="interswitchClientId" placeholder="Enter Client ID" />
              <InputField icon={Key} label="Secret Key" type="password" name="interswitchSecretKey" placeholder="Enter Secret Key" />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Your credentials are encrypted and stored securely for processing tuition payments.
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