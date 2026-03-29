import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors selection:bg-blue-100 dark:selection:bg-blue-900/40">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-30 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-[140px] animate-pulse-slow delay-700"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              
              <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 leading-tight text-balance">
                Au service de votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">conformité RH</span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                Accédez instantanément à la documentation de votre entreprise. 
                Une recherche verbatim sécurisée, directement dans vos sources officielles.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center group"
                >
                  Espace sécurisé
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-white dark:bg-slate-800/50 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 border border-blue-100 dark:border-blue-900/30">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sécurité Verbatim</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pas de reformulation risquée. Les extraits sont livrés tels quels, garantissant une intégrité juridique totale.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-100 dark:border-indigo-900/30">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Recherche Ultra-Rapide</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Indexez des milliers de pages de conventions et règlements en quelques secondes avec notre technologie d'indexation.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 border border-emerald-100 dark:border-emerald-900/30">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sources Unifiées</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Code du travail, conventions collectives, accords d'entreprise : tout au même endroit, synchronisé.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cta Section */}
        <section className="py-20">
           <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-600/20">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                 <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 relative">Prêt à moderniser votre gestion RH ?</h2>
                 <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto relative opacity-90 font-medium">
                    Rejoignez les entreprises qui font confiance à Lexi-RH pour simplifier l’accès à l’information de votre entreprise.
                 </p>
                  <div className="flex flex-wrap items-center justify-center gap-6 relative">
                    <div className="flex flex-col text-left">
                       <div className="flex items-center space-x-2 text-sm text-blue-100 mb-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Installation instantanée</span>
                       </div>
                       <div className="flex items-center space-x-2 text-sm text-blue-100">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Conforme RGPD</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
