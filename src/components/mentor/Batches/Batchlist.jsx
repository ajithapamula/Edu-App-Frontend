// src/components/mentor/Batches/BatchList.jsx

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
  TextField,
  TablePagination,
  Skeleton,
  Alert,
  Snackbar,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search,
  Refresh,
  Visibility,
  Groups,
  CalendarMonth,
  School,
  AccessTime,
  FilterList,
  Person,
  MoreVert,
  VideoLibrary,
  TipsAndUpdates,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mentorBatchesAPI } from '../../../services/API/batches';
import QuickTipDialog from './QuickTipDialog';

/* ── inject fonts ── */
const _styleTag = document.getElementById('mentor-batch-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'mentor-batch-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes mbFadeUp {
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
const getStatusInfo = (status) => {
  const s = String(status).toLowerCase();
  const map = {
    active:    { label: 'Active',    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    completed: { label: 'Completed', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
    upcoming:  { label: 'Upcoming',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    inactive:  { label: 'Inactive',  color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
    '1':       { label: 'Active',    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    '0':       { label: 'Inactive',  color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  };
  return map[s] || { label: status || 'Unknown', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try { return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return dateString; }
};

/* ───────────── Shimmer ───────────── */
const BatchListShimmer = ({ rows = 6 }) => (
  <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Skeleton variant="text" width={220} height={44} sx={{ borderRadius: 2 }} />
    </Box>
    <Paper sx={{ ...cardBase, p: 2.5, mb: 2.5 }}>
      <Box display="flex" gap={2} alignItems="center">
        <Skeleton variant="rectangular" width={340} height={42} sx={{ borderRadius: '10px' }} />
        <Skeleton variant="rectangular" width={140} height={42} sx={{ borderRadius: '10px' }} />
        <Skeleton variant="rectangular" width={100} height={42} sx={{ borderRadius: '10px' }} />
      </Box>
    </Paper>
    <Paper sx={{ ...cardBase, overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ background: '#f8fafc' }}>
            {['BATCH CODE', 'COURSE', 'TRAINER', 'STRENGTH', 'DURATION', 'STATUS', ''].map((h, i) => (
              <TableCell key={i}><Skeleton variant="text" width={70} height={16} /></TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }, (_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton variant="rounded" width={90} height={30} sx={{ borderRadius: '8px' }} /></TableCell>
              <TableCell><Skeleton variant="text" width={160} /></TableCell>
              <TableCell><Skeleton variant="text" width={120} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={50} height={26} sx={{ borderRadius: '6px' }} /></TableCell>
              <TableCell><Skeleton variant="text" width={140} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={65} height={24} sx={{ borderRadius: '6px' }} /></TableCell>
              <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </Box>
);

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const MentorBatchList = () => {
  const [batches, setBatches] = useState([]);
  const [mentorName, setMentorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);

  // ── Menu state for 3-dot dropdown ──
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuBatch, setMenuBatch] = useState(null);

  // ── Quick Tip Dialog state ──
  const [quickTipOpen, setQuickTipOpen] = useState(false);
  const [quickTipBatch, setQuickTipBatch] = useState(null);

  const navigate = useNavigate();

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mentorBatchesAPI.getAll();
      setMentorName(response.Mentor_Name || '');
      setBatches(Array.isArray(response.Batches) ? response.Batches : []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err.message || 'Failed to load batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const uniqueStatuses = [...new Set(batches.map(b => getStatusInfo(b.Status).label))];

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      (batch.Batch_Code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (batch.Course_Name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (batch.Trainer_Name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getStatusInfo(batch.Status).label === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Menu handlers ──
  const handleMenuOpen = (event, batch) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuBatch(batch);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuBatch(null);
  };

  const handleViewStudents = (batchId) => {
    handleMenuClose();
    navigate(`/mentor/batches/${batchId}/students`);
  };

  const handleViewSessions = (batch) => {
    handleMenuClose();
    navigate(`/mentor/batches/${batch.Batch_ID}/sessions`, {
      state: {
        batchId: batch.Batch_ID,
        batchCode: batch.Batch_Code,
        courseName: batch.Course_Name,
        trainerId: batch.Trainer_ID,
        trainerName: batch.Trainer_Name,
      },
    });
  };

  // ── Quick Tip handler ──
  const handleQuickTip = (batch) => {
    handleMenuClose();
    setQuickTipBatch(batch);
    setQuickTipOpen(true);
  };

  const handleQuickTipClose = () => {
    setQuickTipOpen(false);
    setQuickTipBatch(null);
  };

  if (loading) return <BatchListShimmer rows={6} />;

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>{error}</Alert>
      </Snackbar>

      {/* ═══════════ HEADER ═══════════ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, animation: 'mbFadeUp 0.5s ease-out both' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
          }}>
            <Groups sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...headingFont, fontSize: { xs: '1.3rem', md: '1.55rem' }, lineHeight: 1.2 }}>
              My Batches
            </Typography>
            <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>
              {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''} assigned to you
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ═══════════ FILTERS ═══════════ */}
      <Paper elevation={0} sx={{ ...cardBase, p: 2.5, mb: 2.5, animation: 'mbFadeUp 0.5s ease-out 0.1s both' }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search by batch, course, or trainer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              flex: 1, maxWidth: 460,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem',
                background: '#f8fafc',
                '& fieldset': { borderColor: '#e8ecf2' },
                '&:hover fieldset': { borderColor: '#bfdbfe' },
                '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '1.5px' },
              },
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              startAdornment={<FilterList sx={{ color: '#64748b', fontSize: 17, mr: 0.5 }} />}
              sx={{
                borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem',
                background: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8ecf2' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bfdbfe' },
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              {uniqueStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: 18 }} />}
            onClick={fetchBatches}
            disabled={loading}
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.82rem',
              textTransform: 'none', borderRadius: '10px', border: '1.5px solid #e8ecf2', color: '#475569',
              px: 2, py: 0.85,
              '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' },
              transition: 'all 0.3s ease',
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* ═══════════ TABLE ═══════════ */}
      {filteredBatches.length === 0 ? (
        <Paper elevation={0} sx={{ ...cardBase, p: 5, textAlign: 'center', animation: 'mbFadeUp 0.5s ease-out 0.2s both' }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '16px', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(13,148,136,0.04))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Groups sx={{ color: '#0ea5e9', fontSize: 32 }} />
          </Box>
          <Typography sx={{ ...headingFont, fontSize: '1.1rem', mb: 1 }}>No Batches Found</Typography>
          <Typography sx={{ ...bodyFont, fontSize: '0.88rem', color: '#64748b' }}>
            {batches.length === 0 ? 'No batches have been assigned to you yet.' : 'No batches match your current filters.'}
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ ...cardBase, overflow: 'hidden', animation: 'mbFadeUp 0.5s ease-out 0.2s both' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  {['Batch Code', 'Course', 'Trainer', 'Strength', 'Duration', 'Timings', 'Status', ''].map((h) => (
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
                {filteredBatches
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((batch) => {
                    const statusInfo = getStatusInfo(batch.Status);
                    return (
                      <TableRow
                        key={batch.Batch_ID}
                        sx={{
                          cursor: 'default',
                          transition: 'background 0.2s ease',
                          '&:hover': { background: '#f8fafc' },
                          '&:last-child td': { borderBottom: 'none' },
                        }}
                      >
                        {/* Batch Code */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <School sx={{ fontSize: 16, color: '#0ea5e9' }} />
                            <Typography sx={{ ...bodyFont, fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                              {batch.Batch_Code || '—'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Course */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Typography sx={{ ...bodyFont, fontWeight: 600, fontSize: '0.86rem', color: '#0f172a' }}>
                            {batch.Course_Name || '—'}
                          </Typography>
                        </TableCell>

                        {/* Trainer */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Person sx={{ fontSize: 15, color: '#0d9488' }} />
                            <Typography sx={{ ...bodyFont, fontSize: '0.84rem', fontWeight: 500, color: '#334155' }}>
                              {batch.Trainer_Name || '—'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Strength */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Chip
                            icon={<Groups sx={{ fontSize: 14 }} />}
                            label={batch.Strength ?? '—'}
                            size="small"
                            sx={{
                              height: 26, fontSize: '0.76rem',
                              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                              background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd',
                              '& .MuiChip-icon': { color: '#0ea5e9' },
                            }}
                          />
                        </TableCell>

                        {/* Duration */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <CalendarMonth sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Box>
                              <Typography sx={{ ...bodyFont, fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>
                                {formatDate(batch.Start_Date)}
                              </Typography>
                              <Typography sx={{ ...bodyFont, fontSize: '0.7rem', color: '#94a3b8' }}>
                                to {formatDate(batch.End_Date)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Timings */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <AccessTime sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b' }}>
                              {batch.Batch_timings || '—'}
                            </Typography>
                          </Box>
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

                        {/* ── 3-Dot Menu ── */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, batch)}
                            sx={{
                              width: 34, height: 34, borderRadius: '8px',
                              color: '#475569', background: '#f8fafc', border: '1px solid #e8ecf2',
                              transition: 'all 0.25s ease',
                              '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe', transform: 'translateY(-1px)' },
                            }}
                          >
                            <MoreVert sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Dropdown Menu ── */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                borderRadius: '10px',
                border: '1px solid #e8ecf2',
                boxShadow: '0 4px 20px rgba(30,58,138,0.10)',
                minWidth: 180,
                mt: 0.5,
              },
            }}
          >
            <MenuItem
              onClick={() => menuBatch && handleViewStudents(menuBatch.Batch_ID)}
              sx={{
                py: 1.2, px: 2,
                '&:hover': { background: '#f0f9ff' },
              }}
            >
              <ListItemIcon>
                <Visibility sx={{ fontSize: 18, color: '#0ea5e9' }} />
              </ListItemIcon>
              <ListItemText
                primary="View Students"
                primaryTypographyProps={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#334155',
                }}
              />
            </MenuItem>

            <MenuItem
              onClick={() => menuBatch && handleViewSessions(menuBatch)}
              sx={{
                py: 1.2, px: 2,
                '&:hover': { background: '#f0f9ff' },
              }}
            >
              <ListItemIcon>
                <VideoLibrary sx={{ fontSize: 18, color: '#0d9488' }} />
              </ListItemIcon>
              <ListItemText
                primary="Sessions"
                primaryTypographyProps={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#334155',
                }}
              />
            </MenuItem>

            {/* ── NEW: Quick Tip Menu Item ── */}
            <MenuItem
              onClick={() => menuBatch && handleQuickTip(menuBatch)}
              sx={{
                py: 1.2, px: 2,
                '&:hover': { background: '#fffbeb' },
              }}
            >
              <ListItemIcon>
                <TipsAndUpdates sx={{ fontSize: 18, color: '#f59e0b' }} />
              </ListItemIcon>
              <ListItemText
                primary="Quick Tip"
                primaryTypographyProps={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#334155',
                }}
              />
            </MenuItem>
          </Menu>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredBatches.length}
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

      {/* ── Quick Tip Dialog ── */}
      <QuickTipDialog
        open={quickTipOpen}
        onClose={handleQuickTipClose}
        batch={quickTipBatch}
      />
    </Box>
  );
};

export default MentorBatchList;