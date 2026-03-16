import React, { useState, useEffect } from 'react';

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

const Footer = () => (
  <footer className="bg-lavender-blue text-white py-20 px-6">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <img src="/icons.png" alt="Logo" className="w-12 h-12" />
            <span className="text-2xl font-black">Mystery Puzzle</span>
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
        © 2026 Mystery Puzzle Challenge. All rights reserved.
      </div>
    </div>
  </footer>
);

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', phone: '', city: '', confirmPassword: '', agree: false
  });
  const [errors, setErrors] = useState({});
  const [role, setRole] = useState('user');

  const validate = () => {
    let newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email address';
    if (formData.password.length < 6) newErrors.password = 'Password too short';
    if (!isLogin) {
      if (!formData.fullName) newErrors.fullName = 'Full Name is required';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.agree) newErrors.agree = 'Must agree to T&C';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      if (isLogin) {
        // Role detection simulation
        if (formData.email.startsWith('admin')) {
          alert('Redirecting to Admin Dashboard...');
        } else if (formData.email.startsWith('company')) {
          alert('Redirecting to Company Dashboard...');
        } else {
          alert('Redirecting to Puzzle Game Dashboard...');
        }
      } else {
        const participationId = 'CHAL-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        alert(`Account Created! Your Participation ID: ${participationId}\nRedirecting to Puzzle Challenge page...`);
      }
    }
  };

  return (
    <section className="min-h-screen pt-24 pb-12 flex items-center justify-center px-6 pastel-gradient">
      <div className="max-w-6xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        {/* Left Side - Illustration */}
        <div className="w-full md:w-1/2 bg-sky-blue/10 p-12 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-10 left-10 floating-piece w-12 h-12 bg-mint rounded-lg rotate-12 opacity-50" />
          <div className="absolute bottom-20 right-10 floating-piece w-16 h-16 bg-lavender-blue rounded-xl -rotate-6 opacity-50" />
          
          <img src="/icons.png" alt="Logo" className="w-48 h-48 mb-8 drop-shadow-2xl relative z-10" />
          <h2 className="text-4xl font-black text-gray-900 text-center mb-4 relative z-10">Start Your Challenge</h2>
          <p className="text-xl text-gray-600 text-center relative z-10 font-medium">Join thousands already solving the mystery.</p>
          
          <div className="mt-12 w-full max-w-sm grid grid-cols-2 gap-4 relative z-10">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-square bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-white/50 flex items-center justify-center text-3xl">
                {i === 1 ? '🧩' : i === 2 ? '⏳' : i === 3 ? '🎉' : '🏆'}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Auth Card */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-12 self-start">
            <button 
              onClick={() => setIsLogin(true)}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-white shadow-md text-mint' : 'text-gray-500'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-white shadow-md text-mint' : 'text-gray-500'}`}
            >
              Register
            </button>
          </div>

          <h3 className="text-3xl font-black text-gray-900 mb-8">
            {isLogin ? 'Welcome Back!' : 'Join the Challenge'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all outline-none font-medium"
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
                {errors.fullName && <span className="text-accent text-xs font-bold px-1">{errors.fullName}</span>}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Email Address</label>
              <input 
                type="email" 
                placeholder="example@email.com"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all outline-none font-medium"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {errors.email && <span className="text-accent text-xs font-bold px-1">{errors.email}</span>}
            </div>

            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+1..."
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all outline-none font-medium"
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 px-1">City (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="New York"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all outline-none font-medium"
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block text-sm font-bold text-gray-700">Password</label>
                {isLogin && <a href="#" className="text-xs font-bold text-sky-blue hover:text-mint transition-colors">Forgot Password?</a>}
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all outline-none font-medium"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              {errors.password && <span className="text-accent text-xs font-bold px-1">{errors.password}</span>}
              {!isLogin && formData.password && (
                <div className="mt-2 flex gap-1 px-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${formData.password.length > i*3 ? 'bg-mint' : 'bg-gray-200'}`} />
                  ))}
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Confirm Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all outline-none font-medium"
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                {errors.confirmPassword && <span className="text-accent text-xs font-bold px-1">{errors.confirmPassword}</span>}
              </div>
            )}

            {!isLogin && (
              <label className="flex items-start gap-3 cursor-pointer group px-1">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-mint focus:ring-mint transition-all"
                  onChange={(e) => setFormData({...formData, agree: e.target.checked})}
                />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                  I agree to the <a href="#" className="underline text-sky-blue">Terms & Conditions</a>
                </span>
              </label>
            )}

            <button type="submit" className="w-full bg-mint text-white py-4 rounded-2xl font-black text-xl hover:bg-mint/90 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-mint/20 mt-4">
              {isLogin ? 'Login' : 'Create Account'}
            </button>

            <div className="text-center mt-8">
              <span className="text-gray-400 font-medium">🛡️ CAPTCHA Protected</span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

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
              The Mystery Puzzle Challenge is an interactive online puzzle game created to build excitement before the official launch of our new education brand...
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
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 soft-shadow hover:scale-105 transition-all">
                  <h4 className="text-xl font-bold text-gray-800 mb-3">{p.title}</h4>
                  <p className="text-gray-600 font-medium leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
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
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">Read the rules carefully before starting.</p>
        </div>
        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="bg-gray-50 p-8 rounded-[30px] border border-gray-100 soft-shadow">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Rule {i}</h3>
                <p className="text-gray-600 font-medium">Rule description placeholder...</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="leaderboard" className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">Mystery Rewards</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-[40px] p-10 soft-shadow border border-gray-100">
                <span className="text-3xl font-black text-gray-800">Prize Layer {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

function App() {
  const [view, setView] = useState('landing');

  return (
    <div className="min-h-screen font-sans selection:bg-mint/30 overflow-x-hidden">
      <Header onAuthClick={() => setView('auth')} setView={setView} />
      
      <main className="transition-opacity duration-300">
        {view === 'landing' ? (
          <LandingView onAuthClick={() => setView('auth')} />
        ) : (
          <AuthView />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
