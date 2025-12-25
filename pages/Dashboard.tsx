import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, MapPin, Calendar, Users, Activity, Edit, Trash2, Database, FileText, Search, X } from 'lucide-react';
import { storageService } from '../services/storage';
import { exportToExcel, exportToPDF } from '../services/exportService';
import { Report, FieldDefinition } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import Skeleton from '../components/Skeleton';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const navigate = useNavigate();
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [localDataCount, setLocalDataCount] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
      checkLocalData();
    }
  }, [user]);

  const checkLocalData = () => {
    const local = storageService.getLocalReports();
    setLocalDataCount(local.length);
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const loadedReports = await storageService.getReports(user.id);
    const loadedFields = await storageService.getFields(user.id);
    setReports(loadedReports);
    setFields(loadedFields);
    setLoading(false);
  };

  const handleMigrate = async () => {
    if (!user) return;
    setIsMigrating(true);
    try {
      const result = await storageService.migrateToSupabase(user.id);
      alert(`Migración completada: ${result.reports} reportes y ${result.fields} campos migrados.`);
      setLocalDataCount(0);
      loadData();
    } catch (error) {
      console.error("Migration error:", error);
      alert("Error durante la migración.");
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading && reports.length === 0) return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xl shadow-slate-300/20">
        <div className="flex gap-4 sm:gap-6 w-full justify-around sm:justify-start">
          <Skeleton className="h-10 w-24" />
          <div className="w-px h-8 sm:h-10 bg-slate-100"></div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
            </div>
            <div className="flex gap-6 py-2 border-y border-slate-50">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
      {/* Migration Banner */}
      {localDataCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-xl">
              <Database size={20} />
            </div>
            <div>
              <p className="text-amber-800 font-bold text-sm">Datos locales detectados</p>
              <p className="text-amber-600 text-xs">Tienes {localDataCount} reportes en este navegador.</p>
            </div>
          </div>
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isMigrating ? 'Migrando...' : 'Migrar Ahora'}
          </button>
        </div>
      )}

      {/* Compact Header Section */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xl shadow-slate-300/20">
        <div className="flex gap-4 sm:gap-6 w-full justify-around sm:justify-start">
          <div className="flex flex-col">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1">Reportes</p>
            <p className="text-xl sm:text-2xl font-black text-medical-600">{reports.length}</p>
          </div>
          <div className="w-px h-8 sm:h-10 bg-slate-100 flex-shrink-0 self-center"></div>
          <div className="flex flex-col">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1">Población</p>
            <p className="text-xl sm:text-2xl font-black text-accent-600">
              {reports.reduce((acc, curr) => acc + (Number(curr.data['total_pop']) || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Search and List Header */}
      <div className="flex flex-col space-y-4 mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Registros</h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
            {searchTerm ? 'Resultados' : 'Recientes'}
          </span>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-500 transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ubicación o referencia..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 border-slate-200 bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-100 outline-none transition-all text-slate-700 font-bold placeholder:text-slate-400 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8">
          <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-500 font-bold text-lg">No hay registros</p>
          <p className="text-slate-400 text-sm mt-1">Tus reportes aparecerán aquí.</p>
        </div>
      ) : reports.filter(r => r.location.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
        <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 p-8">
          <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Search className="text-slate-300" size={24} />
          </div>
          <p className="text-slate-500 font-bold">No se encontraron resultados</p>
          <p className="text-slate-400 text-xs mt-1">Intenta con otros términos de búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports
            .filter(r => r.location.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((report) => (
              <div
                key={report.id}
                onClick={() => navigate(`/edit/${report.id}`)}
                className="group bg-white p-4 rounded-3xl shadow-md border border-slate-200 hover:border-medical-300 hover:shadow-xl hover:shadow-slate-300/40 transition-all active:scale-[0.99] flex flex-col gap-3 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-medical-50 text-medical-600 p-2 rounded-xl">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-none text-base">{report.location}</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                        {format(new Date(report.timestamp), 'dd MMM, HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-300 group-hover:text-medical-500 transition-colors">
                    <Edit size={16} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2 border-y border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Viviendas</span>
                    <span className="text-sm font-black text-slate-800">{report.data['total_houses'] ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Población</span>
                    <span className="text-sm font-black text-medical-600">{report.data['total_pop'] ?? '-'}</span>
                  </div>
                </div>

                {report.notes && (
                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Notas:</span>
                      {report.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
