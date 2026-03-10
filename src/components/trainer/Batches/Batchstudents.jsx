// src/components/trainer/Batches/BatchStudents.jsx

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
} from '@mui/material';
import {
  Search,
  Refresh,
  ArrowBack,
  Person,
  Email,
  Phone,
  School,
  Groups,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { batchesAPI } from '../../../services/API/batches';

/* ───────────── Shimmer Loading ───────────── */
const BatchStudentsShimmer = ({ rows = 6 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
        <Box>
          <Skeleton variant="text" width={260} height={36} />
          <Skeleton variant="text" width={360} height={18} />
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
        <Box display="flex" gap={2} alignItems="center">
          <Skeleton variant="rounded" width="100%" height={42} sx={{ borderRadius: '10px', maxWidth: 460 }} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="rounded" width={100} height={42} sx={{ borderRadius: '10px' }} />
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <Box sx={{ height: 3, background: 'linear-gradient(90deg, #E2E8F0, #F1F5F9, #E2E8F0)' }} />
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#FAFBFD' }}>
              {['#', 'STUDENT', 'EMAIL', 'MOBILE', 'QUALIFICATION', 'PASSOUT YEAR'].map((h) => (
                <TableCell key={h}><Skeleton variant="text" width={70} height={16} /></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shimmerRows.map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton variant="text" width={30} /></TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Skeleton variant="circular" width={36} height={36} />
                    <Box>
                      <Skeleton variant="text" width={140} height={20} />
                      <Skeleton variant="text" width={80} height={14} />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Skeleton variant="text" width={180} /></TableCell>
                <TableCell><Skeleton variant="text" width={110} /></TableCell>
                <TableCell><Skeleton variant="text" width={90} /></TableCell>
                <TableCell><Skeleton variant="text" width={50} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const BatchStudents = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [batchInfo, setBatchInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await batchesAPI.getStudentsByBatch(batchId);

      setBatchInfo({
        Batch_ID: response.Batch_ID,
        Batch_Code: response.Batch_Code,
        Course_Name: response.Course_Name,
        Trainer_Name: response.Trainer_Name,
        Total_Students: response.Total_Students,
      });

      const studentsData = response.Students || [];
      if (Array.isArray(studentsData)) {
        setStudents(studentsData);
      } else {
        console.error('Unexpected API response structure:', response);
        setError('Failed to load students: Invalid response format');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(error.message || 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [batchId]);

  /* ── filtered data ── */
  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      (student.Student_Name?.toLowerCase() || '').includes(term) ||
      (student.Student_Code?.toLowerCase() || '').includes(term) ||
      (student.Email?.toLowerCase() || '').includes(term) ||
      (student.Mobile_Number?.toString() || '').includes(term)
    );
  });

  /* ── Avatar color generator ── */
  const getAvatarColor = (name) => {
    const colors = [
      '#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626',
      '#0891B2', '#7C2D12', '#4338CA', '#0D9488', '#BE185D',
    ];
    const idx = (name || '').charCodeAt(0) % colors.length;
    return colors[idx];
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (loading) return <BatchStudentsShimmer rows={6} />;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      {/* ──── Snackbars ──── */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ borderRadius: '12px', fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* ═══════════ HEADER ═══════════ */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          {/* Back Button */}
          <IconButton
            onClick={() => navigate('/trainer/batches')}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: '#F1F5F9',
              color: '#64748B',
              '&:hover': { bgcolor: '#E2E8F0', color: '#334155' },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>

          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              flexShrink: 0,
            }}
          >
            <Groups sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} mb={0.3}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#0F172A',
                  fontSize: '1.75rem',
                  letterSpacing: '-0.025em',
                }}
              >
                {batchInfo.Batch_Code || `Batch #${batchId}`}
              </Typography>
              <Chip
                label={`${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  bgcolor: '#EFF6FF',
                  color: '#2563EB',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 26,
                  borderRadius: '8px',
                  border: '1px solid #BFDBFE',
                }}
              />
            </Box>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', maxWidth: 520, lineHeight: 1.5 }}>
              {batchInfo.Course_Name ? `${batchInfo.Course_Name}` : 'Students enrolled in this batch'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ═══════════ FILTERS ═══════════ */}
      <Paper
        elevation={0}
        sx={{ p: 1.5, mb: 3, borderRadius: '14px', border: '1px solid #E2E8F0', bgcolor: '#fff' }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <TextField
            placeholder="Search by name, code, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#94A3B8', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              maxWidth: 460,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: '#FAFBFD',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#93C5FD' },
                '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1.5 },
                '&.Mui-focused': { bgcolor: '#fff' },
              },
              '& .MuiInputBase-input': { fontSize: '0.88rem' },
            }}
          />

          <Box sx={{ flex: 1 }} />

          <Button
            variant="text"
            startIcon={<Refresh sx={{ fontSize: 17 }} />}
            onClick={fetchStudents}
            disabled={loading}
            sx={{
              color: '#64748B',
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'none',
              borderRadius: '10px',
              px: 2,
              '&:hover': { bgcolor: '#F1F5F9', color: '#2563EB' },
              transition: 'all 0.2s ease',
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* ═══════════ STUDENT TABLE ═══════════ */}
      {filteredStudents.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 8, textAlign: 'center', borderRadius: '16px', border: '1px solid #E2E8F0' }}
        >
          <Box
            sx={{
              width: 80, height: 80, borderRadius: '20px', bgcolor: '#F8FAFC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 3, fontSize: 36,
            }}
          >
            👥
          </Box>
          <Typography sx={{ color: '#334155', fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>
            No Students Found
          </Typography>
          <Typography sx={{ color: '#94A3B8', mb: 3, maxWidth: 380, mx: 'auto', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {students.length === 0
              ? 'No students have been assigned to this batch yet.'
              : 'No students match your search. Try adjusting your filters.'}
          </Typography>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}
        >
          <Box sx={{ height: 3, background: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 100%)' }} />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: '#FAFBFD',
                    '& .MuiTableCell-head': {
                      color: '#94A3B8',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid #E2E8F0',
                      py: 2,
                    },
                  }}
                >
                  <TableCell sx={{ width: 60, pl: 3 }}>#</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Qualification</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>Passout Year</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredStudents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((student, idx) => {
                    const avatarColor = getAvatarColor(student.Student_Name);
                    const initials = getInitials(student.Student_Name);

                    return (
                      <TableRow
                        key={student.Student_Code || idx}
                        sx={{
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: '#F8FAFC',
                            '& .student-avatar': { transform: 'scale(1.05)' },
                          },
                          '& .MuiTableCell-root': { borderBottom: '1px solid #F1F5F9', py: 1.8 },
                        }}
                      >
                        {/* Index */}
                        <TableCell sx={{ pl: 3 }}>
                          <Typography sx={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.82rem' }}>
                            {page * rowsPerPage + idx + 1}
                          </Typography>
                        </TableCell>

                        {/* Student Name + Code */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Box
                              className="student-avatar"
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                bgcolor: avatarColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'transform 0.2s ease',
                              }}
                            >
                              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>
                                {initials}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#1E293B', lineHeight: 1.3 }}>
                                {student.Student_Name || 'Unknown'}
                              </Typography>
                              <Typography sx={{ color: '#CBD5E1', fontSize: '0.7rem' }}>
                                {student.Student_Code || '—'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Email */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Email sx={{ fontSize: 14, color: '#94A3B8' }} />
                            <Typography sx={{ color: '#334155', fontSize: '0.82rem', fontWeight: 500 }}>
                              {student.Email || '—'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Mobile */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Phone sx={{ fontSize: 14, color: '#94A3B8' }} />
                            <Typography sx={{ color: '#334155', fontSize: '0.82rem', fontWeight: 500 }}>
                              {student.Mobile_Number || '—'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Qualification */}
                        <TableCell>
                          <Typography sx={{ color: '#64748B', fontSize: '0.82rem', fontWeight: 500 }}>
                            {student.Qualification || '—'}
                          </Typography>
                        </TableCell>

                        {/* Passout Year */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            label={student.Passout_Year || '—'}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              bgcolor: '#F8FAFC',
                              color: '#64748B',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              '& .MuiChip-label': { px: 1 },
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
            count={filteredStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            sx={{
              borderTop: '1px solid #F1F5F9',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem',
                color: '#64748B',
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default BatchStudents;