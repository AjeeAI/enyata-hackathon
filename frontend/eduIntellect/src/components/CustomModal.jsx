import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function CustomModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', or 'info'
  onConfirm, 
  confirmText = 'OK', 
  showCancel = false 
}) {
  if (!isOpen) return null;

  // Dynamic styling based on the type of modal
  const styles = {
    success: { icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />, bg: 'bg-emerald-50', btn: 'bg-[#00C48C] hover:bg-emerald-500' },
    error: { icon: <AlertCircle className="w-6 h-6 text-rose-500" />, bg: 'bg-rose-50', btn: 'bg-rose-500 hover:bg-rose-600' },
    warning: { icon: <AlertCircle className="w-6 h-6 text-amber-500" />, bg: 'bg-amber-50', btn: 'bg-amber-500 hover:bg-amber-600' },
    info: { icon: <Info className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-50', btn: 'bg-blue-600 hover:bg-blue-700' }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 text-center flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full ${currentStyle.bg} flex items-center justify-center mb-4`}>
            {currentStyle.icon}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>

        <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          {showCancel && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors w-full"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors w-full ${currentStyle.btn} shadow-sm`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}