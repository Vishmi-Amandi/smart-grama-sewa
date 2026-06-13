import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { auth, db, initializeMessaging, requestNotificationPermission, onForegroundMessage } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './NotificationBell.css';

// SVG Icon helper
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const BELL_PATH = 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0';
const PHONE_PATH = 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z';
const CLOSE_PATH = 'M18 6L6 18M6 6l12 12';
const CHECK_PATH = 'M20 6L9 17l-5-5';
const ALERT_PATH = 'M12 9v4 M12 17h.01 M12 2a10 10 0 100 20 10 10 0 000-20z';
const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
const INFO_PATH = 'M12 2a10 10 0 100 20 10 10 0 000-20z M12 8v4 M12 16h.01';

// Priority config
const PRIORITY_CONFIG = {
  Urgent: { class: 'urgent', icon: ALERT_PATH, color: '#c0392b' },
  High: { class: 'high', icon: STAR_PATH, color: '#b45309' },
  Normal: { class: 'normal', icon: INFO_PATH, color: '#1a4a8a' },
};

// Time ago helper
const timeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [shaking, setShaking] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastExiting, setToastExiting] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('+94 71 234 5678');
  const dropdownRef = useRef(null);
  const prevCountRef = useRef(0);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            setReadIds(new Set(data.readAnnouncements || []));
          }
        } catch (e) {
          console.warn('NotificationBell: Error fetching user data:', e.message);
        }
      }
    });
    return () => unsub();
  }, []);

  // Fetch GN officer emergency contact
  useEffect(() => {
    if (!userData?.gnDiv) return;
    const fetchGN = async () => {
      try {
        const gnDoc = await getDoc(doc(db, 'gnOfficers', userData.gnDiv));
        if (gnDoc.exists()) {
          setEmergencyContact(gnDoc.data().emergencyContact || gnDoc.data().mobile || '+94 71 234 5678');
        }
      } catch (e) {
        console.warn('NotificationBell: Error fetching GN contact:', e.message);
      }
    };
    fetchGN();
  }, [userData?.gnDiv]);

  // Real-time announcements listener using onSnapshot
  useEffect(() => {
    if (!userData?.gnDiv) return;

    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          const annGnDiv = data.gnDiv || '';
          const category = data.category || '';
          const isAdmin = annGnDiv === '';
          if (isAdmin) {
            return ['residents', 'all_users'].includes(category);
          }
          return annGnDiv === userData.gnDiv;
        })
        .map(doc => {
          const data = doc.data();
          let priority = 'Normal';
          const pVal = data.priority ? data.priority.charAt(0).toUpperCase() + data.priority.slice(1).toLowerCase() : '';
          if (pVal === 'Urgent') priority = 'Urgent';
          else if (pVal === 'High') priority = 'High';

          return {
            id: doc.id,
            title: data.title || 'Announcement',
            body: data.body || data.description || '',
            priority,
            createdAt: data.createdAt?.toDate?.() || null,
            gnDiv: data.gnDiv || '',
          };
        });

      // Detect new notifications (shake bell)
      const unreadCount = items.filter(n => !readIds.has(n.id)).length;
      if (unreadCount > prevCountRef.current && prevCountRef.current >= 0) {
        setShaking(true);
        setTimeout(() => setShaking(false), 700);
      }
      prevCountRef.current = unreadCount;

      setNotifications(items);
    }, (error) => {
      console.error('NotificationBell: Firestore listener error:', error);
    });

    return () => unsub();
  }, [userData?.gnDiv, readIds]);

  // Initialize FCM and listen for foreground messages
  useEffect(() => {
    if (!userData?.gnDiv) return;

    const setupFCM = async () => {
      await initializeMessaging();
      await requestNotificationPermission(userData.gnDiv);

      onForegroundMessage((payload) => {
        // Show in-app toast
        setToast({
          title: payload.notification?.title || 'New Notification',
          body: payload.notification?.body || '',
        });
        setToastExiting(false);

        // Shake bell
        setShaking(true);
        setTimeout(() => setShaking(false), 700);

        // Auto-dismiss toast
        setTimeout(() => {
          setToastExiting(true);
          setTimeout(() => setToast(null), 300);
        }, 5000);
      });
    };

    setupFCM();
  }, [userData?.gnDiv]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    if (readIds.has(id)) return;
    setReadIds(prev => new Set([...prev, id]));
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          readAnnouncements: arrayUnion(id),
        });
      } catch (e) {
        console.warn('Mark read error:', e.message);
      }
    }
  }, [readIds, currentUser]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !readIds.has(n.id)).map(n => n.id);
    if (unreadIds.length === 0) return;
    const allIds = [...readIds, ...unreadIds];
    setReadIds(new Set(allIds));
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          readAnnouncements: allIds,
        });
      } catch (e) {
        console.warn('Mark all read error:', e.message);
      }
    }
  }, [notifications, readIds, currentUser]);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    navigate('/announcements');
  };

  // Dismiss toast
  const dismissToast = () => {
    setToastExiting(true);
    setTimeout(() => setToast(null), 300);
  };

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  return (
    <>
      <div className={`notification-bell ${shaking ? 'notification-bell-shake' : ''}`} ref={dropdownRef}>
        {/* Bell Button */}
        <button
          className="notification-bell-btn"
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          aria-label="Notifications"
          id="notification-bell-btn"
        >
          <span className="notification-bell-icon">
            <Icon d={BELL_PATH} size={18} color="#5a3a00" />
          </span>
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <>
            <div className="notification-overlay" onClick={() => setIsOpen(false)} />
            <div className="notification-dropdown">
              {/* Header */}
              <div className="notification-dropdown-header">
                <h3>Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
                <div className="header-actions">
                  {unreadCount > 0 && (
                    <button
                      className="notification-mark-read-btn"
                      onClick={markAllAsRead}
                      id="mark-all-read-btn"
                    >
                      <Icon d={CHECK_PATH} size={10} color="currentColor" strokeWidth={2.5} /> Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <div className="notification-empty-icon">
                      <Icon d={BELL_PATH} size={24} color="#ccc" />
                    </div>
                    <h4>No notifications yet</h4>
                    <p>Announcements from your GN officer will appear here</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => {
                    const pConfig = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.Normal;
                    const isUnread = !readIds.has(n.id);
                    return (
                      <div
                        key={n.id}
                        className={`notification-item ${isUnread ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                        id={`notification-item-${n.id}`}
                      >
                        <div className={`notification-priority ${pConfig.class}`}>
                          <Icon d={pConfig.icon} size={16} color={pConfig.color} strokeWidth={2} />
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-body">
                            {n.body.length > 80 ? n.body.slice(0, 80) + '…' : n.body}
                          </div>
                          <div className="notification-time">{timeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* View All */}
              {notifications.length > 0 && (
                <button
                  className="notification-view-all"
                  onClick={() => { setIsOpen(false); navigate('/announcements'); }}
                  id="view-all-notifications-btn"
                >
                  View All Announcements →
                </button>
              )}

              {/* Emergency Hotline */}
              <a
                href={`tel:${emergencyContact.replace(/[^0-9+]/g, '')}`}
                className="notification-hotline"
                id="emergency-hotline-link"
              >
                <div className="notification-hotline-icon">
                  <Icon d={PHONE_PATH} size={14} color="#fff" strokeWidth={2} />
                </div>
                <div>
                  <div className="notification-hotline-text">🚨 Emergency Hotline</div>
                  <div className="notification-hotline-number">{emergencyContact}</div>
                </div>
              </a>
            </div>
          </>
        )}
      </div>

      {/* Foreground Toast */}
      {toast && (
        <div className={`notification-toast ${toastExiting ? 'toast-exit' : ''}`}>
          <div className="toast-icon">
            <Icon d={BELL_PATH} size={18} color="#fff" />
          </div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-body">{toast.body}</div>
          </div>
          <button className="toast-close" onClick={dismissToast}>
            <Icon d={CLOSE_PATH} size={14} />
          </button>
        </div>
      )}
    </>
  );
};

export default NotificationBell;
