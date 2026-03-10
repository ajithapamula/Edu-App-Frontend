// src/components/trainer/Batches/BatchList.jsx

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
  ViewList,
  ViewModule,
  MoreVert,
  MeetingRoom,
  TipsAndUpdates,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { batchesAPI } from '../../../services/API/batches';
import TrainerQuickTipDialog from './QuickTipDialog';

const getStatusInfo = (status) => {
  const s = String(status).toLowerCase();
  const map = {
    active:    { label: 'Active',    color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    completed: { label: 'Completed', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    upcoming:  { label: 'Upcoming',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    inactive:  { label: 'Inactive',  color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
    ongoing:   { label: 'Ongoing',   color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    '1':       { label: 'Active',    color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    '0':       { label: 'Inactive',  color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  };
  return map[s] || { label: status || 'Unknown', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateString; }
};

const BatchListShimmer = ({ rows = 6 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);
  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '14px' }} />
          <Box><Skeleton variant="text" width={220} height={36} /><Skeleton variant="text" width={340} height={18} /></Box>
        </Box>
      </Box>
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
        <Box display="flex" gap={2} alignItems="center">
          <Skeleton variant="rounded" width="100%" height={42} sx={{ borderRadius: '10px', maxWidth: 460 }} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="rounded" width={140} height={42} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" width={100} height={42} sx={{ borderRadius: '10px' }} />
        </Box>
      </Paper>
      <Paper elevation={0} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <Box sx={{ height: 3, background: 'linear-gradient(90deg, #E2E8F0, #F1F5F9, #E2E8F0)' }} />
        <Table><TableHead><TableRow sx={{ bgcolor: '#FAFBFD' }}>
          {['BATCH CODE', 'COURSE', 'STRENGTH', 'DURATION', 'TIMINGS', 'STATUS', 'ACTIONS'].map((h) => (
            <TableCell key={h}><Skeleton variant="text" width={70} height={16} /></TableCell>
          ))}
        </TableRow></TableHead><TableBody>
          {shimmerRows.map((i) => (
            <TableRow key={i}>
              <TableCell><Skeleton variant="rounded" width={90} height={36} sx={{ borderRadius: '10px' }} /></TableCell>
              <TableCell><Skeleton variant="text" width={160} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={50} height={30} sx={{ borderRadius: '8px' }} /></TableCell>
              <TableCell><Skeleton variant="text" width={180} /></TableCell>
              <TableCell><Skeleton variant="text" width={100} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={70} height={26} sx={{ borderRadius: '6px' }} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: '9px' }} /></TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </Paper>
    </Box>
  );
};

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [trainerName, setTrainerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
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
      const response = await batchesAPI.getAll();
      setTrainerName(response.Trainer_Name || '');
      const batchesData = response.Batches || [];
      if (Array.isArray(batchesData)) {
        setBatches(batchesData);
      } else {
        console.error('Unexpected API response structure:', response);
        setError('Failed to load batches: Invalid response format');
        setBatches([]);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError(error.message || 'Failed to load batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const uniqueStatuses = [...new Set(batches.map(b => getStatusInfo(b.Status).label))];

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = (batch.Batch_Code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (batch.Course_Name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getStatusInfo(batch.Status).label === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMenuOpen = (event, batch) => { event.stopPropagation(); setMenuAnchorEl(event.currentTarget); setMenuBatch(batch); };
  const handleMenuClose = () => { setMenuAnchorEl(null); setMenuBatch(null); };
  const handleViewStudents = (batchId) => { handleMenuClose(); navigate(`/trainer/batches/${batchId}/students`); };
  const handleViewSessions = (batchId) => { handleMenuClose(); navigate(`/trainer/batches/${batchId}/sessions`); };

  // ── Quick Tip handlers ──
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
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ borderRadius: '12px', fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>{error}</Alert>
      </Snackbar>

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(124,58,237,0.3)', flexShrink: 0 }}>
            <Groups sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} mb={0.3}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.75rem', letterSpacing: '-0.025em' }}>My Batches</Typography>
              <Chip label={`${filteredBatches.length} batch${filteredBatches.length !== 1 ? 'es' : ''}`} size="small" sx={{ bgcolor: '#F3E8FF', color: '#7C3AED', fontWeight: 700, fontSize: '0.72rem', height: 26, borderRadius: '8px', border: '1px solid #DDD6FE' }} />
            </Box>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', maxWidth: 480, lineHeight: 1.5 }}>View all batches assigned to you and manage your students</Typography>
          </Box>
        </Box>
      </Box>

      {/* FILTERS */}
      <Paper elevation={0} sx={{ p: 1.5, mb: 3, borderRadius: '14px', border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <TextField placeholder="Search by batch code or course..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment> }}
            sx={{ flex: 1, maxWidth: 460, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#FAFBFD', '& fieldset': { borderColor: '#E2E8F0' }, '&:hover fieldset': { borderColor: '#93C5FD' }, '&.Mui-focused fieldset': { borderColor: '#7C3AED', borderWidth: 1.5 }, '&.Mui-focused': { bgcolor: '#fff' } }, '& .MuiInputBase-input': { fontSize: '0.88rem' } }} />
          <Box sx={{ flex: 1 }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty startAdornment={<FilterList sx={{ color: '#64748B', fontSize: 17, mr: 0.5 }} />}
              sx={{ borderRadius: '10px', bgcolor: '#FAFBFD', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' }, '& .MuiSelect-select': { fontSize: '0.85rem', fontWeight: 500, color: '#334155' } }}>
              <MenuItem value="all">All Status</MenuItem>
              {uniqueStatuses.map((s) => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
            </Select>
          </FormControl>
          <Button variant="text" startIcon={<Refresh sx={{ fontSize: 17 }} />} onClick={fetchBatches} disabled={loading}
            sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem', textTransform: 'none', borderRadius: '10px', px: 2, '&:hover': { bgcolor: '#F1F5F9', color: '#7C3AED' }, transition: 'all 0.2s ease' }}>Refresh</Button>
          <Box sx={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            {[{ mode: 'list', Icon: ViewList }, { mode: 'grid', Icon: ViewModule }].map(({ mode, Icon }) => (
              <IconButton key={mode} size="small" onClick={() => setViewMode(mode)}
                sx={{ borderRadius: 0, width: 36, height: 36, bgcolor: viewMode === mode ? '#F3E8FF' : 'transparent', color: viewMode === mode ? '#7C3AED' : '#94A3B8', '&:hover': { bgcolor: '#F3E8FF', color: '#7C3AED' }, transition: 'all 0.15s ease' }}>
                <Icon sx={{ fontSize: 19 }} />
              </IconButton>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* CONTENT */}
      {filteredBatches.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '20px', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, fontSize: 36 }}>📋</Box>
          <Typography sx={{ color: '#334155', fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>No Batches Found</Typography>
          <Typography sx={{ color: '#94A3B8', mb: 3, maxWidth: 380, mx: 'auto', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {batches.length === 0 ? 'No batches have been assigned to you yet.' : 'No batches match your current filters. Try adjusting your search.'}
          </Typography>
        </Paper>
      ) : viewMode === 'list' ? (
        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <Box sx={{ height: 3, background: 'linear-gradient(90deg, #7C3AED 0%, #A78BFA 50%, #06B6D4 100%)' }} />
          <TableContainer><Table>
            <TableHead><TableRow sx={{ bgcolor: '#FAFBFD', '& .MuiTableCell-head': { color: '#94A3B8', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #E2E8F0', py: 2 } }}>
              <TableCell sx={{ pl: 3 }}>Batch Code</TableCell><TableCell>Course</TableCell><TableCell sx={{ textAlign: 'center' }}>Strength</TableCell>
              <TableCell>Duration</TableCell><TableCell>Timings</TableCell><TableCell sx={{ textAlign: 'center' }}>Status</TableCell><TableCell sx={{ textAlign: 'center' }}>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {filteredBatches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((batch) => {
                const statusInfo = getStatusInfo(batch.Status);
                return (
                  <TableRow key={batch.Batch_ID} sx={{ transition: 'all 0.15s ease', cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC', '& .batch-code-box': { bgcolor: '#F3E8FF', color: '#7C3AED' } }, '& .MuiTableCell-root': { borderBottom: '1px solid #F1F5F9', py: 1.8 } }}
                    onClick={() => handleViewStudents(batch.Batch_ID)}>
                    <TableCell sx={{ pl: 3 }}><Box className="batch-code-box" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, borderRadius: '10px', bgcolor: '#F1F5F9', transition: 'all 0.2s ease' }}><School sx={{ fontSize: 16, color: '#7C3AED' }} /><Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>{batch.Batch_Code || '—'}</Typography></Box></TableCell>
                    <TableCell><Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#1E293B' }}>{batch.Course_Name || '—'}</Typography></TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.5, borderRadius: '8px', bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}><Groups sx={{ fontSize: 15, color: '#2563EB' }} /><Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#2563EB' }}>{batch.Strength ?? '—'}</Typography></Box></TableCell>
                    <TableCell><Box display="flex" alignItems="center" gap={0.8}><CalendarMonth sx={{ fontSize: 15, color: '#94A3B8' }} /><Box><Typography sx={{ color: '#334155', fontSize: '0.82rem', fontWeight: 500 }}>{formatDate(batch.Start_Date)}</Typography><Typography sx={{ color: '#CBD5E1', fontSize: '0.7rem' }}>to {formatDate(batch.End_Date)}</Typography></Box></Box></TableCell>
                    <TableCell><Box display="flex" alignItems="center" gap={0.5}><AccessTime sx={{ fontSize: 14, color: '#94A3B8' }} /><Typography sx={{ color: '#64748B', fontSize: '0.82rem', fontWeight: 500 }}>{batch.Batch_timings || '—'}</Typography></Box></TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={statusInfo.label} size="small" sx={{ height: 26, fontSize: '0.72rem', fontWeight: 700, bgcolor: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`, borderRadius: '8px', '& .MuiChip-label': { px: 1.2 } }} /></TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><IconButton onClick={(e) => handleMenuOpen(e, batch)} sx={{ width: 34, height: 34, borderRadius: '9px', color: '#94A3B8', border: '1px solid transparent', '&:hover': { bgcolor: '#F3E8FF', color: '#7C3AED', borderColor: '#DDD6FE' }, transition: 'all 0.2s ease' }}><MoreVert sx={{ fontSize: 19 }} /></IconButton></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></TableContainer>
          <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredBatches.length} rowsPerPage={rowsPerPage} page={page}
            onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            sx={{ borderTop: '1px solid #F1F5F9', '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: '#64748B' } }} />
        </Paper>
      ) : (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 2.5 }}>
            {filteredBatches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((batch) => {
              const statusInfo = getStatusInfo(batch.Status);
              return (
                <Paper key={batch.Batch_ID} elevation={0} onClick={() => handleViewStudents(batch.Batch_ID)}
                  sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { borderColor: '#DDD6FE', boxShadow: '0 8px 30px rgba(124,58,237,0.08)', transform: 'translateY(-3px)', '& .grid-accent': { opacity: 1 } } }}>
                  <Box className="grid-accent" sx={{ height: 4, bgcolor: '#7C3AED', opacity: 0.5, transition: 'opacity 0.25s ease' }} />
                  <Box sx={{ p: 2.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}><School sx={{ fontSize: 18, color: '#7C3AED' }} /><Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>{batch.Batch_Code || '—'}</Typography></Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Chip label={statusInfo.label} size="small" sx={{ height: 24, fontSize: '0.65rem', fontWeight: 700, bgcolor: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`, borderRadius: '6px', '& .MuiChip-label': { px: 1 } }} />
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, batch)} sx={{ width: 28, height: 28, color: '#94A3B8', '&:hover': { bgcolor: '#F3E8FF', color: '#7C3AED' } }}><MoreVert sx={{ fontSize: 16 }} /></IconButton>
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: '#334155', lineHeight: 1.4, mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5em' }}>{batch.Course_Name || 'Unnamed Course'}</Typography>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box display="flex" alignItems="center" gap={0.5}><Groups sx={{ fontSize: 15, color: '#2563EB' }} /><Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#2563EB' }}>{batch.Strength ?? '—'} students</Typography></Box>
                      {batch.Batch_timings && (<Box display="flex" alignItems="center" gap={0.5}><AccessTime sx={{ fontSize: 14, color: '#94A3B8' }} /><Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>{batch.Batch_timings}</Typography></Box>)}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
                      <Box display="flex" alignItems="center" gap={0.5}><CalendarMonth sx={{ fontSize: 13, color: '#94A3B8' }} /><Typography sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>{formatDate(batch.Start_Date)} — {formatDate(batch.End_Date)}</Typography></Box>
                      <Visibility sx={{ fontSize: 16, color: '#CBD5E1' }} />
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
          <Paper elevation={0} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', mt: 2 }}>
            <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredBatches.length} rowsPerPage={rowsPerPage} page={page}
              onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{ '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: '#64748B' } }} />
          </Paper>
        </Box>
      )}

      {/* 3-DOT DROPDOWN MENU */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ elevation: 3, sx: { borderRadius: '12px', minWidth: 180, mt: 0.5, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          '& .MuiMenuItem-root': { fontSize: '0.88rem', fontWeight: 500, py: 1.2, px: 2, gap: 1.5, borderRadius: '8px', mx: 0.5, my: 0.2, transition: 'all 0.15s ease' } } }}>
        <MenuItem onClick={() => menuBatch && handleViewStudents(menuBatch.Batch_ID)} sx={{ color: '#334155', '&:hover': { bgcolor: '#F3E8FF', color: '#7C3AED' } }}>
          <Visibility sx={{ fontSize: 18, color: '#7C3AED' }} /> View Students
        </MenuItem>
        <MenuItem onClick={() => menuBatch && handleViewSessions(menuBatch.Batch_ID)} sx={{ color: '#334155', '&:hover': { bgcolor: '#EFF6FF', color: '#2563EB' } }}>
          <MeetingRoom sx={{ fontSize: 18, color: '#2563EB' }} /> Sessions
        </MenuItem>
        {/* ── NEW: Quick Tip Menu Item ── */}
        <MenuItem onClick={() => menuBatch && handleQuickTip(menuBatch)} sx={{ color: '#334155', '&:hover': { bgcolor: '#FFFBEB', color: '#D97706' } }}>
          <TipsAndUpdates sx={{ fontSize: 18, color: '#F59E0B' }} /> Quick Tip
        </MenuItem>
      </Menu>

      {/* ── Quick Tip Dialog ── */}
      <TrainerQuickTipDialog
        open={quickTipOpen}
        onClose={handleQuickTipClose}
        batch={quickTipBatch}
      />
    </Box>
  );
};

export default BatchList;