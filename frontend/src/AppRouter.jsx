import React, { useState } from 'react';
import LandingPage from './LandingPage.jsx';
import LoginPage   from './LoginPage.jsx';
import App         from './App.jsx';

export default function AppRouter() {
  const [page, setPage] = useState('landing');

  if (page === 'dashboard') return <App />;
  if (page === 'login')     return (
    <LoginPage
      onLogin={() => setPage('dashboard')}
      onBack={()  => setPage('landing')}
    />
  );
  return <LandingPage onGetStarted={() => setPage('login')} />;
}
