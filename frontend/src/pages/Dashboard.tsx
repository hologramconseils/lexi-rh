import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, BookOpen, AlertCircle, LogOut, Loader2, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

interface SearchResult {
  document_id: number;
  title: string;
  type: string;
  score: number;
  highlights: string[];
}

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`http://localhost:5001/api/documents/search?q=${encodeURIComponent(query)}`, config);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la recherche des sources juridiques.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors">
      <nav className="bg-white dark:bg-slate-900 shadow border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-500">
              <BookOpen className="w-8 h-8" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white hidden sm:block">Lexi-RH</h1>
              <span className="ml-2 sm:ml-4 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Espace Salarié
              </span>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <ThemeToggle />
              {user ? (
                <>
                  <Link to="/profile" className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Mon Profil">
                    <UserIcon className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Mon Profil</span>
                  </Link>
                  <button onClick={logout} className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Déconnexion">
                    <LogOut className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Déconnexion</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors" title="Espace employeur">
                  <UserIcon className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Espace employeur / RH</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            Posez votre question
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 dark:text-slate-400">
            Recherchez dans le code du travail, vos conventions et accords d'entreprise.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <div className="flex flex-col sm:flex-row shadow-sm rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <div className="flex flex-1 items-center">
              <div className="pl-4 text-slate-400 dark:text-slate-500 hidden sm:block">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full py-4 px-4 sm:pl-3 sm:pr-3 text-slate-900 dark:text-white bg-transparent placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none sm:text-lg"
                placeholder="Ex: Quel est le préavis de démission ?"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-4 bg-blue-600 text-white font-medium hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none transition-colors disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center sm:w-auto w-full"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rechercher'}
            </button>
          </div>
        </form>

        <div className="mt-12 space-y-6">
          {searched && (
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-slate-800 dark:text-white">
                Résultats de recherche
              </h3>
              <button
                onClick={() => {
                  setQuery('');
                  setSearched(false);
                  setResults([]);
                }}
                className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                Retour
              </button>
            </div>
          )}

          {searched && !loading && results.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Aucun résultat trouvé</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Essayez de reformuler votre question ou utilisez d'autres mots-clés.</p>
            </div>
          )}

          {results.map((result, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {result.title}
                </h3>
                <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                  {result.type}
                </span>
              </div>
              <div className="px-6 py-5">
                {result.highlights && result.highlights.length > 0 ? (
                  result.highlights.map((highlight, hIdx) => (
                    <p 
                      key={hIdx} 
                      className="text-slate-700 dark:text-slate-300 leading-relaxed text-[15px] mb-3 last:mb-0 whitespace-pre-line text-justify dark:[&>mark]:bg-blue-900/40 dark:[&>mark]:text-blue-200"
                      dangerouslySetInnerHTML={{ 
                        __html: highlight
                          .replace(/[ \t]+/g, ' ') 
                          .replace(/<mark>/g, '<mark class="bg-yellow-200 px-1 rounded text-slate-900 font-medium dark:bg-blue-900/60 dark:text-blue-200">') 
                      }}
                    />
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic text-sm">Extrait non disponible.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
