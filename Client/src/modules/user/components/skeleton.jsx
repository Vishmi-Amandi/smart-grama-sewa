import React from 'react';

// Base skeleton block
const SkeletonBlock = ({ w = '100%', h = 14, radius = 6, mb = 0, className = '' }) => (
  <div 
    className={`skeleton-block ${className}`}
    style={{
      width: w, 
      height: `${h}px`, 
      borderRadius: `${radius}px`,
      marginBottom: `${mb}px`,
    }}
  />
);

// Pulse keyframe
const SkeletonStyle = () => (
  <style>{`
    @keyframes skeletonPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .skeleton-block {
      background-color: #e5e7eb;
      animation: skeletonPulse 1.5s ease-in-out infinite;
    }
    
    .dark .skeleton-block {
      background-color: var(--color-dark-border-light);
    }
  `}</style>
);

// ============================================
// DESKTOP PAGE LOADING SKELETON (Width > 768px)
// ============================================
export const DesktopPageLoadingSkeleton = () => (
  <div className="min-h-screen flex font-sans" style={{ backgroundColor: 'var(--bg-page)' }}>
    <SkeletonStyle />

    {/* Desktop Sidebar */}
    <div className="hidden md:block w-[235px] flex-shrink-0" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
      <div className="p-[18px_10px]">
        <div className="w-20 h-[60px] bg-white/40 dark:bg-white/10 rounded-lg mb-6 ml-2" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 py-[11px] px-4 mb-1">
            <div className="w-[18px] h-[18px] rounded bg-white/40 dark:bg-white/10" />
            <div className="h-3 rounded-md bg-white/40 dark:bg-white/10" style={{ width: `${50 + i * 10}px` }} />
          </div>
        ))}
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 flex flex-col">
      {/* Desktop Topbar */}
      <div className="hidden md:flex h-16 items-center px-7 gap-3.5" style={{ 
        backgroundColor: 'var(--bg-topbar)', 
        borderBottom: `1px solid var(--border)` 
      }}>
        <div className="flex-1 max-w-[400px] h-[38px] rounded-full skeleton-block" />
        <div className="flex-1" />
        <div className="w-[38px] h-[38px] rounded-full skeleton-block" />
        <div className="w-[140px] h-[38px] rounded-full skeleton-block" />
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block p-7 md:p-8 flex-1">
        <SkeletonBlock w="200px" h={28} radius={8} mb={8} />
        <SkeletonBlock w="300px" h={14} radius={6} mb={32} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
              <SkeletonBlock w="140px" h={16} radius={6} mb={16} />
              <SkeletonBlock w="100%" h={12} radius={6} mb={10} />
              <SkeletonBlock w="80%" h={12} radius={6} mb={10} />
              <SkeletonBlock w="60%" h={12} radius={6} mb={0} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MOBILE PAGE LOADING SKELETON (Width ≤ 768px)
// ============================================
export const MobilePageLoadingSkeleton = () => (
  <div className="min-h-screen block md:hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
    <SkeletonStyle />

    {/* Mobile Header */}
    <div className="h-16 flex items-center px-4 gap-3" style={{ 
      backgroundColor: 'var(--bg-sidebar)',
      borderBottom: `1px solid var(--border)`
    }}>
      <div className="w-8 h-8 rounded-md bg-white/40 dark:bg-white/10" />
      <div className="flex-1 flex justify-center">
        <div className="w-32 h-10 rounded-lg bg-white/40 dark:bg-white/10" />
      </div>
      <div className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10" />
      <div className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10" />
    </div>

    {/* Mobile Content */}
    <div className="p-4">
      {/* Page Title */}
      <SkeletonBlock w="180px" h={24} radius={6} mb={20} />
      
      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map(i => (
          <SkeletonBlock key={i} w="100px" h={36} radius={20} mb={0} />
        ))}
        <SkeletonBlock w="100px" h={36} radius={20} mb={0} />
      </div>
      
      {/* Mobile Cards Stack */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
            <div className="flex items-center gap-3 mb-3">
              <SkeletonBlock w={48} h={48} radius={12} mb={0} />
              <div className="flex-1">
                <SkeletonBlock w="80%" h={14} radius={4} mb={6} />
                <SkeletonBlock w="60%" h={10} radius={4} mb={0} />
              </div>
            </div>
            <SkeletonBlock w="100%" h={10} radius={4} mb={3} />
            <SkeletonBlock w="90%" h={10} radius={4} mb={3} />
            <SkeletonBlock w="70%" h={10} radius={4} mb={12} />
            <SkeletonBlock w="100%" h={36} radius={8} mb={0} />
          </div>
        ))}
      </div>
    </div>

    {/* Mobile Bottom Navigation */}
    <div className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around px-4" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderTop: `1px solid var(--border)`
    }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="w-8 h-8 rounded-full skeleton-block" />
      ))}
    </div>
  </div>
);

// ============================================
// RESPONSIVE SKELETON (Auto-switches based on screen)
// ============================================
export const PageLoadingSkeleton = () => (
  <>
    <DesktopPageLoadingSkeleton />
    <MobilePageLoadingSkeleton />
  </>
);

// ============================================
// DASHBOARD SKELETONS
// ============================================

export const DesktopDashboardSkeleton = () => (
  <div className="hidden md:block">
    <SkeletonStyle />
    
    {/* Welcome Header */}
    <div className="mb-6">
      <SkeletonBlock w="250px" h={28} radius={8} mb={8} />
      <SkeletonBlock w="180px" h={14} radius={6} mb={16} />
    </div>
    
    {/* GN Officer Card */}
    <div className="rounded-xl p-5 mb-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
      <div className="flex items-center gap-4">
        <SkeletonBlock w={56} h={56} radius={28} mb={0} />
        <div>
          <SkeletonBlock w="120px" h={16} radius={6} mb={6} />
          <SkeletonBlock w="160px" h={12} radius={6} mb={4} />
          <SkeletonBlock w="60px" h={10} radius={4} mb={0} />
        </div>
      </div>
      <SkeletonBlock w={100} h={36} radius={20} mb={0} />
    </div>
    
    {/* Quick Actions */}
    <div className="mb-6">
      <SkeletonBlock w="120px" h={16} radius={6} mb={16} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
            <SkeletonBlock w={40} h={40} radius={10} mb={10} className="mx-auto" />
            <SkeletonBlock w="80%" h={12} radius={4} mb={0} className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
    
    {/* Upcoming Appointments Section */}
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <SkeletonBlock w="180px" h={18} radius={6} mb={0} />
        <SkeletonBlock w="100px" h={12} radius={4} mb={0} />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <SkeletonBlock w={40} h={12} radius={4} mb={4} />
                <SkeletonBlock w={40} h={24} radius={6} mb={0} />
              </div>
              <div>
                <SkeletonBlock w="180px" h={14} radius={6} mb={6} />
                <SkeletonBlock w="100px" h={11} radius={4} mb={0} />
              </div>
            </div>
            <SkeletonBlock w={70} h={26} radius={20} mb={0} />
          </div>
        ))}
      </div>
    </div>
    
    {/* Latest Announcements */}
    <div>
      <SkeletonBlock w="160px" h={18} radius={6} mb={4} />
      <div className="flex flex-col gap-2">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
            <SkeletonBlock w="60px" h={8} radius={4} mb={8} />
            <SkeletonBlock w="80%" h={12} radius={4} mb={4} />
            <SkeletonBlock w="60%" h={10} radius={4} mb={0} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const MobileDashboardSkeleton = () => (
  <div className="block md:hidden p-4">
    <SkeletonStyle />
    
    {/* Welcome Header */}
    <SkeletonBlock w="200px" h={24} radius={6} mb={8} />
    <SkeletonBlock w="150px" h={12} radius={4} mb={20} />
    
    {/* GN Officer Card */}
    <div className="rounded-xl p-4 mb-5 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
      <div className="flex items-center gap-3">
        <SkeletonBlock w={48} h={48} radius={24} mb={0} />
        <div>
          <SkeletonBlock w="100px" h={14} radius={6} mb={4} />
          <SkeletonBlock w="130px" h={10} radius={4} mb={3} />
          <SkeletonBlock w="50px" h={8} radius={4} mb={0} />
        </div>
      </div>
      <SkeletonBlock w={80} h={32} radius={20} mb={0} />
    </div>
    
    {/* Quick Actions */}
    <SkeletonBlock w="100px" h={14} radius={6} mb={12} />
    <div className="grid grid-cols-4 gap-2 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
          <SkeletonBlock w={32} h={32} radius={8} mb={6} className="mx-auto" />
          <SkeletonBlock w="90%" h={9} radius={3} mb={0} className="mx-auto" />
        </div>
      ))}
    </div>
    
    {/* Appointments Section */}
    <div className="flex justify-between items-center mb-3">
      <SkeletonBlock w="140px" h={16} radius={6} mb={0} />
      <SkeletonBlock w="80px" h={10} radius={4} mb={0} />
    </div>
    <div className="flex flex-col gap-3">
      {[1, 2].map(i => (
        <div key={i} className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <SkeletonBlock w={35} h={10} radius={3} mb={3} />
              <SkeletonBlock w={35} h={20} radius={5} mb={0} />
            </div>
            <div className="flex-1">
              <SkeletonBlock w="80%" h={12} radius={4} mb={4} />
              <SkeletonBlock w="50%" h={9} radius={3} mb={0} />
            </div>
            <SkeletonBlock w={60} h={22} radius={20} mb={0} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <>
    <DesktopDashboardSkeleton />
    <MobileDashboardSkeleton />
  </>
);

// ============================================
// FORMS SKELETONS
// ============================================

export const DesktopFormsSkeleton = () => (
  <div className="hidden md:block">
    <SkeletonStyle />
    
    {/* Header with title and description */}
    <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
      <div>
        <SkeletonBlock w="120px" h={28} radius={8} mb={8} />
        <SkeletonBlock w="280px" h={14} radius={6} mb={0} />
      </div>
      <SkeletonBlock w="140px" h={40} radius={999} mb={0} />
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-2 gap-3.5 mb-7">
      {[1, 2].map(i => (
        <div key={i} className="rounded-xl p-5" style={{ backgroundColor: i === 1 ? '#f0a060' : '#60b880' }}>
          <SkeletonBlock w="50px" h={36} radius={6} mb={8} className="bg-white/30" />
          <SkeletonBlock w="120px" h={16} radius={6} mb={4} className="bg-white/30" />
          <SkeletonBlock w="160px" h={10} radius={4} mb={0} className="bg-white/30" />
        </div>
      ))}
    </div>
    
    {/* Tabs */}
    <div className="flex gap-5 md:gap-7 mb-5 border-b-2 border-user-border-light">
      {[1, 2, 3, 4].map(i => (
        <SkeletonBlock key={i} w="100px" h={36} radius={0} mb={0} />
      ))}
      <SkeletonBlock w="100px" h={36} radius={999} mb={0} className="ml-auto" />
    </div>
    
    {/* Form Cards */}
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="rounded-xl p-5 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
          <div className="flex items-center gap-4">
            <SkeletonBlock w={56} h={56} radius={12} mb={0} />
            <div>
              <SkeletonBlock w="180px" h={16} radius={6} mb={6} />
              <SkeletonBlock w="200px" h={11} radius={4} mb={0} />
            </div>
          </div>
          <SkeletonBlock w="100px" h={36} radius={8} mb={0} />
        </div>
      ))}
    </div>
  </div>
);

export const MobileFormsSkeleton = () => (
  <div className="block md:hidden p-4">
    <SkeletonStyle />
    
    {/* Header */}
    <SkeletonBlock w="100px" h={24} radius={6} mb={8} />
    <SkeletonBlock w="200px" h={11} radius={4} mb={20} />
    
    {/* Stats Cards */}
    <div className="grid grid-cols-2 gap-3 mb-5">
      {[1, 2].map(i => (
        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: i === 1 ? '#f0a060' : '#60b880' }}>
          <SkeletonBlock w="40px" h={28} radius={5} mb={6} className="bg-white/30" />
          <SkeletonBlock w="100px" h={12} radius={4} mb={3} className="bg-white/30" />
          <SkeletonBlock w="120px" h={8} radius={3} mb={0} className="bg-white/30" />
        </div>
      ))}
    </div>
    
    {/* Tabs Scroll */}
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {[1, 2, 3, 4].map(i => (
        <SkeletonBlock key={i} w="90px" h={32} radius={20} mb={0} />
      ))}
      <SkeletonBlock w="90px" h={32} radius={20} mb={0} />
    </div>
    
    {/* Form Cards */}
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
          <div className="flex items-center gap-3 mb-3">
            <SkeletonBlock w={48} h={48} radius={10} mb={0} />
            <div className="flex-1">
              <SkeletonBlock w="70%" h={14} radius={5} mb={6} />
              <SkeletonBlock w="90%" h={10} radius={4} mb={0} />
            </div>
          </div>
          <SkeletonBlock w="100%" h={36} radius={8} mb={0} />
        </div>
      ))}
    </div>
  </div>
);

export const FormsSkeleton = () => (
  <>
    <DesktopFormsSkeleton />
    <MobileFormsSkeleton />
  </>
);

// ============================================
// APPOINTMENTS SKELETONS
// ============================================

export const MobileAppointmentsListSkeleton = () => (
  <div className="block md:hidden">
    <SkeletonStyle />
    <div className="flex flex-col gap-3 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
          {/* Date and Status Row */}
          <div className="flex justify-between items-center mb-3">
            <SkeletonBlock w="80px" h={30} radius={8} mb={0} />
            <SkeletonBlock w="60px" h={24} radius={20} mb={0} />
          </div>
          {/* Title */}
          <SkeletonBlock w="90%" h={16} radius={4} mb={8} />
          {/* Time */}
          <SkeletonBlock w="50%" h={12} radius={4} mb={12} />
          {/* Buttons Row */}
          <div className="flex gap-2">
            <SkeletonBlock w="50%" h={36} radius={8} mb={0} />
            <SkeletonBlock w="50%" h={36} radius={8} mb={0} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const DesktopAppointmentsListSkeleton = () => (
  <div className="hidden md:block">
    <SkeletonStyle />
    <div className="flex flex-col gap-3.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl p-5 flex items-center gap-5" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: `1px solid var(--border)`,
          borderLeft: `5px solid var(--color-user-border)`
        }}>
          <div className="w-12 text-center">
            <SkeletonBlock w="100%" h={10} radius={4} mb={6} />
            <SkeletonBlock w="100%" h={28} radius={6} mb={0} />
          </div>
          <div className="flex-1">
            <SkeletonBlock w="60%" h={14} radius={6} mb={8} />
            <SkeletonBlock w="40%" h={11} radius={5} mb={0} />
          </div>
          <SkeletonBlock w={80} h={26} radius={999} mb={0} />
          <div className="flex gap-2">
            <SkeletonBlock w={80} h={30} radius={999} mb={0} />
            <SkeletonBlock w={80} h={30} radius={999} mb={0} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AppointmentsListSkeleton = () => (
  <>
    <DesktopAppointmentsListSkeleton />
    <MobileAppointmentsListSkeleton />
  </>
);

// ============================================
// ANNOUNCEMENTS SKELETONS
// ============================================

export const MobileAnnouncementsListSkeleton = () => (
  <div className="block md:hidden">
    <SkeletonStyle />
    <div className="flex flex-col gap-3 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
          {/* Priority Badge */}
          <SkeletonBlock w="60px" h={22} radius={20} mb={10} />
          {/* Title */}
          <SkeletonBlock w="90%" h={16} radius={4} mb={8} />
          {/* Date */}
          <SkeletonBlock w="40%" h={10} radius={4} mb={8} />
          {/* Description preview */}
          <SkeletonBlock w="100%" h={10} radius={4} mb={4} />
          <SkeletonBlock w="85%" h={10} radius={4} mb={4} />
          <SkeletonBlock w="60%" h={10} radius={4} mb={12} />
          {/* Read more link */}
          <SkeletonBlock w="80px" h={12} radius={4} mb={0} />
        </div>
      ))}
    </div>
  </div>
);

export const DesktopAnnouncementsListSkeleton = () => (
  <div className="hidden md:block">
    <SkeletonStyle />
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl p-[18px_22px]" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
          <SkeletonBlock w={70} h={22} radius={999} mb={10} />
          <SkeletonBlock w="70%" h={18} radius={6} mb={10} />
          <SkeletonBlock w="100%" h={12} radius={5} mb={6} />
          <SkeletonBlock w="85%" h={12} radius={5} mb={6} />
          <SkeletonBlock w="50%" h={12} radius={5} mb={12} />
          <SkeletonBlock w={80} h={12} radius={5} mb={0} />
        </div>
      ))}
    </div>
  </div>
);

export const AnnouncementsListSkeleton = () => (
  <>
    <DesktopAnnouncementsListSkeleton />
    <MobileAnnouncementsListSkeleton />
  </>
);

// ============================================
// PROFILE SKELETONS
// ============================================

export const MobileProfileSkeleton = () => (
  <div className="block md:hidden p-4">
    <SkeletonStyle />
    
    {/* Header */}
    <div className="rounded-xl p-5 mb-4 flex items-center gap-4" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
      <SkeletonBlock w={60} h={60} radius={30} mb={0} />
      <div className="flex-1">
        <SkeletonBlock w="80%" h={16} radius={4} mb={6} />
        <SkeletonBlock w="50%" h={12} radius={4} mb={0} />
      </div>
    </div>
    
    {/* Info Cards */}
    {[1, 2].map(card => (
      <div key={card} className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
        <SkeletonBlock w="100px" h={14} radius={4} mb={16} />
        {[1, 2, 3, 4].map(row => (
          <div key={row} className="mb-4">
            <SkeletonBlock w="70px" h={9} radius={3} mb={4} />
            <SkeletonBlock w="100%" h={12} radius={4} mb={0} />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const DesktopProfileSkeleton = () => (
  <div className="hidden md:block p-7 md:p-8">
    <SkeletonStyle />
    
    <SkeletonBlock w="160px" h={28} radius={8} mb={24} />
    
    {/* Header card */}
    <div className="rounded-xl p-[22px_26px] flex items-center gap-5 mb-5" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
      <SkeletonBlock w={76} h={76} radius={38} mb={0} />
      <div className="flex-1">
        <SkeletonBlock w="200px" h={20} radius={6} mb={8} />
        <SkeletonBlock w="140px" h={13} radius={5} mb={0} />
      </div>
      <SkeletonBlock w={120} h={38} radius={999} mb={0} />
    </div>
    
    {/* Info cards grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[1, 2].map(card => (
        <div key={card} className="rounded-xl p-[22px_24px]" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
          <SkeletonBlock w="120px" h={16} radius={6} mb={20} />
          {[1, 2, 3, 4].map(row => (
            <div key={row} className="mb-4">
              <SkeletonBlock w="80px" h={10} radius={4} mb={6} />
              <SkeletonBlock w="100%" h={14} radius={5} mb={0} />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <>
    <DesktopProfileSkeleton />
    <MobileProfileSkeleton />
  </>
);

// ============================================
// SETTINGS SKELETONS
// ============================================

export const DesktopSettingsSkeleton = () => (
  <div className="hidden md:block">
    <SkeletonStyle />
    
    {/* Header */}
    <div className="mb-6">
      <SkeletonBlock w="100px" h={28} radius={8} mb={8} />
      <SkeletonBlock w="280px" h={14} radius={6} mb={0} />
    </div>
    
    {/* Language Section Card */}
    <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
      <SkeletonBlock w="100px" h={18} radius={6} mb={20} />
      
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center justify-between py-4 border-b border-user-border-light last:border-0">
          <div>
            <SkeletonBlock w="80px" h={14} radius={4} mb={6} />
            <SkeletonBlock w="180px" h={11} radius={4} mb={0} />
          </div>
          <SkeletonBlock w={50} h={24} radius={999} mb={0} />
        </div>
      ))}
    </div>
  </div>
);

export const MobileSettingsSkeleton = () => (
  <div className="block md:hidden p-4">
    <SkeletonStyle />
    
    {/* Header */}
    <SkeletonBlock w="90px" h={24} radius={6} mb={8} />
    <SkeletonBlock w="200px" h={11} radius={4} mb={20} />
    
    {/* Language Section */}
    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid var(--border)` }}>
      <SkeletonBlock w="80px" h={14} radius={4} mb={16} />
      
      {[1, 2, 3].map(i => (
        <div key={i} className="py-3 border-b border-user-border-light last:border-0">
          <SkeletonBlock w="70px" h={12} radius={4} mb={6} />
          <SkeletonBlock w="150px" h={10} radius={3} mb={0} />
        </div>
      ))}
    </div>
  </div>
);

export const SettingsSkeleton = () => (
  <>
    <DesktopSettingsSkeleton />
    <MobileSettingsSkeleton />
  </>
);

// ============================================
// EXPORT ALL
// ============================================

export default {
  PageLoadingSkeleton,
  DesktopPageLoadingSkeleton,
  MobilePageLoadingSkeleton,
  DashboardSkeleton,
  DesktopDashboardSkeleton,
  MobileDashboardSkeleton,
  FormsSkeleton,
  DesktopFormsSkeleton,
  MobileFormsSkeleton,
  AppointmentsListSkeleton,
  DesktopAppointmentsListSkeleton,
  MobileAppointmentsListSkeleton,
  AnnouncementsListSkeleton,
  DesktopAnnouncementsListSkeleton,
  MobileAnnouncementsListSkeleton,
  ProfileSkeleton,
  DesktopProfileSkeleton,
  MobileProfileSkeleton,
  SettingsSkeleton,
  DesktopSettingsSkeleton,
  MobileSettingsSkeleton,
};