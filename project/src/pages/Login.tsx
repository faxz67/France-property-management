import React, { useState } from 'react';
import { Home, Lock, User } from 'lucide-react';
// @ts-ignore
import { login } from '../api.js';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<number>(0);
  const [errorField, setErrorField] = useState<'email' | 'password' | null>(null);

  // Reset error when input changes
  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (errorField === field) {
      setErrorField(null);
      setError('');
    }
    field === 'email' ? setEmail(value) : setPassword(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!email.trim()) {
      setErrorField('email');
      setError('Email is required');
      return;
    }
    if (!email.includes('@')) {
      setErrorField('email');
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setErrorField('password');
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setErrorField('password');
      setError('Password must be at least 6 characters');
      return;
    }

    // Check if we're in a retry timeout
    if (retryTimeout > Date.now()) {
      const waitSeconds = Math.ceil((retryTimeout - Date.now()) / 1000);
      setError(`Too many attempts. Please wait ${waitSeconds} seconds.`);
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    setErrorField(null);

    try {
      const response = await login(email, password);
      
      if (response.data?.success && response.data?.data) {
        const { token, admin } = response.data.data;
        
        console.log('Login successful - Token:', token ? 'exists' : 'missing');
        console.log('Login successful - Admin:', admin);
        
        // Store auth data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(admin));
        
        // Verify storage
        console.log('Stored token:', localStorage.getItem('token') ? 'exists' : 'missing');
        console.log('Stored user:', localStorage.getItem('user'));
        
        // Reset retry count on successful login
        setRetryCount(0);
        setRetryTimeout(0);
        
        setSuccess('Login successful! Redirecting...');
        
        // Redirect to dashboard using React Router
        setTimeout(() => {
          console.log('Redirecting to dashboard...');
          // Use window.location for a full page reload to ensure clean state
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle rate limiting
      if (err.response?.status === 429) {
        const retryAfter = parseInt(err.response.headers['retry-after'] || '900');
        setRetryTimeout(Date.now() + (retryAfter * 1000));
        setError(`Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`);
        return;
      }

      // Handle validation errors
      if (err.response?.data?.code === 'VALIDATION_ERROR') {
        setErrorField(err.response.data.field || null);
      }

      // Increment retry count
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      // After 3 failed attempts, add increasing delays
      if (newRetryCount >= 3) {
        const delay = Math.min(Math.pow(2, newRetryCount - 3) * 1000, 30000);
        setRetryTimeout(Date.now() + delay);
      }

      setError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=900&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="relative w-full flex flex-col items-center justify-center text-white p-12 animate-fade-in">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-8 animate-float">
            <Home className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-display-large mb-6 text-center">Property Management<br/>Made Simple</h2>
          <p className="text-body-large text-white/80 text-center max-w-md">
            Your comprehensive property management platform for home sharing and co-living.
          </p>
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
            <h1 className="text-heading-large mb-3">Welcome</h1>
            <p className="text-body-medium text-gray-600">Sign in to your dashboard</p>
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
                    placeholder="Enter your email"
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
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500">
                    <Lock className="w-full h-full" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                </div>
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
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-body-small text-gray-500">
              © 2025 HomeShare. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;