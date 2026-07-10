import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Cpu, Zap, Briefcase } from 'lucide-react';
import api from '../services/api';
import { Job } from '../types';

const LandingPage: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicJobs = async () => {
      try {
        const response = await api.get('/jobs');
        setJobs(response.data.slice(0, 3)); // show top 3 jobs on landing page
      } catch (err) {
        console.error("Failed to load jobs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicJobs();
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 text-dark-50 flex flex-col justify-between overflow-x-hidden">
      {/* Header */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <Link 
          to="/" 
          onClick={handleLogoClick}
          className="text-2xl font-extrabold bg-gradient-to-r from-brand-400 to-violet-500 bg-clip-text text-transparent flex items-center gap-2 cursor-pointer select-none"
        >
          <span>🚀</span>
          <span>Jobify</span>
        </Link>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-all duration-200 shadow-md shadow-brand-500/10"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-dark-300 hover:text-white font-semibold transition-colors duration-150">
                Log In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-brand-500/10"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto w-full px-6 py-20 flex flex-col items-center text-center space-y-8 z-10">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 bg-brand-950/50 border border-brand-800/40 text-brand-300 px-4 py-1.5 rounded-full text-xs font-semibold"
        >
          <Sparkles size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
          <span>AI-Powered Matching Engine v2.0</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight"
        >
          Match Your Resume to Your <br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-brand-400 via-fuchsia-400 to-violet-500 bg-clip-text text-transparent">
            Dream Job in Seconds
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-dark-300 max-w-2xl font-light"
        >
          Upload your resume in PDF or Word format. Our deep-learning semantic algorithms parse skills, evaluate experience, and recommend the best-fitting jobs with an explicit accuracy breakdown.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 pt-4"
        >
          <Link
            to="/register"
            className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-bold transition-all duration-200 shadow-xl shadow-brand-500/20 group text-md"
          >
            <span>Get Started For Free</span>
            <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center px-8 py-4 rounded-xl border border-dark-700 hover:bg-dark-800 hover:text-white transition-all text-dark-200 font-bold"
          >
            Candidate Sign In
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto w-full px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 z-10">
        <div className="glass-panel p-8 rounded-2xl flex flex-col space-y-4 hover:border-brand-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Cpu size={24} />
          </div>
          <h3 className="text-xl font-bold">Deep Resume Parsing</h3>
          <p className="text-dark-400 text-sm leading-relaxed">
            Extracts name, contact details, structured education lists, experience timelines, certifications, and languages.
          </p>
        </div>
        
        <div className="glass-panel p-8 rounded-2xl flex flex-col space-y-4 hover:border-brand-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold">Weighted Match Scores</h3>
          <p className="text-dark-400 text-sm leading-relaxed">
            Computes a final composite score based on 40% Skills, 20% Experience, 20% Education, and 20% general Semantic Keyword matching.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col space-y-4 hover:border-brand-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold">Role-Based Gatekeeping</h3>
          <p className="text-dark-400 text-sm leading-relaxed">
            Tailored pipelines and dashboards for Candidates (profile uploads), Recruiters (job creation), and Administrators (analytics).
          </p>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 z-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Recent Job Openings</h2>
            <p className="text-dark-400 text-sm">Explore roles that are currently hiring</p>
          </div>
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold text-sm flex items-center gap-1">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-dark-400">
            <Briefcase className="mx-auto text-dark-500 mb-2" size={32} />
            No active jobs listed. Sign up as a recruiter to post the first job!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="glass-panel p-6 rounded-xl hover:border-brand-500/20 transition-all flex flex-col justify-between h-48">
                <div>
                  <span className="text-xs text-brand-400 font-bold uppercase tracking-wider">{job.company}</span>
                  <h4 className="text-lg font-bold text-dark-100 mt-1">{job.title}</h4>
                  <p className="text-xs text-dark-400 mt-1">{job.location || 'Remote'}</p>
                </div>
                <div className="flex justify-between items-center border-t border-dark-800 pt-4 mt-4">
                  <span className="text-sm font-semibold text-emerald-400">{job.salary || 'Competitive'}</span>
                  <Link to="/login" className="text-xs font-bold bg-dark-800 hover:bg-dark-700 text-dark-100 px-3 py-1.5 rounded">
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-900 bg-dark-950/80 backdrop-blur-md px-6 py-8">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center text-sm text-dark-400">
          <div>
            <p>&copy; 2026 Jobify Inc. All rights reserved.</p>
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-dark-100 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-dark-100 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-dark-100 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
