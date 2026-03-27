import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  File as FileIcon
} from 'lucide-react';
import CustomModal from './CustomModal';

export default function Policies() {
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const schoolId = localStorage.getItem('school_id');
        if (!schoolId || schoolId === 'null') {
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/admin/policies/${schoolId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) throw new Error("Failed to fetch documents");
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Connection Error',
          message: 'Could not load your school policies. Please check your connection.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, [API_URL]);

  const handleDragOver = (e) => e.preventDefault();
  
  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) processFile(files[0]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = async (document) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', document); 
    const schoolId = localStorage.getItem('school_id');
    formData.append('school_id', schoolId);

    try {
      const response = await fetch(`${API_URL}/api/admin/upload-policy`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      
      const newDoc = await response.json(); 
      setDocuments(prevDocs => [newDoc, ...prevDocs]);
      
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Upload Successful',
        message: 'The document has been securely uploaded and the AI is indexing it.'
      });
      
    } catch (error) {
      console.error('Upload failed', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload document. Ensure it is a valid PDF or Word file under 10MB.'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerDelete = (id) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Delete Document',
      message: 'Are you sure? The AI will no longer use this information to answer parent queries.',
      confirmText: 'Yes, Delete',
      showCancel: true,
      onConfirm: () => executeDelete(id)
    });
  };

  const executeDelete = async (id) => {
      setDocuments(documents.filter(doc => doc.id !== id));
      try {
          // await fetch(`${API_URL}/api/admin/policies/${id}`, { method: 'DELETE' });
      } catch (error){
          console.error("Failed to delete doc", error);
      }
  };

  const filteredDocs = documents.filter(doc => (doc?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const getStatusDisplay = (status) => {
    const baseClass = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border";
    switch(status) {
      case 'indexed':
        return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>;
      case 'processing':
        return <span className={`${baseClass} bg-amber-50 text-amber-600 border-amber-100`}><Clock className="w-3.5 h-3.5 animate-pulse" /> Indexing...</span>;
      default:
        return <span className={`${baseClass} bg-red-50 text-red-600 border-red-100`}><AlertCircle className="w-3.5 h-3.5" /> Failed</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <CustomModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />

      <div className="flex flex-col mb-2">
        <h1 className="text-2xl font-bold text-slate-800">Knowledge Base (RAG)</h1>
        <p className="text-slate-500 text-sm mt-1">Upload school policies to train the EduIntellect AI assistant.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div 
            className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center hover:border-[#00C48C] hover:bg-emerald-50/30 transition-all cursor-pointer h-full min-h-[300px]"
            onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-[#00C48C]">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Upload Document</h3>
            <p className="text-sm text-slate-500 mb-6 px-4">Drag and drop or click to browse.</p>
            <input type="file" accept=".pdf,.doc,.docx,.txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button disabled={isUploading} className="bg-[#0F172A] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center gap-2">
              {isUploading ? <><Clock className="w-4 h-4 animate-spin" /> Processing...</> : 'Select File'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col h-full min-h-[400px]">
          <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-slate-800">Indexed Documents</h3>
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div>
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C]" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center"><p>Loading...</p></div>
              ) : filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                  <FileText className="w-12 h-12 mb-3 opacity-20" />
                  <p>No documents found.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredDocs.map((doc) => (
                    <li key={doc.id || Math.random()} className="group p-4 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 overflow-hidden">
                        <div className="p-2.5 bg-slate-100 text-slate-500 rounded-lg shrink-0"><FileIcon className="w-5 h-5" /></div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-slate-800 text-sm truncate">{doc.name || 'Unnamed Document'}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>{doc.size || 'Unknown size'}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{doc.date || 'Unknown date'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {getStatusDisplay(doc.status)}
                        <button onClick={() => triggerDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}