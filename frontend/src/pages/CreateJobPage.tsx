import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { Plus, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';

export const CreateJobPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    // Convert experience_required to number
    data.experience_required = Number(data.experience_required);

    try {
      await api.post('/recruiter/jobs', data);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to create job posting. Make sure you entered valid inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Post a New Job</h1>
        <p className="text-dark-400 mt-1">Publish active job listings to match with parsed candidate profiles.</p>
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
            <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-4 flex items-start space-x-3 text-emerald-200 text-sm animate-pulse">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>Job listing published successfully! Redirecting...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-200">Company Name</label>
              <input
                type="text"
                {...register('company', { required: 'Company name is required' })}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="Google, Microsoft, etc."
              />
              {errors.company && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.company.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200">Job Title</label>
              <input
                type="text"
                {...register('title', { required: 'Job title is required' })}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="Senior Full Stack Engineer"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.title.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200">Location</label>
              <input
                type="text"
                {...register('location')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="San Francisco, CA or Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200">Estimated Salary</label>
              <input
                type="text"
                {...register('salary')}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="$120k - $150k"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200">Required Experience (Years)</label>
              <input
                type="number"
                {...register('experience_required', { 
                  required: 'Experience requirement is required',
                  min: { value: 0, message: 'Experience cannot be negative' }
                })}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="3"
                defaultValue={0}
              />
              {errors.experience_required && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.experience_required.message as string}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-200">Required Skills (comma-separated)</label>
              <input
                type="text"
                {...register('required_skills', { required: 'Please specify required skills' })}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="Python, React, SQL, AWS, Docker"
              />
              {errors.required_skills && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.required_skills.message as string}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-200">Job Description & Responsibilities</label>
              <textarea
                rows={6}
                {...register('description', { required: 'Job description is required' })}
                className="mt-1 block w-full rounded-lg border border-dark-700 bg-dark-900/60 px-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="Describe responsibilities, stack, qualifications..."
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.description.message as string}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-dark-800">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-lg border border-dark-700 hover:bg-dark-800 text-dark-200 font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-brand-500/20 text-sm cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Publish Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateJobPage;
