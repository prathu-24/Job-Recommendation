import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { User } from '../types';
import { Users, Mail, ShieldAlert, Calendar, ShieldCheck } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } catch (err) {
        console.error("Failed to load users list", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
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
        <h1 className="text-3xl font-bold tracking-tight">Registered Portal Users</h1>
        <p className="text-dark-400 mt-1">Audit security profiles and active roles within the system.</p>
      </div>

      <div className="glass-panel rounded-2xl border border-dark-800 overflow-hidden">
        <table className="min-w-full divide-y divide-dark-800 text-sm">
          <thead className="bg-dark-900/60 text-dark-400 font-semibold text-left">
            <tr>
              <th className="px-6 py-4">Account ID</th>
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Email Address</th>
              <th className="px-6 py-4">Registration Date</th>
              <th className="px-6 py-4 text-right">System Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800 bg-dark-950/20">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-dark-900/20 transition-all">
                <td className="px-6 py-4 text-dark-400 font-mono text-xs">#{user.id}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-dark-100">{user.name}</div>
                </td>
                <td className="px-6 py-4 text-dark-300">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-dark-500" />
                    {user.email}
                  </span>
                </td>
                <td className="px-6 py-4 text-dark-400 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-dark-500" />
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    {
                      admin: 'bg-red-950/40 text-red-400 border border-red-500/20',
                      recruiter: 'bg-violet-950/40 text-violet-400 border border-violet-500/20',
                      candidate: 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                    }[user.role]
                  }`}>
                    {user.role === 'admin' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                    {user.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminUsersPage;
