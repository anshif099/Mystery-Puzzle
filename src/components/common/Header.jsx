import React from 'react';

const NavLink = ({ href, children, onNav }) => (
  <a 
    href={href}
    className="text-gray-700 hover:text-mint font-semibold transition-colors duration-300"
    onClick={(e) => {
      e.preventDefault();
      onNav(href);
    }}
  >
    {children}
  </a>
);

const Header = ({ onAuthClick, setView }) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
      <img src="/icons.png" alt="Logo" className="w-10 h-10 object-contain" />
      <span className="text-xl font-extrabold bg-gradient-to-r from-mint to-sky-blue bg-clip-text text-transparent hidden sm:block">
        Mystery Puzzle
      </span>
    </div>
    
    <nav className="hidden md:flex items-center gap-8">
      <NavLink href="#home" onNav={() => { setView('landing'); setTimeout(() => window.scrollTo({top: 0, behavior: 'smooth'}), 100); }}>Home</NavLink>
      <NavLink href="#about" onNav={() => { setView('landing'); setTimeout(() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>About Challenge</NavLink>
      <NavLink href="#leaderboard" onNav={() => { setView('landing'); setTimeout(() => document.querySelector('#leaderboard')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Leaderboard</NavLink>
      <NavLink href="#rules" onNav={() => { setView('landing'); setTimeout(() => document.querySelector('#rules')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Rules</NavLink>
    </nav>

    <button onClick={onAuthClick} className="bg-mint text-white px-6 py-2 rounded-full font-bold hover:bg-mint/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-mint/20">
      Start Challenge
    </button>
  </header>
);

export default Header;
