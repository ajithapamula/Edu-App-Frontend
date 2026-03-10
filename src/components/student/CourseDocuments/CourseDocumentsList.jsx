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
  Select,
  MenuItem,
  TablePagination,
  Skeleton,
  Alert,
  Snackbar,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Visibility,
  Refresh,
  SearchOutlined,
  DescriptionOutlined,
  FolderOutlined,
  FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseDocumentsAPI } from '../../../services/API/courseDocuments';
import { AuthContext } from '../../../context/AuthContext';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

/* ——— Shimmer Loading ——— */
const CourseDocumentsShimmer = ({ rows = 8 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={260} height={40} sx={{ borderRadius: 2 }} />
      </Box>
      <Box sx={{ p: 2, mb: 3, borderRadius: '14px', border: '1px solid rgba(41,128,185,0.08)', bgcolor: '#fff' }}>
        <Box display="flex" gap={2} alignItems="center">
          <Skeleton variant="rectangular" width={350} height={40} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: '10px' }} />
        </Box>
      </Box>
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
        <Table>
          <TableHead>
            <TableRow>
              {['', '', '', '', '', ''].map((_, i) => (
                <TableCell key={i}><Skeleton variant="text" width={80 + i * 15} /></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shimmerRows.map((index) => (
              <TableRow key={index}>
                <TableCell><Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '6px' }} /></TableCell>
                <TableCell><Skeleton variant="text" width={40} /></TableCell>
                <TableCell><Skeleton variant="text" width={180} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={140} /></TableCell>
                <TableCell><Skeleton variant="circular" width={34} height={34} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box display="flex" justifyContent="center" mt={3}>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading course documents...</Typography>
      </Box>
    </Box>
  );
};

const StudentCourseDocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [batchFilter, setBatchFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Filter options from backend /filters endpoint
  const [filterBatches, setFilterBatches] = useState([]);
  const [filterCourses, setFilterCourses] = useState([]);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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

  const handleSearch = (event) => setSearchTerm(event.target.value);
  const handleRefresh = () => { fetchFilters(); fetchDocuments(); };

  const handleView = (documentId) => {
    navigate(`/student/course-documents/view/${documentId}`);
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

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleString(); } catch { return dateString; }
  };

  if (loading) return <CourseDocumentsShimmer rows={8} />;

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(239,68,68,0.15)' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(13,148,136,0.15)' }}>{success}</Alert>
      </Snackbar>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ width: 38, height: 38, borderRadius: '11px', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Course Documents
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} available
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search & Filter Bar */}
      <Box
        sx={{
          p: 2, mb: 3, borderRadius: '14px', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
          boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
          display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap',
        }}
      >
        <TextField
          placeholder="Search by title, batch, or course..."
          value={searchTerm}
          onChange={handleSearch}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 20, color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 300, flex: 1, maxWidth: 460,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px', fontSize: '0.85rem', fontFamily: fontStack,
              bgcolor: '#f8fafc',
              '& fieldset': { borderColor: 'rgba(41,128,185,0.12)' },
              '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.25)' },
              '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
            },
          }}
        />

        {/* Batch Filter — from backend /filters */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            displayEmpty
            startAdornment={<FilterList sx={{ color: '#94a3b8', fontSize: 17, mr: 0.5 }} />}
            sx={{
              borderRadius: '10px', fontSize: '0.85rem', fontFamily: fontStack,
              bgcolor: '#f8fafc',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(41,128,185,0.12)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(41,128,185,0.25)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2980b9' },
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
              borderRadius: '10px', fontSize: '0.85rem', fontFamily: fontStack,
              bgcolor: '#f8fafc',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(41,128,185,0.12)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(41,128,185,0.25)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2980b9' },
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
          startIcon={<Refresh sx={{ fontSize: '18px !important' }} />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: '0.82rem',
            borderRadius: '10px', borderColor: 'rgba(41,128,185,0.20)',
            color: '#2980b9', px: 2.5, fontFamily: fontStack,
            '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <Box
          sx={{
            p: 5, textAlign: 'center', borderRadius: '16px', bgcolor: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
          }}
        >
          <DescriptionOutlined sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
            No Documents Found
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {documents.length === 0
              ? 'No course documents available at this time.'
              : 'No documents match your current search criteria. Try adjusting your search term.'}
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
                  {['Batch', 'Doc ID', 'Document Title', 'Course', 'Upload Date & Time', 'Actions'].map((h) => (
                    <TableCell key={h}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a5276', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack }}>
                        {h}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((document, idx) => (
                    <TableRow
                      key={document.documentId}
                      hover
                      sx={{
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' },
                        '&:last-child td': { borderBottom: 0 },
                        borderBottom: '1px solid rgba(41,128,185,0.06)',
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={document.batchCode || `B-${document.batchId}`}
                          size="small"
                          sx={{
                            height: 24, fontSize: '0.72rem', fontWeight: 600,
                            bgcolor: 'rgba(41,128,185,0.08)', color: '#1a5276',
                            borderRadius: '6px', fontFamily: fontStack,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontFamily: fontStack, fontWeight: 500 }}>
                          {document.documentId || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                          {document.title || 'Untitled'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack }}>
                          {document.courseName || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack }}>
                          {formatDateTime(document.uploadDateTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          title="View Document"
                          onClick={() => handleView(document.documentId)}
                          sx={{
                            width: 34, height: 34, borderRadius: '9px',
                            color: '#2980b9',
                            bgcolor: 'rgba(41,128,185,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' },
                          }}
                        >
                          <Visibility sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
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
              borderTop: '1px solid rgba(41,128,185,0.06)',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem', color: '#94a3b8', fontFamily: fontStack,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default StudentCourseDocumentsList;