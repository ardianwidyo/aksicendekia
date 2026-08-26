'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { GradeLevel } from '@aksicendekia/design-tokens';

interface ThemeContextType {
  gradeLevel: GradeLevel;
  setGradeLevel: (level: GradeLevel) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultGradeLevel?: GradeLevel;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultGradeLevel = 'sd',
}) => {
  const [gradeLevel, setGradeLevelState] = useState<GradeLevel>(defaultGradeLevel);

  const setGradeLevel = (level: GradeLevel) => {
    setGradeLevelState(level);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-jenjang', level);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-jenjang', gradeLevel);
    }
  }, [gradeLevel]);

  return (
    <ThemeContext.Provider value={{ gradeLevel, setGradeLevel }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
