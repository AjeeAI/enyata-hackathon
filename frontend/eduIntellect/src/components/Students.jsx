import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, X, Check, Bell, Clock } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('All');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '', class: '', parentName: '', parentPhone: '', outstanding: '', status: 'Not Paid'
  });

  // --- Fetch real data from the backend ---
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const schoolId = localStorage.getItem('school_id');
        if (!schoolId) {
          console.error("No school ID found. Please login again.");
          return;
        }

        const response = await fetch(`http://127.0.0.1:8000/api/admin/students/${schoolId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Secure the route
          }
        });

        if (!response.ok) throw new Error("Failed to fetch students");
        
        const data = await response.json();
        
        // Map backend database fields to the UI state
        const formattedData = data.map(s => ({
            id: s.id,
            name: s.name,
            class: s.current_class,
            parentName: s.guardian_name,
            parentPhone: s.guardian_phone,
            outstanding: 15000, // Hardcoded default outstanding for the demo
            status: s.status
        }));
        setStudents(formattedData);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // --- Handlers for Adding a New Student ---
  const handleInputChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const schoolId = localStorage.getItem('school_id');
    
    // Prepare payload for FastAPI
    const studentData = {
      ...newStudent,
      school_id: schoolId,
      class: newStudent.class.trim().toUpperCase(), 
      outstanding: Number(newStudent.outstanding)
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/students', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(studentData)
      });
      
      if (!response.ok) throw new Error("Failed to save student");
      
      const savedStudent = await response.json();
      
      // Instantly update the UI table with the DB response
      setStudents([...students, {
          id: savedStudent.id,
          name: savedStudent.name,
          class: savedStudent.current_class,
          parentName: savedStudent.guardian_name,
          parentPhone: savedStudent.guardian_phone,
          outstanding: Number(newStudent.outstanding),
          status: savedStudent.status
      }]);
      
      setIsModalOpen(false);
      setNewStudent({ name: '', class: '', parentName: '', parentPhone: '', outstanding: '', status: 'Not Paid' });
      alert('Student added successfully!');
    } catch (error) {
      console.error("Add student error:", error);
      alert("Error saving student to the database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Action Handlers ---
  const handleApprovePayment = (id) => {
    if(window.confirm("Approve this pending payment? The outstanding balance will be cleared.")) {
      // For a full app, this would be a PUT request to the backend. 
      // We do it optimistically in the UI for the demo.
      setStudents(students.map(s => 
        s.id === id ? { ...s, outstanding: 0, status: 'Paid' } : s
      ));
    }
  };

  const handleAlertParent = (id, phone) => {
    alert(`Payment reminder sequence initiated for ${phone} via EduIntellect AI.`);
  };

  // --- Filtering Logic ---
  const classes = ['All', ...new Set(students.map(s => s.class))];
  const filteredStudents = filterClass === 'All' ? students : students.filter(s => s.class === filterClass);

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
        
        <div className="flex items-center gap-3">
          {/* Class Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select 
              value={filterClass} 
              onChange={(e) => setFilterClass(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
            </select>
          </div>

          {/* New "Add Student" Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#00C48C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Data Table */}
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
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">No students found. Add one to get started!</td></tr>
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
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {student.outstanding.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {/* Dynamic Status Pill */}
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
                      {/* Dynamic Action Buttons */}
                      <div className="flex justify-end items-center gap-2">
                        {student.status === 'Pending' && (
                          <button 
                            onClick={() => handleApprovePayment(student.id)}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded text-xs font-medium transition-colors border border-emerald-200"
                          >
                            Approve
                          </button>
                        )}
                        {student.status === 'Not Paid' && (
                          <button 
                            onClick={() => handleAlertParent(student.id, student.parentPhone)}
                            className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded text-xs font-medium transition-colors border border-blue-200"
                          >
                            <Bell className="w-3 h-3" /> Alert Parent
                          </button>
                        )}
                        {student.status === 'Paid' && (
                          <button disabled className="bg-slate-100 text-slate-400 px-3 py-1.5 rounded text-xs font-medium cursor-not-allowed">
                            Approved
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD STUDENT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Add New Student</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Student Name</label>
                  <input type="text" name="name" required value={newStudent.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00C48C] outline-none" placeholder="e.g. John Doe" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                    <input type="text" name="class" required value={newStudent.class} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00C48C] outline-none" placeholder="e.g. JSS 1" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                    <select name="status" value={newStudent.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00C48C] outline-none bg-white">
                      <option value="Not Paid">Not Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Parent Name</label>
                  <input type="text" name="parentName" required value={newStudent.parentName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00C48C] outline-none" placeholder="e.g. Mr. Doe" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Parent Phone</label>
                  <input type="tel" name="parentPhone" required value={newStudent.parentPhone} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00C48C] outline-none" placeholder="e.g. 08012345678" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Outstanding Debt (₦)</label>
                  <input type="number" name="outstanding" required min="0" value={newStudent.outstanding} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00C48C] outline-none" placeholder="e.g. 15000" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-[#00C48C] hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}