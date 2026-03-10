import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  TablePagination,
  Skeleton,
  Alert,
  Snackbar,
  InputAdornment,
  Chip,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Refresh,
  SearchOutlined,
  PersonOutlined,
  Close,
  Save,
  CheckCircle,
  Cancel,
  GroupOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mockTestsAPI } from '../../../services/API/mocktest';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

/* ——— Stat Card ——— */
const StatCard = ({ icon, label, value, gradient }) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: '14px',
      bgcolor: '#fff',
      border: '1px solid rgba(41,128,185,0.08)',
      boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      transition: 'all 0.2s ease',
      '&:hover': { boxShadow: '0 4px 16px rgba(26,82,118,0.08)', transform: 'translateY(-1px)' },
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: '11px',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontFamily: fontStack, letterSpacing: '0.02em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

/* ——— Shimmer Loading ——— */
const MockTestsShimmer = ({ rows = 8 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={200} height={40} sx={{ borderRadius: 2 }} />
      </Box>
      {/* Stat cards shimmer */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '14px' }} />
          </Grid>
        ))}
      </Grid>
      {/* Search bar shimmer */}
      <Box sx={{ p: 2, mb: 3, borderRadius: '14px', border: '1px solid rgba(41,128,185,0.08)', bgcolor: '#fff' }}>
        <Box display="flex" gap={2} alignItems="center">
          <Skeleton variant="rectangular" width={350} height={40} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: '10px' }} />
        </Box>
      </Box>
      {/* Table shimmer */}
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
        <Table>
          <TableHead>
            <TableRow>
              {['', '', '', '', ''].map((_, i) => (
                <TableCell key={i}><Skeleton variant="text" width={80 + i * 20} /></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shimmerRows.map((index) => (
              <TableRow key={index}>
                <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>
                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                <TableCell><Skeleton variant="text" width={140} /></TableCell>
                <TableCell><Skeleton variant="text" width={70} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box display="flex" justifyContent="center" mt={3}>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading students...</Typography>
      </Box>
    </Box>
  );
};

const MockTestsList = () => {
  const navigate = useNavigate();
  const [mockTests, setMockTests] = useState([]);
  const [stats, setStats] = useState({
    total_tests: 0,
    active_tests: 0,
    completed_tests: 0,
    draft_tests: 0,
    average_score: 0,
    total_students: 0,
    total_completions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', Student_ID: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMockTests();
  }, []);

  const fetchMockTests = async () => {
    try {
      setLoading(true);
      setError(null);

      const studentsData = await mockTestsAPI.getAllStudents();

      const transformedStudents = studentsData.map((student) => ({
        id: student.Student_ID,
        title: student.name || 'No Name',
        status: student.name ? 'active' : 'inactive',
        Student_ID: student.Student_ID,
        studentName: student.name,
        raw: student,
      }));

      setMockTests(transformedStudents);

      const calculatedStats = {
        total_tests: transformedStudents.length,
        active_tests: transformedStudents.filter((s) => s.status === 'active').length,
        completed_tests: 0,
        draft_tests: transformedStudents.filter((s) => s.status === 'inactive').length,
        average_score: 0,
        total_students: transformedStudents.length,
        total_completions: 0,
      };
      setStats(calculatedStats);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(`Failed to fetch students: ${err.message}`);
      setMockTests([]);
      setStats({ total_tests: 0, active_tests: 0, completed_tests: 0, draft_tests: 0, average_score: 0, total_students: 0, total_completions: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMockTests();
    setRefreshing(false);
  };

  const handleViewClick = (studentId) => {
    navigate(`/trainer/mock-tests/view/${studentId}`);
  };

  const handleEditClick = (student) => {
    setEditingTest(student);
    setEditForm({ name: student.studentName || '', Student_ID: student.Student_ID.toString(), status: student.status });
    setEditModalOpen(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      alert('Edit functionality is not available for students with current API endpoints');
      setEditModalOpen(false);
      setEditingTest(null);
    } catch (err) {
      console.error('Error saving student:', err);
      setError(`Failed to update student: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setEditingTest(null);
    setSaving(false);
  };

  const getInitials = (name) => {
    if (!name || name === 'No Name') return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  /* ——— Filtering ——— */
  const filteredStudents = mockTests.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.studentName?.toLowerCase() || '').includes(term) ||
      (s.Student_ID?.toString() || '').includes(term) ||
      (s.status?.toLowerCase() || '').includes(term)
    );
  });

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  if (loading) return <MockTestsShimmer rows={8} />;

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* Snackbars */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(239,68,68,0.15)' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(13,148,136,0.15)' }}>{success}</Alert>
      </Snackbar>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: '11px',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <GroupOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Students
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<GroupOutlined sx={{ color: '#fff', fontSize: 20 }} />}
            label="Total Students"
            value={stats.total_students || mockTests.length}
            gradient="linear-gradient(135deg, #1a5276 0%, #2980b9 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CheckCircle sx={{ color: '#fff', fontSize: 20 }} />}
            label="Active Students"
            value={stats.active_tests || mockTests.filter((s) => s.status === 'active').length}
            gradient="linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Cancel sx={{ color: '#fff', fontSize: 20 }} />}
            label="Inactive Students"
            value={stats.draft_tests || mockTests.filter((s) => s.status === 'inactive').length}
            gradient="linear-gradient(135deg, #dc2626 0%, #f87171 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PersonOutlined sx={{ color: '#fff', fontSize: 20 }} />}
            label="Named Students"
            value={mockTests.filter((s) => s.studentName && s.studentName !== 'No Name').length}
            gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)"
          />
        </Grid>
      </Grid>

      {/* Search & Filter Bar */}
      <Box
        sx={{
          p: 2, mb: 3, borderRadius: '14px', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
          boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
          display: 'flex', gap: 2, alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search by name, student ID, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 20, color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 350, flex: 1, maxWidth: 500,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px', fontSize: '0.85rem', fontFamily: fontStack, bgcolor: '#f8fafc',
              '& fieldset': { borderColor: 'rgba(41,128,185,0.12)' },
              '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.25)' },
              '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
            },
          }}
        />
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh sx={{ fontSize: '18px !important' }} />}
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: '0.82rem',
            borderRadius: '10px', borderColor: 'rgba(41,128,185,0.20)',
            color: '#2980b9', px: 2.5, fontFamily: fontStack,
            '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Box
          sx={{
            p: 5, textAlign: 'center', borderRadius: '16px', bgcolor: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
          }}
        >
          <PersonOutlined sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
            No Students Found
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {mockTests.length === 0
              ? 'No students are currently enrolled.'
              : 'No students match your current search criteria. Try adjusting your search term.'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(41,128,185,0.04)' }}>
                  {['Avatar', 'Student ID', 'Student Name', 'Status', 'Actions'].map((h) => (
                    <TableCell key={h}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a5276', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack }}>
                        {h}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((student) => (
                    <TableRow
                      key={student.Student_ID}
                      hover
                      sx={{
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' },
                        '&:last-child td': { borderBottom: 0 },
                        borderBottom: '1px solid rgba(41,128,185,0.06)',
                      }}
                    >
                      <TableCell>
                        <Avatar
                          sx={{
                            width: 32, height: 32, fontSize: '0.7rem', fontWeight: 700,
                            background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                            fontFamily: fontStack,
                          }}
                        >
                          {getInitials(student.studentName)}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.Student_ID}
                          size="small"
                          sx={{
                            height: 24, fontSize: '0.72rem', fontWeight: 600,
                            bgcolor: 'rgba(41,128,185,0.08)', color: '#1a5276',
                            borderRadius: '6px', fontFamily: fontStack,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                          {student.studentName || 'No Name'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.status}
                          size="small"
                          sx={{
                            height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px',
                            fontFamily: fontStack, textTransform: 'capitalize',
                            bgcolor: student.status === 'active' ? 'rgba(13,148,136,0.10)' : 'rgba(239,68,68,0.10)',
                            color: student.status === 'active' ? '#0d9488' : '#dc2626',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            title="View Student Details"
                            onClick={() => handleViewClick(student.Student_ID)}
                            sx={{
                              width: 34, height: 34, borderRadius: '9px',
                              color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)',
                              transition: 'all 0.2s ease',
                              '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' },
                            }}
                          >
                            <Visibility sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            title="Edit Student"
                            onClick={() => handleEditClick(student)}
                            sx={{
                              width: 34, height: 34, borderRadius: '9px',
                              color: '#0d9488', bgcolor: 'rgba(13,148,136,0.06)',
                              transition: 'all 0.2s ease',
                              '&:hover': { bgcolor: 'rgba(13,148,136,0.12)', transform: 'scale(1.05)' },
                            }}
                          >
                            <Edit sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid rgba(41,128,185,0.06)',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem', color: '#94a3b8', fontFamily: fontStack,
              },
            }}
          />
        </Box>
      )}

      {/* Edit Modal */}
      <Modal open={editModalOpen} onClose={handleCloseModal} aria-labelledby="edit-student-modal">
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 }, bgcolor: '#fff', borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(26,82,118,0.18)', p: 0, maxHeight: '90vh', overflow: 'auto',
            border: '1px solid rgba(41,128,185,0.08)',
          }}
        >
          {/* Modal Header */}
          <Box
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: 3, borderBottom: '1px solid rgba(41,128,185,0.08)',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 34, height: 34, borderRadius: '9px',
                  background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Edit sx={{ color: '#fff', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                Edit Student
              </Typography>
            </Box>
            <IconButton onClick={handleCloseModal} disabled={saving} sx={{ color: '#94a3b8', '&:hover': { color: '#475569' } }}>
              <Close sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* Modal Body */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Student Name" value={editForm.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  disabled={saving} size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', fontSize: '0.85rem', fontFamily: fontStack,
                      '& fieldset': { borderColor: 'rgba(41,128,185,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.25)' },
                      '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.85rem', fontFamily: fontStack },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Student ID" value={editForm.Student_ID}
                  onChange={(e) => handleEditFormChange('Student_ID', e.target.value)}
                  disabled={saving} size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', fontSize: '0.85rem', fontFamily: fontStack,
                      '& fieldset': { borderColor: 'rgba(41,128,185,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.25)' },
                      '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.85rem', fontFamily: fontStack },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={saving} size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', fontSize: '0.85rem', fontFamily: fontStack,
                      '& fieldset': { borderColor: 'rgba(41,128,185,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.25)' },
                      '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.85rem', fontFamily: fontStack },
                  }}
                >
                  <InputLabel>Status</InputLabel>
                  <Select value={editForm.status} label="Status" onChange={(e) => handleEditFormChange('status', e.target.value)}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Modal Footer */}
          <Box
            sx={{
              display: 'flex', justifyContent: 'flex-end', gap: 1.5,
              p: 3, borderTop: '1px solid rgba(41,128,185,0.08)',
            }}
          >
            <Button
              variant="outlined" onClick={handleCloseModal} disabled={saving}
              sx={{
                textTransform: 'none', fontWeight: 600, fontSize: '0.82rem',
                borderRadius: '10px', borderColor: 'rgba(41,128,185,0.20)',
                color: '#64748b', px: 3, fontFamily: fontStack,
                '&:hover': { borderColor: '#94a3b8', bgcolor: 'rgba(0,0,0,0.02)' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Save sx={{ fontSize: '18px !important' }} />}
              onClick={handleSaveEdit} disabled={saving}
              sx={{
                textTransform: 'none', fontWeight: 600, fontSize: '0.82rem',
                borderRadius: '10px', px: 3, fontFamily: fontStack,
                background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                boxShadow: '0 2px 8px rgba(41,128,185,0.25)',
                '&:hover': { boxShadow: '0 4px 16px rgba(41,128,185,0.35)' },
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default MockTestsList;