import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { UserPlus, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

export const RegisterPage: React.FC = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newClicks = logoClicks + 1;
    if (newClicks >= 5) {
      navigate('/login', { state: { autofillAdmin: true } });
      setLogoClicks(0);
    } else {
      setLogoClicks(newClicks);
    }
  };

  const onSubmit = async (data: any) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await signup(data.name, data.email, data.password, data.role as UserRole);
      navigate('/login', { state: { registered: true } });
    } catch (err: any) {
      console.error(err);
      setServerError(
        err.response?.data?.detail || "Registration failed. Email might already be taken."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow blur */}
      <div className="absolute w-80 h-80 bg-brand-600/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse-slow"></div>
      <div className="absolute w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link 
          to="/" 
          onClick={handleLogoClick}
          className="inline-flex items-center text-3xl font-extrabold bg-gradient-to-r from-brand-400 to-violet-500 bg-clip-text text-transparent gap-2 mb-4 cursor-pointer select-none"
        >
          <span>🚀</span>
          <span>Jobify</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-dark-50">Create your role account</h2>
        <p className="mt-2 text-sm text-dark-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
            Sign in
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
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-4 flex items-start space-x-3 text-red-200 text-sm">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-dark-200">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Full name is required' })}
                  className="block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.name.message as string}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-200">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  className="block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                  placeholder="name@example.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email.message as string}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-dark-200">
                Register As
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  {...register('role', { required: 'Please select a role' })}
                  className="block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                >
                  <option value="candidate" className="bg-dark-900 text-dark-100">Candidate (Seek Jobs)</option>
                  <option value="recruiter" className="bg-dark-900 text-dark-100">Recruiter (Post Jobs)</option>
                </select>
                {errors.role && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.role.message as string}</p>
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
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className="block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password.message as string}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full justify-center items-center space-x-2 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 transition-all duration-200 cursor-pointer"
              >
                {submitting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Create Account</span>
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
export default RegisterPage;
