import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  Fade,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Assignment,
  Visibility,
  AttachFile,
  CheckCircle,
  Person,
  Schedule,
  Search,
  FilterList,
  Group,
  Refresh,
  GradingOutlined,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { trainerTasksAPI } from '../../../services/API/trainertasks';
import LoadingSpinner from '../../common/LoadingSpinner';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

const cardSx = {
  borderRadius: '16px',
  bgcolor: '#fff',
  border: '1px solid rgba(41,128,185,0.08)',
  boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 24px rgba(26,82,118,0.10)',
    transform: 'translateY(-1px)',
  },
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    fontFamily: fontStack,
    fontSize: '0.88rem',
    '& fieldset': { borderColor: 'rgba(41,128,185,0.15)' },
    '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.30)' },
    '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root': { fontFamily: fontStack, fontSize: '0.88rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#2980b9' },
};

const TaskReviewsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const trainerId = user?.id || user?.trainerId || user?.trainer_id || user?.ID;

  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [batches, setBatches] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [submissions, searchTerm, statusFilter, batchFilter]);

  const fetchSubmissions = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      if (!trainerId) {
        setSnackbar({ open: true, message: 'Trainer ID not found. Please log in again.', severity: 'error' });
        return;
      }

      const response = await trainerTasksAPI.getTaskSubmissions(trainerId);

      let subs = [];
      if (Array.isArray(response)) {
        subs = response;
      } else if (response && Array.isArray(response.submissions)) {
        subs = response.submissions;
      } else if (response && Array.isArray(response.data)) {
        subs = response.data;
      } else if (response && typeof response === 'object' && !Array.isArray(response)) {
        // If it's a single object, wrap it
        if (response.Submission_ID || response.Student_ID) {
          subs = [response];
        }
      }

      setSubmissions(subs);

      // Extract unique batches for filter
      const uniqueBatches = [...new Set(subs.map(s => s.Batch_ID || s.batch_id).filter(Boolean))];
      setBatches(uniqueBatches);

      if (isRefresh) {
        setSnackbar({ open: true, message: 'Submissions refreshed successfully', severity: 'success' });
      }
    } catch (error) {
      console.error('Error fetching task submissions:', error);
      setSnackbar({ open: true, message: `Error loading submissions: ${error.message}`, severity: 'error' });
      setSubmissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        (s.Student_Name || s.student_name || '').toLowerCase().includes(term) ||
        (s.Student_ID || s.student_id || '').toString().toLowerCase().includes(term) ||
        (s.Task_Name || s.Task_Box || s.task_name || '').toLowerCase().includes(term) ||
        (s.Task_Submit || '').toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'reviewed') {
        filtered = filtered.filter(s => s.grade || s.Grade || s.feedback || s.Feedback);
      } else if (statusFilter === 'not_reviewed') {
        filtered = filtered.filter(s => !s.grade && !s.Grade && !s.feedback && !s.Feedback);
      }
    }

    // Batch filter
    if (batchFilter !== 'all') {
      filtered = filtered.filter(s => String(s.Batch_ID || s.batch_id) === String(batchFilter));
    }

    setFilteredSubmissions(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <AttachFile sx={{ color: '#94a3b8' }} />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const colorMap = {
      pdf: '#ef4444', doc: '#2980b9', docx: '#2980b9',
      xls: '#0d9488', xlsx: '#0d9488',
      jpg: '#f59e0b', jpeg: '#f59e0b', png: '#f59e0b',
      ppt: '#7b1fa2', pptx: '#7b1fa2',
    };
    return <AttachFile sx={{ color: colorMap[ext] || '#94a3b8' }} />;
  };

  const getFileName = (filePath) => {
    if (!filePath) return 'No file';
    return filePath.includes('/') ? filePath.split('/').pop() : filePath;
  };

  const isReviewed = (submission) => {
    return !!(submission.grade || submission.Grade || submission.feedback || submission.Feedback);
  };

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  // Stats
  const totalSubmissions = submissions.length;
  const reviewedCount = submissions.filter(s => s.grade || s.Grade || s.feedback || s.Feedback).length;

  if (loading) return <LoadingSpinner message="Loading task submissions..." />;

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* ═══ Header ═══ */}
      <Fade in timeout={600}>
        <Box sx={{
          p: 2.5, mb: 3, borderRadius: '16px',
          background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)',
          boxShadow: '0 4px 20px rgba(26,82,118,0.18)',
          position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{
                width: 42, height: 42, borderRadius: '11px',
                bgcolor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GradingOutlined sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', fontFamily: fontStack }}>
                  Task Reviews
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', fontFamily: fontStack }}>
                  Review and grade student task submissions
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh submissions">
                <IconButton
                  onClick={() => fetchSubmissions(true)}
                  disabled={refreshing}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.20)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  {refreshing ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <Refresh sx={{ fontSize: 20 }} />}
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<ArrowForward sx={{ fontSize: '18px !important' }} />}
                onClick={() => navigate('/trainer/tasks')}
                sx={{
                  textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
                  borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.92)',
                  color: '#1a5276', px: 2.5, fontFamily: fontStack,
                  '&:hover': { bgcolor: '#fff' },
                }}
              >
                Go to Tasks
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* ═══ Stats Bar — only Total and Reviewed ═══ */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Submissions', value: totalSubmissions, color: '#2980b9', icon: <Assignment sx={{ fontSize: 20 }} /> },
          { label: 'Reviewed', value: reviewedCount, color: '#0d9488', icon: <CheckCircle sx={{ fontSize: 20 }} /> },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} key={i}>
            <Box sx={{
              p: 2, borderRadius: '14px', bgcolor: '#fff',
              border: '1px solid rgba(41,128,185,0.08)',
              boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '10px',
                bgcolor: `${stat.color}15`, color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                  {stat.value}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* ═══ Filters ═══ */}
      <Box sx={{
        p: 2, mb: 3, borderRadius: '14px', bgcolor: '#fff',
        border: '1px solid rgba(41,128,185,0.08)',
        boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
      }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <FilterList sx={{ color: '#2980b9', fontSize: 20 }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
            Filters
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student, task, or file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Batch</InputLabel>
              <Select
                value={batchFilter}
                label="Batch"
                onChange={(e) => setBatchFilter(e.target.value)}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="all">All Batches</MenuItem>
                {batches.map((batch) => (
                  <MenuItem key={batch} value={batch}>Batch {batch}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* ═══ Submissions Grid ═══ */}
      {filteredSubmissions.length === 0 ? (
        <Box sx={{
          p: 5, textAlign: 'center', borderRadius: '16px', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
        }}>
          <GradingOutlined sx={{ fontSize: 52, color: '#cbd5e1', mb: 1.5 }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5, fontFamily: fontStack }}>
            {submissions.length === 0 ? 'No Task Submissions Yet' : 'No Matching Submissions'}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mb: 2.5, fontFamily: fontStack }}>
            {submissions.length === 0
              ? 'Student submissions will appear here once they submit their tasks.'
              : 'Try adjusting your search or filter criteria.'}
          </Typography>
          {submissions.length > 0 && (
            <Button
              variant="outlined"
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setBatchFilter('all'); }}
              sx={{
                textTransform: 'none', fontWeight: 600, borderRadius: '10px',
                borderColor: 'rgba(41,128,185,0.20)', color: '#2980b9', fontFamily: fontStack,
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filteredSubmissions.map((submission, index) => {
            const submissionId = submission.Submission_ID || submission.ID || submission.id;
            const taskId = submission.Task_ID || submission.task_id;
            const studentName = submission.Student_Name || submission.student_name || 'Unknown Student';
            const studentId = submission.Student_ID || submission.student_id;
            const fileName = submission.Task_Submit || submission.file || submission.file_name;
            const submittedAt = submission.Submitted_At || submission.created_at || submission.submitted_at;
            const batchId = submission.Batch_ID || submission.batch_id;
            const sessionId = submission.Session_ID || submission.session_id;
            const taskContent = submission.Task_Box || submission.Task_Name || submission.task_content;
            const reviewed = isReviewed(submission);

            return (
              <Grid item xs={12} md={6} lg={4} key={submissionId || index}>
                <Card sx={cardSx}>
                  {/* Top color bar — blue default, green if reviewed */}
                  <Box sx={{
                    height: '3px',
                    background: reviewed
                      ? 'linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)'
                      : 'linear-gradient(90deg, #2980b9 0%, #3498db 100%)',
                  }} />
                  <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                    {/* Header row — chip only shown when reviewed */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{
                          width: 36, height: 36, borderRadius: '10px',
                          background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Person sx={{ color: '#fff', fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                            {studentName}
                          </Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>
                            ID: {studentId}
                          </Typography>
                        </Box>
                      </Box>
                      {reviewed && (
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                          label="Reviewed"
                          size="small"
                          sx={{
                            height: 24, fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px',
                            bgcolor: 'rgba(13,148,136,0.10)', color: '#0d9488',
                            '& .MuiChip-icon': { color: '#0d9488' },
                          }}
                        />
                      )}
                    </Box>

                    {/* Task info */}
                    {taskContent && (
                      <Typography sx={{
                        fontSize: '0.82rem', color: '#475569', mb: 1.5,
                        fontFamily: fontStack, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {taskContent}
                      </Typography>
                    )}

                    <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 1.5 }} />

                    {/* Details */}
                    <Box display="flex" flexDirection="column" gap={0.8}>
                      {taskId && (
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Assignment sx={{ fontSize: 16, color: '#94a3b8' }} />
                          <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack }}>
                            <strong>Task:</strong> #{taskId}
                          </Typography>
                        </Box>
                      )}
                      {batchId && (
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Group sx={{ fontSize: 16, color: '#94a3b8' }} />
                          <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack }}>
                            <strong>Batch:</strong> {batchId}
                          </Typography>
                        </Box>
                      )}
                      <Box display="flex" alignItems="center" gap={0.8}>
                        {getFileIcon(fileName)}
                        <Typography sx={{
                          fontSize: '0.82rem', color: '#475569', fontFamily: fontStack,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          <strong>File:</strong> {getFileName(fileName)}
                        </Typography>
                      </Box>
                      {submittedAt && (
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Schedule sx={{ fontSize: 16, color: '#94a3b8' }} />
                          <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
                            {formatDate(submittedAt)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Grade display */}
                    {(submission.grade || submission.Grade) && (
                      <Alert severity="success" sx={{ mt: 2, borderRadius: '10px', py: 0.5, '& .MuiAlert-message': { fontSize: '0.82rem' } }}>
                        <strong>Grade:</strong> {submission.grade || submission.Grade}
                      </Alert>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 2.5, pb: 2, pt: 0 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility sx={{ fontSize: '16px !important' }} />}
                      size="small"
                      onClick={() => navigate(`/trainer/task-reviews/view/${submissionId}`)}
                      sx={{
                        textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                        borderRadius: '8px', borderColor: 'rgba(41,128,185,0.20)',
                        color: '#2980b9', fontFamily: fontStack,
                        '&:hover': { borderColor: '#2980b9' },
                      }}
                    >
                      Review
                    </Button>
                    {taskId && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate(`/trainer/tasks/view/${taskId}`)}
                        sx={{
                          textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                          borderRadius: '8px', color: '#0d9488', fontFamily: fontStack,
                          '&:hover': { bgcolor: 'rgba(13,148,136,0.06)' },
                        }}
                      >
                        View Task
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskReviewsList;