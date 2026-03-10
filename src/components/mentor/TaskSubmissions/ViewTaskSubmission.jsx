import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Avatar,
  Divider,
  Paper,
  LinearProgress,
  Alert,
  Rating,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Modal,
  CircularProgress
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  ArrowBack,
  Assignment,
  Person,
  CalendarToday,
  Schedule,
  AttachFile,
  Grade,
  CheckCircle,
  Warning,
  Error,
  Feedback,
  Download,
  Edit,
  Info,
  Description,
  QuestionAnswer,
  Visibility,
  Close,
  OpenInNew
} from '@mui/icons-material';
import { AuthContext } from '../../../context/AuthContext';
import { trainerTasksAPI } from '../../../services/API/trainertasks';

/* ── inject fonts ── */
const _style = document.getElementById('ts-view-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'ts-view-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes tsvFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(s);
  return s;
})();

const hFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const crd = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };

const getStatusColor = (status) => {
  switch (status) { case 'graded': return '#0d9488'; case 'submitted': return '#0ea5e9'; case 'pending_review': return '#f59e0b'; case 'pending': return '#f59e0b'; case 'needs_revision': return '#ef4444'; default: return '#94a3b8'; }
};
const getStatusBg = (status) => {
  switch (status) { case 'graded': return '#f0fdf4'; case 'submitted': return '#f0f4ff'; case 'pending_review': return '#fffbeb'; case 'pending': return '#fffbeb'; case 'needs_revision': return '#fef2f2'; default: return '#f8fafc'; }
};
const getGradeColor = (score, maxScore) => {
  const p = (score / maxScore) * 100;
  if (p >= 90) return '#0d9488'; if (p >= 80) return '#0ea5e9'; if (p >= 70) return '#f59e0b'; return '#ef4444';
};
const getTimelineColor = (type) => {
  switch (type) { case 'submitted': return '#0ea5e9'; case 'review_started': return '#1e3a8a'; case 'graded': return '#0d9488'; default: return '#94a3b8'; }
};
const getTimelineIcon = (type) => {
  switch (type) { case 'submitted': return <Assignment sx={{ fontSize: 16 }} />; case 'review_started': return <Person sx={{ fontSize: 16 }} />; case 'graded': return <Grade sx={{ fontSize: 16 }} />; default: return <Schedule sx={{ fontSize: 16 }} />; }
};
const getFileIcon = (name) => {
  if (!name) return '📎';
  const lower = name.toLowerCase();
  if (lower.includes('.pdf')) return '📄';
  if (lower.includes('.zip') || lower.includes('.rar')) return '📦';
  if (lower.includes('.mp4') || lower.includes('.mov') || lower.includes('.avi')) return '🎥';
  if (lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.gif')) return '🖼️';
  if (lower.includes('.doc') || lower.includes('.docx')) return '📝';
  if (lower.includes('.xls') || lower.includes('.xlsx')) return '📊';
  if (lower.includes('.ppt') || lower.includes('.pptx')) return '📎';
  return '📎';
};

// Helper to check if a file can be previewed inline
const isPreviewable = (fileName) => {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  // PDFs, images, and text-based files can be previewed in an iframe/object
  return (
    lower.endsWith('.pdf') ||
    lower.endsWith('.jpg') || lower.endsWith('.jpeg') ||
    lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.txt') || lower.endsWith('.csv') ||
    lower.endsWith('.html') || lower.endsWith('.htm')
  );
};

const isImageFile = (fileName) => {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp') || lower.endsWith('.svg');
};

const MentorViewTaskSubmission = ({ submissionId, onBack, onEdit }) => {
  const { user } = useContext(AuthContext);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState({ open: false, url: null, fileName: null, loading: false });

  // ═══════════════════════════════════════════════════════════════
  // ✅ REAL API CALL — replaces mock data
  // Backend: GET /api/mentor/submission/<mentor_id>/<submission_id>
  // Returns: Submission_ID, Student_ID, Student_Name, Task_Name,
  //          Task_Submit, Task_ID, Submitted_At, Batch_ID
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user?.id || !submissionId) {
        setError('Unable to load submission. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await trainerTasksAPI.getMentorSingleSubmission(user.id, submissionId);

        // Extract filename from S3 URL
        const taskSubmitUrl = response.Task_Submit || '';
        const fileName = taskSubmitUrl && taskSubmitUrl !== 'No file uploaded'
          ? decodeURIComponent(taskSubmitUrl.split('/').pop() || 'submission-file')
          : null;

        // Map backend fields to component format
        const mapped = {
          id: response.Submission_ID,
          task: {
            id: response.Task_ID,
            title: response.Task_Name || 'Untitled Task',
            description: response.Task_Name || '',
            dueDate: null,
            estimatedHours: null,
            maxScore: 100,
            requirements: []
          },
          submitter: {
            name: response.Student_Name || `Student ${response.Student_ID}`,
            avatar: null,
            email: ''
          },
          studentId: response.Student_ID,
          submissionDate: response.Submitted_At,
          status: 'submitted',
          grade: null,
          feedback: null,
          submissionText: '',
          attachments: fileName
            ? [{
                id: 1,
                name: fileName,
                size: 'N/A',
                type: 'application/octet-stream',
                uploadedDate: response.Submitted_At
              }]
            : [],
          taskSubmitUrl: taskSubmitUrl,
          reviewedBy: null,
          reviewedDate: null,
          timeSpent: 'N/A',
          isLate: false,
          batchId: response.Batch_ID,
          rubric: null,
          submissionHistory: response.Submitted_At
            ? [{
                id: 1,
                date: response.Submitted_At,
                action: 'Submission created',
                user: response.Student_Name || 'Student',
                type: 'submitted'
              }]
            : [],
          allowedActions: { canEdit: false, canResubmit: false, canViewFeedback: false }
        };

        setSubmission(mapped);
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError(err.message || 'Failed to load submission');
        setSubmission(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId, user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleDownload = async (attachment) => {
    try {
      // Call backend to get presigned S3 URL
      const response = await trainerTasksAPI.viewMentorSubmissionDocument(submissionId, user.id,'download');
      if (response && response.url) {
        window.open(response.url, '_blank');
      } else {
        console.error('No presigned URL returned');
      }
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const handleView = async (attachment) => {
    try {
      setPreview({ open: true, url: null, fileName: attachment.name, loading: true });

      const response = await trainerTasksAPI.viewMentorSubmissionDocument(submissionId, user.id, 'view');
      if (response && response.url) {
        setPreview({ open: true, url: response.url, fileName: attachment.name, loading: false });
      } else {
        console.error('No presigned URL returned');
        setPreview({ open: false, url: null, fileName: null, loading: false });
      }
    } catch (err) {
      console.error('Error viewing file:', err);
      setPreview({ open: false, url: null, fileName: null, loading: false });
    }
  };

  const handleClosePreview = () => {
    setPreview({ open: false, url: null, fileName: null, loading: false });
  };

  // Render preview content based on file type
  const renderPreviewContent = () => {
    if (preview.loading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
          <CircularProgress sx={{ color: '#0ea5e9' }} />
          <Typography sx={{ ...bFont, fontSize: '0.9rem', color: '#64748b' }}>Loading preview...</Typography>
        </Box>
      );
    }

    if (!preview.url) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
          <Warning sx={{ fontSize: 48, color: '#f59e0b' }} />
          <Typography sx={{ ...bFont, fontSize: '0.9rem', color: '#64748b' }}>Unable to load preview</Typography>
        </Box>
      );
    }

    const fileName = preview.fileName || '';

    // Image files – render as <img>
    if (isImageFile(fileName)) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2, overflow: 'auto' }}>
          <img
            src={preview.url}
            alt={fileName}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
          />
        </Box>
      );
    }

    // PDF and other previewable files – render in iframe
    if (isPreviewable(fileName)) {
      return (
        <iframe
          src={preview.url}
          title={`Preview: ${fileName}`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0 0 14px 14px' }}
        />
      );
    }

    // Non-previewable files (docx, xlsx, pptx, zip, etc.) –
    // Use Google Docs Viewer as a fallback for office documents
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(preview.url)}&embedded=true`;
      return (
        <iframe
          src={googleViewerUrl}
          title={`Preview: ${fileName}`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0 0 14px 14px' }}
        />
      );
    }

    // Fallback for truly non-previewable files
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2, p: 3 }}>
        <Box sx={{ width: 80, height: 80, borderRadius: '16px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 40 }}>{getFileIcon(fileName)}</Typography>
        </Box>
        <Typography sx={{ ...hFont, fontSize: '1.1rem', textAlign: 'center' }}>{fileName}</Typography>
        <Typography sx={{ ...bFont, fontSize: '0.88rem', color: '#64748b', textAlign: 'center' }}>
          This file type cannot be previewed directly. Please download to view.
        </Typography>
        <IconButton
          onClick={() => handleDownload({ name: fileName })}
          sx={{
            mt: 1, px: 3, py: 1, borderRadius: '10px',
            background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
            color: '#fff', fontSize: '0.88rem',
            '&:hover': { background: 'linear-gradient(135deg, #0284c7, #0f766e)' }
          }}
        >
          <Download sx={{ fontSize: 18, mr: 1 }} /> Download File
        </IconButton>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
          <Box sx={{ flex: 1 }}><Skeleton variant="text" width={280} height={32} /><Skeleton variant="text" width={180} height={18} /></Box>
        </Box>
        <Skeleton variant="rounded" width="100%" height={200} sx={{ borderRadius: '14px', mb: 2.5 }} />
        <Box display="flex" gap={2.5}><Skeleton variant="rounded" sx={{ flex: 2, height: 300, borderRadius: '14px' }} /><Skeleton variant="rounded" sx={{ flex: 1, height: 300, borderRadius: '14px' }} /></Box>
      </Box>
    );
  }

  if (error || !submission) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <IconButton onClick={onBack} sx={{ mb: 2, width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2' }}><ArrowBack sx={{ fontSize: 20, color: '#475569' }} /></IconButton>
        <Alert severity="error" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>
          {error || 'Submission not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Document Preview Modal                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Modal
        open={preview.open}
        onClose={handleClosePreview}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, md: 3 } }}
      >
        <Box sx={{
          width: '95vw', maxWidth: 1100, height: '90vh',
          background: '#ffffff', borderRadius: '14px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', outline: 'none'
        }}>
          {/* Preview Header */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 3, py: 2, borderBottom: '1px solid #e8ecf2', background: '#f8fafc',
            flexShrink: 0
          }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 20 }}>{getFileIcon(preview.fileName)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ ...hFont, fontSize: '0.95rem', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {preview.fileName || 'Document Preview'}
                </Typography>
                <Typography sx={{ ...bFont, fontSize: '0.75rem', color: '#94a3b8' }}>Document Preview</Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {preview.url && (
                <IconButton
                  onClick={() => window.open(preview.url, '_blank')}
                  title="Open in new tab"
                  sx={{
                    width: 36, height: 36, borderRadius: '8px',
                    color: '#0ea5e9', background: 'rgba(14,165,233,0.08)',
                    '&:hover': { background: 'rgba(14,165,233,0.15)' }
                  }}
                >
                  <OpenInNew sx={{ fontSize: 18 }} />
                </IconButton>
              )}
              {preview.url && (
                <IconButton
                  onClick={() => handleDownload({ name: preview.fileName })}
                  title="Download"
                  sx={{
                    width: 36, height: 36, borderRadius: '8px',
                    color: '#1e3a8a', background: 'rgba(30,58,138,0.08)',
                    '&:hover': { background: 'rgba(30,58,138,0.15)' }
                  }}
                >
                  <Download sx={{ fontSize: 18 }} />
                </IconButton>
              )}
              <IconButton
                onClick={handleClosePreview}
                sx={{
                  width: 36, height: 36, borderRadius: '8px',
                  color: '#ef4444', background: 'rgba(239,68,68,0.08)',
                  '&:hover': { background: 'rgba(239,68,68,0.15)' }
                }}
              >
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Preview Body */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {renderPreviewContent()}
          </Box>
        </Box>
      </Modal>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, animation: 'tsvFadeUp 0.5s ease-out both', flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={onBack} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease' }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <Assignment sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: { xs: '1.2rem', md: '1.4rem' }, lineHeight: 1.2 }}>Submission Details</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>{submission.task.title}</Typography>
          </Box>
        </Box>
        {submission.allowedActions.canEdit && (
          <IconButton onClick={() => onEdit && onEdit(submission)} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', color: '#0ea5e9', '&:hover': { background: '#f0f4ff' } }}>
            <Edit sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Box>

      {/* Alerts */}
      {submission.isLate && <Alert severity="warning" sx={{ mb: 2, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>This submission was submitted after the due date.</Alert>}
      {submission.status === 'graded' && submission.feedback && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>This submission has been graded and feedback is available below.</Alert>}

      {/* Overview Card */}
      <Paper elevation={0} sx={{ ...crd, p: 3, mb: 2.5, animation: 'tsvFadeUp 0.5s ease-out 0.1s both' }}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Assignment sx={{ color: '#0ea5e9', fontSize: 22 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ ...hFont, fontSize: '1.15rem' }}>{submission.task.title}</Typography>
                {submission.task.description && submission.task.description !== submission.task.title && (
                  <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b' }}>{submission.task.description}</Typography>
                )}
              </Box>
            </Box>

            {/* Status chip */}
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip label="SUBMITTED" size="small" sx={{
                height: 26, fontSize: '0.7rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                background: getStatusBg(submission.status), color: getStatusColor(submission.status),
                border: `1px solid ${getStatusColor(submission.status)}25`
              }} />
              {submission.batchId && (
                <Chip label={`Batch ${submission.batchId}`} size="small" sx={{
                  height: 26, fontSize: '0.7rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                  background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe'
                }} />
              )}
            </Box>

            {/* Info grid - only show fields that have data */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student</Typography>
                <Box display="flex" alignItems="center" gap={0.8} mt={0.3}>
                  <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)' }}>
                    {submission.submitter.name.charAt(0)}
                  </Avatar>
                  <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 600 }}>{submission.submitter.name}</Typography>
                </Box>
              </Box>
              {submission.studentId && (
                <Box>
                  <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student ID</Typography>
                  <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 600, mt: 0.2 }}>{submission.studentId}</Typography>
                </Box>
              )}
              <Box>
                <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Submitted</Typography>
                <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 600, mt: 0.2 }}>{formatDate(submission.submissionDate)}</Typography>
              </Box>
              {submission.task.dueDate && (
                <Box>
                  <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Due Date</Typography>
                  <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 600, mt: 0.2 }}>{formatDate(submission.task.dueDate)}</Typography>
                </Box>
              )}
              {submission.timeSpent && submission.timeSpent !== 'N/A' && (
                <Box>
                  <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Time Spent</Typography>
                  <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 600, mt: 0.2 }}>{submission.timeSpent}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Grade section - show if graded, otherwise show pending */}
          {submission.grade !== null && submission.grade !== undefined ? (
            <Box sx={{ textAlign: 'center', p: 2.5, borderRadius: '14px', background: 'linear-gradient(135deg, rgba(14,165,233,0.04), rgba(13,148,136,0.02))', border: '1px solid #e8ecf2', minWidth: 180 }}>
              <Typography sx={{ ...hFont, fontSize: '2.2rem', lineHeight: 1, color: getGradeColor(submission.grade, submission.task.maxScore) }}>
                {submission.grade}<Typography component="span" sx={{ ...bFont, fontSize: '1rem', color: '#94a3b8' }}>/{submission.task.maxScore}</Typography>
              </Typography>
              <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.5 }}>Grade</Typography>
              <Rating value={submission.grade / 20} readOnly precision={0.1} size="medium" sx={{ mt: 1, '& .MuiRating-iconFilled': { color: '#0ea5e9' } }} />
              <Typography sx={{ ...bFont, fontSize: '0.78rem', color: '#64748b', mt: 0.5 }}>{Math.round((submission.grade / submission.task.maxScore) * 100)}%</Typography>
              {submission.reviewedBy && (
                <Box mt={1.5} pt={1.5} sx={{ borderTop: '1px solid #f1f5f9' }}>
                  <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8' }}>Reviewed by</Typography>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.3}>
                    <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)' }}>{submission.reviewedBy.name ? submission.reviewedBy.name.charAt(0) : 'M'}</Avatar>
                    <Typography sx={{ ...bFont, fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{submission.reviewedBy.name || 'Mentor'}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', p: 2.5, borderRadius: '14px', background: '#f0f4ff', border: '1px solid #dbeafe', minWidth: 180 }}>
              <Assignment sx={{ fontSize: 40, color: '#0ea5e9', mb: 1 }} />
              <Typography sx={{ ...hFont, fontSize: '1rem', color: '#0ea5e9' }}>Submitted</Typography>
              <Typography sx={{ ...bFont, fontSize: '0.8rem', color: '#64748b' }}>Awaiting review</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Content Layout */}
      <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', lg: 'row' }, animation: 'tsvFadeUp 0.5s ease-out 0.2s both' }}>
        {/* Left */}
        <Box sx={{ flex: '1 1 65%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Task Requirements - only show if available */}
          {submission.task.requirements && submission.task.requirements.length > 0 && (
            <Paper elevation={0} sx={{ ...crd, p: 3 }}>
              <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle sx={{ color: '#0d9488', fontSize: 18 }} /></Box>
                Task Requirements
              </Typography>
              {submission.task.requirements.map((req, i) => (
                <Box key={i} display="flex" alignItems="center" gap={1.5} sx={{ py: 1, px: 1.5, mb: 0.5, borderRadius: '8px', background: i % 2 === 0 ? '#f8fafc' : 'transparent' }}>
                  <CheckCircle sx={{ fontSize: 16, color: '#0d9488' }} />
                  <Typography sx={{ ...bFont, fontSize: '0.86rem' }}>{req}</Typography>
                </Box>
              ))}
            </Paper>
          )}

          {/* Submission Details - only show if submissionText available */}
          {submission.submissionText && (
            <Paper elevation={0} sx={{ ...crd, p: 3 }}>
              <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Description sx={{ color: '#0ea5e9', fontSize: 18 }} /></Box>
                Submission Details
              </Typography>
              <Box sx={{ p: 2.5, borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <Typography sx={{ ...bFont, fontSize: '0.88rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{submission.submissionText}</Typography>
              </Box>
            </Paper>
          )}

          {/* Submission Info Card - always show since we have basic data */}
          <Paper elevation={0} sx={{ ...crd, p: 3 }}>
            <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Info sx={{ color: '#0ea5e9', fontSize: 18 }} /></Box>
              Submission Info
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: '8px', background: '#f8fafc' }}>
                <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>Submission ID</Typography>
                <Typography sx={{ ...hFont, fontSize: '0.84rem', fontWeight: 600 }}>#{submission.id}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: '8px' }}>
                <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>Student</Typography>
                <Typography sx={{ ...hFont, fontSize: '0.84rem', fontWeight: 600 }}>{submission.submitter.name}</Typography>
              </Box>
              {submission.studentId && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: '8px', background: '#f8fafc' }}>
                  <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>Student ID</Typography>
                  <Typography sx={{ ...hFont, fontSize: '0.84rem', fontWeight: 600 }}>{submission.studentId}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: '8px' }}>
                <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>Task ID</Typography>
                <Typography sx={{ ...hFont, fontSize: '0.84rem', fontWeight: 600 }}>#{submission.task.id}</Typography>
              </Box>
              {submission.batchId && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: '8px', background: '#f8fafc' }}>
                  <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>Batch ID</Typography>
                  <Typography sx={{ ...hFont, fontSize: '0.84rem', fontWeight: 600 }}>{submission.batchId}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: '8px' }}>
                <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>Submitted At</Typography>
                <Typography sx={{ ...hFont, fontSize: '0.84rem', fontWeight: 600 }}>{formatDate(submission.submissionDate)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: '1 1 35%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Rubric - only show if available */}
          {submission.rubric && submission.rubric.criteria && submission.rubric.criteria.length > 0 && (
            <Paper elevation={0} sx={{ ...crd, p: 3 }}>
              <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Grade sx={{ color: '#0d9488', fontSize: 18 }} /></Box>
                Grading Breakdown
              </Typography>
              {submission.rubric.criteria.map((c, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography sx={{ ...hFont, fontSize: '0.82rem', fontWeight: 600 }}>{c.name}</Typography>
                    <Typography sx={{ ...hFont, fontSize: '0.82rem', fontWeight: 700, color: getGradeColor(c.score, c.maxScore) }}>{c.score}/{c.maxScore}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={(c.score / c.maxScore) * 100} sx={{
                    height: 5, borderRadius: 3, backgroundColor: '#f1f5f9', mb: 0.5,
                    '& .MuiLinearProgress-bar': { borderRadius: 3, background: `linear-gradient(90deg, ${getGradeColor(c.score, c.maxScore)}, ${getGradeColor(c.score, c.maxScore)}80)` },
                  }} />
                  <Typography sx={{ ...bFont, fontSize: '0.74rem', color: '#94a3b8' }}>{c.feedback}</Typography>
                </Box>
              ))}
            </Paper>
          )}

          {/* Timeline - show if history available */}
          {submission.submissionHistory && submission.submissionHistory.length > 0 && (
            <Paper elevation={0} sx={{ ...crd, p: 3 }}>
              <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(30,58,138,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Schedule sx={{ color: '#1e3a8a', fontSize: 18 }} /></Box>
                Submission Timeline
              </Typography>
              <Timeline sx={{ p: 0, m: 0, '& .MuiTimelineItem-root:before': { flex: 0, padding: 0 } }}>
                {submission.submissionHistory.map((event, index) => (
                  <TimelineItem key={event.id}>
                    <TimelineSeparator>
                      <TimelineDot sx={{ bgcolor: getTimelineColor(event.type), boxShadow: `0 2px 8px ${getTimelineColor(event.type)}30`, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getTimelineIcon(event.type)}
                      </TimelineDot>
                      {index < submission.submissionHistory.length - 1 && <TimelineConnector sx={{ bgcolor: '#e8ecf2' }} />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: 1, px: 2 }}>
                      <Typography sx={{ ...hFont, fontSize: '0.84rem', fontWeight: 600 }}>{event.action}</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.76rem', color: '#94a3b8' }}>by {event.user}</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8' }}>{formatDate(event.date)}</Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Full-width sections below the two-column layout */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2.5, animation: 'tsvFadeUp 0.5s ease-out 0.3s both' }}>
        {/* Attachments - show if available */}
        {submission.attachments && submission.attachments.length > 0 && (
          <Paper elevation={0} sx={{ ...crd, p: 3 }}>
            <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(30,58,138,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AttachFile sx={{ color: '#1e3a8a', fontSize: 18 }} /></Box>
              Attachments ({submission.attachments.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {submission.attachments.map((att) => (
                <Box key={att.id} sx={{
                  flex: '1 1 calc(25% - 12px)', minWidth: 220, p: 2, borderRadius: '10px',
                  background: '#f8fafc', border: '1px solid #f1f5f9',
                  transition: 'all 0.2s ease', '&:hover': { borderColor: '#dbeafe', background: '#f0f4ff' },
                }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography sx={{ fontSize: 20 }}>{getFileIcon(att.name)}</Typography>
                    <Typography sx={{ ...bFont, fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{att.name}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ ...bFont, fontSize: '0.74rem', color: '#94a3b8' }}>{att.size}</Typography>
                    <Box display="flex" gap={0.5}>
                      <IconButton size="small" onClick={() => handleView(att)} title="Preview" sx={{ width: 26, height: 26, borderRadius: '6px', color: '#1e3a8a', background: 'rgba(30,58,138,0.08)', '&:hover': { background: 'rgba(30,58,138,0.15)' } }}>
                        <Visibility sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDownload(att)} title="Download" sx={{ width: 26, height: 26, borderRadius: '6px', color: '#0ea5e9', background: 'rgba(14,165,233,0.08)', '&:hover': { background: 'rgba(14,165,233,0.15)' } }}>
                        <Download sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Instructor Feedback - only show if available */}
        {submission.feedback && (
          <Paper elevation={0} sx={{ ...crd, p: 3 }}>
            <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Feedback sx={{ color: '#0ea5e9', fontSize: 18 }} /></Box>
              Instructor Feedback
            </Typography>
            <Box sx={{ p: 2.5, borderRadius: '12px', background: '#f0f4ff', border: '1px solid #dbeafe' }}>
              <Typography sx={{ ...bFont, fontSize: '0.88rem', lineHeight: 1.7, color: '#1e3a8a' }}>{submission.feedback}</Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default MentorViewTaskSubmission;