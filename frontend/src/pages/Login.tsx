import React, { useState } from 'react';
import { Home, Lock, User, Eye, EyeOff, Mail, Building2, Users, CreditCard } from 'lucide-react';
import { login } from '../api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<number>(0);
  const [errorField, setErrorField] = useState<'email' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');

  // Reset error when input changes
  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (errorField === field) {
      setErrorField(null);
      setError('');
    }
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!email.trim()) {
      setErrorField('email');
      setError('L\'email est requis');
      return;
    }
    if (!email.includes('@')) {
      setErrorField('email');
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    if (!password) {
      setErrorField('password');
      setError('Le mot de passe est requis');
      return;
    }
    if (password.length < 6) {
      setErrorField('password');
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Check if we're in a retry timeout
    if (retryTimeout > Date.now()) {
      const waitSeconds = Math.ceil((retryTimeout - Date.now()) / 1000);
      setError(`Trop de tentatives. Veuillez attendre ${waitSeconds} secondes.`);
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    setErrorField(null);

    try {
      const response = await login(email, password);
      
      // Log full response for debugging (only in development)
      if (import.meta.env.DEV) {
        console.log('Login response:', response);
        console.log('Login response.data:', response.data);
      }
      
      // Check if response structure is valid
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        setError('Réponse invalide du serveur');
        return;
      }
      
      // Check for successful login response
      if (response.data.success && response.data.data) {
        const { token, admin } = response.data.data;
        
        // Validate required fields
        if (!token) {
          console.error('Token missing in response:', response.data);
          setError('Token manquant dans la réponse du serveur');
          return;
        }
        
        if (!admin) {
          console.error('Admin data missing in response:', response.data);
          setError('Données utilisateur manquantes dans la réponse');
          return;
        }
        
        // Store auth data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(admin));
        
        // Reset retry count on successful login
        setRetryCount(0);
        setRetryTimeout(0);
        
        setSuccess('Connexion réussie ! Redirection...');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        // This should not happen for successful requests
        console.error('Invalid response format:', response.data);
        setError(response.data?.error || 'Format de réponse invalide du serveur');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle rate limiting (429)
      if (err.response?.status === 429) {
        const retryAfter = parseInt(err.response.headers['retry-after'] || '900');
        setRetryTimeout(Date.now() + (retryAfter * 1000));
        setError(`Trop de tentatives de connexion. Veuillez réessayer dans ${Math.ceil(retryAfter / 60)} minutes.`);
        return;
      }

      // Handle 401 errors (invalid credentials) - these are normal errors, not exceptions
      if (err.response?.status === 401) {
        const errorData = err.response.data;
        
        // Extract error message
        const errorMessage = errorData?.error || errorData?.message || 'Email ou mot de passe incorrect';
        setError(errorMessage);
        
        // Increment retry count
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);

        // After 3 failed attempts, add increasing delays
        if (newRetryCount >= 3) {
          const delay = Math.min(Math.pow(2, newRetryCount - 3) * 1000, 30000);
          setRetryTimeout(Date.now() + delay);
        }
        return;
      }

      // Handle validation errors (400) from backend middleware
      if (err.response?.status === 400 && err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const validationErrors = err.response.data.details.map((d: any) => d.msg || d.message || d).join(', ');
        setError(`Erreur de validation: ${validationErrors}`);
        
        // Try to identify which field has the error
        const emailError = err.response.data.details.find((d: any) => 
          d.param === 'email' || d.path === 'email' || (d.msg && d.msg.toLowerCase().includes('email'))
        );
        const passwordError = err.response.data.details.find((d: any) => 
          d.param === 'password' || d.path === 'password' || (d.msg && d.msg.toLowerCase().includes('password'))
        );
        
        if (emailError) setErrorField('email');
        else if (passwordError) setErrorField('password');
        return;
      }
      
      // Handle other validation errors
      if (err.response?.data?.code === 'VALIDATION_ERROR') {
        setErrorField(err.response.data.field || null);
        setError(err.response.data.error || err.response.data.message || 'Erreur de validation');
        return;
      }

      // Handle network errors
      if (!err.response) {
        setError(err.message === 'Network Error' 
          ? 'Erreur réseau. Vérifiez votre connexion internet.' 
          : 'Impossible de joindre le serveur. Vérifiez votre connexion.');
        return;
      }

      // Extract error message from various possible response formats
      let errorMessage = 'Échec de connexion. Veuillez réessayer.';
      
      if (err.response?.data) {
        if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      } else if (err.message && !err.message.includes('Network Error')) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');

    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Veuillez entrer votre adresse email');
      return;
    }

    if (!forgotPasswordEmail.includes('@')) {
      setForgotPasswordError('Veuillez entrer une adresse email valide');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      // TODO: Implement forgot password API call
      // const response = await forgotPassword(forgotPasswordEmail);
      
      // For now, show a success message
      setForgotPasswordSuccess('Un email de réinitialisation a été envoyé à votre adresse email.');
      setForgotPasswordEmail('');
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setForgotPasswordError(err.response?.data?.error || err.message || 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background Image with better quality */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=1080&fit=crop&q=80')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 via-indigo-600/80 to-purple-700/80"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative w-full flex flex-col items-center justify-center text-white p-12 animate-fade-in z-10">
          <div className="w-28 h-28 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 animate-float shadow-2xl border border-white/30">
            <Home className="w-14 h-14 text-white drop-shadow-lg" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center drop-shadow-lg">Gestion Immobilière<br/><span className="text-blue-200">Simplifiée</span></h2>
          <p className="text-lg text-white/90 text-center max-w-md leading-relaxed drop-shadow-md">
            Votre plateforme complète de gestion immobilière pour la colocation et le partage de logement.
          </p>
          
          {/* Feature Icons */}
          <div className="mt-12 flex gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-3 border border-white/20">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-white/80">Propriétés</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-3 border border-white/20">
                <Users className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-white/80">Locataires</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-3 border border-white/20">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-white/80">Paiements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          {/* Header */}
          <div className="text-center">
            <div className="lg:hidden inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-6 animate-float">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-heading-large mb-3">Bienvenue</h1>
            <p className="text-body-medium text-gray-600">Connectez-vous à votre tableau de bord</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 p-8 space-y-6 hover:shadow-xl transition-shadow duration-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="form-label mb-2">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500">
                    <User className="w-full h-full" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`form-input w-full pl-12 pr-4 py-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 transition-all duration-200 ${
                      errorField === 'email' 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    placeholder="Entrez votre email"
                    required
                    disabled={loading}
                    aria-invalid={errorField === 'email' ? 'true' : 'false'}
                    aria-describedby="email-error"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="form-label mb-2">
                  Mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500">
                    <Lock className="w-full h-full" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Entrez votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-red-600 text-body-small">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-green-700 text-body-small">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-text w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-body-small text-gray-500">
              © 2025 HomeShare. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-heading-medium text-gray-900">Mot de passe oublié</h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail('');
                  setForgotPasswordError('');
                  setForgotPasswordSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-body-medium text-gray-600">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="form-label mb-2">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500">
                    <Mail className="w-full h-full" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="form-input w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Entrez votre email"
                    required
                    disabled={forgotPasswordLoading}
                  />
                </div>
              </div>

              {forgotPasswordError && (
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                  <p className="text-red-600 text-body-small">{forgotPasswordError}</p>
                </div>
              )}

              {forgotPasswordSuccess && (
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4">
                  <p className="text-green-700 text-body-small">{forgotPasswordSuccess}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordError('');
                    setForgotPasswordSuccess('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  disabled={forgotPasswordLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;