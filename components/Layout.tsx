import React from 'react';
import { Home, PlusCircle, Settings, LogOut, FileText, Download, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { exportToExcel, exportToPDF } from '../services/exportService';
import { storageService } from '../services/storage';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (!user) return;
    setIsExporting(true);
    setIsMenuOpen(false);
    try {
      const reports = await storageService.getReports(user.id);
      const fields = await storageService.getFields(user.id);
      if (type === 'pdf') exportToPDF(reports, fields);
      else exportToExcel(reports, fields);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => navigate(to)}
        className={`flex flex-col items-center justify-center w-full py-3 space-y-1 ${isActive ? 'text-medical-600' : 'text-slate-400 hover:text-slate-600'
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
        <div className="flex items-center">
          <img src="/logo.png" alt="MediCenso Logo" className="h-12 w-auto" />
        </div>

        <div className="relative">
          {user && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 hover:bg-slate-50 p-1.5 rounded-2xl transition-all border border-transparent hover:border-slate-100"
            >
              <img
                src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
                alt="Profile"
                className="w-8 h-8 rounded-xl border-2 border-slate-100 shadow-sm"
              />
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          )}

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsMenuOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 py-2 z-30 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Conectado como</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Download size={18} className="text-red-500" />
                    <span className="font-bold">Exportar PDF</span>
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={isExporting}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <FileSpreadsheet size={18} className="text-green-600" />
                    <span className="font-bold">Exportar Excel</span>
                  </button>
                </div>

                <div className="border-t border-slate-50 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors group"
                  >
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                    <span className="font-black uppercase tracking-tighter">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
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
