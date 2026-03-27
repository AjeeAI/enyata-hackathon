import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, Users, Building2 } from 'lucide-react';
import CustomModal from './CustomModal';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [dashboardData, setDashboardData] = useState({
    schoolName: 'Loading...',
    totalCollected: 0,
    outstandingDebt: 0,
    activePaymentPlans: 0,
    recentTransactions: []
  });

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const schoolId = localStorage.getItem('school_id'); 
      const token = localStorage.getItem('token');

      if (!schoolId || schoolId === 'null') {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Authentication Error',
          message: 'No valid school ID found. Please log out and log back in.'
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/dashboard/overview/${schoolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Could not load dashboard statistics. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CustomModal 
        {...modal} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />

      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bursary Overview</h1>
          <p className="text-sm text-slate-500">Real-time financial metrics</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-bold text-slate-700">
            {dashboardData.schoolName || 'My School'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">Total Collected</p>
            <h2 className="text-2xl font-bold text-slate-800 truncate">
              {isLoading ? '...' : `₦${(dashboardData.totalCollected || 0).toLocaleString()}`}
            </h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 text-red-500 rounded-lg shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">Outstanding Debt</p>
            <h2 className="text-2xl font-bold text-slate-800 truncate">
              {isLoading ? '...' : `₦${(dashboardData.outstandingDebt || 0).toLocaleString()}`}
            </h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-lg shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">Active Payment Plans</p>
            <h2 className="text-2xl font-bold text-slate-800 truncate">
              {isLoading ? '...' : (dashboardData.activePaymentPlans || 0)}
            </h2>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-bold text-slate-800">Recent Transactions</h3>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-xs font-medium text-slate-400 border-b border-slate-50 bg-slate-50/50">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : (!dashboardData.recentTransactions || dashboardData.recentTransactions.length === 0) ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">
                    No recent transactions found.
                  </td>
                </tr>
              ) : (
                dashboardData.recentTransactions.map((tx) => (
                  <tr key={tx.id || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{tx.studentName || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{tx.class || ''}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      ₦{tx.amount ? tx.amount.toLocaleString() : '0'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {tx.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{tx.time || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}