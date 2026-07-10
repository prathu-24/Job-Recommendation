import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CandidateProfile } from '../types';
import { useForm } from 'react-hook-form';
import { Save, User, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/candidate/profile');
        setProfile(response.data);
        reset(response.data); // pre-populate form fields
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Unable to retrieve candidate profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: any) => {
    setError(null);
    setSuccess(false);
    try {
      const response = await api.put('/candidate/profile', data);
      setProfile(response.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save changes to profile.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidate Profile</h1>
        <p className="text-dark-400 mt-1">Review and refine your parsed resume qualifications.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-dark-800">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-4 flex items-start space-x-3 text-red-200 text-sm">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-4 flex items-start space-x-3 text-emerald-200 text-sm">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>Profile details updated successfully! Job recommendations are updated.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-200">Extracted Name</label>
              <input
                type="text"
                {...register('name_extracted')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200">Extracted Email</label>
              <input
                type="email"
                {...register('email_extracted')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200">Phone</label>
              <input
                type="text"
                {...register('phone')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200">Languages (comma-separated)</label>
              <input
                type="text"
                {...register('languages')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-200">Skills (comma-separated)</label>
              <textarea
                rows={3}
                {...register('skills')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-200">Experience History</label>
              <textarea
                rows={4}
                {...register('experience')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-200">Education Details</label>
              <textarea
                rows={3}
                {...register('education')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-200">Projects</label>
              <textarea
                rows={3}
                {...register('projects')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-200">Certifications</label>
              <textarea
                rows={3}
                {...register('certifications')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-dark-800">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-lg border border-dark-700 hover:bg-dark-800 text-dark-200 font-semibold text-sm transition-all"
            >
              Back to Dashboard
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-brand-500/20 text-sm cursor-pointer"
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProfilePage;
