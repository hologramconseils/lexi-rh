import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Eye, EyeOff, Home, UserPlus, LogIn, KeyRound } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import { API_URL } from '../config';

type LoginMode = 'login' | 'register' | 'reset';

const Login: React.FC = () => {
  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email,
          password
        });
        login(response.data.token, response.data.user);
        
        if (response.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas.');
          return;
        }
        await axios.post(`${API_URL}/auth/register`, {
          email,
          password,
          role: 'employer' // Public registration always creates employer role
        });
        setSuccess('Compte employeur créé avec succès. Vous pouvez maintenant vous connecter.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else if (mode === 'reset') {
        await axios.post(`${API_URL}/auth/forgot-password`, {
          email
        });
        setSuccess('Si cet email correspond à un compte, un lien de réinitialisation vous sera envoyé.');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Le serveur est injoignable. Veuillez vérifier votre connexion ou réessayer plus tard.');
      } else if (err.response.status === 400 && err.response.data?.error === 'Email already exists') {
        setError('Cet adresse email est déjà utilisée.');
      } else if (err.response.status === 401) {
        setError('Identifiants invalides. Veuillez réessayer.');
      } else {
        setError(err.response?.data?.error || 'Une erreur est survenue.');
      }
    }
  };

  const resetForm = () => {
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600 dark:text-blue-500">
          <BookOpen className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Lexi-RH
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Gestion de votre espace sécurisé
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100 dark:border-slate-700 transition-colors">
          
          {/* Tabs */}
          <div className="flex space-x-2 mb-8 border-b border-slate-200 dark:border-slate-700 pb-2">
            <button
              type="button"
              onClick={() => { setMode('login'); resetForm(); }}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${mode === 'login' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              <LogIn className="w-4 h-4 mx-auto mb-1" />
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); resetForm(); }}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${mode === 'register' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              title="Inscription Employeur / RH uniquement"
            >
              <UserPlus className="w-4 h-4 mx-auto mb-1" />
              Inscription (RH)
            </button>
            <button
              type="button"
              onClick={() => { setMode('reset'); resetForm(); }}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${mode === 'reset' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              <KeyRound className="w-4 h-4 mx-auto mb-1" />
              Mdp. oublié
            </button>
          </div>
          
          {mode === 'login' && (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mb-6 px-4">
              <strong>Point d'accès unique</strong> : Connectez-vous ici que vous soyez Employeur / RH ou Salarié.
            </p>
          )}

          {mode === 'register' && (
            <p className="text-center text-xs text-blue-600 dark:text-blue-400 mb-6 px-4 font-medium animate-pulse">
              Note : L'inscription est réservée aux employeurs. Les comptes salariés sont créés par l'administrateur.
            </p>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 transition-colors">
                <p className="text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-4 transition-colors">
                <p className="text-sm">{success}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Adresse email</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  placeholder="votre@email.com"
                  title="Adresse email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {mode === 'register' ? 'Mot de passe' : 'Mot de passe'}
                </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  placeholder="••••••••"
                  title="Mot de passe"
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors"
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
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirmer le mot de passe
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    placeholder="••••••••"
                    title="Confirmer le mot de passe"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Créer le compte' : 'Envoyer le lien de réinitialisation'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <Link
              to="/"
              className="w-full flex justify-center items-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Home className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
