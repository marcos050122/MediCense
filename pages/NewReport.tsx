import React, { useState, useEffect, useRef } from 'react';
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
  const locationInputRef = useRef<HTMLInputElement>(null);

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
      // Restore from draft if available
      const savedDraft = localStorage.getItem('medicense-report-draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setLocation(draft.location || '');
          setFormData(draft.formData || {});
          setNotes(draft.notes || '');
        } catch (e) {
          console.error("Error parsing draft:", e);
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
    }
    setIsLoading(false);

    // Auto-focus location input for new reports
    if (!id) {
      setTimeout(() => {
        locationInputRef.current?.focus();
      }, 100);
    }
  };

  // Persist draft to localStorage
  useEffect(() => {
    if (!id && !isLoading && user) {
      const draft = {
        location,
        formData,
        notes
      };
      localStorage.setItem('medicense-report-draft', JSON.stringify(draft));
    }
  }, [location, formData, notes, id, isLoading, user]);

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
        // Clear draft after successful save
        localStorage.removeItem('medicense-report-draft');
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
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-300/40 border border-slate-200 overflow-hidden">
        <div className="p-8 bg-slate-50/50 border-b border-slate-100 space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            Ubicación o Referencia
          </label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-medical-500 group-focus-within:scale-110 transition-transform">
              <MapPin size={24} />
            </div>
            <input
              ref={locationInputRef}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Edificio 30, Apartamento 4B"
              className="w-full pl-14 pr-6 py-5 rounded-3xl border-2 border-slate-200 bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-100 outline-none transition-all text-slate-900 font-black text-xl placeholder:text-slate-300 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            <div className="bg-slate-200/60 p-1.5 rounded-lg">
              <Clock size={14} />
            </div>
            <span>{format(new Date(), 'eeee, dd MMMM HH:mm', { locale: es })}</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-medical-500 rounded-full shadow-lg shadow-medical-500/20"></div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Datos del Censo</h3>
            </div>
            <button
              onClick={() => setShowAllFields(!showAllFields)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-3 rounded-[1.25rem] transition-all active:scale-90"
            >
              {showAllFields ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
          </div>

          {showAllFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-400">
              {fields.map((field) => (
                <div key={field.id} className="relative group space-y-2.5">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider pl-1">
                    {field.label}
                  </label>

                  {field.type === 'boolean' ? (
                    <div className="flex bg-slate-100 p-2 rounded-3xl gap-2 border border-slate-200/50">
                      <button
                        onClick={() => handleInputChange(field.id, true, field.type)}
                        className={`flex-1 py-4 px-4 rounded-2xl font-black flex items-center justify-center gap-2.5 transition-all ${formData[field.id] === true
                          ? 'bg-medical-600 text-white shadow-xl shadow-medical-500/30 active:scale-95'
                          : 'bg-white text-slate-400 hover:text-slate-500 border border-slate-200/50 active:scale-95'
                          }`}
                      >
                        <Check size={20} className={formData[field.id] === true ? 'scale-110' : ''} />
                        <span className="text-base">Si</span>
                      </button>
                      <button
                        onClick={() => handleInputChange(field.id, false, field.type)}
                        className={`flex-1 py-4 px-4 rounded-2xl font-black flex items-center justify-center gap-2.5 transition-all ${formData[field.id] === false
                          ? 'bg-red-500 text-white shadow-xl shadow-red-500/30 active:scale-95'
                          : 'bg-white text-slate-400 hover:text-slate-500 border border-slate-200/50 active:scale-95'
                          }`}
                      >
                        <X size={20} className={formData[field.id] === false ? 'scale-110' : ''} />
                        <span className="text-base">No</span>
                      </button>
                    </div>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      inputMode={field.type === 'number' ? 'numeric' : 'text'}
                      value={formData[field.id]}
                      onChange={(e) => handleInputChange(field.id, e.target.value, field.type)}
                      className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-slate-200 bg-slate-50/30 focus:bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-50 outline-none transition-all text-xl font-black text-slate-800 placeholder:text-slate-200 shadow-sm"
                      placeholder={field.type === 'number' ? '0' : '...'}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-10">
            <label className="block text-[11px] font-black text-slate-500 mb-3 uppercase tracking-wider pl-1 flex items-center gap-2">
              <div className="bg-medical-50 p-1.5 rounded-lg text-medical-600 shadow-sm">
                <FileText size={16} />
              </div>
              Notas y Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-6 py-5 rounded-[2rem] border-2 border-slate-200 bg-slate-50/30 focus:bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-50 outline-none min-h-[160px] text-slate-700 font-bold text-lg leading-relaxed transition-all shadow-sm"
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
