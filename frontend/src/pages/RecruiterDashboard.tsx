import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Job, Application } from '../types';
import { Plus, Briefcase, FileText, CheckCircle2, ChevronRight, AlertCircle, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const RecruiterDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecruiterData = async () => {
      try {
        setLoading(true);
        // Fetch posted jobs
        const jobsRes = await api.get('/recruiter/jobs');
        setJobs(jobsRes.data);

        // Fetch applications
        const appsRes = await api.get('/recruiter/applications');
        setApplications(appsRes.data);
      } catch (err) {
        console.error("Failed to load recruiter data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecruiterData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Group applications by status for visual charts
  const statusCounts = applications.reduce((acc: Record<string, number>, curr) => {
    acc[curr.application_status] = (acc[curr.application_status] || 0) + 1;
    return acc;
  }, { applied: 0, reviewed: 0, accepted: 0, rejected: 0 });

  const chartData = [
    { name: 'Applied', Count: statusCounts.applied },
    { name: 'Reviewed', Count: statusCounts.reviewed },
    { name: 'Accepted', Count: statusCounts.accepted },
    { name: 'Rejected', Count: statusCounts.rejected },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruiter Dashboard</h1>
          <p className="text-dark-400 mt-1">Post new roles, manage active jobs, and review applications.</p>
        </div>
        <Link
          to="/create-job"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-lg shadow-brand-500/10 transition-all cursor-pointer w-fit"
        >
          <Plus size={18} />
          <span>Post a Job</span>
        </Link>
      </div>

      {/* Numerical Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-32">
          <span className="text-sm font-semibold text-dark-400">Active Job Postings</span>
          <span className="text-3xl font-black text-brand-400 mt-2">{jobs.length}</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-32">
          <span className="text-sm font-semibold text-dark-400">Total Applications Received</span>
          <span className="text-3xl font-black text-fuchsia-400 mt-2">{applications.length}</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-32">
          <span className="text-sm font-semibold text-dark-400">Successful Placements</span>
          <span className="text-3xl font-black text-emerald-400 mt-2">{statusCounts.accepted}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Applications Chart */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
          <h3 className="text-lg font-bold">Applications Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} 
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Manage Active Jobs and Candidates */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Job Postings */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="text-brand-400" size={20} />
                <span>Active Job Listings</span>
              </h3>
              <Link to="/manage-jobs" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <span>Manage Jobs</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-8 text-dark-400 border border-dashed border-dark-800 rounded-xl">
                No active jobs. Click 'Post a Job' to publish one.
              </div>
            ) : (
              <div className="divide-y divide-dark-800">
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <h4 className="font-semibold text-dark-100">{job.title}</h4>
                      <p className="text-xs text-dark-400 mt-0.5">{job.location || 'Remote'} &bull; {job.salary || 'Competitive'}</p>
                    </div>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-brand-400 hover:text-brand-300 transition-all"
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Applications Review */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-brand-400" size={20} />
                <span>Applications Review Feed</span>
              </h3>
              <Link to="/applications" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <span>View All Applications</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-8 text-dark-400 border border-dashed border-dark-800 rounded-xl">
                No job applications received yet.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="p-4 bg-dark-900/40 hover:bg-dark-900 border border-dark-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-dark-400 block font-medium">Applied for</span>
                      <h4 className="font-semibold text-dark-100">{app.job?.title}</h4>
                      <p className="text-xs text-brand-400 mt-1 capitalize">{app.candidate?.name_extracted}</p>
                    </div>
                    <Link
                      to="/applications"
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default RecruiterDashboard;
