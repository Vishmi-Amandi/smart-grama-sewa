import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

// Icons 
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  dashboard:     'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  announcement:  'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appointments:  'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  forms:         'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai:            'M12 2a10 10 0 100 20A10 10 0 0012 2z M12 8v4l3 3',
  profile:       'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings:      'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
  logout:        'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  bell:          'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  search:        'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  calendar:      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  download:      'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  phone:         'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  chevLeft:      'M15 18l-6-6 6-6',
  chevRight:     'M9 18l6-6-6-6',
};

// Nav item 
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '11px 16px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
      color: active ? '#3d2a00' : '#3d2a00',
      fontWeight: active ? 800 : 600,
      fontSize: '14px',
      fontFamily: 'inherit',
      transition: 'all 0.15s',
      textAlign: 'left',
      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
      marginBottom: '2px',
    }}
    onMouseOver={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
    onMouseOut={(e)  => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const navigate = useNavigate();

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'urgent', label: 'Urgent', color: '#d32f2f' },
    { id: 'important', label: 'Important', color: '#ed6c02' },
    { id: 'info', label: 'Information', color: '#1976d2' },
    { id: 'unread', label: 'Unread', color: '#9c27b0' }
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, activeFilter]);

  const fetchAnnouncements = async () => {
    try {
      const q = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        readBy: doc.data().readBy || []
      }));
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];
    
    if (activeFilter === 'urgent') {
      filtered = filtered.filter(a => a.priority === 'urgent');
    } else if (activeFilter === 'important') {
      filtered = filtered.filter(a => a.priority === 'important');
    } else if (activeFilter === 'info') {
      filtered = filtered.filter(a => a.priority === 'info');
    } else if (activeFilter === 'unread') {
      const userId = auth.currentUser?.uid;
      filtered = filtered.filter(a => !a.readBy?.includes(userId));
    }
    
    setFilteredAnnouncements(filtered);
    setCurrentPage(1);
  };

  const markAsRead = async (announcementId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        readBy: [...(announcements.find(a => a.id === announcementId)?.readBy || []), userId]
      });
      
      setAnnouncements(prev => prev.map(a => 
        a.id === announcementId 
          ? { ...a, readBy: [...(a.readBy || []), userId] }
          : a
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const isUnread = (announcement) => {
    const userId = auth.currentUser?.uid;
    return !announcement.readBy?.includes(userId);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return { bg: '#ffebee', text: '#d32f2f', border: '#d32f2f' };
      case 'important': return { bg: '#fff4e5', text: '#ed6c02', border: '#ed6c02' };
      default: return { bg: '#e3f2fd', text: '#1976d2', border: '#1976d2' };
    }
  };

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/logo.png" alt="Smart Grama Sewa" className="h-10 w-auto" />
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-800">
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Announcements</h1>
        <p className="text-gray-500 mb-6">Stay updated with latest news from your GN officer</p>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter.id
                  ? 'text-[#FFB347] border-b-2 border-[#FFB347]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="text-center py-12">Loading announcements...</div>
        ) : paginatedAnnouncements.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-gray-500">No announcements found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedAnnouncements.map(announcement => {
              const colors = getPriorityColor(announcement.priority || 'info');
              const unread = isUnread(announcement);
              
              return (
                <div
                  key={announcement.id}
                  onClick={() => markAsRead(announcement.id)}
                  className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition"
                  style={{ borderLeft: `4px solid ${colors.border}` }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium`}
                        style={{ backgroundColor: colors.bg, color: colors.text }}>
                        {announcement.priority?.toUpperCase() || 'INFO'}
                      </span>
                      {unread && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {announcement.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{announcement.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{announcement.content}</p>
                  <button className="mt-3 text-[#FFB347] text-sm font-medium hover:text-[#E67E22]">
                    Read more →
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)} of {filteredAnnouncements.length} announcements
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer style={{
        backgroundColor: '#6A2301',
        color: '#fff',
        textAlign: 'center',
        padding: '13px 16px',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        ©2026 Smart Grama Sewa
      </footer>
    </div>
  );
};

export default Announcements;
