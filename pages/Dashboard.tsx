import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, MapPin, Calendar, Users, Activity, Edit } from 'lucide-react';
import { storageService } from '../services/storage';
import { exportToExcel, exportToPDF } from '../services/exportService';
import { Report, FieldDefinition } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const navigate = useNavigate();
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedReports = storageService.getReports();
    const loadedFields = storageService.getFields();
    setReports(loadedReports);
    setFields(loadedFields);
    setLoading(false);
  };

  const handleExportPDF = () => {
    exportToPDF(reports, fields);
  };

  const handleExportExcel = () => {
    exportToExcel(reports, fields);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando datos...</div>;

  return (
    <div className="p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Total Reportes</p>
          <p className="text-3xl font-bold text-medical-600">{reports.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Población Total</p>
          <p className="text-3xl font-bold text-accent-600">
            {reports.reduce((acc, curr) => acc + (Number(curr.data['total_pop']) || 0), 0)}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-2">
        <button
          onClick={handleExportPDF}
          className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <Download size={18} />
          <span>PDF</span>
        </button>
        <button
          onClick={handleExportExcel}
          className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <FileSpreadsheet size={18} />
          <span>Excel</span>
        </button>
      </div>

      {/* Recent List */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3">Registros Recientes</h2>

        {reports.length === 0 ? (
          <div className="text-center py-10 bg-slate-100 rounded-xl border-dashed border-2 border-slate-200">
            <Activity className="mx-auto text-slate-400 mb-2" />
            <p className="text-slate-500">No hay registros aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-medical-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-medical-500 mt-0.5 shrink-0" />
                    <h3 className="font-semibold text-slate-800 leading-tight">{report.location}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full whitespace-nowrap">
                      {format(new Date(report.timestamp), 'dd MMM, HH:mm', { locale: es })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit/${report.id}`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-medical-600 hover:bg-medical-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-3 border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-medical-500"></div>
                    <span className="text-xs">Casas:</span>
                    <span className="font-medium">{report.data['total_houses'] ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-500"></div>
                    <span className="text-xs">Población:</span>
                    <span className="font-medium">{report.data['total_pop'] ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                    <span className="text-xs">Embarazadas:</span>
                    <span className="font-medium">{report.data['pregnant'] ?? '0'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    <span className="text-xs">Enfermos:</span>
                    <span className="font-medium">{report.data['sick'] ?? '0'}</span>
                  </div>
                </div>

                {report.notes && (
                  <div className="mt-3 text-xs text-slate-400 italic truncate">
                    "{report.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
