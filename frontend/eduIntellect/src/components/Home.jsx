import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Shield } from 'lucide-react';
import CustomModal from './CustomModal';

export default function Home() {
  const [studentId, setStudentId] = useState('');
  const navigate = useNavigate();
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  const handleParentChat = (e) => {
    e.preventDefault();
    
    if (!studentId.trim()) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Missing Information',
        message: 'Please enter a valid Student ID or registered Phone Number to access the chat.'
      });
      return;
    }

    navigate(`/chat/${studentId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      <CustomModal 
        {...modal} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />

      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full space-y-8 text-center border border-slate-100 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Excel Academy</h1>
          <p className="text-slate-500 mt-2">Welcome! Please select your portal.</p>
        </div>

        <div className="space-y-6 pt-2">
          <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-center gap-2 mb-4 text-[#00C48C]">
              <Bot className="w-6 h-6" />
              <h2 className="text-lg font-bold text-slate-800">Chat as a Parent</h2>
            </div>
            
            <form onSubmit={handleParentChat} className="space-y-3">
              <input
                type="text"
                placeholder="Enter Student ID (e.g. 08012345678)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00C48C] text-sm text-center bg-white"
              />
              <button 
                type="submit" 
                className="w-full bg-[#00C48C] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-500 transition-all shadow-md active:scale-[0.98]"
              >
                Start Secure Chat
              </button>
            </form>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-400 text-xs font-bold uppercase tracking-widest">School Staff</span>
            </div>
          </div>

          <div>
            <Link 
              to="/login" 
              className="w-full bg-[#0F172A] text-white py-3 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
            >
              <Shield className="w-4 h-4" /> Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}