'use client';

import { useEffect } from 'react';
import { Theme } from '@/types';

interface SettingsPanelProps {
  theme: Theme;
  isHumanized: boolean;
  onThemeChange: (theme: Theme) => void;
  onHumanizedChange: (humanized: boolean) => void;
}

export default function SettingsPanel({
  theme,
  isHumanized,
  onThemeChange,
  onHumanizedChange,
}: SettingsPanelProps) {
  // Apply theme class on mount and theme change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="fixed top-4 right-4 flex space-x-2">
      {/* Theme Toggle */}
      <button
        onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-full hover:bg-gray-700/30 transition-colors"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657L5.636 5.636m12.728 12.728L18.364 18.364M12 7a5 5 0 110 10 5 5 0 010-10z"
            />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {/* Humanization Toggle */}
      <button
        onClick={() => onHumanizedChange(!isHumanized)}
        className="p-2 rounded-full hover:bg-gray-700/30 transition-colors"
        title={`${isHumanized ? 'Use technical' : 'Use humanized'} language`}
        aria-label={`${isHumanized ? 'Use technical' : 'Use humanized'} language`}
      >
        {isHumanized ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
