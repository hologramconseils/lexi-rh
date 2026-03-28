import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, BookOpen, AlertCircle, Loader2, History, MessageSquare } from 'lucide-react';

import { API_URL } from '../config';

interface SearchHit {
  document_id: number;
  title: string;
  type: string;
  extracts: string[];
}

interface SearchSession {
  id: number;
  title: string;
  created_at: string;
}

const Dashboard = () => {
  const { token } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [history, setHistory] = useState<SearchSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Fetch search sessions (history)
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error("History error:", err);
    }
  };

  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  // Click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Suggestions logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/documents/suggest?q=${encodeURIComponent(query)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSuggestions(res.data);
      } catch (err) {
        console.error("Suggestions error:", err);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, token]);

  const handleSearch = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const searchQuery = typeof e === 'string' ? e : query;
    
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);
    
    try {
      // Use the new /api/chat/ask endpoint which handles multi-tenant verbatim search + history
      const res = await axios.post(`${API_URL}/chat/ask`, 
        { question: searchQuery },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data.results);
      fetchHistory(); // Refresh history sidebar
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la recherche documentaire.");
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (sessionId: number) => {
    setLoading(true);
    try {
        // In a real verbatim search app, we'd retrieve the results saved in the session
        // For now, we'll re-trigger search using the session title or just fetch history
        const res = await axios.get(`${API_URL}/chat/conversations/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // We'll just set the query and re-run to simplify
        const lastMsg = res.data.history.find((m: any) => m.is_user);
        if (lastMsg) {
            setQuery(lastMsg.content);
            handleSearch(lastMsg.content);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors">
      <Navbar variant="public" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar History (Salarié space unique feature) */}
        <aside className="hidden md:flex w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
              <History className="w-4 h-4 mr-2 text-blue-500" />
              Recherches récentes
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {history.map(session => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors truncate"
                title={session.title}
              >
                {session.title}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto w-full py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {!searched && (
              <div className="text-center mb-10 pt-10">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                  Espace Salarié
                </h2>
                <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
                  Recherchez des informations précises dans vos documents d'entreprise.
                  <br />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Résultats extraits directement des sources officielles.
                  </span>
                </p>
              </div>
            )}

            <form onSubmit={handleSearch} className="relative mb-10">
              <div className="flex flex-col sm:flex-row shadow-lg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all focus-within:ring-2 focus-within:ring-blue-500/50">
                <div className="flex flex-1 items-center">
                  <div className="pl-4 text-slate-400 dark:text-slate-500 hidden sm:block">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className="block w-full py-4 px-4 sm:pl-3 sm:pr-3 text-slate-900 dark:text-white bg-transparent placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none sm:text-lg"
                    placeholder="Posez votre question sur le règlement, la convention..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none transition-colors disabled:opacity-75 flex items-center justify-center sm:w-auto w-full"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rechercher'}
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div ref={suggestionRef} className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {suggestions.map((s, idx) => (
                      <li 
                        key={idx}
                        onClick={() => handleSearch(s)}
                        className="px-5 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-slate-700 dark:text-slate-200 transition-colors flex items-center"
                      >
                        <Search className="w-4 h-4 mr-3 text-slate-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>

            <div className="space-y-8">
              {loading && results.length === 0 && (
                <div className="flex flex-col items-center py-12">
                   <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                   <p className="text-slate-500 dark:text-slate-400 animate-pulse">Recherche dans vos documents...</p>
                </div>
              )}

              {searched && !loading && results.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Aucun extrait trouvé</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">La réponse n'est pas présente dans les documents déposés par votre employeur.</p>
                </div>
              )}

              {results.map((result, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex items-center text-blue-700 dark:text-blue-400">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span className="font-bold text-sm uppercase tracking-wider">Source : {result.title}</span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {result.type}
                    </span>
                  </div>
                  <div className="px-8 py-6">
                    <div className="flex items-start mb-4">
                        <MessageSquare className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-white italic">Extraits officiels :</h4>
                    </div>
                    {result.extracts.map((extract, hIdx) => (
                      <div 
                        key={hIdx} 
                        className="text-slate-700 dark:text-slate-300 leading-8 text-lg mb-6 last:mb-0 pl-8 border-l-4 border-blue-100 dark:border-blue-900"
                        dangerouslySetInnerHTML={{ 
                          __html: extract
                            .replace(/[^\S\n]+/g, ' ') 
                            .replace(/<mark>/g, '<mark class="bg-blue-100/80 px-1 rounded text-blue-900 font-bold dark:bg-blue-900/60 dark:text-blue-200">') 
                        }}
                      />
                    ))}
                    <div className="mt-8 flex justify-end">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Verbatim Protection Enabled — No AI Generation</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
