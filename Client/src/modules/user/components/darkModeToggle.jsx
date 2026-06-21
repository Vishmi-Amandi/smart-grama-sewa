import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none"
      style={{
        backgroundColor: isDark ? '#4a3a28' : '#e8d5ac',
      }}
      aria-label="Toggle dark mode"
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200 flex items-center justify-center ${
          isDark ? 'translate-x-6' : 'translate-x-0.5'
        }`}
        style={{ 
          backgroundColor: isDark ? '#F5C400' : '#8a6040',
          color: isDark ? '#3d2a00' : '#ffffff'
        }}
      >
        {isDark ? (
          <Moon size={12} strokeWidth={2.5} />
        ) : (
          <Sun size={12} strokeWidth={2.5} />
        )}
      </div>
    </button>
  );
};

export default DarkModeToggle;