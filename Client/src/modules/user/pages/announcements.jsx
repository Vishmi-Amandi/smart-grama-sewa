import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

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

      <div className="text-center text-gray-400 text-sm py-4">
        ©2026 Smart Grama Sewa
      </div>
    </div>
  );
};

export default Announcements;
