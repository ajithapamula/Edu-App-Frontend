import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Card,
  Alert,
  Skeleton,
  Tooltip,
  Snackbar,
  Chip,
  Avatar,
  Stack,
  Divider,
  Fade,
  Slide,
  Zoom,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack,
  CheckCircle,
  ErrorOutline,
  Visibility,
  InsertDriveFile,
  Schedule,
  Folder,
  Assignment,
  Description,
  StarBorder,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { courseDocumentsAPI } from '../../../services/API/courseDocuments';
import { AuthContext } from '../../../context/AuthContext';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

/* ——— Shimmer Loading ——— */
const ViewDocumentShimmer = () => (
  <Box sx={{ py: 2 }}>
    <Fade in timeout={800}>
      <Box>
        <Box display="flex" alignItems="center" mb={3} sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width={300} height={36} sx={{ borderRadius: 2 }} />
            <Skeleton variant="text" width={200} height={24} sx={{ borderRadius: 1 }} />
          </Box>
          <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: '10px' }} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height="calc(100vh - 200px)" sx={{ borderRadius: '16px' }} />
      </Box>
    </Fade>
  </Box>
);

/* ── Get file extension from document ── */
const getFileExtension = (doc) => {
  const path = doc?._original?.Document_Path || doc?.path || doc?.title || '';
  return path.split('.').pop()?.toLowerCase()?.split('?')[0] || '';
};

const StudentViewCourseDocument = () => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Presigned URL state
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [presignedLoading, setPresignedLoading] = useState(false);

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
      setLoading(true);
      setError(null);

      // Step 1: Fetch document metadata
      const response = await courseDocumentsAPI.getById(id);
      const documentData = response.data || response.document || response;
      if (documentData) {
        setDocument(transformDocumentData(documentData));
      } else {
        setError('Document not found');
        setDocument(null);
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
    } catch (error) {
      setError(error.message || 'Failed to load document');
      setDocument(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchDocument(); }, [id]);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch { return dateString; }
  };

  // Build preview iframe src using presigned URL
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

  if (error && !document) {
    return (
      <Box sx={{ py: 2 }}>
        <Fade in timeout={600}>
          <Box>
            <Box
              sx={{
                p: 3, mb: 3, borderRadius: '16px', bgcolor: '#fff',
                border: '1px solid rgba(239,68,68,0.15)',
                boxShadow: '0 2px 12px rgba(239,68,68,0.06)',
              }}
            >
              <Box display="flex" alignItems="center">
                <IconButton
                  onClick={() => navigate('/student/course-documents')}
                  sx={{
                    mr: 2, width: 44, height: 44, borderRadius: '11px',
                    bgcolor: 'rgba(239,68,68,0.08)', color: '#ef4444',
                    '&:hover': { bgcolor: 'rgba(239,68,68,0.12)' },
                  }}
                >
                  <ArrowBack sx={{ fontSize: 22 }} />
                </IconButton>
                <Box>
                  <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444', fontFamily: fontStack }}>
                    Document Not Found
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack }}>
                    The requested document could not be located
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Alert
              severity="error"
              icon={<ErrorOutline />}
              sx={{ borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              {error}
            </Alert>
          </Box>
        </Fade>
      </Box>
    );
  }

  if (!document) {
    return (
      <Box sx={{ py: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/student/course-documents')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Document Not Found</Typography>
        </Box>
        <Alert severity="error" sx={{ borderRadius: '12px' }}>The requested document could not be found.</Alert>
      </Box>
    );
  }

  // Determine file type for inline preview
  const ext = getFileExtension(document);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);

  // Build subtitle with batch code and course name
  const subtitleParts = [];
  if (document.batchCode) subtitleParts.push(document.batchCode);
  else if (document.batchId) subtitleParts.push(`Batch ${document.batchId}`);
  if (document.courseName) subtitleParts.push(document.courseName);
  subtitleParts.push('Document Preview');
  const subtitleText = subtitleParts.join(' · ');

  return (
    <Box sx={{ py: 2, fontFamily: fontStack, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header Bar */}
      <Fade in timeout={600}>
        <Box
          sx={{
            p: 2.5, mb: 2, borderRadius: '16px',
            background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)',
            boxShadow: '0 4px 20px rgba(26,82,118,0.18)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Decorative */}
          <Box sx={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <Box display="flex" alignItems="center" position="relative" zIndex={1}>
            <IconButton
              onClick={() => navigate('/student/course-documents')}
              sx={{
                mr: 2, width: 42, height: 42, borderRadius: '11px',
                bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.20)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'translateY(-1px)' },
              }}
            >
              <ArrowBack sx={{ fontSize: 22 }} />
            </IconButton>

            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', fontFamily: fontStack }}>
                {document.title}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', fontFamily: fontStack }}>
                {subtitleText}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* Document Preview Area */}
      <Slide in direction="up" timeout={700}>
        <Box
          sx={{
            flex: 1, borderRadius: '16px', bgcolor: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            minHeight: 'calc(100vh - 200px)',
          }}
        >
          {/* Top accent bar */}
          <Box sx={{ height: '3px', background: 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)', flexShrink: 0 }} />

          {/* Loading state */}
          {presignedLoading && (
            <Box
              sx={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                minHeight: 'calc(100vh - 220px)', gap: 2,
              }}
            >
              <CircularProgress size={40} sx={{ color: '#2980b9' }} />
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem', fontFamily: fontStack }}>
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
                  p: 3, minHeight: 'calc(100vh - 220px)', background: '#f8fafc',
                  userSelect: 'none',
                }}>
                  <img
                    src={presignedUrl}
                    alt={document.title || 'Document Preview'}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 'calc(100vh - 260px)',
                      objectFit: 'contain',
                      borderRadius: '10px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      WebkitUserDrag: 'none',
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 220px)', position: 'relative' }}>
                  <iframe
                    src={getPreviewIframeSrc() || presignedUrl}
                    title={document.title || 'Document Preview'}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: 'calc(100vh - 220px)',
                      border: 'none',
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
              justifyContent: 'center', p: 5, minHeight: 'calc(100vh - 220px)',
            }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(41,128,185,0.12), rgba(13,148,136,0.12))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
              }}>
                <InsertDriveFile sx={{ fontSize: 40, color: '#2980b9' }} />
              </Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', mb: 1, textAlign: 'center', fontFamily: fontStack }}>
                Preview Not Available
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', maxWidth: 400, fontFamily: fontStack, mb: 3 }}>
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
                    bgcolor: '#2980b9', borderRadius: '10px',
                    textTransform: 'none', fontWeight: 600, fontFamily: fontStack,
                    '&:hover': { bgcolor: '#1a5276' },
                  }}
                >
                  Retry
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Slide>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircle /> : <ErrorOutline />}
          sx={{
            width: '100%', borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(26,82,118,0.15)',
            border: snackbar.severity === 'success' ? '1px solid rgba(13,148,136,0.2)' : '1px solid rgba(239,68,68,0.2)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentViewCourseDocument;