import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewReport from './pages/NewReport';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './hooks/useAuth';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  // Check if we have a reason to expect a user (saved token)
  const hasToken = !!localStorage.getItem('medicense-auth-token');

  React.useEffect(() => {
    if (!loading) {
      const loader = document.getElementById('initial-loader');
      if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }
    }
  }, [loading]);

  // Only show the blocking loader if we are actually loading AND we expect to find a session
  // or if we are in the very first milliseconds of boot.
  if (loading && hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-700">
          <div className="relative">
            <img src="/logo.png" alt="Logo" className="w-24 h-auto opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-medical-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px] animate-pulse">
            Sincronizando Acceso...
          </p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewReport />} />
        <Route path="/edit/:id" element={<NewReport />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

import { SaveProvider } from './components/SaveContext';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <SaveProvider>
          <AppRoutes />
        </SaveProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
