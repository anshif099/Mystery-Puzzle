import React, { useState, useEffect } from 'react';

const LandingView = ({ onAuthClick }) => {
  const [participants, setParticipants] = useState(4326);
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 5, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const counter = setInterval(() => {
      setParticipants(prev => prev + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(counter);
  }, []);

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
          <img src="/icons.png" alt="App Logo" className="relative w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-2xl" />
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          Can You Solve the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint via-sky-blue to-lavender-blue">
            Mystery Puzzle?
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl">
          Join thousands attempting the challenge before the brand reveal.
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

        <button onClick={onAuthClick} className="bg-mint text-white text-xl px-12 py-4 rounded-full font-black hover:bg-mint/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-mint/30 group">
          Start the Challenge
          <span className="inline-block ml-3 transition-transform group-hover:translate-x-2">→</span>
        </button>
      </section>

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
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">About the Mystery Puzzle Challenge</h2>
            <div className="h-2 w-32 bg-mint mx-auto rounded-full mb-8" />
            <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-4xl mx-auto leading-relaxed">
              The Mystery Puzzle Challenge is an interactive online puzzle game created to build excitement before the official launch of our new education brand. Participants are invited to solve a hidden logo puzzle within a limited time and compete with others for the fastest completion time. This challenge combines fun, curiosity, and competition while giving players an exclusive first look at our upcoming brand reveal.
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
                { step: 'Step 2', title: 'Solve the Puzzle', desc: 'Players must reassemble the hidden brand logo by dragging and placing puzzle pieces correctly within the time limit.', icon: '🧩' },
                { step: 'Step 3', title: 'Compete and Win', desc: 'The fastest participants with the best completion times will qualify for prizes and recognition on the leaderboard.', icon: '🏆' }
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
            <h4 className="text-2xl font-black text-gray-800 mb-6">Are you ready to test your puzzle-solving skills?</h4>
            <button onClick={onAuthClick} className="bg-mint text-white text-2xl px-16 py-6 rounded-full font-black hover:bg-mint/90 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-mint/30">
              Start the Challenge
            </button>
          </div>
        </div>
      </section>

      <section id="rules" className="bg-white">
        <div className="bg-soft-yellow py-16 px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Challenge Rules</h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            Read the rules carefully before starting the Mystery Puzzle Challenge.
          </p>
        </div>

        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📝', title: 'Registration Required', desc: 'Participants must register using their name, email, and phone number before playing.' },
              { icon: '🔄', title: 'Puzzle Attempts', desc: 'Each participant is allowed 3 attempts to solve the puzzle.' },
              { icon: '⏱️', title: 'Time Limit', desc: 'Each attempt has a maximum time limit of 3 minutes.' },
              { icon: '🧩', title: 'Puzzle Objective', desc: 'Players must correctly assemble the hidden brand logo puzzle.' },
              { icon: '🏆', title: 'Best Attempt Recorded', desc: 'Only the best completion time among attempts will be recorded.' },
              { icon: '📸', title: 'Automatic Screenshot', desc: 'Once solved, the system will automatically capture a screenshot of the completed puzzle.' },
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
                    { label: 'Successfully Solved', icon: '✅' },
                    { label: 'Fastest Time', icon: '⚡' },
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
                'Use only one account',
                'Not use automated tools or scripts',
                'Not manipulate the timer or game interface'
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 soft-shadow">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-soft-yellow flex items-center justify-center font-bold">!</span>
                  <span className="font-semibold text-gray-700">{text}</span>
                </li>
              ))}
            </ul>
            <p className="text-accent font-bold animate-pulse">Violations may result in removal from the leaderboard.</p>
          </div>
        </div>
      </section>

      <section id="leaderboard" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Mystery Rewards</h2>
            <p className="text-xl text-gray-600 font-medium">To be revealed at the finish line</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
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
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default LandingView;
