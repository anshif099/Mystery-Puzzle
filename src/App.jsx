import React, { useState } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LandingView from './components/landing/LandingView';
import AuthView from './components/auth/AuthView';

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
