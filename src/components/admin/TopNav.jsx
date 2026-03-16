import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';

const TopNav = ({ title, onLogout }) => (
  <header className="h-20 bg-lavender-blue fixed top-0 right-0 left-64 z-30 shadow-lg flex items-center justify-between px-8 text-white">
    <div className="flex flex-col">
      <h1 className="text-xl font-black tracking-tight uppercase">{title}</h1>
      <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Mystery Puzzle Brand Reveal</span>
    </div>

    <div className="flex items-center gap-6">
      <button className="relative p-2 hover:bg-white/10 rounded-xl transition-colors">
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-lavender-blue" />
      </button>

      <div className="h-10 w-[1px] bg-white/10 mx-2" />

      <div className="flex items-center gap-4 group cursor-pointer">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-black">Super Admin</p>
          <p className="text-[10px] font-bold opacity-60">mystery@gmail.com</p>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 transition-all group-hover:scale-110">
          <User size={20} />
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="p-2 hover:bg-accent/20 hover:text-accent rounded-xl transition-all"
        title="Logout"
      >
        <LogOut size={20} />
      </button>
    </div>
  </header>
);

export default TopNav;
