import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UploadCloud, CheckCircle2, AlertCircle, ArrowRight, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export const UploadResumePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [matchingStage, setMatchingStage] = useState<number>(0); // 0: upload, 1: parsing skills, 2: semantic matching, 3: completed
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [topMatches, setTopMatches] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (extension !== 'pdf' && extension !== 'docx') {
        setError('Only PDF or DOCX files are allowed.');
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB limit.');
        setFile(null);
        return;
      }

      setError(null);
      setFile(selectedFile);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/candidate/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const profile = response.data;
      const skills = profile.skills ? profile.skills.split(',').map((s: string) => s.trim()) : [];
      setParsedSkills(skills);

      // Successfully uploaded. Switch to matching UI states.
      setSuccess(true);
      setLoading(false);
      setMatchingStage(1); // Skill parsing step

      // Get recommended jobs matching this candidate
      const recsRes = await api.get('/candidate/recommendations');
      setTopMatches(recsRes.data.slice(0, 3)); // show top 3 company fits

      // Animate comparison logs
      setTimeout(() => {
        setMatchingStage(2); // semantic matching step
      }, 1500);

      setTimeout(() => {
        setMatchingStage(3); // matching finished step
      }, 3200);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while uploading and parsing your resume.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Resume Profiler</h1>
        <p className="text-dark-400 mt-1">Upload your resume to extract skills and match with available recruiter jobs.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-dark-800">
        {success ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center text-center p-8 bg-dark-900/20 border border-dark-800 rounded-2xl">
              {/* Dynamic Scanning Orb */}
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-2 bg-gradient-to-tr from-brand-600 to-violet-500 rounded-full flex items-center justify-center text-white font-extrabold shadow-lg shadow-brand-500/30">
                  {matchingStage === 3 ? (
                    <CheckCircle2 size={32} />
                  ) : (
                    <Cpu className="animate-spin" size={32} style={{ animationDuration: '3s' }} />
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold tracking-tight">AI Matching Suite</h2>
              <p className="text-sm text-dark-400 mt-1">Analyzing your qualifications against active recruiter listings</p>

              {/* Progress Logs */}
              <div className="mt-8 w-full max-w-md text-left space-y-3.5 text-sm bg-dark-950/40 p-5 rounded-xl border border-dark-800/60">
                <div className="flex items-center space-x-3 text-dark-100">
                  <CheckCircle2 className="text-brand-400" size={16} />
                  <span>Resume uploaded successfully</span>
                </div>

                <div className={`flex items-center space-x-3 transition-opacity ${matchingStage >= 1 ? 'text-dark-100' : 'text-dark-600'}`}>
                  {matchingStage >= 1 ? (
                    <CheckCircle2 className="text-brand-400" size={16} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-dark-600 border-t-transparent animate-spin"></div>
                  )}
                  <span>Extracted skills: {parsedSkills.slice(0, 4).join(', ')}...</span>
                </div>

                <div className={`flex items-center space-x-3 transition-opacity ${matchingStage >= 2 ? 'text-dark-100' : 'text-dark-600'}`}>
                  {matchingStage >= 2 ? (
                    <CheckCircle2 className="text-brand-400" size={16} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-dark-600 border-t-transparent animate-spin"></div>
                  )}
                  <span>Semantic matching against recruiters' active roles</span>
                </div>

                <div className={`flex items-center space-x-3 transition-opacity ${matchingStage >= 3 ? 'text-dark-100' : 'text-dark-600'}`}>
                  {matchingStage >= 3 ? (
                    <CheckCircle2 className="text-emerald-400" size={16} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-dark-600 border-t-transparent animate-spin"></div>
                  )}
                  <span>Match complete! Found {topMatches.length} strong job alignments</span>
                </div>
              </div>
            </div>

            {/* Results alignment view */}
            {matchingStage === 3 && (
              <div className="space-y-4 animate-fade-in pt-2">
                <h3 className="text-md font-bold text-dark-200">Top Recruiter Fits</h3>
                <div className="space-y-3">
                  {topMatches.map((rec, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-dark-900/40 p-4 border border-dark-800 rounded-xl hover:border-brand-500/20 transition-all">
                      <div>
                        <span className="text-xs text-brand-400 uppercase font-semibold">{rec.job?.company}</span>
                        <h4 className="font-semibold text-dark-100 text-sm mt-0.5">{rec.job?.title}</h4>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                        {rec.similarity_score}% Match
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 mt-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/10 cursor-pointer text-sm"
                >
                  Explore Full Recommendation Feed
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-4 flex items-start space-x-3 text-red-200 text-sm">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-dark-700 hover:border-brand-500/50 rounded-2xl p-10 flex flex-col items-center text-center justify-center transition-all bg-dark-900/20 relative group">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud size={28} />
              </div>
              
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-dark-100">{file.name}</p>
                  <p className="text-xs text-dark-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-dark-200">Drag and drop your file here, or click to browse</p>
                  <p className="text-xs text-dark-400">Supports PDF and DOCX files up to 10MB</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 rounded-lg border border-dark-700 hover:bg-dark-800 text-dark-200 font-semibold text-sm transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || loading}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>AI Parsing In Progress...</span>
                  </>
                ) : (
                  <>
                    <span>Extract & Match</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default UploadResumePage;
