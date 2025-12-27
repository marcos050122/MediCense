import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, MapPin, Calendar, Users, Activity, Edit, Trash2, Database, FileText, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { storageService } from '../services/storage';
import { exportToExcel, exportToPDF } from '../services/exportService';
import { Report, FieldDefinition } from '../types';
import { format, addDays, subDays, parseISO } from 'date-fns';
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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const dateInputRef = useRef<HTMLInputElement>(null);

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
    if (window.confirm('¿Está seguro de que desea eliminar este reporte? Esta acción no se puede deshacer.')) {
      try {
        const success = await storageService.deleteReport(id);
        if (success) {
          setReports(prev => prev.filter(r => r.id !== id));
        } else {
          alert('Error al intentar eliminar el reporte.');
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert('Error al intentar eliminar el reporte.');
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

  const reportsForDate = reports.filter(r =>
    format(new Date(r.timestamp), 'yyyy-MM-dd') === selectedDate
  );

  const filteredReports = searchTerm
    ? reports.filter(r => r.location.toLowerCase().includes(searchTerm.toLowerCase()))
    : reportsForDate.filter(r => r.location.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPopulation = filteredReports.reduce((acc, curr) => {
    const popField = fields.find(f =>
      f.id === 'a1b2c3d4-e5f6-4a5b-b6c7-d8e9f0a1b2c3' ||
      f.id === 'total_pop' ||
      f.label.toLowerCase().includes('población')
    );
    return acc + (Number(curr.data[popField?.id || '']) || 0);
  }, 0);

  const latestActiveReportId = reports.length > 0
    ? reports.reduce((latest, current) => {
      const latestTime = new Date(latest.updatedAt || latest.timestamp).getTime();
      const currentTime = new Date(current.updatedAt || current.timestamp).getTime();
      return currentTime > latestTime ? current : latest;
    }, reports[0]).id
    : null;

  return (
    <div className="flex flex-col max-w-2xl mx-auto p-4 space-y-3">
      {/* Sticky Quick Actions & Stats */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md py-4 -mx-4 px-4 space-y-3 border-b border-slate-200/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm">
            <div className="flex flex-col px-2">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Reportes</span>
              <span className="text-base font-black text-medical-600 leading-none mt-1">{filteredReports.length}</span>
            </div>
            <div className="w-px h-6 bg-slate-100"></div>
            <div className="flex flex-col px-2">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Población</span>
              <span className="text-base font-black text-accent-600 leading-none mt-1">{totalPopulation}</span>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-white rounded-2xl p-1 border border-slate-200 shadow-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentDate = parseISO(selectedDate);
                const prevDate = subDays(currentDate, 1);
                setSelectedDate(format(prevDate, 'yyyy-MM-dd'));
              }}
              className="p-2 hover:bg-slate-50 text-slate-400 hover:text-medical-600 transition-colors rounded-xl"
            >
              <ChevronLeft size={18} />
            </button>

            <div
              className="relative cursor-pointer"
              onClick={() => dateInputRef.current?.showPicker()}
            >
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none"
              />
              <div className="flex flex-col px-1 items-center min-w-[100px] hover:bg-slate-50 rounded-xl transition-colors py-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Fecha</span>
                <span className="text-sm font-black text-slate-700 leading-none mt-1">
                  {selectedDate === format(new Date(), 'yyyy-MM-dd')
                    ? 'Hoy'
                    : format(new Date(selectedDate + 'T12:00:00'), 'dd MMM', { locale: es })}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentDate = parseISO(selectedDate);
                const nextDate = addDays(currentDate, 1);
                setSelectedDate(format(nextDate, 'yyyy-MM-dd'));
              }}
              className="p-2 hover:bg-slate-50 text-slate-400 hover:text-medical-600 transition-colors rounded-xl"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Ultra-compact Search Bar */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-500 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar ubicación o referencia..."
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border-2 border-slate-200 bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-50 outline-none transition-all text-sm font-bold placeholder:text-slate-400 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-100 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="pb-24 space-y-4">
        {reportsForDate.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 p-8 shadow-sm">
            <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Activity className="text-slate-300" size={40} />
            </div>
            <h3 className="text-slate-900 font-black text-xl">Sin reportes</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-[240px] mx-auto leading-relaxed">Comienza creando tu primer reporte usando el botón inferior.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 p-8 shadow-sm">
            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-300" size={32} />
            </div>
            <h3 className="text-slate-900 font-black">Sin resultados</h3>
            <p className="text-slate-400 text-xs mt-1">No encontramos nada para "{searchTerm}"</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => navigate(`/edit/${report.id}`)}
              className="group bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200 hover:border-medical-300 hover:shadow-2xl hover:shadow-medical-500/10 transition-all active:scale-[0.98] flex flex-col gap-4 cursor-pointer relative overflow-hidden"
            >
              {report.id === latestActiveReportId && (
                <div className="absolute top-0 right-0">
                  <div className="bg-medical-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg">
                    Reciente
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="bg-medical-50 text-medical-600 p-3 rounded-2xl shadow-inner">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-none text-lg tracking-tight">{report.location}</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                      <Calendar size={12} />
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        {format(new Date(report.timestamp), 'dd MMMM, HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(report.id);
                  }}
                  className="bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 p-3 rounded-2xl transition-all active:scale-90"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-4 border-y border-slate-50">
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
                      <div key={field.id} className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                          {field.label.length > 15 ? field.label.substring(0, 12) + '..' : field.label}
                        </span>
                        <span className={`text-sm font-black ${field.type === 'boolean' ? (rawValue ? 'text-medical-600' : 'text-red-500') : 'text-slate-800'}`}>
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
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Sin datos registrados</span>
                    </div>
                  )}
              </div>

              {report.notes && (
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Observaciones:</span>
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
