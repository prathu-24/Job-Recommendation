import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

const ADMIN_EMAIL = 'admin@jobify.com';
const ADMIN_PASSWORD = 'admin@password';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registeredSuccess = (location.state as any)?.registered === true;
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminLogging, setAdminLogging] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  const [logoClicks, setLogoClicks] = useState(0);
  const [clickHint, setClickHint] = useState<number | null>(null);

  // Handle autofill state from other pages (Register or Landing)
  useEffect(() => {
    if (location.state && (location.state as any).autofillAdmin) {
      handleAdminLogin();
    }
  }, []);

  const handleAdminLogin = async () => {
    setAdminLogging(true);
    setServerError(null);
    try {
      await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setServerError('Admin login failed. Please ensure the backend is running.');
    } finally {
      setAdminLogging(false);
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newClicks = logoClicks + 1;
    if (newClicks >= 5) {
      setLogoClicks(0);
      setClickHint(null);
      handleAdminLogin();
    } else {
      setLogoClicks(newClicks);
      // Show a subtle hint after 2+ clicks
      if (newClicks >= 2) {
        setClickHint(5 - newClicks);
      }
    }
  };

  const onSubmit = async (data: any) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setServerError(
        err.response?.data?.detail || "Invalid email or password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = submitting || adminLogging;

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blur */}
      <div className="absolute w-80 h-80 bg-brand-600/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse-slow"></div>
      <div className="absolute w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <button
          onClick={handleLogoClick}
          className="inline-flex items-center text-3xl font-extrabold bg-gradient-to-r from-brand-400 to-violet-500 bg-clip-text text-transparent gap-2 mb-1 cursor-pointer select-none bg-transparent border-none"
        >
          <span>🚀</span>
          <span>Jobify</span>
        </button>

        {/* Subtle click-count hint */}
        {clickHint !== null && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-brand-500/60 mb-3"
          >
            {clickHint} more click{clickHint !== 1 ? 's' : ''}…
          </motion.p>
        )}

        {adminLogging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 mb-3 text-brand-400 text-sm font-medium"
          >
            <ShieldCheck size={16} />
            <span>Logging in as Admin…</span>
          </motion.div>
        )}

        <h2 className="text-2xl font-bold tracking-tight text-dark-50">Sign in to your account</h2>
        <p className="mt-2 text-sm text-dark-400">
          Or{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
            register a new account
          </Link>
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="glass-panel-glow py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-dark-800">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {registeredSuccess && !serverError && (
              <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-4 flex items-start space-x-3 text-emerald-200 text-sm">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>Account created successfully! Please sign in with your credentials.</span>
              </div>
            )}

            {serverError && (
              <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-4 flex items-start space-x-3 text-red-200 text-sm">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-200">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', { 
                    required: 'Email is required',
                  })}
                  className="block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                  placeholder="name@example.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email.message as string}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-200">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required' })}
                  className="block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password.message as string}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-dark-700 bg-dark-950 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-dark-400">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-semibold text-brand-400 hover:text-brand-300">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center items-center space-x-2 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 transition-all duration-200 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
export default LoginPage;
