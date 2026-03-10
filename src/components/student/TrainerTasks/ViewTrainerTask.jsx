import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Paper,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Skeleton,
  IconButton,
  Fade,
  Slide,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Assignment,
  Schedule,
  ArrowBack,
  QuestionAnswer,
  Group,
  InsertDriveFile,
  CloudUpload,
  Upload,
  Close,
  CheckCircle,
  AttachFile,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { trainerTasksAPI } from '../../../services/API/trainertasks';
import { taskSubmissionsAPI } from '../../../services/API/studenttask';
import { useAuth } from '../../../hooks/useAuth';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

/* ——— Shimmer ——— */
const ViewTrainerTaskShimmer = () => (
  <Box>
    <Box display="flex" alignItems="center" mb={3} sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
      <Skeleton variant="circular" width={42} height={42} sx={{ mr: 2 }} />
      <Box sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" width={280} height={32} sx={{ borderRadius: 2 }} />
        <Skeleton variant="text" width={180} height={22} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={8}>
        <Skeleton variant="rectangular" width="100%" height={180} sx={{ borderRadius: '16px', mb: 2.5 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: '16px' }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: '16px' }} />
      </Grid>
    </Grid>
    <Box display="flex" justifyContent="center" mt={3} gap={1} alignItems="center">
      <CircularProgress size={18} sx={{ color: '#2980b9' }} />
      <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>Loading task details...</Typography>
    </Box>
  </Box>
);

/* ——— Info Row helper ——— */
const InfoRow = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
    <Box sx={{ width: 34, height: 34, minWidth: 34, borderRadius: '9px', bgcolor: 'rgba(41,128,185,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.2 }}>
      {React.cloneElement(icon, { sx: { fontSize: 18, color: '#2980b9' } })}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack, mb: 0.2 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const StudentViewTrainerTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── Submit Task State ───
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submissionStatus, setSubmissionStatus] = useState(null); // null | 'submitted' | 'not_submitted'

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchTask();
    } else {
      setError('Invalid task ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError('');
      if (!id || id === 'undefined' || id === 'null') throw new Error('Invalid task ID');

      // Use student endpoint with student ID
      const studentId = user?.id || user?.ID || user?.studentId || user?.student_id;
      if (!studentId) throw new Error('Student ID not found. Please log in again.');
      const response = await trainerTasksAPI.getStudentTaskById(id, studentId);

      if (!response) throw new Error('No data received from server');
      const transformedTask = transformApiResponse(response);
      setTask(transformedTask);

      // Check if student already submitted for this task
      checkSubmissionStatus(transformedTask?.id);
    } catch (err) {
      setError('Failed to fetch task details: ' + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const checkSubmissionStatus = async (taskId) => {
    try {
      const studentId = user?.id || user?.studentId || user?.student_id || user?.ID;
      if (!studentId || !taskId) return;

      const response = await taskSubmissionsAPI.getMySubmissions(studentId);
      if (response && response.submissions && Array.isArray(response.submissions)) {
        const found = response.submissions.find(
          (sub) => String(sub.Task_ID) === String(taskId)
        );
        setSubmissionStatus(found ? 'submitted' : 'not_submitted');
      } else {
        setSubmissionStatus('not_submitted');
      }
    } catch (err) {
      console.log('Could not check submission status:', err.message);
      setSubmissionStatus('not_submitted');
    }
  };

  const transformApiResponse = (apiData) => {
    if (!apiData) return null;
    const taskData = Array.isArray(apiData) ? apiData[0] : apiData;
    if (!taskData) return null;

    // Handle both backend response formats:
    // Student endpoint returns: Task_ID, Task_Content, Batch_Code, Batch_ID, Session_ID
    // Old format had: ID, Task_Box, Batch_ID, Session_ID
    const taskContent = taskData.Task_Content || taskData.Task_Box || '';
    const questions = taskContent
      ? taskContent.split('?').map(q => q.trim()).filter(q => q).map(q => q.endsWith('?') ? q : q + '?')
      : [];

    const taskId = taskData.Task_ID || taskData.ID;
    const batchId = taskData.Batch_ID;
    const batchCode = taskData.Batch_Code;
    const sessionId = taskData.Session_ID;

    return {
      id: taskId,
      batchId: batchId,
      batchCode: batchCode,
      sessionId: sessionId,
      title: `Task #${taskId} - Session ${sessionId}`,
      description: `Training task for Batch ${batchCode || batchId} containing ${questions.length} question${questions.length !== 1 ? 's' : ''}`,
      questions,
      taskBox: taskContent,
      startDateTime: taskData.Start_DateTime,
      endDateTime: taskData.End_DateTime,
      assignedDate: new Date().toISOString(),
      originalData: taskData
    };
  };

  // ─── File Upload Handlers ───
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
      ];
      if (!allowedTypes.includes(file.type)) {
        setSnackbar({ open: true, message: 'Invalid file type. Allowed: PDF, Word, Excel, JPG, PNG', severity: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'File size exceeds 5MB limit.', severity: 'error' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitTask = async () => {
    try {
      const studentId = user?.id || user?.studentId || user?.student_id || user?.ID;
      if (!studentId) {
        setSnackbar({ open: true, message: 'Student ID not found. Please log in again.', severity: 'error' });
        return;
      }
      if (!selectedFile) {
        setSnackbar({ open: true, message: 'Please select a file to submit.', severity: 'error' });
        return;
      }
      if (!task?.id) {
        setSnackbar({ open: true, message: 'Task ID not found.', severity: 'error' });
        return;
      }

      setSubmitting(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('Student_ID', String(studentId));
      formData.append('Task_ID', String(task.id));
      formData.append('Task_Submit', selectedFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + 10;
        });
      }, 200);

      await taskSubmissionsAPI.add(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSnackbar({ open: true, message: 'Task submitted successfully!', severity: 'success' });
      setSelectedFile(null);
      setOpenSubmitDialog(false);
      setSubmissionStatus('submitted');
    } catch (error) {
      let msg = 'Failed to submit task.';
      if (error.message) {
        if (error.message.includes('already submitted')) {
          msg = 'You have already submitted for this task. Go to Task Submissions to update.';
        } else if (error.message.includes('Invalid or non-existent Student_ID')) {
          msg = 'Student ID not found in the system.';
        } else if (error.message.includes('not assigned to your batch')) {
          msg = 'This task is not assigned to your batch.';
        } else {
          msg = `Failed to submit: ${error.message}`;
        }
      }
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <AttachFile sx={{ color: '#94a3b8' }} />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const colorMap = { pdf: '#ef4444', doc: '#2980b9', docx: '#2980b9', xls: '#0d9488', xlsx: '#0d9488', jpg: '#f59e0b', jpeg: '#f59e0b', png: '#f59e0b' };
    return <AttachFile sx={{ color: colorMap[ext] || '#94a3b8' }} />;
  };

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  if (loading) return <ViewTrainerTaskShimmer />;

  if (error) {
    return (
      <Box sx={{ fontFamily: fontStack }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/student/tasks')}
          sx={{
            mb: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
            color: '#2980b9', borderRadius: '10px', fontFamily: fontStack,
            '&:hover': { bgcolor: 'rgba(41,128,185,0.06)' },
          }}
        >
          Back to Tasks
        </Button>
        <Alert severity="error" sx={{ borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)', mb: 2 }}>{error}</Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
            background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
            borderRadius: '10px', px: 3, fontFamily: fontStack,
            '&:hover': { opacity: 0.9 },
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ fontFamily: fontStack }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/student/tasks')}
          sx={{ mb: 2, textTransform: 'none', fontWeight: 600, color: '#2980b9', borderRadius: '10px' }}>
          Back to Tasks
        </Button>
        <Alert severity="warning" sx={{ borderRadius: '12px' }}>Task not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: fontStack }}>

      {/* ═══ Header Bar ═══ */}
      <Fade in timeout={600}>
        <Box
          sx={{
            p: 2.5, mb: 3, borderRadius: '16px',
            background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)',
            boxShadow: '0 4px 20px rgba(26,82,118,0.18)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <Box display="flex" alignItems="center" position="relative" zIndex={1}>
            <IconButton
              onClick={() => navigate('/student/tasks')}
              sx={{
                mr: 2, width: 42, height: 42, borderRadius: '11px',
                bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.20)',
                backdropFilter: 'blur(8px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowBack sx={{ fontSize: 22 }} />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', fontFamily: fontStack }}>
                {task.title}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', fontFamily: fontStack }}>
                {task.description}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Fade>

      <Grid container spacing={2.5}>
        {/* ═══ LEFT — Main Content ═══ */}
        <Grid item xs={12} md={8}>
          <Box display="flex" flexDirection="column" gap={2.5}>

            {/* Task Details Card */}
            <Slide in direction="up" timeout={600}>
              <Card sx={{
                borderRadius: '16px', bgcolor: '#fff',
                border: '1px solid rgba(41,128,185,0.08)',
                boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
                overflow: 'hidden', position: 'relative',
              }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)' }} />
                <CardContent sx={{ p: 3, pt: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                    <InsertDriveFile sx={{ color: '#2980b9', fontSize: 22 }} />
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                      Task Details
                    </Typography>
                  </Box>

                  <Typography sx={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.7, mb: 2.5, fontFamily: fontStack }}>
                    {task.description}
                  </Typography>

                  <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 2.5 }} />

                  <Grid container spacing={2.5}>
                    <Grid item xs={6} md={4}>
                      <InfoRow icon={<Assignment />} label="Task ID" value={`#${task.id}`} />
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <InfoRow icon={<Group />} label="Batch ID" value={task.batchId} />
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <InfoRow icon={<Schedule />} label="Session ID" value={task.sessionId} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Slide>

            {/* Questions Card */}
            <Slide in direction="up" timeout={800}>
              <Card sx={{
                borderRadius: '16px', bgcolor: '#fff',
                border: '1px solid rgba(41,128,185,0.08)',
                boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '9px', background: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <QuestionAnswer sx={{ color: '#fff', fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                      Task Questions ({task.questions.length})
                    </Typography>
                  </Box>

                  {task.questions.length > 0 ? (
                    <List disablePadding>
                      {task.questions.map((question, index) => (
                        <ListItem
                          key={index}
                          disableGutters
                          sx={{
                            px: 1.5, py: 1.2, borderRadius: '12px', mb: 0.5,
                            transition: 'all 0.15s ease',
                            '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 38 }}>
                            <Avatar sx={{
                              width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700,
                              background: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)',
                              color: '#fff', fontFamily: fontStack,
                            }}>
                              {index + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={question}
                            primaryTypographyProps={{
                              sx: { fontSize: '0.88rem', fontWeight: 500, color: '#0f172a', lineHeight: 1.6, fontFamily: fontStack },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <QuestionAnswer sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
                      <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: fontStack }}>
                        No questions available for this task.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Slide>
          </Box>
        </Grid>

        {/* ═══ RIGHT — Sidebar ═══ */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={2.5}>
            <Zoom in timeout={700}>
              <Card sx={{
                borderRadius: '16px', bgcolor: '#fff',
                border: '1px solid rgba(41,128,185,0.08)',
                boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
                position: 'sticky', top: 80,
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', mb: 2.5, fontFamily: fontStack }}>
                    Task Summary
                  </Typography>

                  {/* Question count highlight */}
                  <Box sx={{
                    p: 2.5, borderRadius: '14px', mb: 2.5,
                    background: 'linear-gradient(135deg, rgba(41,128,185,0.06) 0%, rgba(13,148,136,0.04) 100%)',
                    border: '1px solid rgba(41,128,185,0.08)',
                    textAlign: 'center',
                  }}>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#2980b9', lineHeight: 1, fontFamily: fontStack }}>
                      {task.questions.length}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5, fontFamily: fontStack }}>
                      Total Questions
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 2 }} />

                  {/* Key-Value pairs */}
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {[
                      { label: 'Task ID', value: `#${task.id}` },
                      { label: 'Batch ID', value: task.batchId },
                      { label: 'Session ID', value: task.sessionId },
                      { label: 'Questions', value: task.questions.length },
                    ].map((item) => (
                      <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack }}>{item.label}</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>{item.value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', my: 2 }} />

                  {/* ═══ Submit Task Section ═══ */}
                  {submissionStatus === 'submitted' ? (
                    <Box sx={{
                      p: 2, borderRadius: '12px',
                      bgcolor: 'rgba(13,148,136,0.06)',
                      border: '1px solid rgba(13,148,136,0.15)',
                      textAlign: 'center',
                    }}>
                      <CheckCircle sx={{ fontSize: 32, color: '#0d9488', mb: 0.5 }} />
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#0d9488', fontFamily: fontStack }}>
                        Task Submitted
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5, fontFamily: fontStack }}>
                        You have already submitted this task.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/student/task-submissions')}
                        sx={{
                          mt: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                          borderRadius: '8px', borderColor: 'rgba(13,148,136,0.30)', color: '#0d9488',
                          fontFamily: fontStack,
                          '&:hover': { borderColor: '#0d9488', bgcolor: 'rgba(13,148,136,0.04)' },
                        }}
                      >
                        View Submissions
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Upload sx={{ fontSize: '20px !important' }} />}
                      onClick={() => setOpenSubmitDialog(true)}
                      sx={{
                        textTransform: 'none', fontWeight: 700, fontSize: '0.88rem',
                        borderRadius: '12px', py: 1.5,
                        background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                        fontFamily: fontStack,
                        boxShadow: '0 4px 12px rgba(41,128,185,0.25)',
                        '&:hover': { opacity: 0.9, boxShadow: '0 6px 16px rgba(41,128,185,0.30)' },
                      }}
                    >
                      Submit Task
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Zoom>
          </Box>
        </Grid>
      </Grid>

      {/* ═══ Submit Task Dialog ═══ */}
      <Dialog
        open={openSubmitDialog}
        onClose={() => !submitting && setOpenSubmitDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <Box sx={{ height: '3px', background: 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)' }} />
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: fontStack, color: '#0f172a', pb: 1 }}>
          Submit Task: #{task.id}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Task Info Summary */}
            <Box sx={{
              p: 2, mb: 2.5, borderRadius: '12px',
              bgcolor: 'rgba(41,128,185,0.04)',
              border: '1px solid rgba(41,128,185,0.10)',
            }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                {task.title}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 0.3, fontFamily: fontStack }}>
                Batch {task.batchId} • Session {task.sessionId} • {task.questions.length} question{task.questions.length !== 1 ? 's' : ''}
              </Typography>
            </Box>

            <Alert severity="info" sx={{
              mb: 2.5, borderRadius: '12px',
              border: '1px solid rgba(41,128,185,0.15)',
              '& .MuiAlert-message': { fontSize: '0.82rem', fontFamily: fontStack },
            }}>
              <strong>Accepted formats:</strong> PDF, Word, Excel, JPG, PNG (max 5MB)
            </Alert>

            {/* File Upload Area */}
            <Box
              sx={{
                border: '2px dashed rgba(41,128,185,0.20)', borderRadius: '14px', p: 4,
                textAlign: 'center', cursor: submitting ? 'default' : 'pointer',
                transition: 'all 0.2s ease', bgcolor: 'rgba(41,128,185,0.02)',
                '&:hover': submitting ? {} : { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
              }}
              onClick={() => !submitting && document.getElementById('task-file-upload').click()}
            >
              <CloudUpload sx={{ fontSize: 44, color: '#2980b9', mb: 1, opacity: 0.6 }} />
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', mb: 0.5, fontFamily: fontStack }}>
                {selectedFile ? 'Change file' : 'Click to upload your task file'}
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack }}>
                or drag and drop your file here
              </Typography>
              <input
                id="task-file-upload"
                type="file"
                hidden
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                disabled={submitting}
              />
            </Box>

            {/* Selected File Preview */}
            {selectedFile && (
              <Box sx={{
                mt: 2, p: 2, borderRadius: '12px',
                bgcolor: 'rgba(41,128,185,0.04)',
                border: '1px solid rgba(41,128,185,0.08)',
              }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    {getFileIcon(selectedFile.name)}
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                        {selectedFile.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedFile(null)}
                    disabled={submitting}
                    sx={{ color: '#94a3b8' }}
                  >
                    <Close sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Upload Progress */}
            {submitting && (
              <Box mt={2}>
                <Typography sx={{ fontSize: '0.82rem', color: '#475569', mb: 0.5, fontFamily: fontStack }}>
                  Uploading... {uploadProgress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    borderRadius: 4, height: 6,
                    bgcolor: 'rgba(41,128,185,0.10)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #2980b9, #0d9488)',
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setOpenSubmitDialog(false)}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', color: '#64748b', fontFamily: fontStack }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitTask}
            disabled={submitting || !selectedFile}
            startIcon={submitting ? null : <Upload />}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: '10px',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              px: 3, fontFamily: fontStack,
              '&:hover': { opacity: 0.9 },
              '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentViewTrainerTask;