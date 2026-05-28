import React from 'react';

// Base skeleton block
const SkeletonBlock = ({ w = '100%', h = 14, radius = 6, mb = 0 }) => (
  <div style={{
    width: w, height: h, borderRadius: radius,
    backgroundColor: '#e8e0d4',
    marginBottom: mb,
    animation: 'skeletonPulse 1.5s ease-in-out infinite',
  }} />
);

// Pulse keyframe — inject once
const SkeletonStyle = () => (
  <style>{`
    @keyframes skeletonPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }
  `}</style>
);

//  PAGE-LEVEL AUTH LOADING SKELETON
export const PageLoadingSkeleton = ({ pageName = '' }) => (
  <div style={{
    minHeight: '100vh', display: 'flex',
    fontFamily: 'Nunito, system-ui, sans-serif',
    backgroundColor: '#f5f0e8',
  }}>
    <SkeletonStyle />

    {/* Sidebar skeleton */}
    <div style={{
      width: 235, flexShrink: 0,
      backgroundColor: '#F5C400',
      padding: '18px 10px',
    }}>
      {/* Logo */}
      <div style={{ width: 80, height: 60, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 10, marginBottom: 24, marginLeft: 8 }} />
      {/* Nav items */}
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', marginBottom: 4 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
          <div style={{ height: 12, width: `${50 + i * 10}px`, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.4)' }} />
        </div>
      ))}
    </div>

    {/* Main area */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{
        height: 64, backgroundColor: '#fff',
        borderBottom: '1px solid #e8d8b0',
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14,
      }}>
        <div style={{ flex: 1, maxWidth: 400, height: 38, borderRadius: 999, backgroundColor: '#f0ece4' }} />
        <div style={{ flex: 1 }} />
        <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#f0ece4' }} />
        <div style={{ width: 140, height: 38, borderRadius: 999, backgroundColor: '#f0ece4' }} />
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', flex: 1 }}>
        {/* Page title */}
        <SkeletonBlock w="200px" h={28} radius={8} mb={8} />
        <SkeletonBlock w="300px" h={14} radius={6} mb={32} />

        {/* Content cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
          {[1,2].map(i => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid #e8d5ac' }}>
              <SkeletonBlock w="140px" h={16} radius={6} mb={16} />
              <SkeletonBlock w="100%" h={12} radius={6} mb={10} />
              <SkeletonBlock w="80%"  h={12} radius={6} mb={10} />
              <SkeletonBlock w="60%"  h={12} radius={6} mb={0} />
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid #e8d5ac' }}>
          <SkeletonBlock w="160px" h={16} radius={6} mb={16} />
          <SkeletonBlock w="100%" h={12} radius={6} mb={10} />
          <SkeletonBlock w="90%"  h={12} radius={6} mb={10} />
          <SkeletonBlock w="70%"  h={12} radius={6} mb={0} />
        </div>
      </div>
    </div>
  </div>
);

//  APPOINTMENTS LIST SKELETON
export const AppointmentsListSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <SkeletonStyle />
    {[1,2,3].map(i => (
      <div key={i} style={{
        backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
        borderRadius: 16, padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 20,
        borderLeft: '5px solid #e8d5ac',
      }}>
        {/* Date block */}
        <div style={{ width: 48, flexShrink: 0, textAlign: 'center' }}>
          <SkeletonBlock w="100%" h={10} radius={4} mb={6} />
          <SkeletonBlock w="100%" h={28} radius={6} mb={0} />
        </div>
        {/* Info */}
        <div style={{ flex: 1 }}>
          <SkeletonBlock w="60%" h={14} radius={6} mb={8} />
          <SkeletonBlock w="40%" h={11} radius={5} mb={0} />
        </div>
        {/* Status chip */}
        <SkeletonBlock w={80} h={26} radius={999} mb={0} />
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <SkeletonBlock w={80}  h={30} radius={999} mb={0} />
          <SkeletonBlock w={80}  h={30} radius={999} mb={0} />
        </div>
      </div>
    ))}
  </div>
);

//  ANNOUNCEMENTS LIST SKELETON
export const AnnouncementsListSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <SkeletonStyle />
    {[1,2,3].map(i => (
      <div key={i} style={{
        backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
        borderRadius: 12, padding: '18px 22px',
      }}>
        {/* Tag chip */}
        <SkeletonBlock w={70} h={22} radius={999} mb={10} />
        {/* Title */}
        <SkeletonBlock w="70%" h={18} radius={6} mb={10} />
        {/* Body preview */}
        <SkeletonBlock w="100%" h={12} radius={5} mb={6} />
        <SkeletonBlock w="85%"  h={12} radius={5} mb={6} />
        <SkeletonBlock w="50%"  h={12} radius={5} mb={12} />
        {/* Read more */}
        <SkeletonBlock w={80} h={12} radius={5} mb={0} />
      </div>
    ))}
  </div>
);

//  PROFILE SKELETON
export const ProfileSkeleton = () => (
  <div style={{ padding: '28px 32px' }}>
    <SkeletonStyle />

    {/* Title */}
    <SkeletonBlock w="160px" h={28} radius={8} mb={24} />

    {/* Header card */}
    <div style={{
      backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
      borderRadius: 18, padding: '22px 26px',
      display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20,
    }}>
      <div style={{ width: 76, height: 76, borderRadius: '50%', backgroundColor: '#e8e0d4', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <SkeletonBlock w="200px" h={20} radius={6} mb={8} />
        <SkeletonBlock w="140px" h={13} radius={5} mb={0} />
      </div>
      <SkeletonBlock w={120} h={38} radius={999} mb={0} />
    </div>

    {/* Info cards */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      {[1,2].map(card => (
        <div key={card} style={{
          backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
          borderRadius: 18, padding: '22px 24px',
        }}>
          <SkeletonBlock w="120px" h={16} radius={6} mb={20} />
          {[1,2,3,4].map(row => (
            <div key={row} style={{ marginBottom: 18 }}>
              <SkeletonBlock w="80px"  h={10} radius={4} mb={6} />
              <SkeletonBlock w="100%" h={14} radius={5} mb={0} />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default {
  PageLoadingSkeleton,
  AppointmentsListSkeleton,
  AnnouncementsListSkeleton,
  ProfileSkeleton,
};