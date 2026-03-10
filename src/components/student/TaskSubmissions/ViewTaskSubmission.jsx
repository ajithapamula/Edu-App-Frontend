import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Backdrop,
  Fade,
  Slide,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack,
  Person,
  AttachFile,
  CheckCircle,
  Warning,
  Download,
  Visibility,
  Delete,
  Close,
  Schedule,
  InsertDriveFile,
  OpenInNew,
} from '@mui/icons-material';
import { taskSubmissionsAPI } from '../../../services/API/studenttask';
import { useAuth } from '../../../hooks/useAuth';
import LoadingSpinner from '../../common/LoadingSpinner';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

const cardSx = {
  borderRadius: '16px', bgcolor: '#fff',
  border: '1px solid rgba(41,128,185,0.08)',
  boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
};

const ViewTaskSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || user?.studentId || user?.student_id || user?.ID;
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileContent, setFileContent] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState(null); // Store presigned URL for download
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { fetchTaskSubmission(); }, [id]);

  const fetchTaskSubmission = async () => {
    try {
      setLoading(true);
      const response = await taskSubmissionsAPI.getById(id, studentId);
      setSubmission(response);
    } catch (error) {
      setSnackbar({ open: true, message: `Error loading submission: ${error.message}`, severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleDeleteSubmission = async () => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await taskSubmissionsAPI.remove(id, studentId);
        setSnackbar({ open: true, message: 'Submission deleted successfully', severity: 'success' });
        setTimeout(() => navigate('/student/task-submissions'), 1500);
      } catch (error) { setSnackbar({ open: true, message: 'Failed to delete submission', severity: 'error' }); }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <AttachFile sx={{ color: '#94a3b8' }} />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const colorMap = { pdf: '#ef4444', doc: '#2980b9', docx: '#2980b9', xls: '#0d9488', xlsx: '#0d9488', jpg: '#f59e0b', jpeg: '#f59e0b', png: '#f59e0b' };
    return <AttachFile sx={{ color: colorMap[ext] || '#94a3b8' }} />;
  };

  const getFileName = (filePath) => {
    if (!filePath) return 'No file';
    return filePath.includes('/') ? filePath.split('/').pop() : filePath;
  };

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  // Build the backend API URL to get presigned URL
  const buildViewUrl = () => {
    let url = `/api/student/task-submissions/view-submission/${id}`;
    if (studentId) {
      url += `?role=student&user_id=${studentId}`;
    }
    return url;
  };

  // ═══════════════════════════════════════════════════════════
  // FIXED: Get presigned URL from backend
  // ═══════════════════════════════════════════════════════════
  const getPresignedUrl = async () => {
    const url = buildViewUrl();
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      let errorMessage;
      try { const errorData = await response.json(); errorMessage = errorData.error || `HTTP ${response.status}`; }
      catch (e) { errorMessage = `HTTP ${response.status}`; }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    if (!data.url) throw new Error('No file URL returned from server');
    return data.url;
  };

  // ═══════════════════════════════════════════════════════════
  // FIXED: View file - uses Google Docs Viewer for office files
  // ═══════════════════════════════════════════════════════════
  const handleViewFile = async () => {
    if (!submission?.Task_Submit) {
      setSnackbar({ open: true, message: 'No file available', severity: 'warning' });
      return;
    }

    try {
      setFileLoading(true);

      // Step 1: Get presigned URL from backend
      const s3Url = await getPresignedUrl();
      setPresignedUrl(s3Url); // Save for download button

      // Step 2: Determine file type
      const fn = getFileName(submission.Task_Submit).toLowerCase();

      if (fn.endsWith('.pdf')) {
        // PDF — open presigned URL directly in iframe
        setFileType('pdf');
        setFileContent(s3Url);
        setShowFileViewer(true);

      } else if (fn.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
        // Images — show directly
        setFileType('image');
        setFileContent(s3Url);
        setShowFileViewer(true);

      } else if (fn.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/)) {
        // Office files — use Google Docs Viewer OR Microsoft Office Online
        const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(s3Url)}&embedded=true`;
        setFileType('office_preview');
        setFileContent(googleViewerUrl);
        setShowFileViewer(true);

      } else if (fn.match(/\.(txt|log|csv|json|xml)$/)) {
        // Text files — open in new tab
        setFileType('text');
        setFileContent(s3Url);
        setShowFileViewer(true);

      } else {
        // Unknown — open in new tab directly
        window.open(s3Url, '_blank');
      }

    } catch (error) {
      let msg = error.message;
      if (msg.includes('Failed to fetch')) msg = 'Network error. Please try again.';
      else if (msg.includes('404')) msg = 'File not found on server.';
      setSnackbar({ open: true, message: `Error viewing file: ${msg}`, severity: 'error' });
    } finally {
      setFileLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // FIXED: Download — opens presigned URL directly (no fetch to S3)
  // This avoids CORS errors completely
  // ═══════════════════════════════════════════════════════════
  const handleDirectDownload = async () => {
    try {
      let downloadUrl = presignedUrl;

      // If we don't have a presigned URL yet, get one
      if (!downloadUrl) {
        downloadUrl = await getPresignedUrl();
        setPresignedUrl(downloadUrl);
      }

      // Open the presigned URL directly in a new tab
      // The browser will handle the download automatically
      window.open(downloadUrl, '_blank');

      setSnackbar({ open: true, message: 'File download started', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `Download failed: ${error.message}`, severity: 'error' });
    }
  };

  const handleCloseFileViewer = () => {
    setShowFileViewer(false);
    // Only revoke blob URLs, not presigned URLs
    if (fileContent && fileContent.startsWith('blob:')) {
      URL.revokeObjectURL(fileContent);
    }
    setFileContent(null);
    setFileType(null);
  };

  if (loading) return <LoadingSpinner message="Loading task submission details..." />;

  if (!submission) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Warning sx={{ fontSize: 52, color: '#cbd5e1', mb: 1.5 }} />
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5, fontFamily: fontStack }}>Submission Not Found</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mb: 2.5, fontFamily: fontStack }}>The requested task submission could not be found.</Typography>
        <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate('/student/task-submissions')}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', fontFamily: fontStack }}>
          Back to Task Submissions
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* ═══ Header ═══ */}
      <Fade in timeout={600}>
        <Box sx={{
          p: 2.5, mb: 3, borderRadius: '16px',
          background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)',
          boxShadow: '0 4px 20px rgba(26,82,118,0.18)', position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
            <Box display="flex" alignItems="center">
              <IconButton onClick={() => navigate('/student/task-submissions')} sx={{
                mr: 2, width: 42, height: 42, borderRadius: '11px', bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.20)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}>
                <ArrowBack sx={{ fontSize: 22 }} />
              </IconButton>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', fontFamily: fontStack }}>Task Submission Details</Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button variant="outlined" startIcon={<Delete sx={{ fontSize: '18px !important' }} />} onClick={handleDeleteSubmission}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', borderRadius: '10px', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.10)' } }}>
                Delete
              </Button>
              <Button variant="contained" onClick={() => navigate('/student/task-submissions')}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.92)', color: '#1a5276', '&:hover': { bgcolor: '#fff' } }}>
                Back to List
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>

      <Grid container spacing={2.5}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Slide in direction="up" timeout={600}>
            <Box sx={{ ...cardSx, p: 3, position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)' }} />

              {/* Status */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5} mt={1}>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>Submission Information</Typography>
                <Chip icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} label="Submitted" size="small"
                  sx={{ height: 26, fontSize: '0.72rem', fontWeight: 700, borderRadius: '7px', bgcolor: 'rgba(13,148,136,0.10)', color: '#0d9488', '& .MuiChip-icon': { color: '#0d9488' } }} />
              </Box>
              <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 2.5 }} />

              {/* Student Info */}
              <Box mb={2.5}>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Person sx={{ color: '#2980b9', fontSize: 22 }} />
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>Student Information</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.3 }}>Student ID</Typography>
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>{submission.Student_ID}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.3 }}>Student Name</Typography>
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>{submission.Student_Name || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 2.5 }} />

              {/* Submission Details */}
              <Box mb={2.5}>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Schedule sx={{ color: '#2980b9', fontSize: 22 }} />
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>Submission Details</Typography>
                </Box>
                {submission.Submitted_At && (
                  <Box mb={1.5}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.3 }}>Submitted On</Typography>
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>{formatDate(submission.Submitted_At)}</Typography>
                  </Box>
                )}
                {submission.Task_Name && (
                  <Box mb={1.5}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.3 }}>Task Name</Typography>
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>{submission.Task_Name}</Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 2.5 }} />

              {/* File Info */}
              {submission.Task_Submit && (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <InsertDriveFile sx={{ color: '#2980b9', fontSize: 22 }} />
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>Submitted File</Typography>
                  </Box>
                  <Card sx={{ borderRadius: '14px', border: '1px solid rgba(41,128,185,0.08)', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          {getFileIcon(submission.Task_Submit)}
                          <Box>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>{getFileName(submission.Task_Submit)}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: fontStack }}>Task submission file</Typography>
                          </Box>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Button variant="outlined" size="small"
                            startIcon={fileLoading ? <CircularProgress size={14} /> : <Visibility sx={{ fontSize: '16px !important' }} />}
                            onClick={handleViewFile} disabled={fileLoading}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', borderRadius: '8px', borderColor: 'rgba(41,128,185,0.20)', color: '#2980b9', '&:hover': { borderColor: '#2980b9' } }}>
                            {fileLoading ? 'Loading...' : 'View'}
                          </Button>
                          <Button variant="outlined" size="small"
                            startIcon={<Download sx={{ fontSize: '16px !important' }} />}
                            onClick={handleDirectDownload}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', borderRadius: '8px', borderColor: 'rgba(41,128,185,0.20)', color: '#2980b9', '&:hover': { borderColor: '#2980b9' } }}>
                            Download
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          </Slide>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ ...cardSx, position: 'sticky', top: 80 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', mb: 2, fontFamily: fontStack }}>Submission Status</Typography>
              <Box mb={2.5}>
                <Chip icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} label="Successfully Submitted" size="small"
                  sx={{ height: 28, fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', bgcolor: 'rgba(13,148,136,0.10)', color: '#0d9488', mb: 1.5, '& .MuiChip-icon': { color: '#0d9488' } }} />
                <Typography sx={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, fontFamily: fontStack }}>Your task has been submitted and is available for review.</Typography>
              </Box>

              {submission.grade && (
                <Box mb={2.5}>
                  <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 2 }} />
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', mb: 0.5, fontFamily: fontStack }}>Grade</Typography>
                  <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#0d9488', lineHeight: 1, fontFamily: fontStack }}>{submission.grade}</Typography>
                </Box>
              )}

              {submission.feedback && (
                <Box mb={2.5}>
                  <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 2 }} />
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', mb: 1, fontFamily: fontStack }}>Feedback</Typography>
                  <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(41,128,185,0.04)', border: '1px solid rgba(41,128,185,0.08)' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, fontFamily: fontStack }}>{submission.feedback}</Typography>
                  </Box>
                </Box>
              )}

              {!submission.grade && !submission.feedback && (
                <Box>
                  <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 2 }} />
                  <Alert severity="info" sx={{ borderRadius: '12px', border: '1px solid rgba(41,128,185,0.15)', '& .MuiAlert-message': { fontSize: '0.82rem', fontFamily: fontStack } }}>
                    <strong>Pending Review</strong><br />Your submission is awaiting review. You'll be notified when feedback is available.
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FIXED: File Viewer Dialog                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={showFileViewer} onClose={handleCloseFileViewer} maxWidth="lg" fullWidth
        PaperProps={{ sx: { height: '90vh', borderRadius: '16px', overflow: 'hidden' } }}>
        <Box sx={{ height: '3px', background: 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)' }} />
        <DialogTitle sx={{ fontWeight: 700, fontFamily: fontStack, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, fontFamily: fontStack }}>{getFileName(submission?.Task_Submit)}</Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {/* Open in new tab button */}
            <IconButton
              onClick={() => window.open(presignedUrl || fileContent, '_blank')}
              title="Open in new tab"
              sx={{ color: '#2980b9' }}
            >
              <OpenInNew sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton onClick={handleCloseFileViewer}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {fileContent && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

              {/* PDF — iframe with presigned URL */}
              {fileType === 'pdf' && (
                <Box sx={{ height: '100%', width: '100%' }}>
                  <iframe
                    src={fileContent}
                    title="PDF Viewer"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                  />
                </Box>
              )}

              {/* Images — direct img tag */}
              {fileType === 'image' && (
                <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                  <img src={fileContent} alt="Submitted file" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </Box>
              )}

              {/* Office files — Google Docs Viewer iframe */}
              {fileType === 'office_preview' && (
                <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
                  <iframe
                    src={fileContent}
                    title="Document Viewer"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                  {/* Fallback message at bottom */}
                  <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    bgcolor: 'rgba(255,255,255,0.95)', p: 1.5,
                    borderTop: '1px solid rgba(41,128,185,0.08)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1
                  }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontFamily: fontStack }}>
                      Document not loading?
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Download sx={{ fontSize: '14px !important' }} />}
                      onClick={handleDirectDownload}
                      sx={{ textTransform: 'none', fontSize: '0.78rem', fontWeight: 600, color: '#2980b9' }}
                    >
                      Download instead
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Text files */}
              {fileType === 'text' && (
                <Box sx={{ height: '100%', width: '100%' }}>
                  <iframe
                    src={fileContent}
                    title="Text Viewer"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </Box>
              )}

              {/* Unknown file type */}
              {(fileType === 'office' || fileType === 'unknown') && (
                <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', p: 3 }}>
                  <AttachFile sx={{ fontSize: 52, color: '#2980b9', mb: 2 }} />
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', mb: 0.5, fontFamily: fontStack }}>
                    Preview Not Available
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', mb: 2.5, fontFamily: fontStack }}>
                    This file type cannot be previewed. Please download to view.
                  </Typography>
                  <Button variant="contained" startIcon={<Download />} onClick={handleDirectDownload}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', fontFamily: fontStack }}>
                    Download {getFileName(submission.Task_Submit)}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button startIcon={<Download />} onClick={handleDirectDownload}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#2980b9', borderRadius: '10px' }}>
            Download
          </Button>
          <Button onClick={handleCloseFileViewer}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b', borderRadius: '10px' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={fileLoading}>
        <Box textAlign="center"><CircularProgress sx={{ color: '#fff' }} /><Typography sx={{ mt: 2, fontSize: '0.88rem' }}>Loading file...</Typography></Box>
      </Backdrop>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewTaskSubmission;
