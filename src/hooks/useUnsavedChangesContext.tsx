import { createContext, useContext, ReactNode } from 'react';

interface UnsavedChangesContextType {
  checkUnsavedChangesBeforeAction: (
    action: () => void, 
    showDialog?: (action: () => void) => void
  ) => void;
  hasUnsavedChanges: boolean;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

export function UnsavedChangesProvider({ 
  children, 
  value 
}: { 
  children: ReactNode;
  value: UnsavedChangesContextType;
}) {
  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChangesContext() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChangesContext must be used within UnsavedChangesProvider');
  }
  return context;
}

// Optional hook that returns null if no context is available
export function useOptionalUnsavedChangesContext() {
  return useContext(UnsavedChangesContext);
}