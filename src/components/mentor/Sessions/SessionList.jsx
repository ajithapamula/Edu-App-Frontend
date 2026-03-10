// src/components/mentor/Sessions/SessionsList.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Alert,
  Snackbar,
  Chip,
  Button,
  IconButton,
  TablePagination,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  VideoLibrary,
  CalendarMonth,
  AccessTime,
  Link as LinkIcon,
  School,
  Person,
  OpenInNew,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { sessionsAPI } from '../../../services/API/sessions';

/* ── inject fonts ── */
const _styleTag = document.getElementById('mentor-session-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'mentor-session-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes msFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ── shared tokens ── */
const headingFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bodyFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const cardBase = {
  background: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #e8ecf2',
  boxShadow: '0 2px 12px rgba(30,58,138,0.06)',
};

/* ───────────── Status helper ───────────── */
const getSessionStatusInfo = (status) => {
  const s = String(status || '').toLowerCase();
  const map = {
    scheduled:  { label: 'Scheduled',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    active:     { label: 'Active',     color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    completed:  { label: 'Completed',  color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
    cancelled:  { label: 'Cancelled',  color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    ongoing:    { label: 'Ongoing',    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  };
  return map[s] || { label: status || 'Unknown', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try { return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return dateString; }
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  try { return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  catch { return ''; }
};

/* ───────────── Shimmer ───────────── */
const SessionsShimmer = ({ rows = 5 }) => (
  <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <Skeleton variant="circular" width={36} height={36} />
      <Skeleton variant="text" width={260} height={44} sx={{ borderRadius: 2 }} />
    </Box>
    <Paper sx={{ ...cardBase, p: 2.5, mb: 2.5 }}>
      <Box display="flex" gap={4}>
        <Skeleton variant="text" width={140} />
        <Skeleton variant="text" width={160} />
        <Skeleton variant="text" width={130} />
      </Box>
    </Paper>
    <Paper sx={{ ...cardBase, overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ background: '#f8fafc' }}>
            {['#', 'DATE', 'TIME', 'DURATION', 'SESSION LINK', 'STATUS'].map((h, i) => (
              <TableCell key={i}><Skeleton variant="text" width={70} height={16} /></TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }, (_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton variant="rounded" width={36} height={26} sx={{ borderRadius: '6px' }} /></TableCell>
              <TableCell><Skeleton variant="text" width={120} /></TableCell>
              <TableCell><Skeleton variant="text" width={100} /></TableCell>
              <TableCell><Skeleton variant="text" width={80} /></TableCell>
              <TableCell><Skeleton variant="text" width={140} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={75} height={24} sx={{ borderRadius: '6px' }} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </Box>
);

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const MentorSessionsList = () => {
  const [sessions, setSessions] = useState([]);
  const [batchInfo, setBatchInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { batchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get batch info from route state (passed from BatchList)
  const routeState = location.state || {};

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // mentorGetByBatch reads mentor_id & org_id from localStorage internally
      const response = await sessionsAPI.mentorGetByBatch(batchId);

      setBatchInfo({
        batchCode: response.Batch_Code || routeState.batchCode || '',
        courseName: response.Course_Name || routeState.courseName || '',
        trainerName: response.Trainer_Name || routeState.trainerName || '',
        trainerId: response.Trainer_ID || routeState.trainerId || '',
        mentorName: response.Mentor_Name || '',
        totalSessions: response.Total_Sessions || 0,
      });

      setSessions(Array.isArray(response.Sessions) ? response.Sessions : []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, [batchId]);

  const getDuration = (start, end) => {
    if (!start || !end) return '—';
    try {
      const diffMs = new Date(end) - new Date(start);
      if (diffMs <= 0) return '—';
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
      if (hours > 0) return `${hours}h`;
      return `${mins}m`;
    } catch { return '—'; }
  };

  if (loading) return <SessionsShimmer rows={5} />;

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>{error}</Alert>
      </Snackbar>

      {/* ═══════════ HEADER ═══════════ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, animation: 'msFadeUp 0.5s ease-out both' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/mentor/batches')}
            sx={{
              width: 38, height: 38, borderRadius: '10px',
              background: '#fff', border: '1px solid #e8ecf2',
              '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' },
            }}
          >
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #0d9488, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(13,148,136,0.25)',
          }}>
            <VideoLibrary sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...headingFont, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>
              Sessions
            </Typography>
            <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>
              {batchInfo.batchCode || 'Batch'} • {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<Refresh sx={{ fontSize: 18 }} />}
          onClick={fetchSessions}
          disabled={loading}
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.82rem',
            textTransform: 'none', borderRadius: '10px', border: '1.5px solid #e8ecf2', color: '#475569',
            px: 2, py: 0.85,
            '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' },
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* ═══════════ BATCH INFO CARD ═══════════ */}
      <Paper elevation={0} sx={{ ...cardBase, p: 2.5, mb: 2.5, animation: 'msFadeUp 0.5s ease-out 0.1s both' }}>
        <Box display="flex" gap={4} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1}>
            <School sx={{ fontSize: 16, color: '#0ea5e9' }} />
            <Typography sx={{ ...bodyFont, fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
              {batchInfo.batchCode || '—'}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography sx={{ ...bodyFont, fontSize: '0.78rem', color: '#94a3b8' }}>Course:</Typography>
            <Typography sx={{ ...bodyFont, fontSize: '0.84rem', fontWeight: 500, color: '#334155' }}>
              {batchInfo.courseName || '—'}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Person sx={{ fontSize: 16, color: '#0d9488' }} />
            <Typography sx={{ ...bodyFont, fontSize: '0.78rem', color: '#94a3b8' }}>Trainer:</Typography>
            <Typography sx={{ ...bodyFont, fontSize: '0.84rem', fontWeight: 500, color: '#334155' }}>
              {batchInfo.trainerName || '—'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* ═══════════ TABLE ═══════════ */}
      {sessions.length === 0 ? (
        <Paper elevation={0} sx={{ ...cardBase, p: 5, textAlign: 'center', animation: 'msFadeUp 0.5s ease-out 0.2s both' }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '16px', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(14,165,233,0.04))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <VideoLibrary sx={{ color: '#0d9488', fontSize: 32 }} />
          </Box>
          <Typography sx={{ ...headingFont, fontSize: '1.1rem', mb: 1 }}>No Sessions Found</Typography>
          <Typography sx={{ ...bodyFont, fontSize: '0.88rem', color: '#64748b' }}>
            No sessions have been created by the trainer for this batch yet.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ ...cardBase, overflow: 'hidden', animation: 'msFadeUp 0.5s ease-out 0.2s both' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  {['#', 'Date', 'Time', 'Duration', 'Session Link', 'Status'].map((h) => (
                    <TableCell key={h} sx={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                      fontSize: '0.73rem', color: '#1e3a8a', textTransform: 'uppercase',
                      letterSpacing: '0.06em', borderBottom: '2px solid #e8ecf2', py: 1.5,
                    }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((session, index) => {
                    const statusInfo = getSessionStatusInfo(session.Status);
                    return (
                      <TableRow
                        key={session.Session_ID}
                        sx={{
                          transition: 'background 0.2s ease',
                          '&:hover': { background: '#f8fafc' },
                          '&:last-child td': { borderBottom: 'none' },
                        }}
                      >
                        {/* Session Number */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Chip
                            label={page * rowsPerPage + index + 1}
                            size="small"
                            sx={{
                              height: 26, minWidth: 36, fontSize: '0.76rem',
                              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                              background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd',
                            }}
                          />
                        </TableCell>

                        {/* Date */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <CalendarMonth sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography sx={{ ...bodyFont, fontSize: '0.84rem', fontWeight: 500, color: '#334155' }}>
                              {formatDate(session.Start_DateTime)}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Time */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <AccessTime sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Box>
                              <Typography sx={{ ...bodyFont, fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>
                                {formatTime(session.Start_DateTime)}
                              </Typography>
                              {session.End_DateTime && (
                                <Typography sx={{ ...bodyFont, fontSize: '0.7rem', color: '#94a3b8' }}>
                                  to {formatTime(session.End_DateTime)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Duration */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Typography sx={{ ...bodyFont, fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>
                            {getDuration(session.Start_DateTime, session.End_DateTime)}
                          </Typography>
                        </TableCell>

                        {/* Session Link */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          {session.Session_Link ? (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
                              endIcon={<OpenInNew sx={{ fontSize: 12 }} />}
                              onClick={() => window.open(session.Session_Link, '_blank')}
                              sx={{
                                fontFamily: '"DM Sans", sans-serif', fontSize: '0.76rem', fontWeight: 600,
                                textTransform: 'none', borderRadius: '8px',
                                border: '1px solid #bae6fd', color: '#0ea5e9',
                                py: 0.4, px: 1.5,
                                '&:hover': { background: '#f0f9ff', borderColor: '#0ea5e9' },
                              }}
                            >
                              Join Link
                            </Button>
                          ) : (
                            <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#94a3b8' }}>
                              No link
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              height: 24, fontSize: '0.7rem',
                              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                              background: statusInfo.bg, color: statusInfo.color,
                              border: `1px solid ${statusInfo.border}`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={sessions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            sx={{
              borderTop: '1px solid #f1f5f9',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.82rem', color: '#64748b',
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default MentorSessionsList;