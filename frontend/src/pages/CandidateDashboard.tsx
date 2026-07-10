import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { CandidateProfile, Recommendation, Application } from '../types';
import { Sparkles, FileText, CheckCircle2, ChevronRight, Briefcase, Plus, AlertCircle, Building, Award, Zap, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export const CandidateDashboard: React.FC = () => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch profile
        const profileRes = await api.get('/candidate/profile');
        setProfile(profileRes.data);

        // Fetch recommendations
        const recsRes = await api.get('/candidate/recommendations');
        setRecommendations(recsRes.data.slice(0, 4)); // Get top 4

        // Fetch applications
        const appsRes = await api.get('/candidate/applications');
        setApplications(appsRes.data.slice(0, 5)); // Get top 5

      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setError("Could not retrieve profile statistics. Please make sure your resume is uploaded.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const skillsList = profile?.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.resume_path) score += 30;
    if (profile.skills && profile.skills.trim()) score += 15;
    if (profile.experience && profile.experience.trim()) score += 15;
    if (profile.education && profile.education.trim()) score += 15;
    if (profile.projects && profile.projects.trim()) score += 10;
    if (profile.certifications && profile.certifications.trim()) score += 5;
    if (profile.languages && profile.languages.trim()) score += 5;
    if (profile.phone && profile.phone.trim()) score += 5;
    return score;
  };

  const completenessScore = calculateCompleteness();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidate Dashboard</h1>
          <p className="text-dark-400 mt-1">Manage your resume matching and track your job applications.</p>
        </div>
        <Link
          to="/upload-resume"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-lg shadow-brand-500/10 transition-all cursor-pointer w-fit"
        >
          <FileText size={18} />
          <span>Upload Resume</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Summary */}
        <div className="lg:col-span-1 space-y-8">
          {/* Profile Completeness Card */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Award size={18} className="text-brand-400" />
              <span>Profile Score</span>
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-300">Completeness</span>
                <span className="text-brand-300 font-extrabold text-base">{completenessScore}%</span>
              </div>
              <div className="w-full h-2.5 bg-dark-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-500" 
                  style={{ width: `${completenessScore}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-xs text-dark-400">
              {completenessScore === 100 ? (
                <span className="text-emerald-400 font-medium">🎉 Outstanding! Your profile is 100% complete.</span>
              ) : (
                <span>💡 Tip: Add {completenessScore < 70 ? 'a resume upload' : completenessScore < 85 ? 'certifications and projects' : 'languages and contact details'} to reach 100%.</span>
              )}
            </div>
          </div>

          {/* Resume Parsing Status */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText size={18} className="text-brand-400" />
              <span>Resume Status</span>
            </h3>
            
            {profile?.resume_path ? (
              <div className="bg-brand-950/20 border border-brand-800/40 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="text-brand-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-sm font-semibold text-dark-100">Resume Uploaded</h4>
                  <p className="text-xs text-dark-400 mt-1 max-w-[200px] truncate">
                    {profile.resume_path.split('/').pop()?.split('\\').pop()?.substring(7)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-200">No Resume Yet</h4>
                  <p className="text-xs text-dark-400 mt-1">
                    Upload your resume to begin semantic AI recommendations.
                  </p>
                </div>
              </div>
            )}

            {/* Extracted Details */}
            {profile && (
              <div className="border-t border-dark-800 pt-4 space-y-3 text-sm">
                <div>
                  <span className="text-xs text-dark-400 block font-medium uppercase tracking-wider">Full Name</span>
                  <span className="text-dark-100 font-semibold">{profile.name_extracted || "Not parsed"}</span>
                </div>
                <div>
                  <span className="text-xs text-dark-400 block font-medium uppercase tracking-wider">Email</span>
                  <span className="text-dark-100 font-semibold">{profile.email_extracted || "Not parsed"}</span>
                </div>
                <div>
                  <span className="text-xs text-dark-400 block font-medium uppercase tracking-wider">Phone</span>
                  <span className="text-dark-100 font-semibold">{profile.phone || "Not parsed"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap size={18} className="text-brand-400" />
              <span>Quick Actions</span>
            </h3>
            <div className="grid grid-cols-1 gap-2.5 text-xs font-semibold">
              <Link 
                to="/profile" 
                className="flex items-center justify-between p-3 bg-dark-900/40 hover:bg-dark-800 border border-dark-800/80 hover:border-brand-500/20 rounded-xl transition-all"
              >
                <span>Edit Profile Info</span>
                <ChevronRight size={14} className="text-dark-400" />
              </Link>
              <Link 
                to="/recommendations" 
                className="flex items-center justify-between p-3 bg-dark-900/40 hover:bg-dark-800 border border-dark-800/80 hover:border-brand-500/20 rounded-xl transition-all"
              >
                <span>Analyze Job Gaps</span>
                <ChevronRight size={14} className="text-dark-400" />
              </Link>
              <Link 
                to="/upload-resume" 
                className="flex items-center justify-between p-3 bg-dark-900/40 hover:bg-dark-800 border border-dark-800/80 hover:border-brand-500/20 rounded-xl transition-all"
              >
                <span>Scan New Resume</span>
                <ChevronRight size={14} className="text-dark-400" />
              </Link>
            </div>
          </div>
          {/* Skill Tag Summary */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4">
            <h3 className="text-lg font-bold">Skills Extracted</h3>
            {skillsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-dark-800 border border-dark-700 text-brand-300 hover:border-brand-500/30 transition-all"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-400">No skills parsed yet. Upload your resume or edit your profile.</p>
            )}
          </div>

          {/* Top Fit Companies Card */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Building size={18} className="text-brand-400" />
              <span>Target Companies</span>
            </h3>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const uniqueCompanies: { company: string; score: number }[] = [];
                  recommendations.forEach(rec => {
                    if (rec.job?.company) {
                      const existing = uniqueCompanies.find(c => c.company === rec.job!.company);
                      if (!existing) {
                        uniqueCompanies.push({ company: rec.job.company, score: rec.similarity_score });
                      } else if (rec.similarity_score > existing.score) {
                        existing.score = rec.similarity_score;
                      }
                    }
                  });
                  return uniqueCompanies.slice(0, 5).map((comp, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-dark-900/30 p-2.5 rounded-lg border border-dark-800/40">
                      <span className="font-semibold text-dark-100">{comp.company}</span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                        {comp.score}% Match
                      </span>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-xs text-dark-400">Upload your resume to target specific companies.</p>
            )}
          </div>
        </div>

        {/* Right Column: Recommendations & Applications */}
        <div className="lg:col-span-2 space-y-8">
          {/* Top Job Recommendations */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-brand-400" size={20} />
                <span>AI Recommended Matches</span>
              </h3>
              <Link to="/recommendations" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <span>View All Matches</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-dark-400 border border-dashed border-dark-800 rounded-xl">
                No recommended jobs. Add details or wait for recruiters to post.
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => {
                  const matchDetails = rec.match_details ? JSON.parse(rec.match_details) : {};
                  return (
                    <div 
                      key={rec.id}
                      className="group p-4 bg-dark-900/40 hover:bg-dark-900 border border-dark-800 hover:border-brand-500/20 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">{rec.job?.company}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-dark-700"></span>
                          <span className="text-xs text-dark-400">{rec.job?.location || 'Remote'}</span>
                        </div>
                        <h4 className="text-md font-bold text-dark-100 group-hover:text-brand-300 transition-colors">
                          {rec.job?.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-6 justify-between md:justify-end">
                        <div className="flex flex-col text-right">
                          <span className="text-xs text-dark-400">Match Score</span>
                          <span className="text-lg font-bold text-emerald-400">{rec.similarity_score}%</span>
                        </div>
                        <Link 
                          to={`/jobs/${rec.job_id}`}
                          className="px-4 py-2 text-xs font-bold bg-dark-800 hover:bg-brand-600 text-dark-100 hover:text-white rounded-lg transition-all"
                        >
                          View Job
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="text-brand-400" size={20} />
                <span>Recent Job Applications</span>
              </h3>
              <Link to="/applications" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <span>All Applications</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-8 text-dark-400 border border-dashed border-dark-800 rounded-xl">
                No active applications. Check out recommendations to apply!
              </div>
            ) : (
              <div className="overflow-hidden border border-dark-800 rounded-xl">
                <table className="min-w-full divide-y divide-dark-800 text-sm">
                  <thead className="bg-dark-900/60 text-dark-400 text-left font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Job Title</th>
                      <th className="px-6 py-3.5">Company</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800 bg-dark-950/20">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-dark-900/20">
                        <td className="px-6 py-4 font-semibold text-dark-100">{app.job?.title}</td>
                        <td className="px-6 py-4 text-dark-300">{app.job?.company}</td>
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
        </div>
      </div>
    </div>
  );
};
export default CandidateDashboard;
