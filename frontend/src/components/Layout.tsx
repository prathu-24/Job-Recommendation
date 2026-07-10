import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatBot from './ChatBot';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
          <p className="text-brand-400 font-semibold animate-pulse">Loading Jobify...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-dark-50 flex flex-col">
      {isAuthenticated && <Navbar />}
      
      <div className="flex flex-1">
        {isAuthenticated && showSidebar && <Sidebar />}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      {isAuthenticated && <ChatBot />}
    </div>
  );
};

export default Layout;
