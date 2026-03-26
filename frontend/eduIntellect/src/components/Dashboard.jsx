import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, Users } from 'lucide-react';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic state to hold backend data
  const [dashboardData, setDashboardData] = useState({
    totalCollected: 0,
    outstandingDebt: 0,
    activePaymentPlans: 0,
    recentTransactions: []
  });

  // Fetch data from the database
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Replace with your actual backend GET endpoint
      // const response = await fetch('https://demo-api.com/api/dashboard/overview');
      // const data = await response.json();
      
      // Mocking the backend JSON response for demonstration
      const mockBackendData = {
        totalCollected: 4500000,
        outstandingDebt: 1200000,
        activePaymentPlans: 42,
        recentTransactions: [
          { id: 1, studentName: 'Amaka Johnson', class: 'JSS 2', amount: 5000, status: 'Verified', time: '2 mins ago' },
          { id: 2, studentName: 'Obi Michael', class: 'SSS 1', amount: 15000, status: 'Verified', time: '1 hr ago' }
        ]
      };
      
      setDashboardData(mockBackendData);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when the component mounts
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Bursary Overview</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Excel Academy</span>
          <div className="w-8 h-8 rounded-full bg-emerald-500"></div>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid (1 col mobile, 3 col desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">Total Collected</p>
            <h2 className="text-2xl font-bold text-slate-800 truncate">
              {isLoading ? '...' : `₦${dashboardData.totalCollected.toLocaleString()}`}
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
              {isLoading ? '...' : `₦${dashboardData.outstandingDebt.toLocaleString()}`}
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
              {isLoading ? '...' : dashboardData.activePaymentPlans}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Content: Recent Transactions Table (Full Width) */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-bold text-slate-800">Recent Transactions</h3>
        </div>
        
        {/* Responsive Table Wrapper */}
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
              ) : dashboardData.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">
                    No recent transactions found.
                  </td>
                </tr>
              ) : (
                dashboardData.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{tx.studentName}</p>
                      <p className="text-xs text-slate-400">{tx.class}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{tx.time}</td>
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