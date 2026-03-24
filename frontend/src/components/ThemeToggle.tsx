import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm items-center">
      <button
        onClick={() => setTheme('light')}
        title="Mode Jour"
        aria-label="Passer au mode jour"
        className={`p-1.5 rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 ${
          theme === 'light' 
            ? 'bg-white shadow text-yellow-500 dark:bg-slate-700 dark:text-yellow-400' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        title="Mode Système"
        aria-label="Utiliser le thème du système"
        className={`p-1.5 rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${
          theme === 'system' 
            ? 'bg-white shadow text-slate-800 dark:bg-slate-700 dark:text-blue-400' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        title="Mode Nuit"
        aria-label="Passer au mode nuit"
        className={`p-1.5 rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          theme === 'dark' 
            ? 'bg-white shadow text-indigo-500 dark:bg-slate-700 dark:text-indigo-400' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ThemeToggle;
