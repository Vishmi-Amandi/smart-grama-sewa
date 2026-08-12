import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Catches the error and updates state
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Silent error handling - no console logs
  componentDidCatch(error, info) {
    // Error is already in state, user sees fallback UI
    // No console logs for production
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f0e8',
          fontFamily: 'Nunito, system-ui, sans-serif',
          padding: '24px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            border: '1.5px solid #e8d5ac',
            borderRadius: 20,
            padding: '48px 40px',
            textAlign: 'center',
            maxWidth: 480,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            {/* Icon */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#fde8e8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <AlertTriangle size={32} color="#dc2626" strokeWidth={2} />
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: 22, fontWeight: 900,
              color: '#1e1200', marginBottom: 10,
            }}>
              Something went wrong
            </h2>

            {/* Message */}
            <p style={{
              fontSize: 14, fontWeight: 600,
              color: '#888', lineHeight: 1.7,
              marginBottom: 28,
            }}>
              This page ran into an unexpected error.<br />
              Please try refreshing or go back to the dashboard.
            </p>

            {/* Error detail — only in development */}
            {import.meta.env.DEV && this.state.error && (
              <div style={{
                backgroundColor: '#fde8e8',
                border: '1px solid #f0a0a0',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 24,
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: '#8b1a1a',
                wordBreak: 'break-word',
              }}>
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {/* Refresh */}
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '11px 24px', borderRadius: 999,
                  backgroundColor: '#F5C400', border: 'none',
                  fontSize: 14, fontWeight: 800, color: '#3d2a00',
                  cursor: 'pointer', transition: 'all .15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#d4a800'}
                onMouseOut={e  => e.currentTarget.style.backgroundColor = '#F5C400'}
              >
                <RefreshCw size={16} color="#3d2a00" strokeWidth={2.5} />
                Refresh page
              </button>

              {/* Dashboard */}
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  padding: '11px 24px', borderRadius: 999,
                  backgroundColor: '#fff',
                  border: '1.5px solid #e8d5ac',
                  fontSize: 14, fontWeight: 800, color: '#3d2a00',
                  cursor: 'pointer', transition: 'all .15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#F5C400'}
                onMouseOut={e  => e.currentTarget.style.borderColor = '#e8d5ac'}
              >
                <Home size={16} color="#3d2a00" strokeWidth={2.5} />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    // No error — render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;