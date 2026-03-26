import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

interface SearchResult {
  document_id: number;
  title: string;
  type: string;
  score: number;
  highlights: string[];
}

const Dashboard = () => {
  const { user, token, logout } = useAuth();

  // Auto-logout admin if they access the public dashboard
  React.useEffect(() => {
    if (user?.role === 'admin') {
      logout();
    }
  }, [user, logout]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/documents/suggest?q=${encodeURIComponent(query)}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error("Suggestions error:", err);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Automatically clear results and searched state if query is emptied
  React.useEffect(() => {
    if (query === '') {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  const handleSearch = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const searchQuery = typeof e === 'string' ? e : query;
    
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);
    
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_URL}/documents/search?q=${encodeURIComponent(searchQuery)}`, config);
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
      <Navbar variant="public" />

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
          <div className="flex flex-col sm:flex-row shadow-md rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500">
            <div className="flex flex-1 items-center">
              <div className="pl-4 text-slate-400 dark:text-slate-500 hidden sm:block">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="block w-full py-4 px-4 sm:pl-3 sm:pr-3 text-slate-900 dark:text-white bg-transparent placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none sm:text-lg rounded-l-lg"
                placeholder="Ex: Quel est le préavis de démission ?"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none transition-colors disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center sm:w-auto w-full"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rechercher'}
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionRef} className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {suggestions.map((s, idx) => (
                  <li 
                    key={idx}
                    onClick={() => handleSearch(s)}
                    className="px-5 py-3.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-slate-700 dark:text-slate-200 transition-colors flex items-center group"
                  >
                    <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-md mr-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors">
                      <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
                    </div>
                    <span className="font-medium">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
                          .replace(/[^\S\n]+/g, ' ') 
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
      <Footer />
    </div>
  );
};

export default Dashboard;
