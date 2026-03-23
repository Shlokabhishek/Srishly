import * as React from 'react';

import { STORAGE_KEYS } from '@/constants';
import { usePersistentState } from '@/hooks/usePersistentState';
import type { AppMode } from '@/types';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const ModeContext = React.createContext<ModeContextValue | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = usePersistentState<AppMode>(STORAGE_KEYS.appMode, 'sender');

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const context = React.useContext(ModeContext);

  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }

  return context;
}
