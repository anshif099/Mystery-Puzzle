import React, { useState } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LandingView from './components/landing/LandingView';
import AuthView from './components/auth/AuthView';
import AdminDashboard from './components/admin/AdminDashboard';

function App() {
  const [view, setView] = useState('landing');

  return (
    <div className="min-h-screen font-sans selection:bg-mint/30 overflow-x-hidden">
      {view !== 'admin' && (
        <Header onAuthClick={() => setView('auth')} setView={setView} />
      )}
      
      <main className="transition-opacity duration-300">
        {view === 'landing' ? (
          <LandingView onAuthClick={() => setView('auth')} />
        ) : view === 'auth' ? (
          <AuthView setView={setView} />
        ) : (
          <AdminDashboard onLogout={() => setView('landing')} />
        )}
      </main>

      {view !== 'admin' && <Footer />}
    </div>
  );
}

export default App;
