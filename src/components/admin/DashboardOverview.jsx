import React from 'react';
import { 
  Flag, 
  Users, 
  CheckCircle2, 
  Timer, 
  Share2, 
  UserPlus,
  Loader2,
} from 'lucide-react';
import { 
  getSuperAdminMetrics, 
  getSuperAdminRecentActivity, 
  getSuperAdminLiveStatus 
} from '../../services/superAdminService';
import { formatDuration } from '../../services/challengeService';

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

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const DashboardOverview = () => {
  const [loading, setLoading] = React.useState(true);
  const [overview, setOverview] = React.useState(null);
  const [activities, setActivities] = React.useState([]);
  const [liveCount, setLiveCount] = React.useState(0);

  const fetchData = async () => {
    try {
      const [metrics, recent, live] = await Promise.all([
        getSuperAdminMetrics(),
        getSuperAdminRecentActivity(),
        getSuperAdminLiveStatus()
      ]);
      setOverview(metrics);
      setActivities(recent);
      setLiveCount(live);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      getSuperAdminLiveStatus().then(setLiveCount);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-mint" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Campaigns', value: overview?.totalCampaigns || 0, icon: Flag, color: 'bg-soft-yellow' },
    { label: 'Total Participants', value: overview?.totalParticipants?.toLocaleString() || 0, icon: Users, color: 'bg-sky-blue' },
    { label: 'Completed Puzzles', value: overview?.completedPuzzles?.toLocaleString() || 0, icon: CheckCircle2, color: 'bg-mint' },
    { label: 'Avg. Completion Time', value: formatDuration(overview?.avgCompletionTime), icon: Timer, color: 'bg-lavender-blue' },
    { label: 'Total Companies', value: overview?.totalCompanies || 0, icon: Share2, color: 'bg-sky-blue/50' },
    { label: 'Total Attempts', value: overview?.totalAttempts?.toLocaleString() || 0, icon: UserPlus, color: 'bg-soft-yellow/50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            {activities.length > 0 ? activities.map(activity => (
              <div key={activity.id} className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50/50 p-2 rounded-2xl transition-all">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-mint/10 transition-colors">
                  <span className="text-xl">{activity.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
                <span className="text-xs font-bold text-gray-400">{formatRelativeTime(activity.timestamp)}</span>
              </div>
            )) : (
              <div className="text-center py-10 text-gray-400 font-medium">No recent activity found.</div>
            )}
          </div>
        </div>

        <div className="bg-mint text-white rounded-[40px] p-10 shadow-xl shadow-mint/20 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Live Status</h3>
            <p className="opacity-80 font-medium">Real-time update from all active campaigns.</p>
          </div>
          
          <div className="relative z-10 mt-8 mb-12">
            <h4 className="text-6xl font-black mb-2 animate-pulse-subtle tabular-nums">{liveCount}</h4>
            <p className="font-bold uppercase tracking-widest text-sm opacity-80">Users Currently Playing</p>
          </div>

          <button 
            onClick={fetchData}
            className="relative z-10 bg-white text-mint py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-lg active:scale-95"
          >
            Refresh Dashboard
          </button>

          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
