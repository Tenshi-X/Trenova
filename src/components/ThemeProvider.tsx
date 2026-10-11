'use client';

import { createContext, useContext } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme }>({ theme: 'dark' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Match the server-rendered terminal theme from the first frame, including charts.
  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
