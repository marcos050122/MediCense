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
      window.scrollTo(0, 0);
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

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.')) {
      try {
        const success = await storageService.deleteReport(id);
        if (success) {
          setReports(prev => prev.filter(r => r.id !== id));
        } else {
          alert('Error al intentar eliminar el registro.');
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert('Error al intentar eliminar el registro.');
      }
    }
  };

  if (loading && reports.length === 0) return (
    <div className="flex flex-col max-w-2xl mx-auto min-h-screen">
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm pt-2 pb-1 px-4 space-y-2 border-b border-slate-200/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-white/50 px-3 py-1.5 rounded-xl border border-slate-200/60 grow">
            <Skeleton className="h-6 w-12" />
            <div className="w-px h-5 bg-slate-200"></div>
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>

      <div className="px-4 pb-24 space-y-3 mt-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <Skeleton variant="circle" className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 py-2 border-y border-slate-50">
              <Skeleton className="h-5 w-14 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const totalPopulation = reports.reduce((acc, curr) => {
    const popField = fields.find(f =>
      f.id === 'a1b2c3d4-e5f6-4a5b-b6c7-d8e9f0a1b2c3' ||
      f.id === 'total_pop' ||
      f.label.toLowerCase().includes('población')
    );
    return acc + (Number(curr.data[popField?.id || '']) || 0);
  }, 0);

  const filteredReports = reports.filter(r =>
    r.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const latestActiveReportId = reports.length > 0
    ? reports.reduce((latest, current) => {
      const latestTime = new Date(latest.updatedAt || latest.timestamp).getTime();
      const currentTime = new Date(current.updatedAt || current.timestamp).getTime();
      return currentTime > latestTime ? current : latest;
    }, reports[0]).id
    : null;

  return (
    <div className="flex flex-col max-w-2xl mx-auto">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm pt-2 pb-1 px-4 space-y-2 border-b border-slate-200/50">
        {/* Statistics and Filter Indicator in one row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-white/50 px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-sm grow">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Reportes</span>
              <span className="text-sm font-black text-medical-600 leading-none mt-0.5">{reports.length}</span>
            </div>
            <div className="w-px h-5 bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Población</span>
              <span className="text-sm font-black text-accent-600 leading-none mt-0.5">{totalPopulation}</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <span className="text-[7px] font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
              {searchTerm ? 'Filtrado' : 'Recientes'}
            </span>
          </div>
        </div>

        {/* Ultra-compact Search Bar */}
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-500 transition-colors">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar ubicación..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 bg-white focus:border-medical-500 focus:ring-2 focus:ring-medical-100 outline-none transition-all text-xs font-bold placeholder:text-slate-400 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="px-4 pb-24 space-y-3 mt-2">
        {reports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8">
            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-500 font-bold text-lg">No hay registros</p>
            <p className="text-slate-400 text-sm mt-1">Tus reportes aparecerán aquí.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 p-8">
            <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Search className="text-slate-300" size={24} />
            </div>
            <p className="text-slate-500 font-bold">No se encontraron resultados</p>
            <p className="text-slate-400 text-xs mt-1">Intenta con otros términos de búsqueda.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => navigate(`/edit/${report.id}`)}
              className="group bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 hover:border-medical-300 hover:shadow-md transition-all active:scale-[0.99] flex flex-col gap-2.5 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="bg-medical-50 text-medical-600 p-2 rounded-lg">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 leading-none text-sm">{report.location}</h3>
                      {report.id === latestActiveReportId && (
                        <span className="bg-blue-50 text-blue-600 text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter border border-blue-100">
                          Reciente
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">
                      {format(new Date(report.timestamp), 'dd MMM, HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(report.id);
                  }}
                  className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2 border-y border-slate-50">
                {fields
                  .filter(f => {
                    const val = report.data[f.id];
                    if (!f.isActive) return false;
                    if (f.type === 'boolean') return val !== undefined && val !== null;
                    return val !== undefined && val !== '' && val !== 0;
                  })
                  .slice(0, 4)
                  .map(field => {
                    const rawValue = report.data[field.id];
                    let displayValue = rawValue;

                    if (field.type === 'boolean') {
                      displayValue = rawValue === true ? 'Si' : 'No';
                    }

                    return (
                      <div key={field.id} className="flex items-center gap-1.5 bg-slate-50/50 px-2 py-0.5 rounded-md border border-slate-100/50">
                        <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                          {field.label.length > 12 ? field.label.substring(0, 10) + '..' : field.label}
                        </span>
                        <span className={`text-xs font-black ${field.type === 'boolean' ? (rawValue ? 'text-medical-600' : 'text-red-500') : 'text-slate-800'}`}>
                          {displayValue}
                        </span>
                      </div>
                    );
                  })}
                {fields.filter(f => {
                  const val = report.data[f.id];
                  if (!f.isActive) return false;
                  if (f.type === 'boolean') return val !== undefined && val !== null;
                  return val !== undefined && val !== '' && val !== 0;
                }).length === 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Sin datos</span>
                    </div>
                  )}
              </div>

              {report.notes && (
                <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed line-clamp-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-2">Notas:</span>
                    {report.notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
