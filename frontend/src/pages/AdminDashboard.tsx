import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { DashboardStats } from '../types';
import { Users, Briefcase, FileText, BarChart3, Sparkles, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const statsRes = await api.get('/admin/dashboard');
        setStats(statsRes.data);

        // Fetch detailed analytics for user growth chart
        const analyticsRes = await api.get('/admin/analytics');
        setChartData(analyticsRes.data.user_growth);
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
        <p className="text-dark-400 mt-1">Monitor portal activity, execute reports, and inspect engine metrics.</p>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-dark-400 block font-medium uppercase tracking-wider">Total Users</span>
            <span className="text-3xl font-black text-dark-50 mt-1 block">{stats?.total_users}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Users size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-dark-400 block font-medium uppercase tracking-wider">Job Listings</span>
            <span className="text-3xl font-black text-dark-50 mt-1 block">{stats?.total_jobs}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-dark-400 block font-medium uppercase tracking-wider">Applications</span>
            <span className="text-3xl font-black text-dark-50 mt-1 block">{stats?.total_applications}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <FileText size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-dark-400 block font-medium uppercase tracking-wider">Avg Similarity</span>
            <span className="text-3xl font-black text-dark-50 mt-1 block">{stats?.average_similarity_score}%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Sparkles size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Line Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
          <h3 className="text-lg font-bold">User Registrations (Growth)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} 
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Admin Tasks */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
          <h3 className="text-lg font-bold">Administrative Actions</h3>
          <div className="flex flex-col space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-4 bg-dark-900/40 hover:bg-dark-900 border border-dark-800 hover:border-brand-500/20 rounded-xl transition-all"
            >
              <div className="flex items-center space-x-3">
                <Users className="text-brand-400" size={18} />
                <span className="text-sm font-semibold text-dark-100">Review Registered Users</span>
              </div>
              <ChevronRight size={16} className="text-dark-400" />
            </Link>

            <Link
              to="/admin/analytics"
              className="flex items-center justify-between p-4 bg-dark-900/40 hover:bg-dark-900 border border-dark-800 hover:border-brand-500/20 rounded-xl transition-all"
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="text-fuchsia-400" size={18} />
                <span className="text-sm font-semibold text-dark-100">Deep AI Engine Analytics</span>
              </div>
              <ChevronRight size={16} className="text-dark-400" />
            </Link>

            <Link
              to="/manage-jobs"
              className="flex items-center justify-between p-4 bg-dark-900/40 hover:bg-dark-900 border border-dark-800 hover:border-brand-500/20 rounded-xl transition-all"
            >
              <div className="flex items-center space-x-3">
                <Briefcase className="text-violet-400" size={18} />
                <span className="text-sm font-semibold text-dark-100">Browse Full Job Database</span>
              </div>
              <ChevronRight size={16} className="text-dark-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
