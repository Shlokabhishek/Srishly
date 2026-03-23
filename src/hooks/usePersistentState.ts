import * as React from 'react';

import { readLocalStorage, writeLocalStorage } from '@/lib/storage';

export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = React.useState<T>(() => readLocalStorage(key, initialValue));

  React.useEffect(() => {
    writeLocalStorage(key, state);
  }, [key, state]);

  return [state, setState] as const;
}
