import React from 'react';

// Base skeleton block - with dark mode support
const SkeletonBlock = ({ w = '100%', h = 14, radius = 6, mb = 0 }) => (
  <div style={{
    width: w, height: h, borderRadius: radius,
    backgroundColor: '#e8e0d4',
    marginBottom: mb,
    animation: 'skeletonPulse 1.5s ease-in-out infinite',
  }}
  className="dark:!bg-gray-700"
  />
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
  <div className="min-h-screen flex font-sans bg-[#f5f0e8] dark:bg-gray-900">
    <SkeletonStyle />

    {/* Sidebar skeleton */}
    <div className="w-[235px] flex-shrink-0 bg-[#F5C400] dark:bg-amber-700 p-[18px_10px]">
      {/* Logo */}
      <div className="w-20 h-[60px] bg-white/40 dark:bg-white/20 rounded-lg mb-6 ml-2" />
      {/* Nav items */}
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center gap-3 py-[11px] px-4 mb-1">
          <div className="w-[18px] h-[18px] rounded bg-white/40 dark:bg-white/20 flex-shrink-0" />
          <div className="h-3 rounded-md bg-white/40 dark:bg-white/20" style={{ width: `${50 + i * 10}px` }} />
        </div>
      ))}
    </div>

    {/* Main area */}
    <div className="flex-1 flex flex-col">
      {/* Topbar */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-[#e8d8b0] dark:border-gray-700 flex items-center px-7 gap-3.5">
        <div className="flex-1 max-w-[400px] h-[38px] rounded-full bg-[#f0ece4] dark:bg-gray-700" />
        <div className="flex-1" />
        <div className="w-[38px] h-[38px] rounded-full bg-[#f0ece4] dark:bg-gray-700" />
        <div className="w-[140px] h-[38px] rounded-full bg-[#f0ece4] dark:bg-gray-700" />
      </div>

      {/* Content */}
      <div className="p-7 md:p-8 flex-1">
        {/* Page title */}
        <SkeletonBlock w="200px" h={28} radius={8} mb={8} />
        <SkeletonBlock w="300px" h={14} radius={6} mb={32} />

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {[1,2].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#e8d5ac] dark:border-gray-700">
              <SkeletonBlock w="140px" h={16} radius={6} mb={16} />
              <SkeletonBlock w="100%" h={12} radius={6} mb={10} />
              <SkeletonBlock w="80%"  h={12} radius={6} mb={10} />
              <SkeletonBlock w="60%"  h={12} radius={6} mb={0} />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#e8d5ac] dark:border-gray-700">
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
  <div className="flex flex-col gap-3.5">
    <SkeletonStyle />
    {[1,2,3].map(i => (
      <div key={i} className="bg-white dark:bg-gray-800 border border-[#e8d5ac] dark:border-gray-700 rounded-xl p-5 flex items-center gap-5 border-l-[5px] border-l-[#e8d5ac] dark:border-l-gray-600">
        {/* Date block */}
        <div className="w-12 flex-shrink-0 text-center">
          <SkeletonBlock w="100%" h={10} radius={4} mb={6} />
          <SkeletonBlock w="100%" h={28} radius={6} mb={0} />
        </div>
        {/* Info */}
        <div className="flex-1">
          <SkeletonBlock w="60%" h={14} radius={6} mb={8} />
          <SkeletonBlock w="40%" h={11} radius={5} mb={0} />
        </div>
        {/* Status chip */}
        <SkeletonBlock w={80} h={26} radius={999} mb={0} />
        {/* Buttons */}
        <div className="flex gap-2">
          <SkeletonBlock w={80}  h={30} radius={999} mb={0} />
          <SkeletonBlock w={80}  h={30} radius={999} mb={0} />
        </div>
      </div>
    ))}
  </div>
);

//  ANNOUNCEMENTS LIST SKELETON
export const AnnouncementsListSkeleton = () => (
  <div className="flex flex-col gap-4">
    <SkeletonStyle />
    {[1,2,3].map(i => (
      <div key={i} className="bg-white dark:bg-gray-800 border border-[#e8d5ac] dark:border-gray-700 rounded-xl p-[18px_22px]">
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
  <div className="p-7 md:p-8">
    <SkeletonStyle />

    {/* Title */}
    <SkeletonBlock w="160px" h={28} radius={8} mb={24} />

    {/* Header card */}
    <div className="bg-white dark:bg-gray-800 border border-[#e8d5ac] dark:border-gray-700 rounded-xl p-[22px_26px] flex items-center gap-5 mb-5">
      <div className="w-[76px] h-[76px] rounded-full bg-[#e8e0d4] dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1">
        <SkeletonBlock w="200px" h={20} radius={6} mb={8} />
        <SkeletonBlock w="140px" h={13} radius={5} mb={0} />
      </div>
      <SkeletonBlock w={120} h={38} radius={999} mb={0} />
    </div>

    {/* Info cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[1,2].map(card => (
        <div key={card} className="bg-white dark:bg-gray-800 border border-[#e8d5ac] dark:border-gray-700 rounded-xl p-[22px_24px]">
          <SkeletonBlock w="120px" h={16} radius={6} mb={20} />
          {[1,2,3,4].map(row => (
            <div key={row} className="mb-4">
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