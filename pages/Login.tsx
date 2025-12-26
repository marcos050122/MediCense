import React from 'react';
import { LogIn, FileText, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
    const { signInWithGoogle, loading } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-medical-100 via-slate-50 to-slate-50">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                <div className="flex flex-col items-center text-center space-y-4 mb-10">
                    <img src="/logo.png" alt="MediCenso Logo" className="w-64 h-auto" />
                    <p className="text-slate-500 font-medium">Gestión profesional de reportes médicos</p>
                </div>

                <div className="space-y-4 mb-10">
                    <div className="flex items-start space-x-3 text-slate-600">
                        <div className="mt-1 bg-medical-50 p-1 rounded-full text-medical-600">
                            <CheckCircle2 size={16} />
                        </div>
                        <p className="text-sm">Sincronización en tiempo real con Supabase</p>
                    </div>
                    <div className="flex items-start space-x-3 text-slate-600">
                        <div className="mt-1 bg-medical-50 p-1 rounded-full text-medical-600">
                            <ShieldCheck size={16} />
                        </div>
                        <p className="text-sm">Acceso seguro y encriptado a tus datos</p>
                    </div>
                    <div className="flex items-start space-x-3 text-slate-600">
                        <div className="mt-1 bg-medical-50 p-1 rounded-full text-medical-600">
                            <Zap size={16} />
                        </div>
                        <p className="text-sm">Interfaz rápida y optimizada para móviles</p>
                    </div>
                </div>

                <button
                    onClick={() => signInWithGoogle()}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-slate-200 py-4 px-6 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                >
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    <span className="text-lg">Continuar con Google</span>
                </button>
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Tu sesión permanecerá activa por 30 días
                    </p>
                </div>
            </div>

            <p className="mt-8 text-slate-400 text-sm font-medium uppercase tracking-widest">
                Powered by Supabase
            </p>
        </div>
    );
};

export default Login;
