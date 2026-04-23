'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Trash2, Edit2, Check, Download } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';

interface HearingDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hearingData: any | null;
  onSuccess: () => void;
}

export default function HearingDocumentsModal({ isOpen, onClose, hearingData, onSuccess }: HearingDocumentsModalProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Rename state
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocName, setEditDocName] = useState('');

  useEffect(() => {
    if (isOpen && hearingData) {
      setDocuments(hearingData.documents || []);
    }
  }, [isOpen, hearingData]);

  if (!isOpen || !hearingData) return null;

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadName) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('hearing', hearingData.id);
    formData.append('file', uploadFile);
    formData.append('name', uploadName);

    try {
      const res = await fetch('${API_BASE}/hearing-documents/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (res.ok) {
        const newDoc = await res.json();
        setDocuments([...documents, newDoc]);
        setUploadFile(null);
        setUploadName('');
        onSuccess();
      } else {
        const data = await res.json();
        alert('Failed to upload document: ' + JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/hearing-documents/${docId}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDocuments(documents.filter(d => d.id !== docId));
        onSuccess();
      } else {
        alert("Failed to delete document.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartRename = (doc: any) => {
    setEditingDocId(doc.id);
    setEditDocName(doc.name);
  };

  const handleSaveRename = async (docId: string) => {
    if (!editDocName.trim()) return;
    
    try {
      const res = await apiFetch(`${API_BASE}/hearing-documents/${docId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editDocName })
      });
      
      if (res.ok) {
        setDocuments(documents.map(d => d.id === docId ? { ...d, name: editDocName } : d));
        setEditingDocId(null);
        onSuccess();
      } else {
        alert("Failed to rename document.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={24} className="text-blue-600" />
              Hearing Documents
            </h2>
            <p className="text-sm text-slate-500 mt-1">Manage files for Hearing on {hearingData.hearing_date}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Upload Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Upload New Document</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Document Title (e.g., Court Order, Evidence)"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-medium"
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="flex-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleUploadDocument}
                  disabled={isUploading || !uploadFile || !uploadName.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* List Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
              Attached Documents
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{documents.length}</span>
            </h3>
            
            {documents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">No documents attached yet</p>
                <p className="text-sm text-slate-400 mt-1">Upload files above to attach them to this hearing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all group">
                    <div className="flex-1 min-w-0 pr-4">
                      {editingDocId === doc.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={editDocName}
                            onChange={(e) => setEditDocName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(doc.id)}
                          />
                          <button onClick={() => handleSaveRename(doc.id)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingDocId(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                            <p className="text-xs text-slate-500">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingDocId !== doc.id && (
                        <>
                          <a 
                            href={`http://localhost:8000${doc.file}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download size={18} />
                          </a>
                          <button 
                            onClick={() => handleStartRename(doc)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Rename"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDocument(doc.id)} 
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
