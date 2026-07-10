import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  User, 
  Briefcase, 
  CheckSquare, 
  PlusCircle, 
  BarChart3, 
  Users, 
  Settings, 
  Sparkles,
  Truck
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const getLinks = () => {
    switch (role) {
      case 'candidate':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
          { to: '/upload-resume', label: 'Upload Resume', icon: <UploadCloud size={20} /> },
          { to: '/profile', label: 'My Profile', icon: <User size={20} /> },
          { to: '/recommendations', label: 'Recommended Jobs', icon: <Sparkles size={20} /> },
          { to: '/applications', label: 'Applications', icon: <CheckSquare size={20} /> },
        ];
      case 'recruiter':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
          { to: '/create-job', label: 'Post a Job', icon: <PlusCircle size={20} /> },
          { to: '/manage-jobs', label: 'Manage Jobs', icon: <Briefcase size={20} /> },
          { to: '/applications', label: 'Applications', icon: <CheckSquare size={20} /> },
        ];
      case 'admin':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
          { to: '/admin/users', label: 'Manage Users', icon: <Users size={20} /> },
          { to: '/manage-jobs', label: 'All Jobs', icon: <Briefcase size={20} /> },
          { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
          { to: '/admin/fleet', label: 'Fleet Dispatch', icon: <Truck size={20} /> },
        ];
      default:
        return [];
    }
  };

  const links = [...getLinks(), { to: '/settings', label: 'Settings', icon: <Settings size={20} /> }];

  return (
    <aside className="w-64 min-h-[calc(100vh-73px)] border-r border-dark-800 glass-panel p-4 flex flex-col justify-between">
      <div className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-dark-50'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
      
      <div className="p-4 border-t border-dark-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-dark-400">
          <span>System Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
