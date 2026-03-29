import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config';

const Profile = () => {
  const { user, token, login } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const payload: any = { email };
      if (password) payload.password = password;
      
      const res = await axios.put(`${API_URL}/users/me`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('Profil mis à jour avec succès.');
      setPassword('');
      if (token && res.data.user) {
        login(token, res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors">
      <Navbar showBackButton />

      <main className="flex-1 max-w-3xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="px-4 py-5 sm:px-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center transition-colors">
            <UserIcon className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-3" />
            <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Informations du compte</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleUpdate} className="space-y-6">
              {message && <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-3 rounded text-sm transition-colors">{message}</div>}
              {error && <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-3 rounded text-sm transition-colors">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rôle</label>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-1.5 uppercase inline-block border border-slate-200 dark:border-slate-600 transition-colors">
                  {user?.role}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse Email</label>
                <input
                  type="email"
                  value={email}
                  disabled={user?.role === 'employee'}
                  onChange={e => setEmail(e.target.value)}
                  className={`block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors ${user?.role === 'employee' ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
                />
                {user?.role === 'employee' && (
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    Votre identifiant (email) ne peut être modifié que par votre administrateur.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Laissez vide pour conserver l'actuel"
                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white dark:placeholder-slate-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 transition-colors">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
