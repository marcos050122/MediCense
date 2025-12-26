import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, MapPin, Clock, FileText, ChevronDown, ChevronUp, Loader2, Check, X } from 'lucide-react';
import { storageService } from '../services/storage';
import { FieldDefinition, Report } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { es } from 'date-fns/locale';
import Skeleton from '../components/Skeleton';
import { useSave } from '../components/SaveContext';

const NewReport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [location, setLocation] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');
  const [showAllFields, setShowAllFields] = useState(true);
  const [existingTimestamp, setExistingTimestamp] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setSaveTrigger, setIsSaving: setGlobalIsSaving } = useSave();

  useEffect(() => {
    setSaveTrigger(() => handleSave);
    return () => setSaveTrigger(null);
  }, [location, formData, notes, existingTimestamp]);

  useEffect(() => {
    setGlobalIsSaving(isSaving);
  }, [isSaving]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [id, user]);

  const loadInitialData = async () => {
    if (!user) return;
    setIsLoading(true);
    const loadedFields = (await storageService.getFields(user.id))
      .filter(f => f.isActive)
      .sort((a, b) => a.order - b.order);
    setFields(loadedFields);

    if (id) {
      const existingReport = await storageService.getReportById(id);
      if (existingReport) {
        setLocation(existingReport.location);
        setFormData(existingReport.data);
        setNotes(existingReport.notes || '');
        setExistingTimestamp(existingReport.timestamp);
      }
    } else {
      // Initialize form data
      const initialData: any = {};
      loadedFields.forEach(f => {
        if (f.type === 'number') initialData[f.id] = '';
        else if (f.type === 'boolean') initialData[f.id] = null;
        else initialData[f.id] = '';
      });
      setFormData(initialData);
    }
    setIsLoading(false);
  };

  const handleInputChange = (id: string, value: any, type: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: type === 'number'
        ? (value === '' ? '' : Number(value))
        : type === 'boolean'
          ? value
          : value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!location.trim()) {
      alert('Por favor ingrese la ubicación o referencia.');
      return;
    }

    setIsSaving(true);
    try {
      const reportData = {
        location,
        timestamp: id && existingTimestamp ? existingTimestamp : new Date().toISOString(),
        notes,
        data: formData,
      };

      if (id) {
        await storageService.updateReport({ ...reportData, id, userId: user.id });
      } else {
        await storageService.saveReport(reportData, user.id);
      }
      navigate('/');
    } catch (error) {
      console.error("Save error:", error);
      alert("Error al guardar el reporte.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-4 w-40" />
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
      <div>
        <h2 className="text-3xl font-black text-slate-900 mb-1">{id ? 'Editar Reporte' : 'Nuevo Reporte'}</h2>
        <p className="text-slate-500 font-medium">{id ? 'Modifique los datos del reporte existente.' : 'Complete la información del censo.'}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-300/40 border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Ubicación o Referencia
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-medical-500 group-focus-within:scale-110 transition-transform">
              <MapPin size={22} />
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Edificio 30, Apartamento 4B"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-300 bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-100 outline-none transition-all text-slate-800 font-bold text-lg placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-slate-400">
            <div className="bg-slate-200/50 p-1.5 rounded-lg">
              <Clock size={14} />
            </div>
            <span>{format(new Date(), 'eeee, dd MMMM HH:mm', { locale: es })}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-medical-500 rounded-full"></div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Datos del Censo</h3>
            </div>
            <button
              onClick={() => setShowAllFields(!showAllFields)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-xl transition-all"
            >
              {showAllFields ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {showAllFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-4 duration-300">
              {fields.map((field) => (
                <div key={field.id} className="relative group">
                  <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-tight">
                    {field.label}
                  </label>

                  {field.type === 'boolean' ? (
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                      <button
                        onClick={() => handleInputChange(field.id, true, field.type)}
                        className={`flex-1 py-3 px-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${formData[field.id] === true
                          ? 'bg-medical-600 text-white shadow-lg shadow-medical-500/30 active:scale-95'
                          : 'bg-white text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        <Check size={18} />
                        <span>Si</span>
                      </button>
                      <button
                        onClick={() => handleInputChange(field.id, false, field.type)}
                        className={`flex-1 py-3 px-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${formData[field.id] === false
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95'
                          : 'bg-white text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        <X size={18} />
                        <span>No</span>
                      </button>
                    </div>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      inputMode={field.type === 'number' ? 'numeric' : 'text'}
                      value={formData[field.id]}
                      onChange={(e) => handleInputChange(field.id, e.target.value, field.type)}
                      className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 bg-white focus:bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-50 focus:shadow-lg focus:shadow-medical-500/5 outline-none transition-all text-xl font-black text-slate-800 placeholder:text-slate-300 shadow-sm"
                      placeholder={field.type === 'number' ? '0' : '...'}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-tight flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-md">
                <FileText size={14} />
              </div>
              Notas y Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white focus:bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-50 outline-none min-h-[120px] text-slate-700 font-medium transition-all shadow-sm"
              placeholder="Escribe aquí cualquier detalle adicional relevante..."
            ></textarea>
          </div>
        </div>
      </div>

      {/* Remove individual Save button as it's now in Layout's FAB */}
    </div>
  );
};

export default NewReport;
