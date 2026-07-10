import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute w-80 h-80 bg-brand-600/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse-slow"></div>

      <div className="glass-panel p-12 rounded-3xl border border-dark-800 space-y-6 max-w-md shadow-2xl relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 mx-auto">
          <HelpCircle size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-brand-400">404</h1>
          <h2 className="text-xl font-bold text-dark-50">Page Not Found</h2>
          <p className="text-sm text-dark-400 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1 px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-md shadow-brand-500/10 text-sm transition-all"
        >
          <span>Return Home</span>
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};
export default NotFoundPage;
