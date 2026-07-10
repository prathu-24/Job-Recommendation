import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Job } from '../types';
import { MapPin, DollarSign, Briefcase, Calendar, ChevronLeft, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyState, setApplyState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        // Find public jobs or load job details
        const response = await api.get('/jobs');
        const foundJob = response.data.find((j: Job) => j.id === Number(id));
        if (foundJob) {
          setJob(foundJob);
        } else {
          setErrorMessage("Job posting not found.");
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load job posting details.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [id]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setApplyState('loading');
    setErrorMessage(null);
    try {
      await api.post(`/candidate/jobs/${id}/apply`);
      setApplyState('success');
    } catch (err: any) {
      console.error(err);
      setApplyState('error');
      setErrorMessage(err.response?.data?.detail || "Could not submit application.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (errorMessage && !job) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
        <p className="text-red-400 font-semibold text-lg">{errorMessage}</p>
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-brand-400 hover:underline">
          <ChevronLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const skillsList = job?.required_skills ? job.required_skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navigation Header */}
      <div>
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 text-sm text-dark-400 hover:text-dark-100 transition-colors mb-4"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {job && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Job description content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-8 rounded-2xl border border-dark-800 space-y-6">
              <div>
                <span className="text-sm font-bold text-brand-400 uppercase tracking-wider">{job.company}</span>
                <h1 className="text-3xl font-black text-dark-50 mt-1">{job.title}</h1>
              </div>

              {/* Badges block */}
              <div className="flex flex-wrap gap-4 text-sm text-dark-300">
                <span className="flex items-center gap-1 bg-dark-900 px-3 py-1.5 rounded-lg">
                  <MapPin size={16} className="text-brand-400" />
                  {job.location || 'Remote'}
                </span>
                <span className="flex items-center gap-1 bg-dark-900 px-3 py-1.5 rounded-lg">
                  <DollarSign size={16} className="text-brand-400" />
                  {job.salary || 'Competitive'}
                </span>
                <span className="flex items-center gap-1 bg-dark-900 px-3 py-1.5 rounded-lg">
                  <Briefcase size={16} className="text-brand-400" />
                  {job.experience_required} years exp
                </span>
              </div>

              <div className="border-t border-dark-800 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-dark-100">Job Description</h3>
                <p className="text-dark-300 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Requirements & Apply */}
          <div className="lg:col-span-1 space-y-6">
            {/* Required Skills Card */}
            <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4">
              <h3 className="text-md font-bold">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded bg-dark-900 border border-dark-800 text-xs font-semibold text-brand-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Apply Action Card */}
            <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4">
              {errorMessage && (
                <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
              )}

              {applyState === 'success' && (
                <div className="flex items-start gap-2 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>Your application has been submitted!</span>
                </div>
              )}

              <button
                onClick={handleApply}
                disabled={applyState === 'success' || applyState === 'loading' || (isAuthenticated && role !== 'candidate')}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${
                  applyState === 'success'
                    ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 cursor-not-allowed'
                    : applyState === 'loading'
                    ? 'bg-dark-800 text-dark-400 cursor-not-allowed'
                    : (isAuthenticated && role !== 'candidate')
                    ? 'bg-dark-800 text-dark-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white cursor-pointer shadow-brand-500/20'
                }`}
              >
                {applyState === 'loading' ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                ) : applyState === 'success' ? (
                  <span>Applied ✔</span>
                ) : !isAuthenticated ? (
                  <>
                    <span>Sign In to Apply</span>
                    <ArrowRight size={16} />
                  </>
                ) : role !== 'candidate' ? (
                  <span>Candidates Only</span>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-[10px] text-dark-400 font-medium">
                Posted on {new Date(job.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default JobDetailsPage;
