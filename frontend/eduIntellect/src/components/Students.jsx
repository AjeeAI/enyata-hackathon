import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, X, Check, Bell, Clock, Edit, Trash2, AlertCircle } from 'lucide-react';
import CustomModal from './CustomModal';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('All');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: '', class: '', parentName: '', parentPhone: '', outstanding: '', status: 'Not Paid'
  });
  const [errors, setErrors] = useState({});

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const schoolId = localStorage.getItem('school_id');
        if (!schoolId) return;

        const response = await fetch(`${API_URL}/api/admin/students/${schoolId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) throw new Error("Failed to fetch students");
        const data = await response.json();
        
        setStudents(data.map(s => ({
            id: s.id,
            name: s.name,
            class: s.current_class,
            parentName: s.guardian_name,
            parentPhone: s.guardian_phone,
            outstanding: s.outstanding_debt || 0, 
            status: s.status
        })));
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [API_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent({ ...newStudent, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setNewStudent({ name: '', class: '', parentName: '', parentPhone: '', outstanding: '', status: 'Not Paid' });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setIsEditing(true);
    setEditingId(student.id);
    setNewStudent({
      name: student.name,
      class: student.class,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      outstanding: student.outstanding,
      status: student.status
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newStudent.name.trim()) newErrors.name = 'Student Name is required';
    if (!newStudent.class.trim()) newErrors.class = 'Class is required';
    if (!newStudent.parentName.trim()) newErrors.parentName = 'Parent Name is required';
    if (!newStudent.parentPhone.trim()) newErrors.parentPhone = 'Parent Phone is required';
    if (newStudent.outstanding === '' || newStudent.outstanding < 0) newErrors.outstanding = 'Valid Debt Amount is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
        const schoolId = localStorage.getItem('school_id');
        const token = localStorage.getItem('token');
        const payload = {
            name: newStudent.name,                  
            class: newStudent.class,        
            status: newStudent.status,
            parentName: newStudent.parentName,   
            parentPhone: newStudent.parentPhone, 
            outstanding_debt: parseFloat(newStudent.outstanding) || 0.0, 
            school_id: schoolId 
        };

        const url = isEditing 
            ? `${API_URL}/api/admin/students/${editingId}` 
            : `${API_URL}/api/admin/students`;
        
        const response = await fetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.detail?.includes("already exists")) throw new Error("A student with this phone number already exists.");
            throw new Error("Failed to save student.");
        }
        
        const returned = await response.json();
        const formatted = {
            id: returned.id,
            name: returned.name,
            class: returned.current_class,
            parentName: returned.guardian_name,
            parentPhone: returned.guardian_phone,
            outstanding: returned.outstanding_debt || 0,
            status: returned.status
        };

        setStudents(prev => isEditing ? prev.map(s => s.id === editingId ? formatted : s) : [...prev, formatted]);
        setModal({ isOpen: true, type: 'success', title: 'Success', message: `Student ${isEditing ? 'updated' : 'added'} successfully!` });
        setIsModalOpen(false);
    } catch (error) {
        setModal({ isOpen: true, type: 'error', title: 'Error', message: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const executeDelete = async (id) => {
    try {
        const response = await fetch(`${API_URL}/api/admin/students/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error("Delete failed");
        setStudents(students.filter(s => s.id !== id));
        setModal({ isOpen: true, type: 'success', title: 'Deleted', message: 'Student removed successfully.' });
    } catch (error) {
        setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete student.' });
    }
  };

  const executeApprove = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/students/${id}/clear-debt`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error("Update failed");
      setStudents(students.map(s => s.id === id ? { ...s, outstanding: 0, status: 'Paid' } : s));
      setModal({ isOpen: true, type: 'success', title: 'Approved', message: 'Debt cleared successfully!' });
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Could not update record.' });
    }
  };

  const triggerDelete = (id) => setModal({ isOpen: true, type: 'warning', title: 'Delete Student', message: 'Are you sure? This cannot be undone.', confirmText: 'Delete', showCancel: true, onConfirm: () => executeDelete(id) });
  const triggerApprove = (id) => setModal({ isOpen: true, type: 'info', title: 'Approve Payment', message: 'Clear this student\'s outstanding debt?', confirmText: 'Approve', showCancel: true, onConfirm: () => executeApprove(id) });
  
  const classes = ['All', ...new Set(students.map(s => s.class))];
  const filteredStudents = filterClass === 'All' ? students : students.filter(s => s.class === filterClass);

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <CustomModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-4 w-4 text-slate-400" /></div>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer">
              {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
            </select>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 bg-[#00C48C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Parent Details</th>
                <th className="px-6 py-4">Outstanding (₦)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading student data...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">No students found.</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{student.name}</div>
                      <div className="text-xs text-slate-400">ID: {student.id.split('-')[0]}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.class}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800">{student.parentName}</div>
                      <div className="text-xs text-slate-500">{student.parentPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{student.outstanding.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        student.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        student.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {student.status === 'Paid' && <Check className="w-3 h-3" />}
                        {student.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {student.status === 'Pending' && (
                          <button onClick={() => triggerApprove(student.id)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded text-xs font-medium border border-emerald-200">Approve</button>
                        )}
                        {student.status === 'Not Paid' && (
                          <button onClick={() => setModal({ isOpen: true, type: 'success', title: 'Alert Sent', message: 'Reminder sent!' })} className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded text-xs font-medium border border-blue-200">
                            <Bell className="w-3 h-3" /> Alert
                          </button>
                        )}
                        <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-2">
                            <button onClick={() => openEditModal(student)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => triggerDelete(student.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">{isEditing ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitStudent} noValidate className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Student Name</label>
                  <input type="text" name="name" value={newStudent.name} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} placeholder="John Doe" />
                  {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                    <input type="text" name="class" value={newStudent.class} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${errors.class ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} placeholder="JSS 1" />
                    {errors.class && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.class}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                    <select name="status" value={newStudent.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none bg-white">
                      <option value="Not Paid">Not Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Parent Name</label>
                  <input type="text" name="parentName" value={newStudent.parentName} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${errors.parentName ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} placeholder="Mr. Doe" />
                  {errors.parentName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.parentName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Parent Phone</label>
                  <input type="tel" name="parentPhone" value={newStudent.parentPhone} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${errors.parentPhone ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} placeholder="08012345678" />
                  {errors.parentPhone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.parentPhone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Outstanding Debt (₦)</label>
                  <input type="number" name="outstanding" min="0" value={newStudent.outstanding} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${errors.outstanding ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} placeholder="15000" />
                  {errors.outstanding && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.outstanding}</p>}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-[#00C48C] hover:bg-emerald-500 rounded-lg disabled:opacity-70">{isSubmitting ? 'Saving...' : (isEditing ? 'Save' : 'Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}