import React from 'react';
import { 
  Flag, 
  Users, 
  CheckCircle2, 
  Timer, 
  Share2, 
  UserPlus 
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`p-8 rounded-[32px] soft-shadow bg-white border border-gray-50 flex flex-col gap-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
    <div className={`p-4 rounded-2xl ${color} w-fit shadow-lg shadow-current/10 relative z-10`}>
      <Icon size={24} className="text-gray-800" />
    </div>
    <div>
      <h3 className="text-4xl font-black text-gray-900 mb-1 tabular-nums">{value}</h3>
      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{label}</p>
    </div>
    <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
      <Icon size={120} />
    </div>
  </div>
);

const DashboardOverview = () => {
  const stats = [
    { label: 'Total Campaigns', value: '24', icon: Flag, color: 'bg-soft-yellow' },
    { label: 'Total Participants', value: '4,326', icon: Users, color: 'bg-sky-blue' },
    { label: 'Completed Puzzles', value: '1,284', icon: CheckCircle2, color: 'bg-mint' },
    { label: 'Avg. Completion Time', value: '01:42', icon: Timer, color: 'bg-lavender-blue' },
    { label: 'Social Shares', value: '892', icon: Share2, color: 'bg-sky-blue/50' },
    { label: 'Total Referrals', value: '556', icon: UserPlus, color: 'bg-soft-yellow/50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[40px] p-10 soft-shadow border border-gray-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Recent Activity</h3>
            <button className="text-sky-blue font-bold text-sm hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-mint/10 transition-colors">
                  <span className="text-xl">👤</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">New Participant Joined</p>
                  <p className="text-sm text-gray-500">Alex J. just started the 'Brand Reveal Summer' challenge.</p>
                </div>
                <span className="text-xs font-bold text-gray-400">2m ago</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-mint text-white rounded-[40px] p-10 shadow-xl shadow-mint/20 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Live Status</h3>
            <p className="opacity-80 font-medium">Real-time update from all active campaigns.</p>
          </div>
          
          <div className="relative z-10 mt-8 mb-12">
            <h4 className="text-6xl font-black mb-2 animate-pulse-subtle tabular-nums">142</h4>
            <p className="font-bold uppercase tracking-widest text-sm opacity-80">Users Currently Playing</p>
          </div>

          <button className="relative z-10 bg-white text-mint py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-lg active:scale-95">
            Monitor Live
          </button>

          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
