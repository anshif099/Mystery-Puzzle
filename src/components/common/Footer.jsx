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
          <h4 className="text-lg font-bold mb-6">Contact Us</h4>
          <div className="flex flex-col gap-4 opacity-80 font-medium">
            {company?.address && (
              <div className="flex gap-3">
                <span className="shrink-0 font-bold italic">ADD:</span>
                <span className="whitespace-pre-line">{company.address}</span>
              </div>
            )}
            {company?.publicEmail && (
              <div className="flex gap-3">
                <span className="shrink-0 font-bold italic">MAIL:</span>
                <a href={`mailto:${company.publicEmail}`} className="hover:text-soft-yellow truncate">{company.publicEmail}</a>
              </div>
            )}
            {company?.publicPhone && (
              <div className="flex gap-3">
                <span className="shrink-0 font-bold italic">CALL:</span>
                <a href={`tel:${company.publicPhone}`} className="hover:text-soft-yellow">{company.publicPhone}</a>
              </div>
            )}
            {!company?.address && !company?.publicEmail && !company?.publicPhone && (
               <p className="italic text-sm">Join the brand-hunt and solve the puzzle!</p>
            )}
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
