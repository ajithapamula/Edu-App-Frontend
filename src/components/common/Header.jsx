import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Badge, Menu, MenuItem,
  Avatar, Box, Divider, ListItemIcon, ListItemText, Button,
  CircularProgress, Chip,
} from '@mui/material';
import {
  NotificationsOutlined, ExitToApp, PersonOutline,
  HelpOutlineOutlined, MenuOutlined, KeyboardArrowDown,
  Assignment, Description, EventNote, DoneAll,
  Circle, GroupAdd, EditNote, UploadFile,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/API/index';

const _headerKf = document.getElementById('header-keyframes') || (() => {
  const style = document.createElement('style');
  style.id = 'header-keyframes';
  style.textContent = `@keyframes headerSlideDown{0%{opacity:0;transform:translateY(-100%)}100%{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(style);
  return style;
})();

// ══════════════════════════════════════════════════════════════
// NOTIFICATION HELPERS
// ══════════════════════════════════════════════════════════════

/** Map notification_type → icon + color */
const getNotifIcon = (type) => {
  switch (type) {
    case 'task_created':
      return { icon: <Assignment sx={{ fontSize: 18 }} />, color: '#2980b9', bg: 'rgba(41,128,185,0.10)', label: 'Task' };
    case 'task_updated':
      return { icon: <EditNote sx={{ fontSize: 18 }} />, color: '#8e44ad', bg: 'rgba(142,68,173,0.10)', label: 'Task Updated' };
    case 'document_uploaded':
      return { icon: <Description sx={{ fontSize: 18 }} />, color: '#0d9488', bg: 'rgba(13,148,136,0.10)', label: 'Document' };
    case 'document_updated':
      return { icon: <UploadFile sx={{ fontSize: 18 }} />, color: '#16a085', bg: 'rgba(22,160,133,0.10)', label: 'Doc Updated' };
    case 'session_created':
      return { icon: <EventNote sx={{ fontSize: 18 }} />, color: '#7b1fa2', bg: 'rgba(123,31,162,0.10)', label: 'Session' };
    case 'batch_assigned':
      return { icon: <GroupAdd sx={{ fontSize: 18 }} />, color: '#e67e22', bg: 'rgba(230,126,34,0.10)', label: 'Batch' };
    default:
      return { icon: <NotificationsOutlined sx={{ fontSize: 18 }} />, color: '#64748b', bg: 'rgba(100,116,139,0.10)', label: 'Notification' };
  }
};

/** Format Created_At to relative time */
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

// Polling interval in ms (30 seconds)
const POLL_INTERVAL = 30000;

// ══════════════════════════════════════════════════════════════
// ROLE-BASED API PATH CONFIG
// ══════════════════════════════════════════════════════════════

const getNotifConfig = (role, userId, orgId) => {
  const r = (role || '').toLowerCase();

  if (r === 'student') {
    return {
      enabled: true,
      listUrl: `/api/student/notifications/${userId}/${orgId}`,
      unreadUrl: `/api/student/notifications/unread-count/${userId}/${orgId}`,
      markReadUrl: (notifId) => `/api/student/notifications/read/${notifId}`,
      markAllUrl: `/api/student/notifications/read-all/${userId}/${orgId}`,
      deleteUrl: (notifId) => `/api/student/notifications/delete/${notifId}?student_id=${userId}&org_id=${orgId}`,
      markReadBody: { student_id: userId, org_id: orgId },
      eventName: 'newStudentNotification',
    };
  }

  if (r === 'mentor') {
    return {
      enabled: true,
      listUrl: `/api/mentor/notifications/${userId}/${orgId}`,
      unreadUrl: `/api/mentor/notifications/unread-count/${userId}/${orgId}`,
      markReadUrl: (notifId) => `/api/mentor/notifications/read/${notifId}`,
      markAllUrl: `/api/mentor/notifications/read-all/${userId}/${orgId}`,
      deleteUrl: (notifId) => `/api/mentor/notifications/delete/${notifId}?mentor_id=${userId}&org_id=${orgId}`,
      markReadBody: { mentor_id: userId, org_id: orgId },
      eventName: 'newMentorNotification',
    };
  }

  if (r === 'trainer') {
    return {
      enabled: true,
      listUrl: `/api/trainer/notifications/${userId}/${orgId}`,
      unreadUrl: `/api/trainer/notifications/unread-count/${userId}/${orgId}`,
      markReadUrl: (notifId) => `/api/trainer/notifications/read/${notifId}`,
      markAllUrl: `/api/trainer/notifications/read-all/${userId}/${orgId}`,
      deleteUrl: (notifId) => `/api/trainer/notifications/delete/${notifId}?trainer_id=${userId}&org_id=${orgId}`,
      markReadBody: { trainer_id: userId, org_id: orgId },
      eventName: 'newTrainerNotification',
    };
  }

  return { enabled: false };
};


const Header = ({ title, onMenuToggle }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ══════════════════════════════════════════════════════════════
  // NOTIFICATION STATE
  // ══════════════════════════════════════════════════════════════
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState(new Set());
  const pollRef = useRef(null);

  const userId = user?.id;
  const orgId = user?.orgId;
  const role = (user?.role || '').toLowerCase();

  const notifConfig = getNotifConfig(role, userId, orgId);
  const notifEnabled = notifConfig.enabled && !!userId && !!orgId;

  // ══════════════════════════════════════════════════════════════
  // FETCH UNREAD COUNT
  // ══════════════════════════════════════════════════════════════
  const fetchUnreadCount = useCallback(async () => {
    if (!notifEnabled) return;
    try {
      const res = await apiRequest(notifConfig.unreadUrl, { method: 'GET' });
      if (res?.Unread_Count !== undefined) {
        setUnreadCount(res.Unread_Count);
      }
    } catch (err) {
      console.error('[Header] Failed to fetch unread count:', err);
    }
  }, [notifEnabled, notifConfig.unreadUrl]);

  // ══════════════════════════════════════════════════════════════
  // FETCH NOTIFICATIONS LIST (called when dropdown opens)
  // ══════════════════════════════════════════════════════════════
  const fetchNotifications = useCallback(async () => {
    if (!notifEnabled) return;
    setLoadingNotifs(true);
    try {
      const res = await apiRequest(
        `${notifConfig.listUrl}?page=1&page_size=15`,
        { method: 'GET' }
      );
      if (res?.Notifications) {
        setNotifications(res.Notifications);
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('[Header] Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  }, [notifEnabled, notifConfig.listUrl, fetchUnreadCount]);

  // ══════════════════════════════════════════════════════════════
  // MARK SINGLE NOTIFICATION AS READ + DELETE
  // ══════════════════════════════════════════════════════════════
  const handleMarkRead = async (notifId) => {
    if (!notifEnabled || markingIds.has(notifId)) return;

    setMarkingIds((prev) => new Set(prev).add(notifId));
    try {
      // Step 1: Mark as read
      await apiRequest(
        notifConfig.markReadUrl(notifId),
        {
          method: 'PUT',
          body: JSON.stringify(notifConfig.markReadBody),
        }
      );
      // Step 2: Delete from DB
      await apiRequest(notifConfig.deleteUrl(notifId), { method: 'DELETE' });
      // Step 3: Remove from local list
      setNotifications((prev) => prev.filter((n) => n.Notification_ID !== notifId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Header] Failed to mark+delete notification:', err);
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(notifId);
        return next;
      });
    }
  };

  // ══════════════════════════════════════════════════════════════
  // MARK ALL AS READ + DELETE ALL
  // ══════════════════════════════════════════════════════════════
  const handleMarkAllRead = async () => {
    if (!notifEnabled || markingAll) return;
    setMarkingAll(true);
    try {
      // Step 1: Mark all as read
      await apiRequest(notifConfig.markAllUrl, { method: 'PUT' });
      // Step 2: Delete each notification from DB
      await Promise.all(
        notifications.map((n) =>
          apiRequest(notifConfig.deleteUrl(n.Notification_ID), { method: 'DELETE' }).catch(() => {})
        )
      );
      // Step 3: Clear local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[Header] Failed to mark all+delete:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // INITIAL FETCH + POLLING
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!notifEnabled) return;

    fetchUnreadCount();

    pollRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [notifEnabled, fetchUnreadCount]);

  // ══════════════════════════════════════════════════════════════
  // RESET STATE WHEN ROLE/USER CHANGES
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    setUnreadCount(0);
    setNotifications([]);
  }, [role, userId]);

  // ══════════════════════════════════════════════════════════════
  // OPEN NOTIFICATION DROPDOWN → fetch latest
  // ══════════════════════════════════════════════════════════════
  const handleNotifOpen = (e) => {
    setNotifAnchor(e.currentTarget);
    if (notifEnabled) {
      fetchNotifications();
    }
  };

  const handleNotifClose = () => {
    setNotifAnchor(null);
  };

  // ══════════════════════════════════════════════════════════════
  // FETCH PROFILE PHOTO BASED ON ROLE
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!user?.id) return;

    const fetchPhoto = async () => {
      try {
        const r = (user.role || '').toLowerCase();
        let url = null;
        if (r === 'student') {
          const res = await apiRequest(`/api/student/photo/${user.id}/`, { method: 'GET' });
          if (res?.success && res?.s3_url) url = res.s3_url;
        } else if (r === 'trainer') {
          const res = await apiRequest(`/api/admin/org/trainer/photo/view/${user.id}`, { method: 'GET' });
          if (res?.Photo_upload) url = res.Photo_upload;
        } else if (r === 'mentor') {
          const res = await apiRequest(`/api/admin/org/mentor/photo/view/${user.id}`, { method: 'GET' });
          if (res?.Photo_upload) url = res.Photo_upload;
        }
        if (url) setProfilePhoto(url);
      } catch {
        // No photo available — fallback to initials
      }
    };
    fetchPhoto();
  }, [user?.id, user?.role]);

  // ══════════════════════════════════════════════════════════════
  // LISTEN FOR PHOTO UPDATES FROM PROFILE PAGES
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const handlePhotoUpdate = (e) => {
      setProfilePhoto(e.detail?.url || null);
    };
    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);
    return () => window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
  }, []);

  // ══════════════════════════════════════════════════════════════
  // LISTEN FOR NAME UPDATES FROM PROFILE PAGES
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleNameUpdate = (e) => {
      if (e.detail?.name) setDisplayName(e.detail.name);
    };
    window.addEventListener('profileNameUpdated', handleNameUpdate);
    return () => window.removeEventListener('profileNameUpdated', handleNameUpdate);
  }, []);

  // ══════════════════════════════════════════════════════════════
  // LISTEN FOR NEW NOTIFICATIONS (from other components)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!notifEnabled || !notifConfig.eventName) return;
    const handleNewNotif = () => {
      fetchUnreadCount();
    };
    window.addEventListener(notifConfig.eventName, handleNewNotif);
    return () => window.removeEventListener(notifConfig.eventName, handleNewNotif);
  }, [notifEnabled, notifConfig.eventName, fetchUnreadCount]);

  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => { logout(); navigate('/login'); handleMenuClose(); };

  const getUserInitials = (name) => name?.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase() || 'U';
  const getRoleLabel = () => { if (!user?.role) return 'Student'; return user.role.charAt(0).toUpperCase() + user.role.slice(1); };
  const getPortalLabel = () => { if (!user?.role) return 'STUDENT PORTAL'; return `${user.role.toUpperCase()} PORTAL`; };

  const getSubtitle = () => {
    if (role === 'student') return 'STUDENT';
    if (role === 'trainer') return 'TRAINER';
    if (role === 'mentor') return 'MENTOR';
    return getRoleLabel().toUpperCase();
  };

  const currentName = displayName || user?.name || 'User';
  const avatarSrc = profilePhoto || null;
  const avatarInitials = getUserInitials(currentName);

  const dropdownUnread = notifications.filter((n) => !n.Is_Read).length;

  return (
    <AppBar
      position="fixed" elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #3B5998 0%, #2D7DD2 50%, #1A8A8A 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 2px 12px rgba(26,138,138,0.30)',
        animation: 'headerSlideDown 0.4s ease-out',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 68, sm: 76 }, px: { xs: 1.5, sm: 2.5 }, display: 'flex', justifyContent: 'space-between' }}>
        {/* ── Brand ── */}
        <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.85 }, minWidth: 'fit-content' }} onClick={() => navigate('/')}>
          {onMenuToggle && (
            <IconButton onClick={(e) => { e.stopPropagation(); onMenuToggle(); }} sx={{ color: 'rgba(255,255,255,0.7)', mr: 0.5, display: { md: 'none' } }}>
              <MenuOutlined />
            </IconButton>
          )}
          <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', color: '#fff', lineHeight: 1 }}>i</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.15, fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif" }}>iMentora</Typography>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>{getPortalLabel()}</Typography>
          </Box>
        </Box>

        {/* ── Right Actions ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 1 } }}>
         <IconButton 
  onClick={() => window.dispatchEvent(new Event('openStudentGuide'))}
  sx={{ color: 'rgba(255,255,255,0.55)', width: 36, height: 36, borderRadius: '9px', display: { xs: 'none', sm: 'flex' }, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } }}
>
  <HelpOutlineOutlined sx={{ fontSize: 20 }} />
</IconButton>

          {/* ── Notification Bell ── */}
          <IconButton onClick={handleNotifOpen} sx={{ color: 'rgba(255,255,255,0.55)', width: 36, height: 36, borderRadius: '9px', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } }}>
            <Badge
              badgeContent={notifEnabled ? unreadCount : 0}
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: '#ef4444',
                  fontSize: '0.6rem',
                  minWidth: 16,
                  height: 16,
                  display: (notifEnabled && unreadCount > 0) ? 'flex' : 'none',
                },
              }}
            >
              <NotificationsOutlined sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          <Box sx={{ width: '1px', height: 28, bgcolor: 'rgba(255,255,255,0.15)', mx: 0.5, display: { xs: 'none', sm: 'block' } }} />

          {/* ── User Chip ── */}
          <Box onClick={handleProfileMenuOpen} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', borderRadius: '10px', px: { xs: 0.5, sm: 1.2 }, py: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.10)' } }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{currentName}</Typography>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.60)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.2 }}>{getSubtitle()}</Typography>
            </Box>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={avatarSrc}
                imgProps={{ referrerPolicy: 'no-referrer', onError: (e) => { e.target.style.display = 'none'; } }}
                sx={{ width: 38, height: 38, fontSize: '0.82rem', fontWeight: 700, background: avatarSrc ? 'transparent' : 'rgba(255,255,255,0.20)', color: '#fff', border: '2px solid rgba(255,255,255,0.25)' }}
              >{avatarInitials}</Avatar>
              <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981', border: '2px solid #2D7DD2' }} />
            </Box>
            <KeyboardArrowDown sx={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', display: { xs: 'none', sm: 'block' } }} />
          </Box>
        </Box>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* NOTIFICATION DROPDOWN MENU                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={handleNotifClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1.5,
              borderRadius: '14px',
              background: '#fff',
              boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
              width: 360,
              maxWidth: '95vw',
              maxHeight: 480,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {/* ── Header Row ── */}
          <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                Notifications
              </Typography>
              {notifEnabled && unreadCount > 0 && (
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.2 }}>
                  {unreadCount} unread
                </Typography>
              )}
            </Box>
            {notifEnabled && dropdownUnread > 0 && (
              <Button
                size="small"
                startIcon={markingAll ? <CircularProgress size={14} /> : <DoneAll sx={{ fontSize: 16 }} />}
                disabled={markingAll}
                onClick={handleMarkAllRead}
                sx={{
                  textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                  color: '#2980b9', borderRadius: '8px', px: 1.2,
                  '&:hover': { bgcolor: 'rgba(41,128,185,0.06)' },
                }}
              >
                Mark all read
              </Button>
            )}
          </Box>

          {/* ── Notification List ── */}
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {!notifEnabled ? (
              <Box sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
                <NotificationsOutlined sx={{ fontSize: 32, color: '#cbd5e1', mb: 1 }} />
                <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  No notifications
                </Typography>
              </Box>
            ) : loadingNotifs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} sx={{ color: '#2980b9' }} />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
                <NotificationsOutlined sx={{ fontSize: 32, color: '#cbd5e1', mb: 1 }} />
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>
                  You're all caught up
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 0.3 }}>
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              notifications.map((notif, idx) => {
                const { icon, color, bg, label } = getNotifIcon(notif.Notification_Type);
                const isUnread = !notif.Is_Read;
                const isMarking = markingIds.has(notif.Notification_ID);

                return (
                  <React.Fragment key={notif.Notification_ID}>
                    <Box
                      onClick={() => {
                        if (isUnread) handleMarkRead(notif.Notification_ID);
                      }}
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        display: 'flex',
                        gap: 1.5,
                        cursor: isUnread ? 'pointer' : 'default',
                        bgcolor: isUnread ? 'rgba(41,128,185,0.04)' : 'transparent',
                        transition: 'background 0.2s ease',
                        '&:hover': isUnread
                          ? { bgcolor: 'rgba(41,128,185,0.08)' }
                          : {},
                        position: 'relative',
                        opacity: isMarking ? 0.6 : 1,
                      }}
                    >
                      {/* Icon */}
                      <Box
                        sx={{
                          width: 38, height: 38, minWidth: 38,
                          borderRadius: '10px', bgcolor: bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: color, flexShrink: 0, mt: 0.2,
                        }}
                      >
                        {icon}
                      </Box>

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box display="flex" alignItems="center" gap={0.8} mb={0.3}>
                          <Typography
                            noWrap
                            sx={{
                              fontSize: '0.82rem',
                              fontWeight: isUnread ? 700 : 500,
                              color: '#0f172a',
                              flex: 1,
                            }}
                          >
                            {notif.Title}
                          </Typography>
                          {isUnread && (
                            <Circle sx={{ fontSize: 8, color: '#2980b9', flexShrink: 0 }} />
                          )}
                        </Box>

                        <Typography
                          sx={{
                            fontSize: '0.74rem',
                            color: '#64748b',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 0.5,
                          }}
                        >
                          {notif.Message}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Chip
                            label={label}
                            size="small"
                            sx={{
                              height: 18, fontSize: '0.55rem', fontWeight: 700,
                              letterSpacing: '0.04em', borderRadius: '5px',
                              bgcolor: bg, color: color,
                            }}
                          />
                          {notif.Batch_Code && (
                            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                              {notif.Batch_Code}
                            </Typography>
                          )}
                          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', ml: 'auto' }}>
                            {timeAgo(notif.Created_At)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {idx < notifications.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(0,0,0,0.04)' }} />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </Box>
        </Menu>

        {/* ── Profile Menu ── */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1.5, borderRadius: '14px', background: '#fff', boxShadow: '0 16px 48px rgba(0,0,0,0.15)', minWidth: 220 } }}
        >
          <Box sx={{ px: 2.5, py: 1.8, textAlign: 'center' }}>
            <Avatar
              src={avatarSrc}
              imgProps={{ referrerPolicy: 'no-referrer', onError: (e) => { e.target.style.display = 'none'; } }}
              sx={{ width: 48, height: 48, fontSize: '1rem', fontWeight: 700, background: avatarSrc ? 'transparent' : 'linear-gradient(135deg, #3B5998 0%, #2D7DD2 100%)', color: '#fff', mx: 'auto', mb: 1, boxShadow: '0 4px 14px rgba(45,125,210,0.30)' }}
            >{avatarInitials}</Avatar>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{currentName}</Typography>
            <Box sx={{ display: 'inline-block', mt: 0.5, px: 1.5, py: 0.2, borderRadius: '50px', bgcolor: 'rgba(45,125,210,0.08)', border: '1px solid rgba(45,125,210,0.15)' }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#2D7DD2', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{getRoleLabel()}</Typography>
            </Box>
          </Box>
          <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', mx: 1.5 }} />

          <MenuItem
            onClick={() => { handleMenuClose(); const r = (user?.role || 'student').toLowerCase(); navigate(`/${r}/profile`); }}
            sx={{ mx: 1, my: 0.5, borderRadius: '10px', py: 1.2, '&:hover': { bgcolor: 'rgba(45,125,210,0.06)' } }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}><PersonOutline sx={{ fontSize: 20, color: '#64748b' }} /></ListItemIcon>
            <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }} />
          </MenuItem>

          <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', mx: 1.5 }} />

          <MenuItem onClick={handleLogout} sx={{ mx: 1, my: 0.5, mb: 1, borderRadius: '10px', py: 1.2, '&:hover': { bgcolor: 'rgba(239,68,68,0.06)' } }}>
            <ListItemIcon sx={{ minWidth: 36 }}><ExitToApp sx={{ fontSize: 20, color: '#ef4444' }} /></ListItemIcon>
            <ListItemText primary="Log Out" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }} />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;