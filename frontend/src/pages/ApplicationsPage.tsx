import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Application } from '../types';
import { useAuth } from '../context/AuthContext';
import { Briefcase, User, Mail, Phone, Clock, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const { role } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url = role === 'recruiter' ? '/recruiter/applications' : '/candidate/applications';
      const response = await api.get(url);
      setApplications(response.data);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [role]);

  const handleStatusChange = async (appId: number, newStatus: string) => {
    setUpdatingId(appId);
    try {
      await api.put(`/recruiter/applications/${appId}`, { status: newStatus });
      // Update local state
      setApplications(prev =>
        prev.map(app => (app.id === appId ? { ...app, application_status: newStatus as any } : app))
      );
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {role === 'recruiter' ? 'Review Candidate Applications' : 'My Job Applications'}
        </h1>
        <p className="text-dark-400 mt-1">
          {role === 'recruiter' 
            ? 'Verify parsed resume qualifications and progress candidates through pipeline.'
            : 'Track status updates of your submitted job openings.'}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="glass-panel text-center p-12 rounded-2xl text-dark-400 border border-dashed border-dark-800">
          No applications listed in database.
        </div>
      ) : role === 'recruiter' ? (
        /* Recruiter View - Detailed lists with user details */
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.id} className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4 hover:border-brand-500/10 transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-dark-800/80 pb-4">
                <div>
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Applied Position</span>
                  <h3 className="text-lg font-bold text-dark-100 mt-0.5">{app.job?.title}</h3>
                  <p className="text-xs text-dark-400 mt-0.5">{app.job?.company} &bull; {app.job?.location}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-dark-400 font-semibold">Change Status:</span>
                  <select
                    value={app.application_status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    disabled={updatingId === app.id}
                    className="rounded-lg bg-dark-900 border border-dark-700 px-3 py-1.5 text-xs text-dark-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="applied">Applied</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted / Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {updatingId === app.id && (
                    <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
                  )}
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-dark-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} />
                    <span>Candidate Profile</span>
                  </h4>
                  <div className="font-semibold text-dark-100">{app.candidate?.name_extracted}</div>
                  <div className="flex flex-col space-y-1 text-xs text-dark-400">
                    <span className="flex items-center gap-1.5">
                      <Mail size={12} />
                      {app.candidate?.email_extracted}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone size={12} />
                      {app.candidate?.phone || 'No phone'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <h4 className="text-xs font-bold text-dark-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-400" />
                    <span>Extracted Skills</span>
                  </h4>
                  {app.candidate?.skills ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {app.candidate.skills.split(',').map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700 text-xs text-brand-300 font-medium">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-dark-400 italic">No skills listed in profile.</p>
                  )}
                </div>
              </div>

              {/* Detailed Experience / Education previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-dark-900/20 p-4 rounded-xl border border-dark-800/40">
                <div>
                  <h5 className="font-bold text-dark-300">Experience Summary</h5>
                  <p className="text-dark-400 mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">{app.candidate?.experience || 'No experience summary'}</p>
                </div>
                <div>
                  <h5 className="font-bold text-dark-300">Education Details</h5>
                  <p className="text-dark-400 mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">{app.candidate?.education || 'No education details'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Candidate View - simple tables showing application logs */
        <div className="glass-panel rounded-2xl border border-dark-800 overflow-hidden">
          <table className="min-w-full divide-y divide-dark-800 text-sm">
            <thead className="bg-dark-900/60 text-dark-400 font-semibold text-left">
              <tr>
                <th className="px-6 py-4">Job Details</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Salary</th>
                <th className="px-6 py-4">Submission Date</th>
                <th className="px-6 py-4 text-right">Progress Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 bg-dark-950/20">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-dark-900/20 transition-all">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-dark-100">{app.job?.title}</div>
                      <div className="text-xs text-brand-400 mt-0.5">{app.job?.company}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-dark-300">{app.job?.location || 'Remote'}</td>
                  <td className="px-6 py-4 text-dark-300 font-semibold">{app.job?.salary || 'Competitive'}</td>
                  <td className="px-6 py-4 text-dark-400 text-xs">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      {
                        applied: 'bg-blue-950/40 text-blue-400 border border-blue-500/20',
                        reviewed: 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20',
                        accepted: 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20',
                        rejected: 'bg-red-950/40 text-red-400 border border-red-500/20'
                      }[app.application_status]
                    }`}>
                      {app.application_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default ApplicationsPage;
