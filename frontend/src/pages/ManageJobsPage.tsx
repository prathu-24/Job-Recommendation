import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Job } from '../types';
import { Briefcase, Trash2, ArrowUpRight, Search, MapPin, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ManageJobsPage: React.FC = () => {
  const { role } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Admin or Recruiter routes can fetch full job list
      const url = role === 'admin' ? '/recruiter/jobs' : '/recruiter/jobs';
      const response = await api.get(url);
      setJobs(response.data);
    } catch (err) {
      console.error("Failed to load jobs list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [role]);

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this job listing?")) return;
    setDeletingId(jobId);
    try {
      await api.delete(`/recruiter/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err) {
      console.error("Failed to delete job", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Job Database</h1>
          <p className="text-dark-400 mt-1">Review active posts and delete stale listings.</p>
        </div>
        {role === 'recruiter' && (
          <Link
            to="/create-job"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-lg shadow-brand-500/10 transition-all cursor-pointer w-fit"
          >
            <span>Post a Job</span>
          </Link>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-500">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Filter by title, company, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-lg border border-dark-700 bg-dark-900/60 pl-10 pr-4 py-2.5 text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
        />
      </div>

      {filteredJobs.length === 0 ? (
        <div className="glass-panel text-center p-12 rounded-2xl text-dark-400 border border-dashed border-dark-800">
          No matching jobs listed.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="glass-panel p-6 rounded-xl border border-dark-800 flex flex-col justify-between hover:border-brand-500/10 transition-all">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">{job.company}</span>
                    <h3 className="text-lg font-bold text-dark-100 mt-0.5">{job.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-brand-400 hover:text-brand-300 transition-all"
                      title="View Details"
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      disabled={deletingId === job.id}
                      className="p-2 bg-dark-800 hover:bg-red-950/40 rounded-lg text-dark-400 hover:text-red-400 transition-all"
                      title="Delete Posting"
                    >
                      {deletingId === job.id ? (
                        <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-dark-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} />
                    {job.location || 'Remote'}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={13} />
                    {job.salary || 'Competitive'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase size={13} />
                    {job.experience_required} years exp
                  </span>
                </div>
              </div>

              <div className="border-t border-dark-800/80 pt-4 mt-6 flex justify-between items-center text-[10px] text-dark-400">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar size={12} />
                  Created {new Date(job.created_at).toLocaleDateString()}
                </span>
                <span className="font-semibold text-brand-400 capitalize">{job.required_skills.split(',').length} Skills required</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ManageJobsPage;
