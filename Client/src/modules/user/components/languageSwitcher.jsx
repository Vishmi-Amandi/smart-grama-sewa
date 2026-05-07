import React, { useState } from 'react';

const LanguageSwitcher = ({ onLanguageChange, currentLanguage = 'en' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'si', label: 'SI', name: 'සිංහල' },
    { code: 'ta', label: 'TA', name: 'தமிழ்' },
  ];

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

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
          color: '#1e1200',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '6px',
        }}
      >
        <span>{currentLang.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e8d5ac',
            overflow: 'hidden',
            zIndex: 99,
            minWidth: '120px',
          }}>
            {languages.map((lang) => (
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
                  backgroundColor: currentLanguage === lang.code ? '#f5f0e8' : '#fff',
                  color: '#3d2a00',
                  fontSize: '13px',
                  fontWeight: currentLanguage === lang.code ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{lang.label}</span>
                <span style={{ fontSize: '11px', color: '#888' }}>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
