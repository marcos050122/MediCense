import React, { createContext, useContext, useState } from 'react';

type FabIcon = 'plus' | 'save';

interface FabContextType {
    fabAction: (() => void | Promise<void>) | null;
    setFabAction: (action: (() => void | Promise<void>) | null) => void;
    isFabLoading: boolean;
    setIsFabLoading: (loading: boolean) => void;
    fabIcon: FabIcon;
    setFabIcon: (icon: FabIcon) => void;
}

const FabContext = createContext<FabContextType | undefined>(undefined);

export const FabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [fabAction, setFabAction] = useState<(() => void | Promise<void>) | null>(null);
    const [isFabLoading, setIsFabLoading] = useState(false);
    const [fabIcon, setFabIcon] = useState<FabIcon>('plus');

    return (
        <FabContext.Provider value={{
            fabAction,
            setFabAction,
            isFabLoading,
            setIsFabLoading,
            fabIcon,
            setFabIcon
        }}>
            {children}
        </FabContext.Provider>
    );
};

export const useFab = () => {
    const context = useContext(FabContext);
    if (context === undefined) {
        throw new Error('useFab must be used within a FabProvider');
    }
    return context;
};
