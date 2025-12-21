import React from 'react';
import { Home, PlusCircle, Settings, LogOut, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => navigate(to)}
        className={`flex flex-col items-center justify-center w-full py-3 space-y-1 ${
          isActive ? 'text-medical-600' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-medical-600 text-white p-1.5 rounded-lg">
            <FileText size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">MediCenso</h1>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-end pb-safe safe-area shadow-lg z-20">
        <NavItem to="/" icon={Home} label="Inicio" />
        <div className="relative -top-5">
           <button 
             onClick={() => navigate('/new')}
             className="bg-medical-600 hover:bg-medical-700 text-white p-4 rounded-full shadow-lg shadow-medical-500/30 transition-transform active:scale-95 flex items-center justify-center"
           >
             <PlusCircle size={32} />
           </button>
        </div>
        <NavItem to="/settings" icon={Settings} label="Config" />
      </nav>
    </div>
  );
};

export default Layout;
