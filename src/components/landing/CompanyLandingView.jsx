import React, { useState, useEffect, useLayoutEffect } from 'react';
import { getCompanyAdminById } from '../../services/companyAdminCloud';
import { getCampaigns, subscribeUsers } from '../../services/challengeService';
import { Share2, Instagram, Facebook, MessageCircle, Copy } from 'lucide-react';

const CompanyLandingView = ({ companyId, onAuthClick, onCompanyData }) => {
  const [participants, setParticipants] = useState(4326);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [company, setCompany] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        const companyData = await getCompanyAdminById(companyId);
        setCompany(companyData);
        if (onCompanyData) onCompanyData(companyData);

        const campaigns = await getCampaigns(companyId);
        const activeCampaign = campaigns.find(c => c.isActive) || campaigns[0];
        setCampaign(activeCampaign);
      } catch (err) {
        console.error("Failed to fetch landing data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeUsers(companyId, (users) => {
      setParticipants(users.length + 4326); // Adding initial offset for design
    });
    return unsub;
  }, [companyId]);

  useLayoutEffect(() => {
    if (company?.themeColor) {
      const hex = company.themeColor.replace("#", "");
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        document.documentElement.style.setProperty("--color-mint-rgb", `${r}, ${g}, ${b}`);
      }
    }
    return () => {
      document.documentElement.style.setProperty("--color-mint-rgb", `99, 211, 164`);
    };
  }, [company?.themeColor]);

  useEffect(() => {
    if (!campaign?.revealDate && !campaign?.createdAt) return;
    
    // Using 7 days after creation if revealDate is not explicitly set in the user's request fields
    // But user request mentioned campaign.reveal_date
    const targetDate = campaign?.revealDate ? new Date(campaign.revealDate) : new Date(campaign.createdAt + 7 * 24 * 60 * 60 * 1000);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [campaign]);

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Join the ${campaign?.title || "Mystery Puzzle Challenge"}!`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL for web links, so we'll just copy to clipboard
        navigator.clipboard.writeText(url);
        alert("Link copied for Instagram sharing!");
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
        break;
    }
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const prizes = campaign?.prizes || [];
  const puzzleEnabled = company?.features?.includes("Puzzle");
  const wheelEnabled = company?.features?.includes("Spin Wheel");

  return (
    <>
      <section id="home" className="relative pt-32 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 pastel-gradient opacity-10 -z-10" />
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-soft-yellow/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-sky-blue/20 rounded-full blur-3xl -z-10" />

        <div className="floating-piece top-40 left-10 w-12 h-12 bg-mint rounded-lg rotate-12" />
        <div className="floating-piece top-60 right-20 w-16 h-16 bg-lavender-blue rounded-xl -rotate-6" />

        <div className="relative mb-12">
          <div className="absolute inset-0 bg-mint/20 blur-2xl rounded-full scale-150 animate-pulse-subtle" />
          <img 
            src={company?.logo || "/icons.png"} 
            alt={company?.name || "App Logo"} 
            className="relative w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-2xl rounded-full" 
          />
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          {campaign?.title || "Can You Solve the"} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint via-sky-blue to-lavender-blue">
            Mystery Challenge?
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl">
          {company?.name || "Join thousands"} attempting the challenge before the reveal.
        </p>

        <div className="flex gap-4 md:gap-8 mb-12">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Mins', value: timeLeft.minutes },
            { label: 'Secs', value: timeLeft.seconds }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="bg-white/80 backdrop-blur-sm soft-shadow w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black text-sky-blue border border-white">
                {String(item.value).padStart(2, '0')}
              </div>
              <span className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {(puzzleEnabled || !company) && (
            <button 
              onClick={() => onAuthClick("puzzle")} 
              className="bg-mint text-white text-xl px-12 py-4 rounded-full font-black hover:bg-mint/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-mint/30 group"
            >
              Start Puzzle Challenge
              <span className="inline-block ml-3 transition-transform group-hover:translate-x-2">→</span>
            </button>
          )}
          {wheelEnabled && (
            <button 
              onClick={() => onAuthClick("wheel")} 
              className="bg-sky-blue text-white text-xl px-12 py-4 rounded-full font-black hover:bg-sky-blue/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-sky-blue/30 group"
            >
              Spin the Wheel
              <span className="inline-block ml-3 transition-transform group-hover:translate-x-2">→</span>
            </button>
          )}
          
          <button 
            onClick={() => setShowShareModal(true)} 
            className="bg-white text-gray-800 text-xl px-8 py-4 rounded-full font-black border-2 border-gray-100 hover:bg-gray-50 transition-all flex items-center gap-3"
          >
            <Share2 size={24} />
            Share
          </button>
        </div>
      </section>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-black text-gray-900 mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-mint to-sky-blue">
              Share the Challenge
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleShare('whatsapp')} 
                className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <MessageCircle size={24} />
                </div>
                <span className="font-bold">WhatsApp</span>
              </button>
              <button 
                onClick={() => handleShare('facebook')} 
                className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Facebook size={24} />
                </div>
                <span className="font-bold">Facebook</span>
              </button>
              <button 
                onClick={() => handleShare('instagram')} 
                className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Instagram size={24} />
                </div>
                <span className="font-bold">Instagram</span>
              </button>
              <button 
                onClick={() => handleShare('copy')} 
                className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-800 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-500/20">
                  <Copy size={24} />
                </div>
                <span className="font-bold">Copy Link</span>
              </button>
            </div>
            <button 
              onClick={() => setShowShareModal(false)} 
              className="mt-8 w-full py-4 text-gray-500 font-bold hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="bg-soft-yellow py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 text-center md:text-left">
            Thousands Already <br className="hidden md:block" /> Tried the Challenge
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { label: 'Participants', value: participants.toLocaleString() },
              { label: 'Completed', value: '1,284' },
              { label: 'Fastest', value: '00:48' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-black text-gray-900 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-gray-600 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-24 px-6 bg-gray-50 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">About {campaign?.title || "the Mystery Challenge"}</h2>
            <div className="h-2 w-32 bg-mint mx-auto rounded-full mb-8" />
            <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-4xl mx-auto leading-relaxed">
              {campaign?.description || "The Mystery Puzzle Challenge is an interactive online puzzle game created to build excitement before the official launch of our new education brand. Participants are invited to solve a hidden logo puzzle within a limited time and compete with others for the fastest completion time."}
            </p>
          </div>

          <div className="mb-24">
            <h3 className="text-3xl font-black text-gray-800 mb-12 text-center">Purpose of the Challenge</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Ignite Curiosity', desc: 'Create curiosity around the upcoming brand launch.', color: 'bg-soft-yellow' },
                { title: 'Drive Engagement', desc: 'Encourage participants to engage with the puzzle challenge.', color: 'bg-mint' },
                { title: 'Social Buzz', desc: 'Promote social sharing and friendly competition.', color: 'bg-sky-blue' },
                { title: 'Reward Talent', desc: 'Reward the fastest puzzle solvers with exciting prizes.', color: 'bg-lavender-blue' }
              ].map((p, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 soft-shadow hover:scale-105 transition-all group">
                  <div className={`w-12 h-12 rounded-2xl ${p.color} flex items-center justify-center mb-6 shadow-lg shadow-current/20`}>
                    <span className="text-xl">✨</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">{p.title}</h4>
                  <p className="text-gray-600 font-medium leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-24">
            <h3 className="text-3xl font-black text-gray-800 mb-12 text-center">How the Challenge Works</h3>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {[
                { step: 'Step 1', title: 'Register', desc: 'Participants enter their basic details such as name, email, and phone number to join the challenge.', icon: '📝' },
                { step: 'Step 2', title: 'Solve the Challenge', desc: 'Players must complete the puzzle or spin the wheel correctly within the rules of the campaign.', icon: '🧩' },
                { step: 'Step 3', title: 'Compete and Win', desc: 'The fastest participants or lucky winners will qualify for prizes and recognition on the leaderboard.', icon: '🏆' }
              ].map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className="text-5xl mb-6 scale-110 hover:scale-125 transition-transform cursor-default">{step.icon}</div>
                  <span className="text-mint font-black uppercase tracking-widest text-sm mb-2">{step.step}</span>
                  <h4 className="text-2xl font-black text-gray-800 mb-4">{step.title}</h4>
                  <p className="text-gray-600 font-medium leading-relaxed">{step.desc}</p>
                  {i < 2 && (
                    <div className="hidden lg:block absolute top-10 -right-8 text-gray-200 text-4xl">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-mint/10 to-sky-blue/10 rounded-[50px] p-12 md:p-20 text-center relative overflow-hidden border border-white soft-shadow mb-16">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mint via-sky-blue to-lavender-blue" />
            <span className="text-sky-blue font-black uppercase tracking-[0.3em] text-sm mb-6 block">The Secret Reveal</span>
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">
              Once the challenge ends, the mystery <br /> behind the hidden puzzle will be revealed.
            </h3>
            <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Witness the official launch of our new education brand. <br /> 
              <span className="text-gray-800 font-bold">Participants will be among the first to witness the big reveal.</span>
            </p>
          </div>

          <div className="text-center pt-8">
            <h4 className="text-2xl font-black text-gray-800 mb-6">Are you ready to test your skills?</h4>
            <div className="flex flex-wrap justify-center gap-4">
              {(puzzleEnabled || !company) && (
                <button onClick={() => onAuthClick("puzzle")} className="bg-mint text-white text-2xl px-16 py-6 rounded-full font-black hover:bg-mint/90 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-mint/30">
                  Start Puzzle
                </button>
              )}
              {wheelEnabled && (
                <button onClick={() => onAuthClick("wheel")} className="bg-sky-blue text-white text-2xl px-16 py-6 rounded-full font-black hover:bg-sky-blue/90 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-sky-blue/30">
                  Spin Wheel
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="rules" className="bg-white">
        <div className="bg-soft-yellow py-16 px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Challenge Rules</h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            Read the rules carefully before starting the {campaign?.title || "Challenge"}.
          </p>
        </div>

        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📝', title: 'Registration Required', desc: 'Participants must register using their name, email, and phone number before playing.' },
              { icon: '🔄', title: 'Attempts', desc: `Each participant is allowed ${campaign?.maxAttempts || 3} attempts per challenge.` },
              { icon: '⏱️', title: 'Time Limit', desc: `Each puzzle attempt has a maximum time limit of ${campaign?.timerSeconds / 60 || 3} minutes.` },
              { icon: '🧩', title: 'Objective', desc: 'Players must correctly complete the challenge objective to qualify.' },
              { icon: '🏆', title: 'Best Attempt Recorded', desc: 'Only the best completion time or result among attempts will be recorded.' },
              { icon: '📸', title: 'Verification', desc: 'The system automatically records results and captures completion screens for verification.' },
              { icon: '🛡️', title: 'Anti-Cheat Policy', desc: 'Multiple entries using the same email or suspicious activity may result in disqualification.' }
            ].map((rule, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-[30px] border border-gray-100 soft-shadow hover:-translate-y-2 transition-transform duration-300">
                <div className="text-4xl mb-4">{rule.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Rule {i+1} — {rule.title}</h3>
                <p className="text-gray-600 font-medium leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-sky-blue to-lavender-blue p-1 rounded-[40px] soft-shadow">
              <div className="bg-white rounded-[38px] p-10 md:p-16">
                <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">How Winners Are Selected</h2>
                <div className="grid md:grid-cols-3 gap-8 mb-10">
                  {[
                    { label: 'Successfully Completed', icon: '✅' },
                    { label: 'Fastest Time / Result', icon: '⚡' },
                    { label: 'Fewest Attempts', icon: '📉' }
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 p-6 rounded-3xl text-center border border-gray-100">
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="font-bold text-gray-700">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-mint/10 p-6 rounded-2xl border-2 border-mint/20 text-center">
                  <span className="font-black text-mint uppercase tracking-wider">Tie-breaker:</span>
                  <span className="ml-2 font-bold text-gray-700">Earliest completion timestamp.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-20 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Fair Play Guidelines</h2>
            <ul className="space-y-4 text-left max-w-xl mx-auto mb-12">
              {[
                'Use only one account per person',
                'Do not use automated tools or scripts',
                'Do not manipulate the timer or game interface'
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 soft-shadow">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-soft-yellow flex items-center justify-center font-bold">!</span>
                  <span className="font-semibold text-gray-700">{text}</span>
                </li>
              ))}
            </ul>
            <p className="text-accent font-bold animate-pulse">Violations may result in removal from the final rewards list.</p>
          </div>
        </div>
      </section>

      <section id="leaderboard" className="py-24 px-6 border-t border-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Campaign Rewards</h2>
            <p className="text-xl text-gray-600 font-medium">Top participants will receive these exciting prizes!</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {prizes.length > 0 ? (
              prizes.map((p, i) => (
                <div key={i} className="p-1 bg-gradient-to-br from-mint/20 to-sky-blue/20 rounded-[40px] soft-shadow overflow-hidden group">
                  <div className="bg-white h-full w-full rounded-[38px] p-10 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black mb-2">{i === 0 ? '🥇 1st Place' : i === 1 ? '🥈 2nd Place' : '🥉 3rd Place'}</span>
                    <div className="h-1 w-12 bg-mint mb-6 group-hover:w-24 transition-all" />
                    {p.image && <img src={p.image} alt={p.name} className="w-24 h-24 object-contain mb-4" />}
                    <span className="text-2xl font-black text-gray-800">{p.name}</span>
                  </div>
                </div>
              ))
            ) : (
              [
                { rank: '🥇 1st Place', prize: 'Premium Prize', gradient: 'from-soft-yellow to-yellow-500' },
                { rank: '🥈 2nd Place', prize: 'Gift Voucher', gradient: 'from-gray-100 to-gray-300' },
                { rank: '🥉 3rd Place', prize: 'Mystery Gift', gradient: 'from-orange-100 to-orange-300' }
              ].map((p, i) => (
                <div key={i} className={`p-1 bg-gradient-to-br ${p.gradient} rounded-[40px] soft-shadow overflow-hidden group`}>
                  <div className="bg-white h-full w-full rounded-[38px] p-10 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black mb-2">{p.rank}</span>
                    <div className="h-1 w-12 bg-mint mb-6 group-hover:w-24 transition-all" />
                    <span className="text-3xl font-black text-gray-800">{p.prize}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default CompanyLandingView;
