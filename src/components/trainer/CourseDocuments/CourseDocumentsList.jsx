
import React, { useState, useEffect, useRef, useContext } from 'react';
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
  Paper,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Skeleton,
  Alert,
  Snackbar,
  InputAdornment,
  Chip,
  Fade,
  ClickAwayListener,
  Popper,
  Grow
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Download,
  Refresh,
  Close,
  Upload,
  Search,
  MoreVert,
  ViewList,
  ViewModule,
  FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../common/ConfirmDialog';
import { courseDocumentsAPI } from '../../../services/API/courseDocuments';
import { AuthContext } from '../../../context/AuthContext';

/* ───────────────────── helper: file meta ───────────────────── */
const getFileInfo = (doc) => {
  const path = doc._original?.Document_Path || doc._original?.file_name || doc.title || '';
  const ext = path.split('.').pop()?.toLowerCase() || '';

  const map = {
    pdf:  { label: 'PDF',  color: '#DC2626', bg: '#FEF2F2', icon: '📄' },
    doc:  { label: 'DOC',  color: '#2563EB', bg: '#EFF6FF', icon: '📝' },
    docx: { label: 'DOC',  color: '#2563EB', bg: '#EFF6FF', icon: '📝' },
    ppt:  { label: 'PPT',  color: '#D97706', bg: '#FFFBEB', icon: '📊' },
    pptx: { label: 'PPT',  color: '#D97706', bg: '#FFFBEB', icon: '📊' },
    txt:  { label: 'TXT',  color: '#6B7280', bg: '#F9FAFB', icon: '📃' },
  };
  return map[ext] || map.pdf;
};

const getFileSize = (doc) => {
  const size = doc._original?.file_size || doc._original?.Document_Size;
  if (!size) return null;
  const num = Number(size);
  if (isNaN(num)) return size;
  if (num >= 1048576) return `${(num / 1048576).toFixed(1)} MB`;
  if (num >= 1024) return `${(num / 1024).toFixed(0)} KB`;
  return `${num} B`;
};

/* ── Get file extension from document ── */
const getFileExtension = (doc) => {
  const path = doc?._original?.Document_Path || doc?.path || doc?.title || '';
  return path.split('.').pop()?.toLowerCase()?.split('?')[0] || '';
};

/* ───────────────── File-type icon component ────────────────── */
const FileIcon = ({ type }) => {
  const colorMap = {
    PDF: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)',
    DOC: 'linear-gradient(135deg, #EFF6FF 0%, #BFDBFE 100%)',
    PPT: 'linear-gradient(135deg, #FFFBEB 0%, #FDE68A 100%)',
  };

  return (
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: colorMap[type.label] || 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)',
        fontSize: 19,
        transition: 'transform 0.2s ease',
      }}
    >
      {type.icon}
    </Box>
  );
};

/* ──────────────── Actions Menu (kebab) component ───────────── */
const ActionsMenu = ({ document, onView, onDownload, onEdit, onDelete, allowedActions }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const docRef = useRef(document);
  const callbacksRef = useRef({ onView, onDownload, onEdit, onDelete });
  docRef.current = document;
  callbacksRef.current = { onView, onDownload, onEdit, onDelete };

  const handleToggle = (e) => {
    e.stopPropagation();
    setOpen(prev => !prev);
  };

  const handleClose = (e) => {
    if (anchorRef.current && anchorRef.current.contains(e?.target)) return;
    setOpen(false);
  };

  const handleAction = (actionType) => (e) => {
    e.stopPropagation();
    setOpen(false);
    const doc = docRef.current;
    const cbs = callbacksRef.current;
    setTimeout(() => {
      switch (actionType) {
        case 'view': cbs.onView(doc.documentId); break;
        case 'download': cbs.onDownload(doc); break;
        case 'edit': cbs.onEdit(doc); break;
        case 'delete': cbs.onDelete(doc.documentId); break;
        default: break;
      }
    }, 0);
  };

  // Build menu items based on allowed_actions from backend
  const allMenuItems = [
    { icon: <Visibility sx={{ fontSize: 17, color: '#64748B' }} />, label: 'Quick View',  actionType: 'view',     action: 'view' },
    { icon: <Download   sx={{ fontSize: 17, color: '#64748B' }} />, label: 'Download',    actionType: 'download', action: 'download' },
    { icon: <Edit       sx={{ fontSize: 17, color: '#64748B' }} />, label: 'Edit Entry',  actionType: 'edit',     action: 'edit' },
    { icon: <Delete     sx={{ fontSize: 17, color: '#EF4444' }} />, label: 'Delete',      actionType: 'delete',   action: 'delete', danger: true },
  ];

  const menuItems = allMenuItems.filter(item => allowedActions.includes(item.action));

  if (menuItems.length === 0) return null;

  return (
    <>
      <IconButton
        ref={anchorRef}
        onClick={handleToggle}
        sx={{
          width: 34,
          height: 34,
          borderRadius: '9px',
          bgcolor: open ? '#2563EB' : 'transparent',
          color: open ? '#fff' : '#94A3B8',
          border: '1px solid',
          borderColor: open ? '#2563EB' : 'transparent',
          '&:hover': { bgcolor: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' },
          transition: 'all 0.2s ease',
        }}
      >
        <MoreVert sx={{ fontSize: 19 }} />
      </IconButton>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        sx={{ zIndex: 1400 }}
        modifiers={[
          { name: 'preventOverflow', enabled: true, options: { boundary: 'viewport', padding: 8 } },
          { name: 'flip', enabled: true, options: { fallbackPlacements: ['top-end', 'bottom-start', 'top-start'] } },
        ]}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'right top' }}>
            <Paper
              elevation={0}
              sx={{
                mt: 0.5,
                minWidth: 180,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 40px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                py: 0.5,
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  {menuItems.map((item, idx) => (
                    <Box
                      key={idx}
                      onClick={handleAction(item.actionType)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 2,
                        py: 1.1,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: item.danger ? '#FEF2F2' : '#F8FAFC' },
                        ...(item.danger && { mt: 0.5, borderTop: '1px solid #F1F5F9' }),
                      }}
                    >
                      {item.icon}
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.84rem',
                          color: item.danger ? '#DC2626' : '#334155',
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

/* ────────────────── Shimmer Loading Component ──────────────── */
const CourseDocumentsShimmer = ({ rows = 8 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      {/* Header Shimmer */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
            <Box>
              <Skeleton variant="text" width={240} height={36} />
              <Skeleton variant="text" width={320} height={18} />
            </Box>
          </Box>
        </Box>
        <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '12px' }} />
      </Box>

      {/* Filters Shimmer */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, borderRadius: '14px', border: '1px solid #E2E8F0' }}
      >
        <Box display="flex" gap={2} alignItems="center">
          <Skeleton variant="rounded" width="100%" height={42} sx={{ borderRadius: '10px', maxWidth: 460 }} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="rounded" width={140} height={42} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" width={140} height={42} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" width={100} height={42} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" width={80}  height={42} sx={{ borderRadius: '10px' }} />
        </Box>
      </Paper>

      {/* Table Shimmer */}
      <Paper elevation={0} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <Box sx={{ height: 3, background: 'linear-gradient(90deg, #E2E8F0, #F1F5F9, #E2E8F0)', backgroundSize: '200% 100%' }} />
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#FAFBFD' }}>
              {['BATCH', 'ID', 'DOCUMENT TITLE', 'COURSE', 'UPLOADED AT', 'ACTIONS'].map((h) => (
                <TableCell key={h}>
                  <Skeleton variant="text" width={70} height={16} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shimmerRows.map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton variant="rounded" width={80} height={36} sx={{ borderRadius: '10px' }} /></TableCell>
                <TableCell><Skeleton variant="text" width={45} /></TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: '11px' }} />
                    <Box>
                      <Skeleton variant="text" width={220} height={20} />
                      <Skeleton variant="text" width={70} height={16} />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={90} /></TableCell>
                <TableCell align="center"><Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: '9px', mx: 'auto' }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const CourseDocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, documentId: null });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [batchFilter, setBatchFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [previewDialog, setPreviewDialog] = useState({ open: false, document: null });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [editDialog, setEditDialog] = useState({ open: false, document: null });
  const [editForm, setEditForm] = useState({ title: '', batchId: '', file: null });
  const [editLoading, setEditLoading] = useState(false);

  // Filter options from backend /filters endpoint
  const [filterBatches, setFilterBatches] = useState([]);
  const [filterCourses, setFilterCourses] = useState([]);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Determine if current user can add documents
  const canAdd = user && ['trainer', 'super_admin', 'organization'].includes(user.role);

  const fetchFilters = async () => {
    try {
      const response = await courseDocumentsAPI.getFilters();
      setFilterBatches(response.batches || []);
      setFilterCourses(response.courses || []);
    } catch (err) {
      console.error('Failed to fetch filters:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseDocumentsAPI.getAll();
      const documentsData = response.data || response.documents || response;

      if (Array.isArray(documentsData)) {
        const transformedDocuments = documentsData.map(doc => ({
          batchId: doc.Batch_ID || doc.batchId,
          batchCode: doc.Batch_Code || '',
          courseId: doc.Course_ID || '',
          courseName: doc.Course_Name || '',
          documentId: doc.Document_ID || doc.id,
          title: doc.Document_Title ? doc.Document_Title.replace(/"/g, '') : 'Untitled',
          uploadDateTime: doc.Document_Upload_DateTime || doc.uploadDate || doc.createdAt,
          allowedActions: doc.allowed_actions || ['view'],
          _original: doc
        }));
        setDocuments(transformedDocuments);
        console.log('Transformed documents:', transformedDocuments);
      } else {
        console.error('Unexpected API response structure:', response);
        setError('Failed to load documents: Invalid response format');
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error.message || 'Failed to load course documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchDocuments();
  }, []);

  const handleSearch = (event) => setSearchTerm(event.target.value);
  const handleRefresh = () => { fetchFilters(); fetchDocuments(); };
  const handleDelete = (documentId) => setDeleteDialog({ open: true, documentId });

  const confirmDelete = async () => {
    try {
      setError(null);
      await courseDocumentsAPI.remove(deleteDialog.documentId);
      setDocuments(documents.filter(doc => doc.documentId !== deleteDialog.documentId));
      setSuccess('Document deleted successfully');
      setDeleteDialog({ open: false, documentId: null });
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(error.message || 'Failed to delete document');
      setDeleteDialog({ open: false, documentId: null });
    }
  };

  const handleView = async (documentId) => {
    const doc = documents.find(d => d.documentId === documentId);
    if (!doc) return;

    setPreviewDialog({ open: true, document: doc });
    setPreviewUrl(null);
    setPreviewLoading(true);

    try {
      const response = await courseDocumentsAPI.viewDocument(documentId);
      if (response?.url) {
        setPreviewUrl(response.url);
      } else {
        console.error('No presigned URL returned');
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error('Failed to get preview URL:', err);
      setPreviewUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewClose = () => {
    setPreviewDialog({ open: false, document: null });
    setPreviewUrl(null);
    setPreviewLoading(false);
  };

  const handleDownload = async (document) => {
    try {
      setError(null);
      const response = await courseDocumentsAPI.viewDocument(document.documentId);
      if (response?.url) {
        setSuccess('Download starting...');
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
        setSuccess('Document downloaded successfully');
      } else {
        setError('Could not get download URL');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setError(error.message || 'Failed to download document');
    }
  };

  const handleEdit = (document) => {
    setEditForm({
      title: document.title ? String(document.title) : '',
      batchId: document.batchId ? String(document.batchId) : '',
      file: null
    });
    setEditDialog({ open: true, document });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, document: null });
    setEditForm({ title: '', batchId: '', file: null });
  };

  const handleEditFormChange = (field) => (event) => {
    if (field === 'file') {
      setEditForm(prev => ({ ...prev, [field]: event.target.files[0] || null }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: event.target.value }));
    }
  };

  const handleEditSubmit = async () => {
    try {
      setEditLoading(true);
      setError(null);

      const titleValue = editForm.title ? String(editForm.title).trim() : '';
      const batchIdValue = editForm.batchId ? String(editForm.batchId).trim() : '';

      if (!titleValue) { setError('Document title is required'); setEditLoading(false); return; }
      if (!batchIdValue) { setError('Batch ID is required'); setEditLoading(false); return; }

      const updateData = {
        Document_Title: titleValue,
        Batch_ID: batchIdValue
      };

      if (editForm.file) updateData.file = editForm.file;

      const response = await courseDocumentsAPI.update(editDialog.document.documentId, updateData);

      const updatedDocuments = documents.map(doc =>
        doc.documentId === editDialog.document.documentId
          ? { ...doc, title: titleValue, batchId: batchIdValue, _original: { ...doc._original, ...updateData } }
          : doc
      );
      setDocuments(updatedDocuments);
      setSuccess('Document updated successfully');
      handleEditClose();
    } catch (error) {
      console.error('Error updating document:', error);
      setError(error.message || 'Failed to update document');
    } finally {
      setEditLoading(false);
    }
  };

  /* ── derived data ── */
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      (doc.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (doc.documentId?.toString() || '').includes(searchTerm.toLowerCase()) ||
      (doc.batchCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (doc.courseName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesBatch = batchFilter === 'all' || String(doc.batchId) === String(batchFilter);
    const matchesCourse = courseFilter === 'all' || String(doc.courseId) === String(courseFilter);
    return matchesSearch && matchesBatch && matchesCourse;
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'N/A', time: '' };
    try {
      const d = new Date(dateString);
      const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return { date, time };
    } catch {
      return { date: dateString, time: '' };
    }
  };

  const getPreviewIframeSrc = () => {
    if (!previewUrl) return null;

    const doc = previewDialog.document;
    const ext = getFileExtension(doc);

    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`;
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return previewUrl;
    }

    return null;
  };

  /* ── shared input sx ── */
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      fontSize: '0.88rem',
      fontWeight: 500,
      bgcolor: '#FAFBFD',
      transition: 'all 0.2s ease',
      '& fieldset': { borderColor: '#E2E8F0', borderWidth: '1.5px' },
      '&:hover fieldset': { borderColor: '#93C5FD' },
      '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '2px' },
      '&.Mui-focused': { bgcolor: '#fff' },
    },
  };

  if (loading) return <CourseDocumentsShimmer rows={8} />;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      {/* ──── Snackbars ──── */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ borderRadius: '12px', fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ borderRadius: '12px', fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* ═══════════ HEADER ═══════════ */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
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
            <Typography sx={{ fontSize: 22 }}>📚</Typography>
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
                Course Documents
              </Typography>
              <Chip
                label={`${filteredDocuments.length} assets`}
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
            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', maxWidth: 480, lineHeight: 1.5 }}>
              Centralized library for managing and distributing learning materials
            </Typography>
          </Box>
        </Box>

        {/* Add Button — only for trainer/admin/org */}
        {canAdd && (
          <IconButton
            onClick={() => navigate('/trainer/course-documents/add')}
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              bgcolor: '#2563EB',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              '&:hover': {
                bgcolor: '#1D4ED8',
                boxShadow: '0 8px 28px rgba(37,99,235,0.45)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Add sx={{ fontSize: 24 }} />
          </IconButton>
        )}
      </Box>

      {/* ═══════════ FILTERS ═══════════ */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 3,
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          bgcolor: '#fff',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <TextField
            placeholder="Search documents..."
            value={searchTerm}
            onChange={handleSearch}
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

          {/* Batch Filter — from backend /filters */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              displayEmpty
              startAdornment={<FilterList sx={{ color: '#64748B', fontSize: 17, mr: 0.5 }} />}
              sx={{
                borderRadius: '10px',
                bgcolor: '#FAFBFD',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' },
                '& .MuiSelect-select': { fontSize: '0.85rem', fontWeight: 500, color: '#334155' },
              }}
            >
              <MenuItem value="all">All Batches</MenuItem>
              {filterBatches.map(b => (
                <MenuItem key={b.Batch_ID} value={b.Batch_ID}>
                  {b.Batch_Code || `Batch ${b.Batch_ID}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Course Filter — from backend /filters */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: '10px',
                bgcolor: '#FAFBFD',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' },
                '& .MuiSelect-select': { fontSize: '0.85rem', fontWeight: 500, color: '#334155' },
              }}
            >
              <MenuItem value="all">All Courses</MenuItem>
              {filterCourses.map(c => (
                <MenuItem key={c.Course_ID} value={c.Course_ID}>
                  {c.Course_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="text"
            startIcon={<Refresh sx={{ fontSize: 17 }} />}
            onClick={handleRefresh}
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

          <Box
            sx={{
              display: 'flex',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            {[{ mode: 'list', Icon: ViewList }, { mode: 'grid', Icon: ViewModule }].map(({ mode, Icon }) => (
              <IconButton
                key={mode}
                size="small"
                onClick={() => setViewMode(mode)}
                sx={{
                  borderRadius: 0,
                  width: 36,
                  height: 36,
                  bgcolor: viewMode === mode ? '#EFF6FF' : 'transparent',
                  color: viewMode === mode ? '#2563EB' : '#94A3B8',
                  '&:hover': { bgcolor: '#EFF6FF', color: '#2563EB' },
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon sx={{ fontSize: 19 }} />
              </IconButton>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* ═══════════ CONTENT ═══════════ */}
      {filteredDocuments.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              bgcolor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              fontSize: 36,
            }}
          >
            📁
          </Box>
          <Typography sx={{ color: '#334155', fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>
            No Documents Found
          </Typography>
          <Typography sx={{ color: '#94A3B8', mb: 3, maxWidth: 380, mx: 'auto', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {documents.length === 0
              ? 'Get started by uploading your first course document.'
              : 'No documents match your current filters. Try adjusting your search.'}
          </Typography>
          {documents.length === 0 && canAdd && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/trainer/course-documents/add')}
              sx={{
                bgcolor: '#2563EB',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                '&:hover': { bgcolor: '#1D4ED8' },
              }}
            >
              Upload First Document
            </Button>
          )}
        </Paper>
      ) : viewMode === 'list' ? (
        /* ─────────── LIST VIEW ─────────── */
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}
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
                  <TableCell sx={{ width: 100, pl: 3 }}>Batch</TableCell>
                  <TableCell sx={{ width: 72 }}>ID</TableCell>
                  <TableCell>Document Title</TableCell>
                  <TableCell sx={{ width: 150 }}>Course</TableCell>
                  <TableCell sx={{ width: 150 }}>Uploaded</TableCell>
                  <TableCell sx={{ width: 70, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredDocuments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((doc, idx) => {
                    const fileInfo = getFileInfo(doc);
                    const fileSize = getFileSize(doc);
                    const dt = formatDateTime(doc.uploadDateTime);

                    return (
                      <TableRow
                        key={doc.documentId}
                        sx={{
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: '#F8FAFC',
                            '& .batch-chip': { bgcolor: '#EFF6FF', color: '#2563EB' },
                            '& .file-icon-box': { transform: 'scale(1.05)' },
                          },
                          '& .MuiTableCell-root': {
                            borderBottom: '1px solid #F1F5F9',
                            py: 1.8,
                          },
                        }}
                      >
                        <TableCell sx={{ pl: 3 }}>
                          <Chip
                            className="batch-chip"
                            label={doc.batchCode || `B-${doc.batchId}`}
                            size="small"
                            sx={{
                              height: 28,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              bgcolor: '#F1F5F9',
                              color: '#64748B',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem' }}>
                            #{doc.documentId || '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Box className="file-icon-box" sx={{ transition: 'transform 0.2s ease' }}>
                              <FileIcon type={fileInfo} />
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#1E293B', lineHeight: 1.3 }}>
                                {doc.title || 'Untitled'}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={0.4}>
                                <Chip
                                  label={fileInfo.label}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    bgcolor: fileInfo.bg,
                                    color: fileInfo.color,
                                    borderRadius: '5px',
                                    '& .MuiChip-label': { px: 0.8 },
                                  }}
                                />
                                {fileSize && (
                                  <Typography sx={{ color: '#CBD5E1', fontSize: '0.72rem' }}>
                                    {fileSize}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ color: '#475569', fontSize: '0.82rem', fontWeight: 500 }}>
                            {doc.courseName || '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ color: '#334155', fontSize: '0.82rem', fontWeight: 500 }}>
                            {dt.date}
                          </Typography>
                          <Typography sx={{ color: '#CBD5E1', fontSize: '0.72rem' }}>
                            {dt.time}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <ActionsMenu
                            document={doc}
                            onView={handleView}
                            onDownload={handleDownload}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            allowedActions={doc.allowedActions}
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
            count={filteredDocuments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid #F1F5F9',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem',
                color: '#64748B',
              },
            }}
          />
        </Paper>
      ) : (
        /* ─────────── GRID VIEW ─────────── */
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 2.5,
            }}
          >
            {filteredDocuments
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((doc) => {
                const fileInfo = getFileInfo(doc);
                const fileSize = getFileSize(doc);
                const dt = formatDateTime(doc.uploadDateTime);

                return (
                  <Paper
                    key={doc.documentId}
                    elevation={0}
                    sx={{
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      overflow: 'hidden',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: '#BFDBFE',
                        boxShadow: '0 8px 30px rgba(37,99,235,0.08)',
                        transform: 'translateY(-3px)',
                        '& .grid-accent': { opacity: 1 },
                        '& .grid-file-icon': { transform: 'scale(1.08)' },
                      },
                    }}
                  >
                    <Box
                      className="grid-accent"
                      sx={{
                        height: 4,
                        bgcolor: fileInfo.color,
                        opacity: 0.5,
                        transition: 'opacity 0.25s ease',
                      }}
                    />

                    <Box sx={{ p: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box className="grid-file-icon" sx={{ transition: 'transform 0.2s ease' }}>
                          <FileIcon type={fileInfo} />
                        </Box>
                        <ActionsMenu
                          document={doc}
                          onView={handleView}
                          onDownload={handleDownload}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          allowedActions={doc.allowedActions}
                        />
                      </Box>

                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          color: '#1E293B',
                          lineHeight: 1.4,
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '2.5em',
                        }}
                      >
                        {doc.title || 'Untitled'}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip
                          label={fileInfo.label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            bgcolor: fileInfo.bg,
                            color: fileInfo.color,
                            borderRadius: '5px',
                            '& .MuiChip-label': { px: 0.8 },
                          }}
                        />
                        {fileSize && (
                          <Typography sx={{ color: '#CBD5E1', fontSize: '0.72rem' }}>
                            {fileSize}
                          </Typography>
                        )}
                      </Box>

                      {doc.courseName && (
                        <Typography sx={{ color: '#64748B', fontSize: '0.75rem', mb: 1.5 }}>
                          {doc.courseName}
                        </Typography>
                      )}

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          pt: 1.5,
                          borderTop: '1px solid #F1F5F9',
                        }}
                      >
                        <Chip
                          label={doc.batchCode || `B-${doc.batchId}`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            bgcolor: '#F1F5F9',
                            color: '#64748B',
                            borderRadius: '6px',
                          }}
                        />
                        <Typography sx={{ color: '#CBD5E1', fontSize: '0.7rem' }}>#{doc.documentId}</Typography>
                        <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>{dt.date}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
          </Box>

          <Paper elevation={0} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', mt: 2 }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredDocuments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: '#64748B' },
              }}
            />
          </Paper>
        </Box>
      )}

      {/* ═══════════ PREVIEW DIALOG ═══════════ */}
      <Dialog
        open={previewDialog.open}
        onClose={handlePreviewClose}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
            width: '90vw',
            maxWidth: '1100px',
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 1.5,
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#FAFBFD',
            flexShrink: 0,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            {previewDialog.document && (
              <>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '9px',
                    bgcolor: getFileInfo(previewDialog.document).bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  {getFileInfo(previewDialog.document).icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.2 }}>
                    {previewDialog.document.title}
                  </Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                    {getFileInfo(previewDialog.document).label} · {previewDialog.document.batchCode || `Batch ${previewDialog.document.batchId}`} · #{previewDialog.document.documentId}
                    {previewDialog.document.courseName && ` · ${previewDialog.document.courseName}`}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              size="small"
              onClick={async () => {
                if (previewUrl) {
                  window.open(previewUrl, '_blank');
                } else if (previewDialog.document) {
                  try {
                    const response = await courseDocumentsAPI.viewDocument(previewDialog.document.documentId);
                    if (response?.url) window.open(response.url, '_blank');
                  } catch (err) {
                    console.error('Failed to open:', err);
                  }
                }
              }}
              sx={{
                color: '#64748B',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'none',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                px: 1.5,
                py: 0.5,
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' },
              }}
            >
              Open in new tab
            </Button>
            {previewDialog.document?.allowedActions?.includes('download') && (
              <IconButton
                size="small"
                onClick={() => { if (previewDialog.document) handleDownload(previewDialog.document); }}
                sx={{ width: 32, height: 32, border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
              >
                <Download sx={{ fontSize: 17 }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={handlePreviewClose}
              sx={{ width: 32, height: 32, bgcolor: '#F1F5F9', borderRadius: '8px', color: '#64748B', '&:hover': { bgcolor: '#E2E8F0' } }}
            >
              <Close sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1, bgcolor: '#F1F5F9', overflow: 'hidden', position: 'relative' }}>
          {previewLoading && (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={40} sx={{ color: '#2563EB' }} />
              <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>Loading document preview...</Typography>
            </Box>
          )}

          {!previewLoading && previewUrl && previewDialog.document && (() => {
            const ext = getFileExtension(previewDialog.document);
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

            if (isImage) {
              return (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                  <img src={previewUrl} alt={previewDialog.document.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                </Box>
              );
            }

            const iframeSrc = getPreviewIframeSrc();
            if (iframeSrc) {
              return <iframe src={iframeSrc} title="Document Preview" width="100%" height="100%" style={{ border: 'none' }} />;
            }
            return null;
          })()}

          {!previewLoading && !previewUrl && (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Box sx={{ fontSize: 48, opacity: 0.3 }}>📄</Box>
              <Typography sx={{ color: '#334155', fontWeight: 600 }}>Preview not available</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.85rem', textAlign: 'center', maxWidth: 400 }}>Could not load document preview. The file may not exist in storage.</Typography>
              <Box display="flex" gap={1.5} mt={1}>
                <Button
                  variant="contained"
                  onClick={async () => {
                    if (!previewDialog.document) return;
                    setPreviewLoading(true);
                    try {
                      const response = await courseDocumentsAPI.viewDocument(previewDialog.document.documentId);
                      if (response?.url) setPreviewUrl(response.url);
                    } catch (err) { console.error('Retry failed:', err); }
                    finally { setPreviewLoading(false); }
                  }}
                  sx={{ bgcolor: '#2563EB', borderRadius: '10px', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#1D4ED8' } }}
                >
                  Retry
                </Button>
                <Button variant="outlined" onClick={handlePreviewClose} sx={{ borderColor: '#E2E8F0', color: '#64748B', borderRadius: '10px', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' } }}>
                  Close
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Dialog>

      {/* ═══════════ EDIT DIALOG ═══════════ */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.12)', overflow: 'hidden' } }}
      >
        <Box sx={{ height: 3, background: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 100%)' }} />
        <DialogTitle sx={{ pb: 1, pt: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit sx={{ color: '#2563EB', fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>Edit Document</Typography>
            </Box>
            <IconButton onClick={handleEditClose} size="small" sx={{ bgcolor: '#F1F5F9', borderRadius: '9px', '&:hover': { bgcolor: '#E2E8F0' } }}>
              <Close sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#F1F5F9', py: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#475569', mb: 1 }}>
                Document Title <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
              </Typography>
              <TextField fullWidth value={editForm.title} onChange={handleEditFormChange('title')} variant="outlined" required placeholder="Enter title" sx={inputSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#475569', mb: 1 }}>
                Batch <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={editForm.batchId}
                  onChange={handleEditFormChange('batchId')}
                  displayEmpty
                  sx={{
                    borderRadius: '10px',
                    bgcolor: '#FAFBFD',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0', borderWidth: '1.5px' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563EB', borderWidth: '2px' },
                  }}
                >
                  <MenuItem value="" disabled>Select batch</MenuItem>
                  {filterBatches.map(b => (
                    <MenuItem key={b.Batch_ID} value={String(b.Batch_ID)}>
                      {b.Batch_Code || `Batch ${b.Batch_ID}`} — {b.Course_Name || ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#475569', mb: 1 }}>
                Replace File <Box component="span" sx={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</Box>
              </Typography>
              <input accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png" style={{ display: 'none' }} id="edit-file-input" type="file" onChange={handleEditFormChange('file')} />
              <label htmlFor="edit-file-input">
                <Button variant="outlined" component="span" startIcon={<Upload sx={{ fontSize: 18 }} />} fullWidth sx={{ borderRadius: '10px', borderColor: '#E2E8F0', color: '#64748B', textTransform: 'none', fontWeight: 500, py: 1.2, borderStyle: 'dashed', bgcolor: '#FAFBFD', '&:hover': { borderColor: '#93C5FD', bgcolor: '#F0F7FF' } }}>
                  {editForm.file ? editForm.file.name : 'Choose New File'}
                </Button>
              </label>
              {editForm.file && (
                <Typography sx={{ color: '#64748B', fontSize: '0.78rem', mt: 1 }}>
                  Selected: {editForm.file.name} ({(editForm.file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#FAFBFD', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Current Details</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 2 }}>
                  <strong style={{ color: '#334155' }}>Title:</strong> {editDialog.document?.title}<br />
                  <strong style={{ color: '#334155' }}>Batch:</strong> {editDialog.document?.batchCode || editDialog.document?.batchId}
                  {editDialog.document?.courseName && (<><br /><strong style={{ color: '#334155' }}>Course:</strong> {editDialog.document.courseName}</>)}
                  <br /><strong style={{ color: '#334155' }}>Uploaded:</strong>{' '}
                  {(() => { const dt = formatDateTime(editDialog.document?.uploadDateTime); return `${dt.date} ${dt.time}`; })()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={handleEditClose} disabled={editLoading} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', px: 3, '&:hover': { bgcolor: '#F1F5F9' } }}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={editLoading || !editForm.title?.trim() || !editForm.batchId?.trim()}
            startIcon={editLoading ? <CircularProgress size={18} /> : null}
            sx={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 50%, #06B6D4 100%)', borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, boxShadow: '0 4px 14px rgba(37,99,235,0.3)', '&:hover': { background: 'linear-gradient(135deg, #172F4F 0%, #1D4ED8 50%, #0891B2 100%)' }, '&.Mui-disabled': { background: '#CBD5E1', color: 'rgba(255,255,255,0.8)' } }}
          >
            {editLoading ? 'Updating...' : 'Update Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════ DELETE CONFIRMATION ═══════════ */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, documentId: null })}
        onConfirm={confirmDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
      />
    </Box>
  );
};

export default CourseDocumentsList;