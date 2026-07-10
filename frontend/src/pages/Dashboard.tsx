import React from 'react';
import { useAuth } from '../context/AuthContext';
import CandidateDashboard from './CandidateDashboard';
import RecruiterDashboard from './RecruiterDashboard';
import AdminDashboard from './AdminDashboard';

export const Dashboard: React.FC = () => {
  const { role } = useAuth();

  switch (role) {
    case 'candidate':
      return <CandidateDashboard />;
    case 'recruiter':
      return <RecruiterDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg text-dark-400 font-semibold">User Role Unknown or Invalid.</p>
        </div>
      );
  }
};

export default Dashboard;
