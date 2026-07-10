import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Sparkles, FileBarChart } from 'lucide-react';

const COLORS = ['#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#f3e8ff', '#e9d5ff'];

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/analytics');
        setData(response.data);
      } catch (err) {
        console.error("Failed to load analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Matching Analytics</h1>
        <p className="text-dark-400 mt-1">Audit matching accuracy distributions, candidate skills patterns, and job classifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Distribution Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles size={18} className="text-brand-400" />
            <span>Extracted Skills Density (Top 12)</span>
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.skill_distribution} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="skill" type="category" stroke="#64748b" fontSize={11} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} 
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Categories Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-400" />
            <span>Job Postings Classifications</span>
          </h3>
          <div className="h-80 flex items-center justify-center">
            {data?.job_categories && data.job_categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.job_categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                  >
                    {data.job_categories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-dark-500 italic">No job classifications data available.</p>
            )}
          </div>
        </div>

        {/* Match Accuracy Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-400" />
            <span>AI Recommendation Accuracy Intervals</span>
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.recommendation_accuracy} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="bucket" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} 
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resume Upload Formats Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileBarChart size={18} className="text-brand-400" />
            <span>CV File Upload Statistics</span>
          </h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.resume_upload_stats}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="format"
                  label
                >
                  {data?.resume_upload_stats.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminAnalyticsPage;
