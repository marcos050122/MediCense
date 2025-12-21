import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { FieldDefinition } from '../types';
import { Plus, Trash2, CheckSquare, Square, GripVertical, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setFields(storageService.getFields().sort((a, b) => a.order - b.order));
  }, []);

  const handleToggleField = (id: string) => {
    const updated = fields.map(f => 
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    setFields(updated);
    storageService.saveFields(updated);
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    
    const id = newFieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newField: FieldDefinition = {
      id,
      label: newFieldName,
      type: 'number',
      isActive: true,
      order: fields.length + 1
    };

    const updated = [...fields, newField];
    setFields(updated);
    storageService.saveFields(updated);
    setNewFieldName('');
    setIsAdding(false);
  };

  const handleDeleteField = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este campo? Los datos antiguos se mantendrán pero no se verá en formularios nuevos.')) {
        const updated = fields.filter(f => f.id !== id);
        setFields(updated);
        storageService.saveFields(updated);
    }
  };

  return (
    <div className="p-4 space-y-6">
       <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Configuración</h2>
        <p className="text-slate-500 text-sm">Personaliza los campos del formulario.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Campos Activos</h3>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="text-medical-600 text-sm font-medium hover:text-medical-700 flex items-center gap-1"
            >
              <Plus size={16} /> Añadir
            </button>
        </div>

        {isAdding && (
          <div className="p-4 bg-medical-50 border-b border-medical-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Nombre del nuevo campo (ej. Diabéticos)"
                className="flex-1 px-3 py-2 rounded-lg border border-medical-200 focus:outline-none focus:ring-2 focus:ring-medical-400"
                autoFocus
              />
              <button 
                onClick={handleAddField}
                className="bg-medical-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center p-4 hover:bg-slate-50 transition-colors group">
               <GripVertical className="text-slate-300 mr-3 cursor-move" size={20} />
               <div className="flex-1">
                 <p className={`font-medium ${field.isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                   {field.label}
                 </p>
                 <p className="text-[10px] text-slate-400 uppercase tracking-wide">{field.type}</p>
               </div>
               
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => handleToggleField(field.id)}
                   className={`${field.isActive ? 'text-medical-600' : 'text-slate-300'}`}
                 >
                   {field.isActive ? <CheckSquare size={24} /> : <Square size={24} />}
                 </button>
                 
                 {/* Only allow deleting custom fields (simplified logic for demo, allowing all for now but warning) */}
                 <button 
                    onClick={() => handleDeleteField(field.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <Trash2 size={20} />
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
        <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-blue-800 font-semibold text-sm">Modo Offline / Local</h4>
          <p className="text-blue-600 text-xs mt-1">
            Actualmente los datos se guardan en este dispositivo. Para activar la sincronización con la nube (Supabase), contacte al administrador para configurar las credenciales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
