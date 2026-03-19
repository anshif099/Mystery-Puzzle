import React from 'react';

const Footer = ({ company }) => (
  <footer className="bg-lavender-blue text-white py-20 px-6">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <img src={company?.logo || "/icons.png"} alt="Logo" className="w-12 h-12 rounded-full" />
            <span className="text-2xl font-black">{company?.name || "Mystery Puzzle"}</span>
          </div>
          <p className="opacity-80 font-medium max-w-sm">
            The ultimate viral brand-reveal challenge. Join the hunt, solve the puzzle, and win big.
          </p>
        </div>
        
        <div>
          <h4 className="text-lg font-bold mb-6">Quick Links</h4>
          <nav className="flex flex-col gap-4 opacity-80 font-medium">
            <a href="#about" className="hover:text-soft-yellow">About Campaign</a>
            <a href="#" className="hover:text-soft-yellow">Terms & Conditions</a>
            <a href="#" className="hover:text-soft-yellow">Privacy Policy</a>
            <a href="#" className="hover:text-soft-yellow">Contact</a>
          </nav>
        </div>

        <div>
          <h4 className="text-lg font-bold mb-6">Connect</h4>
          <div className="flex gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center cursor-pointer">
                ✨
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="pt-8 border-t border-white/10 text-center opacity-60 text-sm font-medium">
        © 2026 {company?.name || "Mystery Puzzle Challenge"}. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
