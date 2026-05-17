import React, { useState, useEffect } from 'react';

const LanguageSwitcher = ({ onLanguageChange, currentLanguage = 'en' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if dark mode is active
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const languages = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'si', label: 'SI', name: 'සිංහල' },
    { code: 'ta', label: 'TA', name: 'தமிழ்' },
  ];

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  // Light mode styles
  const lightStyles = {
    button: {
      color: '#1e1200',
    },
    dropdown: {
      backgroundColor: '#fff',
      borderColor: '#e8d5ac',
    },
    itemDefault: {
      backgroundColor: '#fff',
      color: '#3d2a00',
    },
    itemActive: {
      backgroundColor: '#f5f0e8',
      color: '#3d2a00',
    },
    itemHover: {
      backgroundColor: '#f5f0e8',
    },
  };

  // Dark mode styles
  const darkStyles = {
    button: {
      color: '#f1f5f9',
    },
    dropdown: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
    },
    itemDefault: {
      backgroundColor: '#1e293b',
      color: '#f1f5f9',
    },
    itemActive: {
      backgroundColor: '#2d3a4f',
      color: '#F5C400',
    },
    itemHover: {
      backgroundColor: '#334155',
    },
  };

  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 800,
          color: styles.button.color,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '6px',
          transition: 'color 0.2s ease',
        }}
        onMouseOver={e => { e.currentTarget.style.color = '#F5C400'; }}
        onMouseOut={e => { e.currentTarget.style.color = styles.button.color; }}
      >
        <span>{currentLang.label}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: styles.dropdown.backgroundColor,
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              border: `1px solid ${styles.dropdown.borderColor}`,
              overflow: 'hidden',
              zIndex: 99,
              minWidth: '140px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {languages.map((lang) => {
              const isActive = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    if (onLanguageChange) {
                      onLanguageChange(lang.code);
                    }
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    backgroundColor: isActive ? styles.itemActive.backgroundColor : styles.itemDefault.backgroundColor,
                    color: isActive ? styles.itemActive.color : styles.itemDefault.color,
                    fontSize: '13px',
                    fontWeight: isActive ? 800 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = styles.itemHover.backgroundColor;
                    }
                  }}
                  onMouseOut={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = styles.itemDefault.backgroundColor;
                    }
                  }}
                >
                  <span>{lang.label}</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>{lang.name}</span>
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;