import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, MapPin, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { storageService } from '../services/storage';
import { FieldDefinition, Report } from '../types';
import { format } from 'date-fns';

const NewReport: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [location, setLocation] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');
  const [showAllFields, setShowAllFields] = useState(true);

  useEffect(() => {
    const loadedFields = storageService.getFields().filter(f => f.isActive).sort((a, b) => a.order - b.order);
    setFields(loadedFields);

    if (id) {
      const existingReport = storageService.getReportById(id);
      if (existingReport) {
        setLocation(existingReport.location);
        setFormData(existingReport.data);
        setNotes(existingReport.notes || '');
        return;
      }
    }

    // Initialize form data with 0 or empty for numeric fields to make entry easier
    const initialData: any = {};
    loadedFields.forEach(f => {
      if (f.type === 'number') initialData[f.id] = '';
    });
    setFormData(initialData);
  }, [id]);

  const handleInputChange = (id: string, value: string, type: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSave = () => {
    if (!location.trim()) {
      alert('Por favor ingrese la ubicación o referencia.');
      return;
    }

    const reportToSave: Report = {
      id: id || crypto.randomUUID(),
      location,
      timestamp: id ? (storageService.getReportById(id)?.timestamp || new Date().toISOString()) : new Date().toISOString(),
      notes,
      data: formData,
    };

    if (id) {
      storageService.updateReport(reportToSave);
    } else {
      storageService.saveReport(reportToSave);
    }
    navigate('/');
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">{id ? 'Editar Registro' : 'Nuevo Registro'}</h2>
        <p className="text-slate-500 text-sm">{id ? 'Modifique los datos del reporte.' : 'Ingrese los datos recibidos de la llamada.'}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Referencia Principal
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-medical-500" size={20} />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Edificio 30"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all text-slate-800 font-medium"
            />
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <Clock size={14} />
            <span>{format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-slate-700">Datos Demográficos</h3>
            <button
              onClick={() => setShowAllFields(!showAllFields)}
              className="text-medical-600 p-1"
            >
              {showAllFields ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {showAllFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.id} className="relative">
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    inputMode={field.type === 'number' ? 'numeric' : 'text'}
                    value={formData[field.id]}
                    onChange={(e) => handleInputChange(field.id, e.target.value, field.type)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-medical-500 focus:ring-2 focus:ring-medical-100 outline-none transition-all text-lg"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-2">
              <FileText size={16} /> Notas Adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-medical-500 focus:ring-1 focus:ring-medical-500 outline-none min-h-[100px] text-sm"
              placeholder="Detalles extra, nombres específicos, observaciones..."
            ></textarea>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSave}
          className="w-full bg-medical-600 hover:bg-medical-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-medical-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <Save size={20} />
          <span>{id ? 'Actualizar Reporte' : 'Guardar Reporte'}</span>
        </button>
      </div>
    </div>
  );
};

export default NewReport;
