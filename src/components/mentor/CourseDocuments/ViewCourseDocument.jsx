import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Card,
  CardContent,
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
  Container,
  Fade,
  Slide,
  Zoom,
  Chip,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Share,
  Close,
  Save,
  Cancel,
  CheckCircle,
  ErrorOutline,
  ContentCopy,
  Visibility,
  InsertDriveFile,
  Schedule,
  Folder,
  Assignment,
  Description,
  Star,
  StarBorder
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../common/ConfirmDialog';
import { courseDocumentsAPI } from '../../../services/API/courseDocuments';
import { AuthContext } from '../../../context/AuthContext';

/* ── inject fonts ── */
const styleTag = document.getElementById('course-doc-view-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'course-doc-view-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes cdvFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(s);
  return s;
})();

const headingFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bodyFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const cardBase = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };
const accentBtn = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', color: '#fff',
  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.82rem',
  textTransform: 'none', borderRadius: '10px', px: 2.5, py: 0.9,
  boxShadow: '0 4px 14px rgba(14,165,233,0.25)', border: 'none',
  '&:hover': { background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)', boxShadow: '0 6px 20px rgba(14,165,233,0.30)', transform: 'translateY(-1px)' },
  transition: 'all 0.3s ease',
};
const outlineActionBtn = {
  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.82rem',
  textTransform: 'none', borderRadius: '10px', border: '1.5px solid #e8ecf2', color: '#475569',
  px: 2, py: 0.8,
  '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff', transform: 'translateY(-1px)' },
  transition: 'all 0.3s ease',
};

/* ── Get file extension from document ── */
const getFileExtension = (doc) => {
  const path = doc?._original?.Document_Path || doc?.path || doc?.title || '';
  return path.split('.').pop()?.toLowerCase()?.split('?')[0] || '';
};

// Shimmer
const ViewDocumentShimmer = () => (
  <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width={300} height={36} sx={{ borderRadius: 1 }} />
        <Skeleton variant="text" width={200} height={22} />
      </Box>
    </Box>
    <Skeleton variant="rounded" width="100%" height="calc(100vh - 160px)" sx={{ borderRadius: '14px' }} />
  </Box>
);

const MentorViewCourseDocument = () => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editForm, setEditForm] = useState({ title: '' });

  // Presigned URL state
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [presignedLoading, setPresignedLoading] = useState(false);

  // allowed_actions from backend
  const [allowedActions, setAllowedActions] = useState(['view']);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

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
      _original: apiDoc
    };
  };

  const fetchDocument = async () => {
    try {
      setLoading(true); setError(null);

      // Step 1: Fetch document metadata
      const response = await courseDocumentsAPI.getById(id);
      const documentData = response.data || response.document || response;
      if (documentData) {
        setDocument(transformDocumentData(documentData));
        // Read allowed_actions from backend response
        setAllowedActions(documentData.allowed_actions || ['view']);
      } else {
        setError('Document not found'); setDocument(null); return;
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
    } catch (error) {
      setError(error.message || 'Failed to load document'); setDocument(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchDocument(); }, [id]);

  // Permission checks from allowed_actions
  const canEdit = allowedActions.includes('edit');
  const canDelete = allowedActions.includes('delete');

  const handleEdit = () => { if (document) { setEditForm({ title: document.title ? String(document.title) : '' }); setEditDialog(true); } };
  const handleEditClose = () => { setEditDialog(false); setEditForm({ title: '' }); };
  const handleEditFormChange = (field) => (event) => { setEditForm(prev => ({ ...prev, [field]: event.target.value })); };

  const handleEditSubmit = async () => {
    try {
      setEditLoading(true); setError(null);
      const titleValue = editForm.title ? String(editForm.title).trim() : '';
      if (!titleValue) { setError('Document title is required'); setEditLoading(false); return; }
      const updateData = { Document_Title: titleValue, Batch_ID: document.batchId };
      await courseDocumentsAPI.update(document.documentId, updateData);
      setDocument({ ...document, title: titleValue });
      setEditDialog(false);
      setSnackbar({ open: true, message: 'Document title updated successfully!', severity: 'success' });
    } catch (error) { setError(error.message || 'Failed to update document'); setSnackbar({ open: true, message: 'Failed to update document', severity: 'error' }); }
    finally { setEditLoading(false); }
  };

  const handleDelete = () => { setDeleteDialog(true); };
  const confirmDelete = async () => {
    try {
      setError(null); await courseDocumentsAPI.remove(document.documentId);
      setSnackbar({ open: true, message: 'Document deleted successfully!', severity: 'success' });
      setTimeout(() => { navigate('/mentor/course-documents'); }, 1500);
    } catch (error) { setError(error.message || 'Failed to delete document'); setSnackbar({ open: true, message: 'Failed to delete document', severity: 'error' }); }
    setDeleteDialog(false);
  };

  const handleShare = () => {
    const documentUrl = `${window.location.origin}/mentor/course-documents/${id}`;
    navigator.clipboard.writeText(documentUrl).then(() => { setSnackbar({ open: true, message: 'Document link copied to clipboard!', severity: 'success' }); })
      .catch(() => { setSnackbar({ open: true, message: 'Failed to copy link', severity: 'error' }); });
  };

  const handleCopyPath = () => {
    if (document.path) {
      navigator.clipboard.writeText(document.path).then(() => { setSnackbar({ open: true, message: 'File path copied!', severity: 'success' }); })
        .catch(() => { setSnackbar({ open: true, message: 'Failed to copy path', severity: 'error' }); });
    }
  };

  const handleCloseSnackbar = () => { setSnackbar({ ...snackbar, open: false }); };
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    try { return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    catch { return dateString; }
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

  if (loading) return <ViewDocumentShimmer />;

  if ((error && !document) || !document) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/mentor/course-documents')} sx={{
            width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2',
            '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' },
          }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Typography sx={{ ...headingFont, fontSize: '1.4rem' }}>Document Not Found</Typography>
        </Box>
        <Alert severity="error" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>
          {error || 'The requested document could not be found.'}
        </Alert>
      </Box>
    );
  }

  const ext = getFileExtension(document);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        mb: 2, animation: 'cdvFadeUp 0.5s ease-out both', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/mentor/course-documents')} sx={{
            width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2',
            '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease',
          }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
          }}>
            <Description sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...headingFont, fontSize: { xs: '1.1rem', md: '1.3rem' }, lineHeight: 1.2 }}>
              {document.title}
            </Typography>
            <Typography sx={{ ...bodyFont, fontSize: '0.78rem', color: '#64748b', mt: 0.2 }}>
              {document.batchCode || `Batch ${document.batchId}`}
              {document.courseName && ` · ${document.courseName}`}
              {' · '}Document Preview
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Document Preview Area */}
      <Paper elevation={0} sx={{
        ...cardBase,
        flex: 1,
        minHeight: 'calc(100vh - 160px)',
        overflow: 'hidden',
        animation: 'cdvFadeUp 0.5s ease-out 0.1s both',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Loading state */}
        {presignedLoading && (
          <Box
            sx={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: 'calc(100vh - 180px)', gap: 2,
            }}
          >
            <CircularProgress size={40} sx={{ color: '#0ea5e9' }} />
            <Typography sx={{ ...bodyFont, fontSize: '0.85rem', color: '#64748b' }}>
              Loading document preview...
            </Typography>
          </Box>
        )}

        {/* Preview loaded */}
        {!presignedLoading && presignedUrl && (
          <>
            {isImage ? (
              <Box sx={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                p: 3, minHeight: 'calc(100vh - 180px)', background: '#f8fafc',
                userSelect: 'none',
              }}>
                <img
                  src={presignedUrl}
                  alt={document.title || 'Document Preview'}
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(100vh - 220px)',
                    objectFit: 'contain',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    WebkitUserDrag: 'none',
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 180px)', position: 'relative' }}>
                <iframe
                  src={getPreviewIframeSrc() || presignedUrl}
                  title={document.title || 'Document Preview'}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 'calc(100vh - 180px)',
                    border: 'none',
                    borderRadius: '14px',
                  }}
                />
              </Box>
            )}
          </>
        )}

        {/* Fallback/error */}
        {!presignedLoading && !presignedUrl && (
          <Box sx={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', p: 5, minHeight: 'calc(100vh - 180px)',
          }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '20px',
              background: 'linear-gradient(135deg, #0ea5e920, #0d948820)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
            }}>
              <InsertDriveFile sx={{ fontSize: 40, color: '#0ea5e9' }} />
            </Box>
            <Typography sx={{ ...headingFont, fontSize: '1.2rem', mb: 1, textAlign: 'center' }}>
              Preview Not Available
            </Typography>
            <Typography sx={{ ...bodyFont, fontSize: '0.9rem', color: '#64748b', textAlign: 'center', maxWidth: 400, mb: 3 }}>
              Could not load document preview. The file may not exist in storage or the URL has expired.
            </Typography>
            <Box display="flex" gap={1.5}>
              <Button
                variant="contained"
                disableElevation
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
                sx={accentBtn}
              >
                Retry
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Edit Dialog — only accessible if canEdit */}
      <Dialog open={editDialog} onClose={handleEditClose} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 24px 48px rgba(30,58,138,0.12)', border: '1px solid #e8ecf2' } }}>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', color: 'white', py: 2.5,
          borderRadius: '16px 16px 0 0',
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Edit sx={{ fontSize: 24 }} />
              <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
                Edit Document Title
              </Typography>
            </Box>
            <IconButton onClick={handleEditClose} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }} disabled={editLoading}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3.5, background: '#f8fafc' }}>
          <Typography sx={{ ...bodyFont, fontSize: '0.9rem', mb: 3 }}>
            Update the document title with a descriptive name
          </Typography>
          <TextField fullWidth label="Document Title" value={editForm.title} onChange={handleEditFormChange('title')}
            variant="outlined" required disabled={editLoading} helperText="Enter a clear and descriptive title"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px', bgcolor: '#fff', fontFamily: '"DM Sans", sans-serif',
                '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '1.5px' },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#0ea5e9' },
            }}
          />
          <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '10px', border: '1px solid #e8ecf2' }}>
            <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.8 }}>
              <strong style={{ color: '#0f172a' }}>Document ID:</strong> {document.documentId}<br />
              <strong style={{ color: '#0f172a' }}>Batch:</strong> {document.batchCode || `Batch ${document.batchId}`}
              {document.courseName && (<><br /><strong style={{ color: '#0f172a' }}>Course:</strong> {document.courseName}</>)}
              <br /><strong style={{ color: '#0f172a' }}>Upload Date:</strong> {formatDateTime(document.uploadDateTime)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: '#f8fafc' }}>
          <Button onClick={handleEditClose} disabled={editLoading} startIcon={<Cancel />} sx={{
            ...outlineActionBtn, flex: 1,
          }}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" disableElevation
            disabled={editLoading || !editForm.title?.trim()}
            startIcon={editLoading ? <CircularProgress size={18} color="inherit" /> : <Save />}
            sx={{ ...accentBtn, flex: 1 }}>
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={confirmDelete}
        title="Delete Document"
        message={
          <Box>
            <Typography gutterBottom sx={{ ...bodyFont, fontSize: '0.95rem', mb: 2 }}>
              Are you sure you want to delete this document?
            </Typography>
            <Alert severity="warning" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>
              <strong>"{document?.title}"</strong> will be permanently deleted. This action cannot be undone.
            </Alert>
          </Box>
        }
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircle /> : <ErrorOutline />}
          sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MentorViewCourseDocument;