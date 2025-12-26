import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storage';

const SyncIndicator: React.FC = () => {
    const [syncCount, setSyncCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleStatusChange = () => {
            setIsOnline(navigator.onLine);
            if (navigator.onLine) {
                handleSync();
            }
        };

        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        // Initial check and periodic sync attempt
        const checkSync = () => {
            const queue = storageService.getSyncQueue();
            setSyncCount(queue.length);
        };

        const interval = setInterval(() => {
            checkSync();
            if (navigator.onLine && storageService.getSyncQueue().length > 0) {
                handleSync();
            }
        }, 5000);

        checkSync();

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
            clearInterval(interval);
        };
    }, []);

    const handleSync = async () => {
        if (isSyncing || !navigator.onLine) return;

        const queue = storageService.getSyncQueue();
        if (queue.length === 0) return;

        setIsSyncing(true);
        try {
            await storageService.syncPendingChanges();
            const updatedQueue = storageService.getSyncQueue();
            setSyncCount(updatedQueue.length);
        } catch (error) {
            console.error("Manual sync failed:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200 animate-pulse">
                <CloudOff size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Modo Offline</span>
            </div>
        );
    }

    if (syncCount > 0) {
        return (
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-3 py-1.5 ${isSyncing ? 'bg-medical-50 text-medical-600' : 'bg-amber-50 text-amber-600'} rounded-full border ${isSyncing ? 'border-medical-100' : 'border-amber-100'} transition-all active:scale-95`}
            >
                {isSyncing ? (
                    <RefreshCw size={14} className="animate-spin" />
                ) : (
                    <AlertCircle size={14} />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {isSyncing ? 'Sincronizando...' : `${syncCount} Pendientes`}
                </span>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-full border border-green-100 opacity-60">
            <Cloud size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado</span>
        </div>
    );
};

export default SyncIndicator;
