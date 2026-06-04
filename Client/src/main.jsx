import { StrictMode, createContext, useContext, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/i18n';
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

// ---- Font Size Context (inline) ----
const FontSizeContext = createContext();

const SIZES = {
  small:  { label: "Small",  scale: 0.875 },
  medium: { label: "Medium", scale: 1 },
  large:  { label: "Large",  scale: 1.125 },
};

export function FontSizeProvider({ children }) {
  const [size, setSize] = useState(
    () => localStorage.getItem("fontSize") || "medium"
  );

  useEffect(() => {
    const scale = SIZES[size]?.scale ?? 1;
    document.documentElement.style.fontSize = `${scale * 16}px`;
    localStorage.setItem("fontSize", size);
  }, [size]);

  return (
    <FontSizeContext.Provider value={{ size, setSize, sizes: SIZES }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeContext);
// ------------------------------------

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FontSizeProvider>
        <App />
      </FontSizeProvider>
    </BrowserRouter>
  </StrictMode>
)


