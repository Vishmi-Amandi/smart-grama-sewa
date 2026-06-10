import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpSelect = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Detect mobile screen
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleContinue = (role) => {
        if (role === 'citizen') {
            navigate('/user-signup');           
        } else if (role === 'gn') {
            navigate('/gn-signup');
        }
    };

    const RoleCard = ({ role, label }) => {
        const isSelected = selected === role;
        return (
            <div
                onClick={() => { setSelected(role); handleContinue(role); }}
                style={{
                    flex: 1,
                    maxWidth: isMobile ? '160px' : '180px',
                    borderRadius: 16,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: isSelected ? '3px solid #F5C400' : '3px solid transparent',
                    transition: 'all .2s',
                    boxShadow: isSelected
                        ? '0 8px 32px rgba(245,196,0,0.5)'
                        : '0 4px 16px rgba(0,0,0,0.15)',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                }}
                onMouseOver={e => {
                    e.currentTarget.style.transform = 'scale(1.04)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,196,0,0.4)';
                }}
                onMouseOut={e => {
                    if (!isSelected) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                    }
                }}
            >
                {/* Icon area */}
                <div style={{
                    height: isMobile ? 130 : 160,
                    backgroundColor: role === 'citizen' ? '#fff8dc' : '#f0ece4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <svg width={isMobile ? 56 : 72} height={isMobile ? 56 : 72} viewBox="0 0 24 24" fill="#1e1200">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                </div>

                {/* Label area */}
                <div style={{
                    backgroundColor: '#e8e0d4',
                    padding: isMobile ? '10px 0' : '12px 0',
                    textAlign: 'center',
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: 700,
                    color: '#1e1200',
                    letterSpacing: '0.3px',
                }}>
                    {label}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Nunito, system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
        }}>
 
            {/* Background */}
            <div
                style={{
                    flex: 1,
                    backgroundImage: 'url(/background.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute', inset: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        pointerEvents: 'none'
                    }}
                />

                {/* Logo */}
                <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '16px 20px' : '20px 24px' }}>
                    <img 
                        src="/logo.png" 
                        alt="Smart Grama Sewa" 
                        style={{ height: isMobile ? '70px' : '100px', width: 'auto' }} 
                    />
                </div>

                {/* Main content */}
                <div style={{
                    flex: 1,
                    position: 'relative', 
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMobile ? '0 16px 30px' : '0 16px 40px',
                }}>

                    {/* "Sign up" Title */}
                    <h1 style={{
                        fontSize: isMobile ? '36px' : '48px',
                        fontWeight: 900,
                        color: '#332421',
                        letterSpacing: '-1px',
                        marginBottom: isMobile ? '24px' : '32px',
                        textAlign: 'center',
                    }}>
                        Sign Up
                    </h1>

                    {/* Brown card */}
                    <div style={{
                        width: '90%',
                        maxWidth: isMobile ? '100%' : '440px',
                        backgroundColor: 'rgba(106, 35, 1, 0.6)',
                        borderRadius: isMobile ? '20px' : '24px',
                        padding: isMobile ? '24px 20px' : '32px 32px 28px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
                        textAlign: 'center',
                    }}>
                        <p style={{
                            fontSize: isMobile ? '14px' : '16px',
                            fontWeight: 500,
                            color: '#f5e8d0',
                            marginBottom: isMobile ? '20px' : '28px',
                            textAlign: 'left',
                            letterSpacing: '0.2px',
                        }}>
                            You are a :
                        </p>

                        {/* Role cards row */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'row',  
                            gap: isMobile ? '16px' : '28px', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexWrap: 'wrap', 
                        }}>
                            <RoleCard role="gn" label="GN Officer" />
                            <RoleCard role="citizen" label="Citizen" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer style={{
                position: 'relative', 
                zIndex: 2,
                backgroundColor: '#6A2301',
                color: '#fff',
                textAlign: 'center',
                padding: isMobile ? '12px 16px' : '14px 16px',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: 600,
            }}>
                ©2026 Smart Grama Sewa
            </footer>
        </div>
    );
};

export default SignUpSelect;