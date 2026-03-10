// src/components/mentor/Batches/BatchStudents.jsx

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
  Email,
  Phone,
  Groups,
  Person,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { mentorBatchesAPI } from '../../../services/API/batches';

/* ── inject fonts ── */
const _styleTag = document.getElementById('mentor-bs-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'mentor-bs-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes mbsFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

const headingFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bodyFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const cardBase = {
  background: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #e8ecf2',
  boxShadow: '0 2px 12px rgba(30,58,138,0.06)',
};

/* ───────────── Shimmer ───────────── */
const BatchStudentsShimmer = ({ rows = 6 }) => (
  <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
      <Box>
        <Skeleton variant="text" width={260} height={36} />
        <Skeleton variant="text" width={360} height={18} />
      </Box>
    </Box>
    <Paper sx={{ ...cardBase, p: 2.5, mb: 2.5 }}>
      <Box display="flex" gap={2}><Skeleton variant="rectangular" width={340} height={42} sx={{ borderRadius: '10px' }} /></Box>
    </Paper>
    <Paper sx={{ ...cardBase, overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ background: '#f8fafc' }}>
            {['#', 'STUDENT', 'EMAIL', 'MOBILE', 'QUALIFICATION', 'PASSOUT'].map((h) => (
              <TableCell key={h}><Skeleton variant="text" width={70} /></TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }, (_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton variant="text" width={30} /></TableCell>
              <TableCell><Box display="flex" gap={1.5}><Skeleton variant="circular" width={36} height={36} /><Box><Skeleton width={140} /><Skeleton width={80} height={14} /></Box></Box></TableCell>
              <TableCell><Skeleton width={180} /></TableCell>
              <TableCell><Skeleton width={110} /></TableCell>
              <TableCell><Skeleton width={90} /></TableCell>
              <TableCell><Skeleton width={50} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </Box>
);

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const MentorBatchStudents = () => {
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
      const response = await mentorBatchesAPI.getStudentsByBatch(batchId);
      setBatchInfo({
        Batch_Code: response.Batch_Code,
        Course_Name: response.Course_Name,
        Trainer_Name: response.Trainer_Name,
        Total_Students: response.Total_Students,
      });
      setStudents(Array.isArray(response.Students) ? response.Students : []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [batchId]);

  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      (student.Student_Name?.toLowerCase() || '').includes(term) ||
      (student.Student_Code?.toLowerCase() || '').includes(term) ||
      (student.Email?.toLowerCase() || '').includes(term) ||
      (student.Mobile_Number?.toString() || '').includes(term)
    );
  });

  const getAvatarColor = (name) => {
    const colors = ['#0ea5e9', '#0d9488', '#7c3aed', '#d97706', '#dc2626', '#059669', '#4338ca', '#0891b2', '#be185d', '#1e3a8a'];
    return colors[(name || '').charCodeAt(0) % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  if (loading) return <BatchStudentsShimmer rows={6} />;

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>{error}</Alert>
      </Snackbar>

      {/* ═══════════ HEADER ═══════════ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, animation: 'mbsFadeUp 0.5s ease-out both' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            onClick={() => navigate('/mentor/batches')}
            sx={{
              width: 40, height: 40, borderRadius: '10px',
              background: '#fff', border: '1px solid #e8ecf2',
              color: '#475569',
              '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>

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
              {batchInfo.Batch_Code || `Batch #${batchId}`}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mt={0.3}>
              <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b' }}>
                {batchInfo.Course_Name || 'Students in this batch'}
              </Typography>
              {batchInfo.Trainer_Name && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Person sx={{ fontSize: 14, color: '#0d9488' }} />
                  <Typography sx={{ ...bodyFont, fontSize: '0.78rem', color: '#0d9488', fontWeight: 600 }}>
                    Trainer: {batchInfo.Trainer_Name}
                  </Typography>
                </Box>
              )}
              <Chip
                label={`${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  height: 24, fontSize: '0.72rem',
                  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                  background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ═══════════ SEARCH ═══════════ */}
      <Paper elevation={0} sx={{ ...cardBase, p: 2.5, mb: 2.5, animation: 'mbsFadeUp 0.5s ease-out 0.1s both' }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search by name, code, email, or mobile..."
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
          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: 18 }} />}
            onClick={fetchStudents}
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
      </Paper>

      {/* ═══════════ TABLE ═══════════ */}
      {filteredStudents.length === 0 ? (
        <Paper elevation={0} sx={{ ...cardBase, p: 5, textAlign: 'center', animation: 'mbsFadeUp 0.5s ease-out 0.2s both' }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '16px', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(13,148,136,0.04))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Groups sx={{ color: '#0ea5e9', fontSize: 32 }} />
          </Box>
          <Typography sx={{ ...headingFont, fontSize: '1.1rem', mb: 1 }}>No Students Found</Typography>
          <Typography sx={{ ...bodyFont, fontSize: '0.88rem', color: '#64748b' }}>
            {students.length === 0 ? 'No students have been assigned to this batch yet.' : 'No students match your search.'}
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ ...cardBase, overflow: 'hidden', animation: 'mbsFadeUp 0.5s ease-out 0.2s both' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  {['#', 'Student', 'Email', 'Mobile', 'Qualification', 'Passout Year'].map((h) => (
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
                {filteredStudents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((student, idx) => {
                    const avatarColor = getAvatarColor(student.Student_Name);
                    const initials = getInitials(student.Student_Name);
                    return (
                      <TableRow key={student.Student_Code || idx} sx={{
                        transition: 'background 0.2s ease',
                        '&:hover': { background: '#f8fafc' },
                        '&:last-child td': { borderBottom: 'none' },
                      }}>
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                            {page * rowsPerPage + idx + 1}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{
                              width: 36, height: 36, borderRadius: '10px',
                              bgcolor: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                {initials}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography sx={{ ...bodyFont, fontWeight: 600, fontSize: '0.86rem', color: '#0f172a' }}>
                                {student.Student_Name || 'Unknown'}
                              </Typography>
                              <Typography sx={{ ...bodyFont, fontSize: '0.7rem', color: '#94a3b8' }}>
                                {student.Student_Code || '—'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Email sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography sx={{ ...bodyFont, fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>
                              {student.Email || '—'}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Phone sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography sx={{ ...bodyFont, fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>
                              {student.Mobile_Number || '—'}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b' }}>
                            {student.Qualification || '—'}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                          <Chip
                            label={student.Passout_Year || '—'}
                            size="small"
                            sx={{
                              height: 24, fontSize: '0.72rem',
                              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                              background: '#f8fafc', color: '#64748b', border: '1px solid #e8ecf2',
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

export default MentorBatchStudents;