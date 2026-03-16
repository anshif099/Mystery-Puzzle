import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import DashboardOverview from './DashboardOverview';
import CompanyManagement from './CompanyManagement';
import Analytics from './Analytics';
import ParticipantManagement from './ParticipantManagement';

const PlaceholderView = ({ title }) => (
  <div className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center text-center soft-shadow border border-gray-50 animate-in fade-in zoom-in-95 duration-500">
    <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center text-6xl mb-8">🛠️</div>
    <h2 className="text-3xl font-black text-gray-900 mb-4">{title}</h2>
    <p className="text-gray-500 font-medium max-w-md">This module is currently being configured. Feature release expected in the next update.</p>
  </div>
);

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardOverview />;
      case 'companies': return <CompanyManagement />;
      case 'participants': return <ParticipantManagement />;
      case 'analytics': return <Analytics />;
      case 'campaigns': return <PlaceholderView title="Campaign Management" />;
      case 'leaderboards': return <PlaceholderView title="Global Leaderboards" />;
      case 'email': return <PlaceholderView title="Email Automation" />;
      case 'security': return <PlaceholderView title="Security Monitoring" />;
      case 'settings': return <PlaceholderView title="System Settings" />;
      default: return <DashboardOverview />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'companies': return 'Company Admin Management';
      case 'participants': return 'Participants Data Management';
      case 'analytics': return 'Puzzle Analytics';
      case 'campaigns': return 'Campaign Management';
      case 'leaderboards': return 'Leaderboard Management';
      case 'email': return 'Email Automation Settings';
      case 'security': return 'Security Monitoring';
      case 'settings': return 'System Settings';
      default: return 'Super Admin Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex relative overflow-x-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        onLogout={onLogout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          title={getTitle()} 
          onLogout={onLogout} 
          onMenuClick={toggleSidebar}
        />
        
        <main className="flex-1 mt-20 p-4 lg:p-8 pt-10">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
