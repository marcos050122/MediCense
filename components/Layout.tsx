import React from 'react';
import { Home, PlusCircle, Settings, LogOut, FileText, Download, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { exportToExcel, exportToPDF } from '../services/exportService';
import { storageService } from '../services/storage';
import { useState } from 'react';
import SyncIndicator from './SyncIndicator';
import { useSave } from './SaveContext';
import { Save, Loader2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { saveTrigger, isSaving } = useSave();

  const isFormPage = location.pathname.startsWith('/new') || location.pathname.startsWith('/edit');

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
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm z-30">
        <div
          onClick={() => navigate('/')}
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-200"
        >
          <img src="/logo.png" alt="MediCenso Logo" className="h-12 w-auto" />
        </div>

        <div className="flex items-center gap-3">
          {user && <SyncIndicator />}

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
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 py-3 z-30 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
                  <div className="px-6 py-4 flex flex-col items-center text-center border-b border-slate-50 mb-2">
                    <img
                      src={user?.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`}
                      alt="Profile"
                      className="w-20 h-20 rounded-[1.5rem] border-4 border-slate-50 shadow-md mb-3"
                    />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cuenta Conectada</p>
                    <p className="text-slate-900 font-black text-lg leading-tight truncate w-full">{user?.user_metadata.full_name || 'Usuario'}</p>
                    <p className="text-slate-400 text-xs font-medium truncate w-full">{user?.email}</p>
                  </div>

                  <div className="px-2 space-y-1">
                    <p className="px-4 py-1 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Acciones</p>
                    <button
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-2xl transition-all active:scale-[0.98]"
                    >
                      <div className="bg-red-50 p-2 rounded-xl text-red-500">
                        <Download size={18} />
                      </div>
                      <span className="font-bold">Exportar PDF</span>
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      disabled={isExporting}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-2xl transition-all active:scale-[0.98]"
                    >
                      <div className="bg-green-50 p-2 rounded-xl text-green-600">
                        <FileSpreadsheet size={18} />
                      </div>
                      <span className="font-bold">Exportar Excel</span>
                    </button>
                  </div>

                  <div className="mt-4 px-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-4 text-sm text-red-500 hover:bg-red-50 rounded-2xl transition-all group active:scale-[0.98]"
                    >
                      <div className="bg-red-100/50 p-2 rounded-xl group-hover:bg-red-100 transition-colors">
                        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                      <span className="font-black uppercase tracking-tighter">Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-12 relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60 flex justify-around items-end pb-safe safe-area shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)] z-40">
        <NavItem to="/" icon={Home} label="Inicio" />
        <div className="relative -top-6">
          {isFormPage ? (
            <button
              onClick={() => saveTrigger?.()}
              disabled={isSaving || !saveTrigger}
              className="bg-accent-600 hover:bg-accent-700 text-white p-5 rounded-[2rem] shadow-2xl shadow-accent-600/40 transition-all active:scale-90 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-w-[72px] min-h-[72px]"
            >
              {isSaving ? (
                <Loader2 size={36} className="animate-spin" />
              ) : (
                <Save size={36} />
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate('/new')}
              className="bg-medical-600 hover:bg-medical-700 text-white p-5 rounded-[2rem] shadow-2xl shadow-medical-600/40 transition-all active:scale-90 flex items-center justify-center min-w-[72px] min-h-[72px]"
            >
              <PlusCircle size={36} />
            </button>
          )}
        </div>
        <NavItem to="/settings" icon={Settings} label="Config" />
      </nav>
    </div>
  );
};

export default Layout;
