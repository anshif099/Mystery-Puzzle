import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Flag, 
  Database, 
  BarChart3, 
  Trophy, 
  Mail, 
  ShieldAlert, 
  Settings, 
  LogOut 
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-all ${
      active 
        ? 'bg-white/20 border-r-4 border-white text-white font-bold' 
        : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="text-sm tracking-wide">{label}</span>
  </div>
);

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'companies', label: 'Company Admins', icon: Users },
    { id: 'campaigns', label: 'Campaign Management', icon: Flag },
    { id: 'participants', label: 'Participants Data', icon: Database },
    { id: 'analytics', label: 'Puzzle Analytics', icon: BarChart3 },
    { id: 'leaderboards', label: 'Leaderboards', icon: Trophy },
    { id: 'email', label: 'Email Automation', icon: Mail },
    { id: 'security', label: 'Security Monitoring', icon: ShieldAlert },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-mint h-screen fixed left-0 top-0 shadow-2xl z-40 flex flex-col">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <img src="/icons.png" alt="Logo" className="w-10 h-10 object-contain" />
          <span className="text-white font-black text-lg tracking-tighter">ADMIN PANEL</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {menuItems.map(item => (
          <SidebarItem 
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <SidebarItem 
          icon={LogOut} 
          label="Logout" 
          onClick={onLogout}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
