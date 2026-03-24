import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trash2, Upload, FileText, User as UserIcon, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

interface Document {
  id: number;
  title: string;
  document_type: string;
  uploaded_at: string;
}

const AdminDashboard = () => {
  const { token, logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('Code du travail');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleLogoutAndRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate('/dashboard');
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/documents/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchDocuments();
  }, [token]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('document_type', docType);

    try {
      await axios.post('http://localhost:5001/api/documents/', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer ce document ?")) return;
    try {
      await axios.delete(`http://localhost:5001/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <nav className="bg-white dark:bg-slate-900 shadow border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white truncate">Lexi-RH Admin</h1>
              <span className="ml-2 sm:ml-4 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hidden sm:block">
                Espace employeur / RH
              </span>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
               <ThemeToggle />
               <Link to="/profile" className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Mon Profil">
                 <UserIcon className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Mon Profil</span>
               </Link>
               <button onClick={handleLogoutAndRedirect} className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Déconnexion">
                 <LogOut className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Déconnexion</span>
               </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg mb-8 border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white flex items-center mb-4">
              <Upload className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
              Ajouter une source juridique
            </h3>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Titre du document</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Convention Syntec 2024" className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white dark:placeholder-slate-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie Juridique</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors">
                    <option>Code du travail</option>
                    <option>Conventions collectives</option>
                    <option>Accords d'entreprise</option>
                    <option>Règlement intérieur</option>
                    <option>Chartes informatiques</option>
                    <option>Documents RGPD</option>
                    <option>Politiques RSE</option>
                    <option>Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fichier source (.pdf, .txt)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-900/50 group">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center mt-4">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Sélectionner un fichier</span>
                        <input type="file" ref={fileInputRef} onChange={e => setFile(e.target.files?.[0] || null)} required className="sr-only" accept=".pdf,.txt" />
                      </label>
                      <p className="pl-1">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      {file ? <span className="font-semibold text-blue-700 dark:text-blue-400">{file.name}</span> : 'Format PDF ou TXT uniquement (Max 10MB)'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading || !file} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
                  {loading ? 'Hébergement & Indexation...' : 'Ajouter la source'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
              Sources Juridiques Actives
            </h3>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {documents.length === 0 ? (
              <li className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">Aucun document téléchargé.</li>
            ) : (
              documents.map(doc => (
                <li key={doc.id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{doc.title}</p>
                    <p className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-300 mr-3">
                        {doc.document_type}
                      </span>
                      {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(doc.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Supprimer">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
