import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Shield, Key, CreditCard, Eye, EyeOff, 
  Copy, CheckCircle2, Lock, Globe, ImagePlus, X, AlertCircle, Building2
} from 'lucide-react';

export default function Settings() {
  // --- Custom Notification State ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // --- UI States ---
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [environment, setEnvironment] = useState('test');
  const [logoPreview, setLogoPreview] = useState(null);

  // Load existing logo from LocalStorage on mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('schoolLogo');
    if (savedLogo) setLogoPreview(savedLogo);
  }, []);

  // --- Profile Data ---
  // In a real app, schoolName and email would be fetched from the backend on load
  const [profileData, setProfileData] = useState({
    schoolName: 'Excel Academy', // Updated to reflect the school
    email: 'admin@excelacademy.edu.ng',
    phone: '+2349130411877',
    role: 'Super Admin'
  });

  const [apiKeys, setApiKeys] = useState({
    clientId: 'IKIA2C8B59451433405A172825835',
    secretKey: 'sk_test_7a9b8c...',
    webhookUrl: 'https://eduintellect.com/api/webhooks/interswitch'
  });

  // --- Custom Alert Function ---
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Note: Only phone number uses this handler now, as name and email are locked
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handleKeyChange = (e) => setApiKeys({ ...apiKeys, [e.target.name]: e.target.value });

  // --- Logo Upload Handler ---
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      localStorage.setItem('schoolLogo', url);
      showToast('School logo updated successfully!', 'success');
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setTimeout(() => {
      setIsSavingProfile(false);
      showToast('Contact details updated successfully.');
    }, 1000);
  };

  const handleSaveKeys = (e) => {
    e.preventDefault();
    setIsSavingKeys(true);
    setTimeout(() => {
      setIsSavingKeys(false);
      showToast('Interswitch configuration saved securely.');
    }, 1000);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    showToast(`${type === 'client' ? 'Client ID' : type === 'secret' ? 'Secret Key' : 'Webhook URL'} copied!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      
      {/* --- CUSTOM TOAST NOTIFICATION --- */}
      <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white transform transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'} ${toast.type === 'success' ? 'bg-slate-900 border border-slate-700' : 'bg-red-500'}`}>
        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#00C48C]" /> : <AlertCircle className="w-5 h-5 text-white" />}
        <p className="text-sm font-medium">{toast.message}</p>
        <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account details and integrations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* --- BRANDING CARD --- */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <ImagePlus className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-800">School Branding</h2>
            </div>
            <div className="p-6 flex items-center gap-6">
              <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                {logoPreview ? (
                  <img src={logoPreview} alt="School Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                 <h3 className="text-sm font-medium text-slate-800 mb-1">Dashboard Logo</h3>
                 <p className="text-xs text-slate-500 mb-3">Upload your school's logo to personalize the admin portal.</p>
                 <input type="file" accept="image/*" id="logo-upload" className="hidden" onChange={handleLogoUpload} />
                 <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                   <ImagePlus className="w-4 h-4" />
                   {logoPreview ? 'Change Image' : 'Upload Image'}
                 </label>
              </div>
            </div>
          </div>

          {/* --- PROFILE CARD --- */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <User className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-800">Administrator Profile</h2>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* LOCKED: School Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      value={profileData.schoolName} 
                      readOnly
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none cursor-not-allowed" 
                    />
                  </div>
                </div>

                {/* LOCKED: Email Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registered Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      value={profileData.email} 
                      readOnly 
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none cursor-not-allowed" 
                    />
                  </div>
                </div>

                {/* EDITABLE: Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={profileData.phone} 
                      onChange={handleProfileChange} 
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00C48C] outline-none" 
                    />
                  </div>
                </div>

                {/* LOCKED: System Role */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      value={profileData.role} 
                      readOnly 
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none cursor-not-allowed" 
                    />
                  </div>
                </div>

              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={isSavingProfile} className="bg-[#0F172A] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-70">
                  {isSavingProfile ? 'Saving...' : 'Save Contact Details'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Interswitch Setup */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="px-6 py-5 bg-linear-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-300" />
                <h2 className="font-semibold">Interswitch Setup</h2>
              </div>
            </div>

            <form onSubmit={handleSaveKeys} className="p-6 space-y-5">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-800">Environment</p>
                  <p className="text-xs text-slate-500">{environment === 'test' ? 'Sandbox mode active' : 'Live processing active'}</p>
                </div>
                <button type="button" onClick={() => setEnvironment(env => env === 'test' ? 'live' : 'test')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${environment === 'live' ? 'bg-[#00C48C]' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${environment === 'live' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Client ID</label>
                <div className="flex">
                  <input type="text" name="clientId" value={apiKeys.clientId} onChange={handleKeyChange} className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-700" />
                  <button type="button" onClick={() => copyToClipboard(apiKeys.clientId, 'client')} className="px-3 border border-l-0 border-slate-200 rounded-r-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                    {copiedKey === 'client' ? <CheckCircle2 className="w-4 h-4 text-[#00C48C]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Secret Key</label>
                <div className="flex relative">
                  <input type={showSecretKey ? "text" : "password"} name="secretKey" value={apiKeys.secretKey} onChange={handleKeyChange} className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-700" />
                  <button type="button" onClick={() => setShowSecretKey(!showSecretKey)} className="absolute right-12 top-0 bottom-0 px-2 flex items-center text-slate-400 hover:text-slate-600">
                    {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => copyToClipboard(apiKeys.secretKey, 'secret')} className="px-3 border border-l-0 border-slate-200 rounded-r-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors z-10">
                    {copiedKey === 'secret' ? <CheckCircle2 className="w-4 h-4 text-[#00C48C]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Webhook URL
                </label>
                <div className="flex">
                  <input type="text" value={apiKeys.webhookUrl} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-xs bg-slate-50 outline-none text-slate-500 truncate" />
                  <button type="button" onClick={() => copyToClipboard(apiKeys.webhookUrl, 'webhook')} className="px-3 border border-l-0 border-slate-200 rounded-r-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                    {copiedKey === 'webhook' ? <CheckCircle2 className="w-4 h-4 text-[#00C48C]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button type="submit" disabled={isSavingKeys} className="w-full bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
                  <Key className="w-4 h-4" />
                  {isSavingKeys ? 'Saving...' : 'Update Credentials'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}