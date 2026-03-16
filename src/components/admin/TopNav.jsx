import { Bell, User, LogOut, Menu } from 'lucide-react';

const TopNav = ({ title, onLogout, onMenuClick }) => (
  <header className="h-20 bg-lavender-blue fixed top-0 right-0 left-0 lg:left-64 z-30 shadow-lg flex items-center justify-between px-4 lg:px-8 text-white">
    <div className="flex items-center gap-4">
      <button 
        onClick={onMenuClick}
        className="p-2 hover:bg-white/10 rounded-xl transition-colors lg:hidden"
      >
        <Menu size={24} />
      </button>

      <div className="flex flex-col">
        <h1 className="text-sm lg:text-xl font-black tracking-tight uppercase line-clamp-1">{title}</h1>
        <span className="text-[8px] lg:text-[10px] font-bold opacity-60 uppercase tracking-widest hidden xs:block">Mystery Puzzle Brand Reveal</span>
      </div>
    </div>

    <div className="flex items-center gap-2 lg:gap-6">
      <button className="relative p-2 hover:bg-white/10 rounded-xl transition-colors hidden xs:block">
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-lavender-blue" />
      </button>

      <div className="h-10 w-[1px] bg-white/10 mx-1 lg:mx-2 hidden xs:block" />

      <div className="flex items-center gap-2 lg:gap-4 group cursor-pointer">
        <div className="text-right hidden sm:block">
          <p className="text-xs lg:text-sm font-black">Super Admin</p>
          <p className="text-[8px] lg:text-[10px] font-bold opacity-60">mystery@gmail.com</p>
        </div>
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center border border-white/20 transition-all group-hover:scale-110">
          <User size={18} className="lg:w-5 lg:h-5" />
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="p-2 hover:bg-accent/20 hover:text-accent rounded-xl transition-all ml-1 lg:ml-0"
        title="Logout"
      >
        <LogOut size={20} />
      </button>
    </div>
  </header>
);

export default TopNav;
