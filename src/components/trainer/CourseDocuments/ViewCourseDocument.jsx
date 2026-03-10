import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Skeleton,
  Tooltip,
  Snackbar,
  Chip,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Edit,
  Delete,
  Share,
  Close,
  Visibility,
  ContentCopy,
  OpenInNew,
  InsertDriveFile,
  Schedule,
  Folder,
  Tag,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../common/ConfirmDialog';
import { courseDocumentsAPI } from '../../../services/API/courseDocuments';
import { AuthContext } from '../../../context/AuthContext';

/* ───────────── shared sx tokens (matching list page) ───────────── */
const cardSx = {
  borderRadius: '14px',
  border: '1px solid #E2E8F0',
  boxShadow: 'none',
};

/* ───────────── file-type helper ───────────── */
const getFileInfo = (doc) => {
  const path = doc?._original?.Document_Path || doc?.path || doc?.title || '';
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map = {
    pdf:  { label: 'PDF',  color: '#EF4444', bg: '#FEE2E2', icon: '📄' },
    doc:  { label: 'DOC',  color: '#3B82F6', bg: '#DBEAFE', icon: '📝' },
    docx: { label: 'DOC',  color: '#3B82F6', bg: '#DBEAFE', icon: '📝' },
    ppt:  { label: 'PPT',  color: '#F59E0B', bg: '#FEF3C7', icon: '📊' },
    pptx: { label: 'PPT',  color: '#F59E0B', bg: '#FEF3C7', icon: '📊' },
    txt:  { label: 'TXT',  color: '#6B7280', bg: '#F3F4F6', icon: '📃' },
    jpg:  { label: 'IMG',  color: '#06B6D4', bg: '#CFFAFE', icon: '🖼️' },
    jpeg: { label: 'IMG',  color: '#06B6D4', bg: '#CFFAFE', icon: '🖼️' },
    png:  { label: 'IMG',  color: '#06B6D4', bg: '#CFFAFE', icon: '🖼️' },
  };
  return map[ext] || map.pdf;
};

/* ── Get file extension from document ── */
const getFileExtension = (doc) => {
  const path = doc?._original?.Document_Path || doc?.path || doc?.title || '';
  return path.split('.').pop()?.toLowerCase()?.split('?')[0] || '';
};

/* ───────────── Shimmer / Skeleton Loader ───────────── */
const ViewDocumentShimmer = () => (
  <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
    <Box sx={{ pb: 2.5, mb: 3, borderBottom: '1px solid #E2E8F0' }}>
      <Skeleton variant="rectangular" width={180} height={36} sx={{ borderRadius: '10px' }} />
    </Box>
    <Paper elevation={0} sx={{ ...cardSx, p: 2.5, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={2}>
        <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={280} height={32} />
          <Box display="flex" gap={1} mt={0.5}>
            <Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: '4px' }} />
            <Skeleton variant="text" width={140} height={20} />
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rectangular" width={90} height={38} sx={{ borderRadius: '10px' }} />
          ))}
        </Box>
      </Box>
    </Paper>
    <Paper elevation={0} sx={{ ...cardSx, p: 2, mb: 3 }}>
      <Box display="flex" gap={3}>
        {[1, 2, 3, 4].map(i => (
          <Box key={i} display="flex" alignItems="center" gap={1}>
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={100} height={20} />
          </Box>
        ))}
      </Box>
    </Paper>
    <Paper elevation={0} sx={{ ...cardSx, overflow: 'hidden' }}>
      <Skeleton variant="rectangular" width="100%" height={700} />
    </Paper>
  </Box>
);

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const ViewCourseDocument = () => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [previewError, setPreviewError] = useState(false);
  const [editForm, setEditForm] = useState({ title: '' });

  // Presigned URL state
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [presignedLoading, setPresignedLoading] = useState(false);

  // allowed_actions from backend
  const [allowedActions, setAllowedActions] = useState(['view']);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  /* ── Transform API data ── */
  const transformDocumentData = (apiDoc) => {
    if (!apiDoc) return null;
    return {
      batchId: apiDoc.Batch_ID || apiDoc.batchId,
      batchCode: apiDoc.Batch_Code || '',
      courseId: apiDoc.Course_ID || '',
      courseName: apiDoc.Course_Name || '',
      documentId: apiDoc.Document_ID || apiDoc.id,
      title: apiDoc.Document_Title ? apiDoc.Document_Title.replace(/"/g, '') : 'Untitled',
      path: apiDoc.Document_Path || apiDoc.path,
      uploadDateTime: apiDoc.Document_Upload_DateTime || apiDoc.uploadDate || apiDoc.createdAt,
      _original: apiDoc,
    };
  };

  /* ── Fetch document ── */
  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Fetch document metadata
      const response = await courseDocumentsAPI.getById(id);
      const documentData = response.data || response.document || response;
      if (documentData) {
        setDocument(transformDocumentData(documentData));
        // Read allowed_actions from backend response
        setAllowedActions(documentData.allowed_actions || ['view']);
      } else {
        setError('Document not found');
        return;
      }

      // Step 2: Fetch presigned URL for viewing
      setPresignedLoading(true);
      try {
        const viewResponse = await courseDocumentsAPI.viewDocument(id);
        if (viewResponse?.url) {
          setPresignedUrl(viewResponse.url);
        } else {
          console.error('No presigned URL returned from viewDocument API');
          setPresignedUrl(null);
        }
      } catch (viewErr) {
        console.error('Failed to get presigned URL:', viewErr);
        setPresignedUrl(null);
      } finally {
        setPresignedLoading(false);
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDocument();
  }, [id]);

  /* ── Handlers ── */

  const handleView = async () => {
    if (presignedUrl) {
      window.open(presignedUrl, '_blank');
      showSnackbar('Opening document in new tab...', 'success');
    } else {
      try {
        const response = await courseDocumentsAPI.viewDocument(document.documentId);
        if (response?.url) {
          window.open(response.url, '_blank');
          showSnackbar('Opening document in new tab...', 'success');
        } else {
          showSnackbar('Document URL not available', 'error');
        }
      } catch (err) {
        console.error('Failed to open document:', err);
        showSnackbar('Failed to open document', 'error');
      }
    }
  };

  const handleDownload = async () => {
    try {
      const response = await courseDocumentsAPI.viewDocument(document.documentId);
      if (response?.url) {
        showSnackbar('Download starting...', 'success');
        const fileResponse = await fetch(response.url);
        const blob = await fileResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = blobUrl;
        link.download = document.title || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        showSnackbar('Download complete!', 'success');
      } else {
        showSnackbar('Could not get download URL', 'error');
      }
    } catch (err) {
      console.error('Error downloading:', err);
      showSnackbar('Failed to download document', 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/trainer/course-documents/${id}`;
    navigator.clipboard.writeText(url).then(
      () => showSnackbar('Link copied to clipboard', 'success'),
      () => showSnackbar('Failed to copy link', 'error')
    );
  };

  const handleCopyPath = () => {
    if (document?.path) {
      navigator.clipboard.writeText(document.path).then(
        () => showSnackbar('Path copied to clipboard', 'success'),
        () => showSnackbar('Failed to copy path', 'error')
      );
    }
  };

  /* ── Edit ── */
  const handleEdit = () => {
    if (document) {
      setEditForm({ title: document.title || '' });
      setEditDialog(true);
    }
  };

  const handleEditClose = () => {
    setEditDialog(false);
    setEditForm({ title: '' });
  };

  const handleEditSubmit = async () => {
    try {
      setEditLoading(true);
      const titleValue = editForm.title?.trim();
      if (!titleValue) {
        showSnackbar('Title is required', 'error');
        setEditLoading(false);
        return;
      }
      await courseDocumentsAPI.update(document.documentId, {
        Document_Title: titleValue,
        Batch_ID: document.batchId,
      });
      setDocument(prev => ({ ...prev, title: titleValue }));
      setEditDialog(false);
      showSnackbar('Document updated successfully', 'success');
    } catch (err) {
      console.error('Error updating:', err);
      showSnackbar('Failed to update document', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = () => setDeleteDialog(true);

  const confirmDelete = async () => {
    try {
      await courseDocumentsAPI.remove(document.documentId);
      showSnackbar('Document deleted', 'success');
      setTimeout(() => navigate('/trainer/course-documents'), 1200);
    } catch (err) {
      console.error('Error deleting:', err);
      showSnackbar('Failed to delete document', 'error');
    }
    setDeleteDialog(false);
  };

  /* ── Snackbar helper ── */
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  /* ── Format date ── */
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const getPreviewIframeSrc = () => {
    if (!presignedUrl || !document) return null;

    const ext = getFileExtension(document);

    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(presignedUrl)}&embedded=true`;
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return presignedUrl;
    }

    return null;
  };

  /* ── Loading state ── */
  if (loading) return <ViewDocumentShimmer />;

  /* ── Error / not found state ── */
  if ((error && !document) || !document) {
    return (
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ pb: 2.5, mb: 3, borderBottom: '1px solid #E2E8F0' }}>
          <Button
            startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
            onClick={() => navigate('/trainer/course-documents')}
            sx={{
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              borderRadius: '10px',
              px: 1,
              '&:hover': { bgcolor: '#F1F5F9', color: '#2563EB' },
            }}
          >
            Back to Documents
          </Button>
        </Box>

        <Paper elevation={0} sx={{ ...cardSx, p: 6, textAlign: 'center' }}>
          <Box sx={{ mb: 2, fontSize: 48, opacity: 0.4 }}>📄</Box>
          <Typography variant="h6" sx={{ color: '#334155', fontWeight: 600 }} gutterBottom>
            Document Not Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 3, maxWidth: 400, mx: 'auto' }}>
            {error || 'The requested document could not be found. It may have been deleted or the link is invalid.'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/trainer/course-documents')}
            sx={{
              bgcolor: '#2563EB',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            Back to Documents
          </Button>
        </Paper>
      </Box>
    );
  }

  const fileInfo = getFileInfo(document);
  const ext = getFileExtension(document);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);

  // Permission checks from allowed_actions
  const canEdit = allowedActions.includes('edit');
  const canDelete = allowedActions.includes('delete');
  const canDownload = allowedActions.includes('download');

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      {/* ──── Snackbar ──── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '10px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ──── Error alert ──── */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: '12px', border: '1px solid #FECACA' }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* ═══════════ TOP BAR ═══════════ */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pb: 2.5, mb: 3, borderBottom: '1px solid #E2E8F0' }}
      >
        <Button
          startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
          onClick={() => navigate('/trainer/course-documents')}
          sx={{
            color: '#475569',
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'none',
            borderRadius: '10px',
            px: 1,
            '&:hover': { bgcolor: '#F1F5F9', color: '#2563EB' },
            transition: 'all 0.2s ease',
          }}
        >
          Back to Documents
        </Button>
      </Box>

      {/* ═══════════ DOCUMENT HEADER ═══════════ */}
      <Paper elevation={0} sx={{ ...cardSx, p: 2.5, mb: 2.5 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {/* File icon */}
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${fileInfo.bg} 0%, ${fileInfo.bg}CC 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 20,
            }}
          >
            {fileInfo.icon}
          </Box>

          {/* Title & meta */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.15rem',
                color: '#0F172A',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {document.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
              <Chip
                label={fileInfo.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  bgcolor: fileInfo.bg,
                  color: fileInfo.color,
                  borderRadius: '4px',
                  '& .MuiChip-label': { px: 0.8 },
                }}
              />
              <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                #{document.documentId}
              </Typography>
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
              <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                {document.batchCode || `Batch ${document.batchId}`}
              </Typography>
              {document.courseName && (
                <>
                  <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                    {document.courseName}
                  </Typography>
                </>
              )}
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
              <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                {formatDateTime(document.uploadDateTime)}
              </Typography>
            </Box>
          </Box>

          {/* Action buttons — conditionally rendered based on allowed_actions */}
          <Box display="flex" gap={1} flexShrink={0}>
            <Tooltip title="Open in new tab" arrow>
              <Button
                size="small"
                startIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                onClick={handleView}
                sx={{
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  px: 2,
                  py: 0.8,
                  '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' },
                  transition: 'all 0.15s ease',
                }}
              >
                Open
              </Button>
            </Tooltip>

            {canDownload && (
              <Tooltip title="Download document" arrow>
                <Button
                  size="small"
                  startIcon={<Download sx={{ fontSize: 16 }} />}
                  onClick={handleDownload}
                  sx={{
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    px: 2,
                    py: 0.8,
                    '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' },
                    transition: 'all 0.15s ease',
                  }}
                >
                  Download
                </Button>
              </Tooltip>
            )}

            <Tooltip title="Copy share link" arrow>
              <IconButton
                onClick={handleShare}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  color: '#64748B',
                  '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' },
                  transition: 'all 0.15s ease',
                }}
              >
                <Share sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            {canEdit && (
              <Tooltip title="Edit document" arrow>
                <IconButton
                  onClick={handleEdit}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    color: '#64748B',
                    '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Edit sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip title="Delete document" arrow>
                <IconButton
                  onClick={handleDelete}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    border: '1px solid #FEE2E2',
                    borderRadius: '10px',
                    color: '#EF4444',
                    '&:hover': { bgcolor: '#FEF2F2', borderColor: '#FECACA' },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Delete sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>

      {/* ═══════════ DOCUMENT PATH (compact) ═══════════ */}
      {document.path && (
        <Paper elevation={0} sx={{ ...cardSx, px: 2.5, py: 1.5, mb: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.65rem',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                flexShrink: 0,
              }}
            >
              Source
            </Typography>
            <Typography
              sx={{
                flex: 1,
                color: '#64748B',
                fontSize: '0.8rem',
                fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                bgcolor: '#F8FAFC',
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                border: '1px solid #F1F5F9',
              }}
            >
              {document.path}
            </Typography>
            <Tooltip title="Copy path" arrow>
              <IconButton
                onClick={handleCopyPath}
                size="small"
                sx={{
                  width: 30,
                  height: 30,
                  color: '#94A3B8',
                  '&:hover': { color: '#2563EB', bgcolor: '#EFF6FF' },
                  transition: 'all 0.15s ease',
                }}
              >
                <ContentCopy sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      )}

      {/* ═══════════ DOCUMENT PREVIEW ═══════════ */}
      <Paper
        elevation={0}
        sx={{
          ...cardSx,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Preview header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Visibility sx={{ fontSize: 16, color: '#94A3B8' }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Document Preview
            </Typography>
          </Box>
          <Tooltip title="Open in new tab" arrow>
            <IconButton
              onClick={handleView}
              size="small"
              sx={{
                width: 30,
                height: 30,
                color: '#94A3B8',
                '&:hover': { color: '#2563EB', bgcolor: '#EFF6FF' },
              }}
            >
              <OpenInNew sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Preview content */}
        <Box sx={{ bgcolor: '#F1F5F9', position: 'relative', minHeight: 600 }}>
          {presignedLoading && (
            <Box
              sx={{
                width: '100%',
                minHeight: 600,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <CircularProgress size={40} sx={{ color: '#2563EB' }} />
              <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                Loading document preview...
              </Typography>
            </Box>
          )}

          {!presignedLoading && presignedUrl && (
            <>
              {isImage ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    minHeight: 600,
                  }}
                >
                  <img
                    src={presignedUrl}
                    alt={document.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '700px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    }}
                    onError={() => setPreviewError(true)}
                  />
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 750 }}>
                  <iframe
                    src={getPreviewIframeSrc() || presignedUrl}
                    title="Document Preview"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    onError={() => setPreviewError(true)}
                  />
                </Box>
              )}
            </>
          )}

          {!presignedLoading && !presignedUrl && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 10,
                px: 4,
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '20px',
                  bgcolor: fileInfo.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  mb: 3,
                }}
              >
                {fileInfo.icon}
              </Box>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#334155', mb: 1 }}>
                Preview Not Available
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.85rem', mb: 3, textAlign: 'center', maxWidth: 400 }}>
                Could not load document preview. The file may not exist in storage or the URL has expired.
              </Typography>
              <Box display="flex" gap={1.5}>
                <Button
                  variant="contained"
                  onClick={async () => {
                    setPresignedLoading(true);
                    try {
                      const response = await courseDocumentsAPI.viewDocument(id);
                      if (response?.url) setPresignedUrl(response.url);
                    } catch (err) {
                      console.error('Retry failed:', err);
                    } finally {
                      setPresignedLoading(false);
                    }
                  }}
                  sx={{
                    bgcolor: '#2563EB',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                    '&:hover': { bgcolor: '#1D4ED8' },
                  }}
                >
                  Retry
                </Button>
                <Button
                  startIcon={<OpenInNew sx={{ fontSize: 18 }} />}
                  onClick={handleView}
                  variant="outlined"
                  sx={{
                    borderColor: '#E2E8F0',
                    color: '#475569',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' },
                  }}
                >
                  Open in New Tab
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* ═══════════ EDIT DIALOG ═══════════ */}
      <Dialog
        open={editDialog}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Edit Document
            </Typography>
            <IconButton
              onClick={handleEditClose}
              size="small"
              sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#F1F5F9' }}>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Document Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ title: e.target.value })}
              variant="outlined"
              required
              disabled={editLoading}
              helperText="Update the document title"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' },
                  '&.Mui-focused fieldset': { borderColor: '#2563EB' },
                },
              }}
            />

            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.8 }}>
                <strong style={{ color: '#334155' }}>Document ID:</strong> {document.documentId}
                <br />
                <strong style={{ color: '#334155' }}>Batch:</strong> {document.batchCode || `Batch ${document.batchId}`}
                {document.courseName && (<><br /><strong style={{ color: '#334155' }}>Course:</strong> {document.courseName}</>)}
                <br />
                <strong style={{ color: '#334155' }}>Uploaded:</strong> {formatDateTime(document.uploadDateTime)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={handleEditClose}
            color="inherit"
            disabled={editLoading}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 500,
              color: '#64748B',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={editLoading || !editForm.title?.trim()}
            startIcon={editLoading ? <CircularProgress size={20} /> : null}
            sx={{
              bgcolor: '#2563EB',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              '&:hover': { bgcolor: '#1D4ED8' },
              '&.Mui-disabled': { bgcolor: '#94A3B8', color: '#fff' },
            }}
          >
            {editLoading ? 'Updating...' : 'Update Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════ DELETE CONFIRMATION ═══════════ */}
      <ConfirmDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${document?.title}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default ViewCourseDocument;