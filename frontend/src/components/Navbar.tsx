import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoClicks, setLogoClicks] = useState(0);

  // Normal logout — clears session, goes to /login with NO state
  // so LoginPage shows a blank form (credentials required)
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Secret 5-click logo: auto-logins as admin
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newClicks = logoClicks + 1;
    if (newClicks >= 5) {
      logout();
      // Pass autofillAdmin so LoginPage triggers auto-login
      navigate('/login', { state: { autofillAdmin: true }, replace: true });
      setLogoClicks(0);
    } else {
      setLogoClicks(newClicks);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-dark-800 px-6 py-4 flex items-center justify-between text-dark-100">
      <div className="flex items-center space-x-3">
        <Link 
          to="/" 
          onClick={handleLogoClick}
          className="text-xl font-bold bg-gradient-to-r from-brand-400 to-violet-500 bg-clip-text text-transparent flex items-center gap-2 cursor-pointer select-none"
        >
          <span>🚀</span>
          <span className="font-extrabold tracking-tight">Jobify</span>
        </Link>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-dark-400 hover:text-dark-100 transition-colors duration-200">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 border-l border-dark-800 pl-6">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-dark-100">{user?.name}</span>
            <span className="text-xs text-brand-400 capitalize font-medium">{user?.role}</span>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/10">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
          </div>

          <button 
            onClick={handleLogout}
            className="p-2 ml-2 text-dark-400 hover:text-red-400 transition-colors duration-200"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
