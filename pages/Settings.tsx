import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { FieldDefinition } from '../types';
import { Plus, Trash2, CheckSquare, Square, GripVertical, AlertCircle, Cloud, User, LogOut, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadFields();
    }
  }, [user]);

  const loadFields = async () => {
    if (!user) return;
    setIsLoading(true);
    const loadedFields = await storageService.getFields(user.id);
    setFields(loadedFields.sort((a, b) => a.order - b.order));
    setIsLoading(false);
  };

  const handleToggleField = async (id: string) => {
    if (!user) return;
    const updated = fields.map(f =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    setFields(updated);
    await storageService.saveFields(updated, user.id);
  };

  const handleAddField = async () => {
    if (!newFieldName.trim() || !user) return;

    setIsSaving(true);
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
    await storageService.saveFields(updated, user.id);
    setNewFieldName('');
    setIsAdding(false);
    setIsSaving(false);
  };

  const handleDeleteField = async (id: string) => {
    if (!user) return;
    if (confirm('¿Estás seguro de eliminar este campo? Esto solo afectará a los formularios nuevos.')) {
      const updated = fields.filter(f => f.id !== id);
      setFields(updated);
      await storageService.saveFields(updated, user.id);
    }
  };

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    if (!user) return;
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    // Swap items
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];

    // Re-assign order based on new positions
    const reorderedFields = newFields.map((f, i) => ({ ...f, order: i + 1 }));

    setFields(reorderedFields);
    await storageService.saveFields(reorderedFields, user.id);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-medical-600 animate-spin" />
        <p className="text-slate-400 font-medium">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
      <div>
        <h2 className="text-3xl font-black text-slate-900 mb-1">Configuración</h2>
        <p className="text-slate-500 font-medium">Personaliza los campos de tu censo médico.</p>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={user?.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`}
            alt="Profile"
            className="w-14 h-14 rounded-2xl border-4 border-slate-50 shadow-sm"
          />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cuenta Conectada</p>
            <p className="text-slate-900 font-black text-lg leading-tight">{user?.user_metadata.full_name || 'Usuario'}</p>
            <p className="text-slate-400 text-xs font-medium">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 p-3 rounded-2xl transition-all border border-slate-100"
        >
          <LogOut size={22} />
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-300/40 border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-medical-500 rounded-full"></div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Campos Personalizados</h3>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-medical-600 hover:bg-medical-700 text-white text-xs font-black py-2 px-4 rounded-xl shadow-lg shadow-medical-500/20 flex items-center gap-2 transition-all active:scale-95 uppercase tracking-tighter"
          >
            {isAdding ? 'Cerrar' : <><Plus size={14} /> Añadir Campo</>}
          </button>
        </div>

        {isAdding && (
          <div className="p-6 bg-medical-50/50 border-b border-medical-100 animate-in fade-in slide-in-from-top-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Nombre del campo (ej. Niños < 5 años)"
                className="flex-1 px-5 py-3 rounded-2xl border-2 border-slate-300 bg-white focus:outline-none focus:ring-4 focus:ring-medical-100 transition-all font-bold text-slate-700 placeholder:text-slate-400 shadow-sm"
                autoFocus
              />
              <button
                onClick={handleAddField}
                disabled={isSaving}
                className="bg-medical-600 hover:bg-medical-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-medical-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center p-6 hover:bg-slate-50/50 transition-colors group">
              <div className="flex flex-col gap-1 mr-4">
                <button
                  onClick={() => handleMoveField(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-slate-300 hover:text-medical-500 hover:bg-medical-50 rounded-lg transition-all disabled:opacity-0"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={() => handleMoveField(index, 'down')}
                  disabled={index === fields.length - 1}
                  className="p-1 text-slate-300 hover:text-medical-500 hover:bg-medical-50 rounded-lg transition-all disabled:opacity-0"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
              <div className="flex-1">
                <p className={`font-black text-lg tracking-tight ${field.isActive ? 'text-slate-800' : 'text-slate-300 line-through'}`}>
                  {field.label}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">{field.type}</span>
                  {!field.isActive && <span className="text-[10px] bg-red-50 text-red-300 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">Inactivo</span>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleToggleField(field.id)}
                  className={`p-1 rounded-xl transition-all ${field.isActive ? 'text-medical-500 hover:bg-medical-50' : 'text-slate-200 hover:bg-slate-100'}`}
                >
                  {field.isActive ? <CheckSquare size={32} strokeWidth={2.5} /> : <Square size={32} strokeWidth={1} />}
                </button>

                <button
                  onClick={() => handleDeleteField(field.id)}
                  className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-medical-600 p-6 rounded-3xl shadow-xl shadow-medical-500/30 flex gap-4 items-start relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 text-white opacity-10 group-hover:scale-110 transition-transform">
          <Cloud size={100} />
        </div>
        <div className="bg-white/20 p-3 rounded-2xl text-white">
          <Cloud size={24} />
        </div>
        <div className="relative z-10">
          <h4 className="text-white font-black text-lg tracking-tight">Sincronización en la Nube Activa</h4>
          <p className="text-medical-50 text-sm mt-1 font-medium leading-relaxed">
            MediCenso ahora guarda toda su información en tiempo real en Supabase. Sus datos están seguros y accesibles desde cualquier dispositivo al iniciar sesión.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
