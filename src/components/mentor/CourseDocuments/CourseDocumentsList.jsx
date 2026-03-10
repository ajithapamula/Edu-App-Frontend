import React, { useState, useEffect, useContext } from 'react';
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
  Chip,
  Avatar,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Refresh,
  Close,
  Upload,
  Search,
  Description,
  FolderOpen,
  MoreVert
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../common/ConfirmDialog';
import { courseDocumentsAPI } from '../../../services/API/courseDocuments';
import { AuthContext } from '../../../context/AuthContext';

/* ── inject fonts ── */
const styleTag = document.getElementById('course-doc-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'course-doc-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes cdFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ── shared tokens ── */
const headingFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bodyFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const cardBase = {
  background: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #e8ecf2',
  boxShadow: '0 2px 12px rgba(30,58,138,0.06)',
};
const accentBtn = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)',
  color: '#fff',
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontWeight: 600,
  fontSize: '0.85rem',
  textTransform: 'none',
  borderRadius: '10px',
  px: 2.5,
  py: 1,
  boxShadow: '0 4px 14px rgba(14,165,233,0.25)',
  border: 'none',
  '&:hover': {
    background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
    boxShadow: '0 6px 20px rgba(14,165,233,0.30)',
    transform: 'translateY(-1px)',
  },
  transition: 'all 0.3s ease',
};

// Shimmer Loading Component
const CourseDocumentsShimmer = ({ rows = 8 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, index) => index);

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={260} height={44} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width={160} height={42} sx={{ borderRadius: '10px' }} />
      </Box>
      <Paper sx={{ ...cardBase, p: 2.5, mb: 2.5 }}>
        <Box display="flex" gap={2} alignItems="center">
          <Skeleton variant="rectangular" width={340} height={42} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rectangular" width={140} height={42} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rectangular" width={140} height={42} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rectangular" width={110} height={42} sx={{ borderRadius: '10px' }} />
        </Box>
      </Paper>
      <Paper sx={{ ...cardBase, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: '#f8fafc' }}>
              {[80, 100, 180, 120, 160, 120].map((w, i) => (
                <TableCell key={i}><Skeleton variant="text" width={w} /></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shimmerRows.map((index) => (
              <TableRow key={index}>
                <TableCell><Skeleton variant="rounded" width={80} height={26} sx={{ borderRadius: '6px' }} /></TableCell>
                <TableCell><Skeleton variant="text" width={40} /></TableCell>
                <TableCell><Skeleton variant="text" width={160} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={140} /></TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

const MentorCourseDocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, documentId: null });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, document: null });
  const [editForm, setEditForm] = useState({ title: '', batchId: '', file: null });
  const [editLoading, setEditLoading] = useState(false);
  const [batchFilter, setBatchFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Filter options from backend /filters endpoint
  const [filterBatches, setFilterBatches] = useState([]);
  const [filterCourses, setFilterCourses] = useState([]);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Three-dot menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuDocumentId, setMenuDocumentId] = useState(null);

  // Determine if current user can add documents (mentor cannot per backend)
  const canAdd = user && ['trainer', 'super_admin', 'organization'].includes(user.role);

  const handleMenuOpen = (event, documentId) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuDocumentId(documentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuDocumentId(null);
  };

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
      } else {
        setError('Failed to load documents: Invalid response format');
        setDocuments([]);
      }
    } catch (error) {
      setError(error.message || 'Failed to load course documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFilters(); fetchDocuments(); }, []);

  const handleSearch = (event) => { setSearchTerm(event.target.value); };
  const handleRefresh = () => { fetchFilters(); fetchDocuments(); };
  const handleDelete = (documentId) => { setDeleteDialog({ open: true, documentId }); };

  const confirmDelete = async () => {
    try {
      setError(null);
      await courseDocumentsAPI.remove(deleteDialog.documentId);
      setDocuments(documents.filter(doc => doc.documentId !== deleteDialog.documentId));
      setSuccess('Document deleted successfully');
      setDeleteDialog({ open: false, documentId: null });
    } catch (error) {
      setError(error.message || 'Failed to delete document');
      setDeleteDialog({ open: false, documentId: null });
    }
  };

  const handleView = (documentId) => { navigate(`/mentor/course-documents/view/${documentId}`); };

  const handleEdit = (document) => {
    setEditForm({ title: document.title ? String(document.title) : '', batchId: document.batchId ? String(document.batchId) : '', file: null });
    setEditDialog({ open: true, document });
  };
  const handleEditClose = () => { setEditDialog({ open: false, document: null }); setEditForm({ title: '', batchId: '', file: null }); };
  const handleEditFormChange = (field) => (event) => {
    if (field === 'file') { setEditForm(prev => ({ ...prev, [field]: event.target.files[0] || null })); }
    else { setEditForm(prev => ({ ...prev, [field]: event.target.value })); }
  };

  const handleEditSubmit = async () => {
    try {
      setEditLoading(true); setError(null);
      const titleValue = editForm.title ? String(editForm.title).trim() : '';
      const batchIdValue = editForm.batchId ? String(editForm.batchId).trim() : '';
      if (!titleValue) { setError('Document title is required'); setEditLoading(false); return; }
      if (!batchIdValue) { setError('Batch ID is required'); setEditLoading(false); return; }
      const updateData = { Document_Title: titleValue, Batch_ID: batchIdValue };
      if (editForm.file) { updateData.file = editForm.file; }
      await courseDocumentsAPI.update(editDialog.document.documentId, updateData);
      const updatedDocuments = documents.map(doc =>
        doc.documentId === editDialog.document.documentId
          ? { ...doc, title: titleValue, batchId: batchIdValue, _original: { ...doc._original, ...updateData } }
          : doc
      );
      setDocuments(updatedDocuments); setSuccess('Document updated successfully'); handleEditClose();
    } catch (error) { setError(error.message || 'Failed to update document'); }
    finally { setEditLoading(false); }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = (doc.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (doc.documentId?.toString() || '').includes(searchTerm.toLowerCase()) ||
      (doc.batchCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (doc.courseName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesBatch = batchFilter === 'all' || String(doc.batchId) === String(batchFilter);
    const matchesCourse = courseFilter === 'all' || String(doc.courseId) === String(courseFilter);
    return matchesSearch && matchesBatch && matchesCourse;
  });

  const handleChangePage = (event, newPage) => { setPage(newPage); };
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
  const formatDateTime = (dateString) => { if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleString(); } catch { return dateString; } };

  if (loading) { return <CourseDocumentsShimmer rows={8} />; }

  // Menu action items config — built from allowed_actions
  const getMenuActions = (document) => {
    const actions = [];
    const allowed = document.allowedActions || ['view'];

    if (allowed.includes('view')) {
      actions.push({ label: 'View', icon: <Visibility sx={{ fontSize: 18 }} />, color: '#0ea5e9', onClick: () => { handleView(document.documentId); handleMenuClose(); } });
    }
    if (allowed.includes('edit')) {
      actions.push({ label: 'Edit', icon: <Edit sx={{ fontSize: 18 }} />, color: '#1e3a8a', onClick: () => { handleEdit(document); handleMenuClose(); } });
    }
    if (allowed.includes('delete')) {
      actions.push({ label: 'Delete', icon: <Delete sx={{ fontSize: 18 }} />, color: '#ef4444', onClick: () => { handleDelete(document.documentId); handleMenuClose(); } });
    }

    return actions;
  };

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Snackbars */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%', borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%', borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>{success}</Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, animation: 'cdFadeUp 0.5s ease-out both' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
          }}>
            <FolderOpen sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...headingFont, fontSize: { xs: '1.3rem', md: '1.55rem' }, lineHeight: 1.2 }}>
              Course Documents
            </Typography>
            <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} available
            </Typography>
          </Box>
        </Box>
        {canAdd && (
          <Button variant="contained" disableElevation startIcon={<Add />} onClick={() => navigate('/mentor/course-documents/add')} sx={accentBtn}>
            Add Document
          </Button>
        )}
      </Box>

      {/* Search & Filters */}
      <Paper elevation={0} sx={{ ...cardBase, p: 2.5, mb: 2.5, animation: 'cdFadeUp 0.5s ease-out 0.1s both' }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search by title, batch, or course..."
            value={searchTerm}
            onChange={handleSearch}
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

          {/* Batch Filter — from backend /filters */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem',
                background: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8ecf2' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bfdbfe' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0ea5e9' },
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
                borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem',
                background: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8ecf2' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bfdbfe' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0ea5e9' },
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
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: 18 }} />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.82rem',
              textTransform: 'none', borderRadius: '10px', border: '1.5px solid #e8ecf2', color: '#475569',
              px: 2, py: 0.85,
              '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' },
              transition: 'all 0.3s ease',
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      {filteredDocuments.length === 0 ? (
        <Paper elevation={0} sx={{ ...cardBase, p: 5, textAlign: 'center', animation: 'cdFadeUp 0.5s ease-out 0.2s both' }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '16px', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(13,148,136,0.04))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Description sx={{ color: '#0ea5e9', fontSize: 32 }} />
          </Box>
          <Typography sx={{ ...headingFont, fontSize: '1.1rem', mb: 1 }}>No Documents Found</Typography>
          <Typography sx={{ ...bodyFont, fontSize: '0.88rem', color: '#64748b', mb: 2.5 }}>
            {documents.length === 0 ? "No course documents available." : "No documents match your current search criteria."}
          </Typography>
          {documents.length === 0 && canAdd && (
            <Button variant="contained" disableElevation startIcon={<Add />} onClick={() => navigate('/mentor/course-documents/add')} sx={accentBtn}>
              Add First Document
            </Button>
          )}
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ ...cardBase, overflow: 'hidden', animation: 'cdFadeUp 0.5s ease-out 0.2s both' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  {['Batch', 'Doc ID', 'Document Title', 'Course', 'Upload Date & Time', 'Actions'].map((h) => (
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
                {filteredDocuments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((document) => (
                    <TableRow key={document.documentId} sx={{
                      transition: 'background 0.2s ease',
                      '&:hover': { background: '#f8fafc' },
                      '&:last-child td': { borderBottom: 'none' },
                    }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Chip label={document.batchCode || `B-${document.batchId}`} size="small" sx={{
                          height: 26, fontSize: '0.76rem', fontFamily: '"Plus Jakarta Sans", sans-serif',
                          fontWeight: 600, background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe',
                        }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Typography sx={{ ...bodyFont, fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                          #{document.documentId || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box sx={{
                            width: 32, height: 32, borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(14,165,233,0.03))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Description sx={{ color: '#0ea5e9', fontSize: 17 }} />
                          </Box>
                          <Typography sx={{ ...bodyFont, fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>
                            {document.title || 'Untitled'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#475569' }}>
                          {document.courseName || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b' }}>
                          {formatDateTime(document.uploadDateTime)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, document.documentId)}
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '8px',
                            color: '#475569',
                            background: '#f8fafc',
                            border: '1px solid #e8ecf2',
                            transition: 'all 0.25s ease',
                            '&:hover': {
                              background: '#f0f4ff',
                              borderColor: '#bfdbfe',
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          <MoreVert sx={{ fontSize: 19 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Single shared Menu component — built from allowed_actions */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                borderRadius: '12px',
                border: '1px solid #e8ecf2',
                boxShadow: '0 8px 30px rgba(30,58,138,0.12)',
                minWidth: 180,
                mt: 0.5,
                overflow: 'visible',
                '& .MuiList-root': { py: 0.5 },
              },
            }}
          >
            {menuDocumentId && getMenuActions(
              filteredDocuments.find(doc => doc.documentId === menuDocumentId) || {}
            ).map((action, i) => (
              <MenuItem
                key={i}
                onClick={action.onClick}
                sx={{
                  py: 1.2,
                  px: 2,
                  mx: 0.5,
                  my: 0.3,
                  borderRadius: '8px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.85rem',
                  color: action.color,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: `${action.color}0A`,
                  },
                  ...(action.label === 'Delete' && {
                    borderTop: '1px solid #f1f5f9',
                    mt: 0.5,
                  }),
                }}
              >
                <ListItemIcon sx={{ color: action.color, minWidth: 34 }}>
                  {action.icon}
                </ListItemIcon>
                <ListItemText
                  primary={action.label}
                  primaryTypographyProps={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: action.color,
                  }}
                />
              </MenuItem>
            ))}
          </Menu>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredDocuments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid #f1f5f9',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.82rem', color: '#64748b',
              },
            }}
          />
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={handleEditClose} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 24px 48px rgba(30,58,138,0.12)', border: '1px solid #e8ecf2' } }}>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', color: 'white',
          py: 2.5, borderRadius: '16px 16px 0 0',
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Edit sx={{ fontSize: 24 }} />
              <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.15rem' }}>
                Edit Document
              </Typography>
            </Box>
            <IconButton onClick={handleEditClose} size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3.5, background: '#f8fafc' }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Document Title" value={editForm.title} onChange={handleEditFormChange('title')}
                variant="outlined" required helperText="Enter the document title"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px', background: '#fff', fontFamily: '"DM Sans", sans-serif',
                    '&.Mui-focused fieldset': { borderColor: '#0ea5e9' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#0ea5e9' },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ ...headingFont, fontSize: '0.78rem', color: '#475569', mb: 1 }}>
                Batch <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={editForm.batchId}
                  onChange={handleEditFormChange('batchId')}
                  displayEmpty
                  sx={{
                    borderRadius: '10px', background: '#fff', fontFamily: '"DM Sans", sans-serif',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8ecf2' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bfdbfe' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0ea5e9' },
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
              <Typography sx={{ ...headingFont, fontSize: '0.85rem', mb: 1 }}>Replace Document File (Optional)</Typography>
              <input accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png" style={{ display: 'none' }} id="edit-file-input" type="file" onChange={handleEditFormChange('file')} />
              <label htmlFor="edit-file-input">
                <Button variant="outlined" component="span" startIcon={<Upload />} fullWidth sx={{
                  borderRadius: '10px', border: '1.5px dashed #bfdbfe', color: '#0ea5e9', py: 1.5,
                  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none',
                  '&:hover': { borderColor: '#0ea5e9', background: 'rgba(14,165,233,0.04)' },
                }}>
                  {editForm.file ? editForm.file.name : 'Choose New File'}
                </Button>
              </label>
              {editForm.file && (
                <Typography sx={{ ...bodyFont, fontSize: '0.8rem', color: '#64748b', mt: 1 }}>
                  Selected: {editForm.file.name} ({(editForm.file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '10px', border: '1px solid #e8ecf2' }}>
                <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.8 }}>
                  <strong style={{ color: '#0f172a' }}>Current Document:</strong> {editDialog.document?.title}<br />
                  <strong style={{ color: '#0f172a' }}>Current Batch:</strong> {editDialog.document?.batchCode || editDialog.document?.batchId}
                  {editDialog.document?.courseName && (<><br /><strong style={{ color: '#0f172a' }}>Course:</strong> {editDialog.document.courseName}</>)}
                  <br /><strong style={{ color: '#0f172a' }}>Upload Date:</strong> {formatDateTime(editDialog.document?.uploadDateTime)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: '#f8fafc' }}>
          <Button onClick={handleEditClose} disabled={editLoading} sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none',
            borderRadius: '10px', color: '#64748b', border: '1.5px solid #e8ecf2', px: 3,
            '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' },
          }}>
            Cancel
          </Button>
          <Button onClick={handleEditSubmit} variant="contained" disableElevation
            disabled={editLoading || !editForm.title?.trim() || !editForm.batchId?.trim()}
            startIcon={editLoading ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ ...accentBtn, px: 3 }}>
            {editLoading ? 'Updating...' : 'Update Document'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default MentorCourseDocumentsList;