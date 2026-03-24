import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
          © 2026 Hologram Conseils. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
