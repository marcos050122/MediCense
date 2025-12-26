import React, { createContext, useContext, useState, useCallback } from 'react';

interface SaveContextType {
    saveTrigger: (() => Promise<void>) | null;
    setSaveTrigger: (trigger: (() => Promise<void>) | null) => void;
    isSaving: boolean;
    setIsSaving: (loading: boolean) => void;
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

export const SaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [saveTrigger, setSaveTrigger] = useState<(() => Promise<void>) | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    return (
        <SaveContext.Provider value={{ saveTrigger, setSaveTrigger, isSaving, setIsSaving }}>
            {children}
        </SaveContext.Provider>
    );
};

export const useSave = () => {
    const context = useContext(SaveContext);
    if (context === undefined) {
        throw new Error('useSave must be used within a SaveProvider');
    }
    return context;
};
