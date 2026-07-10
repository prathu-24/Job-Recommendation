import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Recommendation } from '../types';
import { Sparkles, MapPin, DollarSign, Briefcase, ChevronRight, CheckCircle2, AlertCircle, BookOpen, BarChart2, Lightbulb } from 'lucide-react';
import SkillRadarChart from '../components/SkillRadarChart';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyStates, setApplyStates] = useState<Record<number, 'idle' | 'loading' | 'success' | 'error'>>({});
  
  // Gap analysis states
  const [selectedJobForGap, setSelectedJobForGap] = useState<number | null>(null);
  const [gapData, setGapData] = useState<Record<number, any>>({});
  const [gapLoading, setGapLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/candidate/recommendations');
        setRecommendations(response.data);
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleApply = async (jobId: number) => {
    setApplyStates(prev => ({ ...prev, [jobId]: 'loading' }));
    try {
      await api.post(`/candidate/jobs/${jobId}/apply`);
      setApplyStates(prev => ({ ...prev, [jobId]: 'success' }));
    } catch (err) {
      console.error(err);
      setApplyStates(prev => ({ ...prev, [jobId]: 'error' }));
    }
  };

  const handleFetchGap = async (jobId: number) => {
    if (selectedJobForGap === jobId) {
      setSelectedJobForGap(null);
      return;
    }

    setSelectedJobForGap(jobId);
    if (gapData[jobId]) return;

    setGapLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await api.get(`/candidate/jobs/${jobId}/gap-analysis`);
      setGapData(prev => ({ ...prev, [jobId]: res.data }));
    } catch (err) {
      console.error("Failed to fetch gap analysis", err);
    } finally {
      setGapLoading(prev => ({ ...prev, [jobId]: false }));
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
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="text-brand-400" size={26} />
          <span>Semantic Match Recommendations</span>
        </h1>
        <p className="text-dark-400 mt-1">Our AI engine evaluated your profile against active listings using 4 components.</p>
      </div>

      {recommendations.length === 0 ? (
        <div className="glass-panel text-center p-12 rounded-2xl text-dark-400 border border-dashed border-dark-800">
          No job matches found. Please upload a structured resume or check back later.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {recommendations.map((rec) => {
            const matchDetails = rec.match_details ? JSON.parse(rec.match_details) : {
              skill_match: 0,
              experience_match: 0,
              education_match: 0,
              keyword_similarity: 0
            };
            const applyState = applyStates[rec.job_id] || 'idle';
            const isGapOpen = selectedJobForGap === rec.job_id;
            const gap = gapData[rec.job_id];
            const isGapLoading = gapLoading[rec.job_id];

            return (
              <div 
                key={rec.id} 
                className="glass-panel p-6 rounded-2xl border border-dark-800 flex flex-col justify-between hover:border-brand-500/10 transition-all duration-300"
              >
                {/* Main Card Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Job Info */}
                  <div className="lg:col-span-1 space-y-4">
                    <div>
                      <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">{rec.job?.company}</span>
                      <h3 className="text-lg font-bold text-dark-100 mt-0.5">{rec.job?.title}</h3>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-dark-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {rec.job?.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={14} />
                        {rec.job?.salary || 'Competitive'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase size={14} />
                        {rec.job?.experience_required} years exp
                      </span>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-extrabold px-4 py-2.5 rounded-xl text-sm flex items-center justify-between max-w-[200px]">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Overall Match</span>
                      <span className="text-base">{rec.similarity_score}%</span>
                    </div>
                  </div>

                  {/* Middle Column: Score breakdown */}
                  <div className="lg:col-span-2 grid grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-dark-800/80 pt-4 lg:pt-0 lg:pl-6 text-xs">
                    <div>
                      <div className="flex justify-between text-dark-400 font-medium">
                        <span>Skills Match (40%)</span>
                        <span className="text-brand-300 font-bold">{matchDetails.skill_match}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${matchDetails.skill_match}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-dark-400 font-medium">
                        <span>Experience Match (20%)</span>
                        <span className="text-fuchsia-300 font-bold">{matchDetails.experience_match}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-fuchsia-500 rounded-full" style={{ width: `${matchDetails.experience_match}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-dark-400 font-medium">
                        <span>Education Match (20%)</span>
                        <span className="text-violet-300 font-bold">{matchDetails.education_match}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${matchDetails.education_match}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-dark-400 font-medium">
                        <span>Keyword Similarity (20%)</span>
                        <span className="text-emerald-300 font-bold">{matchDetails.keyword_similarity}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${matchDetails.keyword_similarity}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gap Analysis Dropdown Section */}
                {isGapOpen && (
                  <div className="mt-6 border-t border-dark-800/80 pt-6 animate-fade-in">
                    {isGapLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
                      </div>
                    ) : gap ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Radar Chart (Visualizer) */}
                        <div className="md:col-span-1 bg-dark-900/40 border border-dark-800 rounded-xl p-4 flex flex-col items-center">
                          <h4 className="text-xs font-bold text-dark-300 mb-2 flex items-center gap-1.5">
                            <BarChart2 size={14} className="text-brand-400" />
                            <span>Skills Radar Comparison</span>
                          </h4>
                          <SkillRadarChart 
                            matchingSkills={gap.matching_skills} 
                            missingSkills={gap.missing_skills} 
                          />
                          <div className="flex gap-4 mt-2 text-[10px] text-dark-400">
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 bg-cyan-500 rounded-sm"></span> You
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm"></span> Required
                            </span>
                          </div>
                        </div>

                        {/* Match & Gaps */}
                        <div className="md:col-span-1 space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-dark-300 uppercase tracking-wider mb-2">Readiness: <span className="text-brand-400 font-extrabold">{gap.readiness_level}</span></h4>
                            <p className="text-xs text-dark-400">You match {gap.readiness_score}% of the core required technical skill sets.</p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">Matching Skills ({gap.matching_skills.length})</span>
                            <div className="flex flex-wrap gap-1.5">
                              {gap.matching_skills.map((s: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded">
                                  {s}
                                </span>
                              ))}
                              {gap.matching_skills.length === 0 && (
                                <span className="text-xs text-dark-500 italic">No matching skills found</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-red-400 block uppercase tracking-wider">Missing Skills ({gap.missing_skills.length})</span>
                            <div className="flex flex-wrap gap-1.5">
                              {gap.missing_skills.map((s: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 text-[10px] font-semibold bg-red-950/40 border border-red-500/20 text-red-400 rounded">
                                  {s}
                                </span>
                              ))}
                              {gap.missing_skills.length === 0 && (
                                <span className="text-xs text-emerald-400 font-semibold">None! You possess all core skills!</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Suggestions & Course Links */}
                        <div className="md:col-span-1 space-y-4 border-l border-dark-800/80 pl-4">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-dark-300 flex items-center gap-1.5">
                              <BookOpen size={14} className="text-brand-400" />
                              <span>Recommended Courses</span>
                            </h4>
                            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                              {gap.suggested_courses.map((c: any, idx: number) => (
                                <a 
                                  key={idx} 
                                  href={c.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block p-2 bg-dark-900/60 border border-dark-800 hover:border-brand-500/30 rounded-lg text-xs transition-all hover:translate-x-1"
                                >
                                  <span className="font-semibold text-brand-300 block truncate">{c.title}</span>
                                  <span className="text-[9px] text-dark-500 block uppercase tracking-wider font-semibold">{c.platform}</span>
                                </a>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 bg-dark-900/20 border border-dark-850 p-3 rounded-lg">
                            <span className="text-[10px] font-bold text-brand-300 flex items-center gap-1">
                              <Lightbulb size={12} />
                              Roadmap Tip
                            </span>
                            <p className="text-[10px] text-dark-400 leading-normal">{gap.improvement_tips[0]}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-red-400">Failed to analyze skill gaps. Make sure your profile has skills listed.</p>
                    )}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex justify-between items-center mt-6 border-t border-dark-800/80 pt-4 gap-4">
                  <div className="flex items-center gap-4">
                    <Link 
                      to={`/jobs/${rec.job_id}`}
                      className="text-xs font-semibold text-dark-300 hover:text-dark-100 flex items-center gap-0.5"
                    >
                      <span>Description</span>
                      <ChevronRight size={14} />
                    </Link>

                    <button
                      onClick={() => handleFetchGap(rec.job_id)}
                      className={`text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isGapOpen ? 'text-brand-400' : 'text-dark-400 hover:text-brand-300'
                      }`}
                    >
                      <Sparkles size={14} />
                      <span>{isGapOpen ? 'Hide Gap Analysis' : 'Skill Gap Analysis'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleApply(rec.job_id)}
                    disabled={applyState !== 'idle'}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                      {
                        idle: 'bg-brand-600 hover:bg-brand-700 text-white cursor-pointer hover:shadow-brand-500/10',
                        loading: 'bg-dark-800 text-dark-400 cursor-not-allowed',
                        success: 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 cursor-not-allowed',
                        error: 'bg-red-950/40 border border-red-500/20 text-red-400 cursor-pointer'
                      }[applyState]
                    }`}
                  >
                    {
                      {
                        idle: 'Apply Instantly',
                        loading: 'Applying...',
                        success: 'Applied ✔',
                        error: 'Retry Apply'
                      }[applyState]
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default RecommendationsPage;
