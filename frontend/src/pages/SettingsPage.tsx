import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, User, Bell, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);

  const handleMockSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-dark-400 mt-1">Configure profile privacy and alert configurations.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-dark-800 space-y-6">
        <form onSubmit={handleMockSave} className="space-y-6">
          {success && (
            <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 p-4 flex items-start space-x-3 text-xs font-semibold">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>System configurations saved successfully!</span>
            </div>
          )}

          {/* User profile info block */}
          <div className="space-y-4">
            <h3 className="text-md font-bold flex items-center gap-2 border-b border-dark-800 pb-2">
              <User size={16} className="text-brand-400" />
              <span>Personal Profile</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-dark-400 block font-medium">Logged in Name</span>
                <span className="text-dark-100 font-semibold">{user?.name}</span>
              </div>
              <div>
                <span className="text-xs text-dark-400 block font-medium">Logged in Email</span>
                <span className="text-dark-100 font-semibold">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Alerts configuration */}
          <div className="space-y-4 pt-4">
            <h3 className="text-md font-bold flex items-center gap-2 border-b border-dark-800 pb-2">
              <Bell size={16} className="text-brand-400" />
              <span>Notification Alerts</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 text-sm text-dark-300">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-dark-700 bg-dark-950 text-brand-600 focus:ring-brand-500" />
                <span>Notify me via email when new jobs score above 80% matches</span>
              </label>
              
              <label className="flex items-center space-x-3 text-sm text-dark-300">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-dark-700 bg-dark-950 text-brand-600 focus:ring-brand-500" />
                <span>Email updates when recruiters status my job application</span>
              </label>

              <label className="flex items-center space-x-3 text-sm text-dark-300">
                <input type="checkbox" className="h-4 w-4 rounded border-dark-700 bg-dark-950 text-brand-600 focus:ring-brand-500" />
                <span>Weekly analytical digests reports</span>
              </label>
            </div>
          </div>

          {/* Privacy settings */}
          <div className="space-y-4 pt-4">
            <h3 className="text-md font-bold flex items-center gap-2 border-b border-dark-800 pb-2">
              <Shield size={16} className="text-brand-400" />
              <span>Security & Privacy</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 text-sm text-dark-300">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-dark-700 bg-dark-950 text-brand-600 focus:ring-brand-500" />
                <span>Allow active recruiters to search my parsed skills directly</span>
              </label>
              
              <label className="flex items-center space-x-3 text-sm text-dark-300">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-dark-700 bg-dark-950 text-brand-600 focus:ring-brand-500" />
                <span>Keep recommendation logs private from administrative charts</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-dark-800">
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-brand-500/20 text-sm cursor-pointer"
            >
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SettingsPage;
