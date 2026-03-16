import React, { useState } from 'react';

const AuthView = ({ setView }) => {
  const [formData, setFormData] = useState({
    email: '', password: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email address';
    if (formData.password.length < 6) newErrors.password = 'Password too short';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e, setView) => {
    e.preventDefault();
    if (validate()) {
      // Super Admin Check
      if (formData.email === 'mystery@gmail.com' && formData.password === 'mystery@123') {
        alert('Logging in as Super Admin...');
        setView('admin');
        return;
      }

      // Role detection simulation
      if (formData.email.startsWith('admin')) {
        alert('Redirecting to Admin Dashboard...');
      } else if (formData.email.startsWith('company')) {
        alert('Redirecting to Company Dashboard...');
      } else {
        alert('Redirecting to Puzzle Game Dashboard...');
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
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-12">
            <h3 className="text-4xl font-black text-gray-900 mb-4">Welcome Back!</h3>
            <p className="text-gray-500 font-medium">Login to your account to continue the challenge.</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, setView)} className="space-y-6">
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

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block text-sm font-bold text-gray-700">Password</label>
                <a href="#" className="text-xs font-bold text-sky-blue hover:text-mint transition-colors">Forgot Password?</a>
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all outline-none font-medium"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              {errors.password && <span className="text-accent text-xs font-bold px-1">{errors.password}</span>}
            </div>

            <button type="submit" className="w-full bg-mint text-white py-4 rounded-2xl font-black text-xl hover:bg-mint/90 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-mint/20 mt-4">
              Login
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

export default AuthView;
