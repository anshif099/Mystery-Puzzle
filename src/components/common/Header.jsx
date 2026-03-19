import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

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

const Header = ({ onAuthClick, setView, company }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const goToSection = (section) => {
    setView('landing');
    setIsMobileMenuOpen(false);

    setTimeout(() => {
      if (section === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      document.querySelector(`#${section}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartChallenge = () => {
    setIsMobileMenuOpen(false);
    onAuthClick();
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between relative">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('landing'); setIsMobileMenuOpen(false); }}>
        <img src={company?.logo || "/icons.png"} alt="Logo" className="w-10 h-10 object-contain rounded-full" />
        <span className="text-xl font-extrabold bg-gradient-to-r from-mint to-sky-blue bg-clip-text text-transparent hidden sm:block">
          {company?.name || "Mystery Puzzle"}
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <NavLink href="#home" onNav={() => goToSection('home')}>Home</NavLink>
        <NavLink href="#about" onNav={() => goToSection('about')}>About Challenge</NavLink>
        <NavLink href="#leaderboard" onNav={() => goToSection('leaderboard')}>Leaderboard</NavLink>
        <NavLink href="#rules" onNav={() => goToSection('rules')}>Rules</NavLink>
      </nav>

      <button
        onClick={onAuthClick}
        className="hidden md:inline-flex bg-mint text-white px-6 py-2 rounded-full font-bold hover:bg-mint/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-mint/20"
      >
        Start Challenge
      </button>

      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 text-gray-700 hover:text-mint hover:border-mint/40 transition-colors"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200/70 p-4">
          <nav className="flex flex-col gap-1">
            <button type="button" onClick={() => goToSection('home')} className="text-left px-3 py-2 rounded-xl font-semibold text-gray-700 hover:text-mint hover:bg-gray-50 transition-colors">Home</button>
            <button type="button" onClick={() => goToSection('about')} className="text-left px-3 py-2 rounded-xl font-semibold text-gray-700 hover:text-mint hover:bg-gray-50 transition-colors">About Challenge</button>
            <button type="button" onClick={() => goToSection('leaderboard')} className="text-left px-3 py-2 rounded-xl font-semibold text-gray-700 hover:text-mint hover:bg-gray-50 transition-colors">Leaderboard</button>
            <button type="button" onClick={() => goToSection('rules')} className="text-left px-3 py-2 rounded-xl font-semibold text-gray-700 hover:text-mint hover:bg-gray-50 transition-colors">Rules</button>
            <button
              type="button"
              onClick={handleStartChallenge}
              className="mt-3 w-full bg-mint text-white px-6 py-2 rounded-full font-bold hover:bg-mint/90 transition-all"
            >
              Start Challenge
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
