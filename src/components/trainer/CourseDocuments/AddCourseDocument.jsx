import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload,
  ArrowBack,
  Add,
  Delete,
  CheckCircle,
  ErrorOutline,
  InsertDriveFile,
  Description,
  Layers,
  Close,
  GridView
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseDocumentsAPI } from '../../../services/API/courseDocuments';
import { AuthContext } from '../../../context/AuthContext';

/* ── file type helpers ── */
const fileTypeConfig = {
  PDF:   { color: '#DC2626', bg: '#FEF2F2', icon: '📄' },
  DOC:   { color: '#2563EB', bg: '#EFF6FF', icon: '📝' },
  PPT:   { color: '#D97706', bg: '#FFFBEB', icon: '📊' },
  XLS:   { color: '#059669', bg: '#ECFDF5', icon: '📗' },
  VIDEO: { color: '#7C3AED', bg: '#F5F3FF', icon: '🎬' },
  AUDIO: { color: '#DB2777', bg: '#FDF2F8', icon: '🎵' },
  IMAGE: { color: '#0891B2', bg: '#ECFEFF', icon: '🖼️' },
  TXT:   { color: '#6B7280', bg: '#F9FAFB', icon: '📃' },
};

const AddCourseDocument = () => {
  const [formData, setFormData] = useState({
    title: '',
    batchId: ''
  });
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dragActive, setDragActive] = useState(false);

  // Batch options from backend /filters endpoint
  const [batchOptions, setBatchOptions] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch batches from /filters on mount
  useEffect(() => {
    const fetchBatchOptions = async () => {
      try {
        setFiltersLoading(true);
        const response = await courseDocumentsAPI.getFilters();
        setBatchOptions(response.batches || []);
      } catch (err) {
        console.error('Failed to fetch batch options:', err);
        // Fallback: user can still type batch ID manually if filters fail
        setBatchOptions([]);
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchBatchOptions();
  }, []);

  // Find selected batch details for summary sidebar
  const selectedBatch = batchOptions.find(b => String(b.Batch_ID) === String(formData.batchId));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (selectedFiles) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'audio/mp3',
      'audio/wav',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];

    const validFiles = selectedFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`File type ${file.type} is not supported for ${file.name}`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 50MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setError('');
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.title.trim()) errors.push('Document title is required');
    if (!formData.batchId) errors.push('Please select a batch');
    if (files.length === 0) errors.push('Please select at least one file to upload');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    let progressInterval;

    try {
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file || file.size === 0) {
          throw new Error('Invalid file selected');
        }

        const documentData = {
          Batch_ID: parseInt(formData.batchId),
          Document_Title: formData.title.trim(),
          file: file
        };

        console.log('=== Document Data Debug Info ===');
        console.log('File details:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });

        console.log('Document data being sent:', {
          Batch_ID: documentData.Batch_ID,
          Document_Title: documentData.Document_Title,
          fileName: file.name,
          fileSize: file.size
        });

        console.log('=== Sending API Request ===');

        const response = await courseDocumentsAPI.add(documentData);
        console.log('Upload response:', response);

        if (response && response.Document_ID) {
          console.log('Successfully uploaded document with ID:', response.Document_ID);
        }
      }

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);

      setSnackbar({
        open: true,
        message: `Successfully uploaded ${files.length} document(s)!`,
        severity: 'success'
      });

      setFormData({ title: '', batchId: '' });
      setFiles([]);

      setTimeout(() => {
        navigate('/trainer/course-documents');
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      if (progressInterval) clearInterval(progressInterval);

      const errorMessage = err.message || 'Failed to upload document. Please try again.';
      setError(`Failed to add course document: ${errorMessage}`);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setUploading(false);
      if (progressInterval) clearInterval(progressInterval);
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  const getFileType = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'doc': case 'docx': return 'DOC';
      case 'ppt': case 'pptx': return 'PPT';
      case 'xls': case 'xlsx': return 'XLS';
      case 'mp4': case 'avi': case 'mov': return 'VIDEO';
      case 'mp3': case 'wav': return 'AUDIO';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'IMAGE';
      case 'txt': return 'TXT';
      default: return extension?.toUpperCase() || 'UNKNOWN';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isReady = formData.title && formData.batchId && files.length > 0;

  /* ── shared input sx ── */
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      fontSize: '0.9rem',
      fontWeight: 500,
      color: '#1E293B',
      bgcolor: '#FAFBFD',
      transition: 'all 0.2s ease',
      '& fieldset': { borderColor: '#E2E8F0', borderWidth: '1.5px' },
      '&:hover fieldset': { borderColor: '#93C5FD' },
      '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '2px' },
      '&.Mui-focused': { bgcolor: '#fff' },
    },
    '& .MuiOutlinedInput-input': { py: 1.6, px: 1.8 },
    '& input::placeholder': { color: '#94A3B8', opacity: 1 },
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 14 }}>
      {/* ──── Snackbar ──── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircle /> : <ErrorOutline />}
          sx={{
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: snackbar.severity === 'success' ? '#86EFAC' : '#FCA5A5',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ═══════════ TOP NAV ═══════════ */}
      <Box
        display="flex"
        alignItems="center"
        sx={{ pb: 3, mb: 4, borderBottom: '1px solid #F1F5F9' }}
      >
        <Button
          startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
          onClick={() => navigate('/trainer/course-documents')}
          sx={{
            color: '#64748B',
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'none',
            borderRadius: '10px',
            px: 2,
            py: 0.8,
            '&:hover': { bgcolor: '#F1F5F9', color: '#2563EB' },
            transition: 'all 0.2s ease',
          }}
        >
          Back to Documents
        </Button>
      </Box>

      {/* ═══════════ HEADER ═══════════ */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            <CloudUpload sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                fontSize: '1.75rem',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
              }}
            >
              Add Course Document
            </Typography>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', mt: 0.3 }}>
              Upload learning materials for your training batches
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ═══════════ ERROR ═══════════ */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: '12px',
            border: '1px solid #FECACA',
            bgcolor: '#FEF2F2',
            '& .MuiAlert-icon': { color: '#DC2626' },
          }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* ═══════════ FORM ═══════════ */}
      <form onSubmit={handleSubmit}>
        <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', lg: 'row' } }}>

          {/* ────── LEFT COLUMN ────── */}
          <Box sx={{ flex: 1.3 }}>

            {/* ── Document Details Card ── */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                mb: 3,
                transition: 'box-shadow 0.3s ease',
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.04)' },
              }}
            >
              {/* Card accent line */}
              <Box sx={{ height: 3, background: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 100%)' }} />

              <Box sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      bgcolor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Description sx={{ color: '#2563EB', fontSize: 18 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                    Document Details
                  </Typography>
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        color: '#475569',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <InsertDriveFile sx={{ fontSize: 14, color: '#94A3B8' }} />
                      Document Title
                      <Box component="span" sx={{ color: '#EF4444', ml: 0.3 }}>*</Box>
                    </Typography>
                    <TextField
                      fullWidth
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      disabled={uploading}
                      placeholder="e.g., React Fundamentals Guide"
                      variant="outlined"
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        color: '#475569',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <GridView sx={{ fontSize: 14, color: '#94A3B8' }} />
                      Batch
                      <Box component="span" sx={{ color: '#EF4444', ml: 0.3 }}>*</Box>
                    </Typography>
                    <FormControl fullWidth disabled={uploading}>
                      <Select
                        name="batchId"
                        value={formData.batchId}
                        onChange={handleInputChange}
                        displayEmpty
                        sx={{
                          borderRadius: '10px',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          color: '#1E293B',
                          bgcolor: '#FAFBFD',
                          transition: 'all 0.2s ease',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0', borderWidth: '1.5px' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563EB', borderWidth: '2px' },
                          '&.Mui-focused': { bgcolor: '#fff' },
                          '& .MuiSelect-select': { py: 1.6, px: 1.8 },
                        }}
                      >
                        <MenuItem value="" disabled>
                          {filtersLoading ? 'Loading batches...' : 'Select a batch'}
                        </MenuItem>
                        {batchOptions.map(b => (
                          <MenuItem key={b.Batch_ID} value={String(b.Batch_ID)}>
                            {b.Batch_Code || `Batch ${b.Batch_ID}`}
                            {b.Course_Name ? ` — ${b.Course_Name}` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* ── File Upload Card ── */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                mb: 3,
                transition: 'box-shadow 0.3s ease',
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.04)' },
              }}
            >
              <Box sx={{ height: 3, background: 'linear-gradient(90deg, #06B6D4 0%, #8B5CF6 100%)' }} />

              <Box sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      bgcolor: '#ECFEFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CloudUpload sx={{ color: '#0891B2', fontSize: 18 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                    Upload Files
                  </Typography>
                  {files.length > 0 && (
                    <Chip
                      label={`${files.length} file${files.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{
                        ml: 'auto',
                        height: 26,
                        bgcolor: '#EFF6FF',
                        color: '#2563EB',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        borderRadius: '8px',
                      }}
                    />
                  )}
                </Box>

                {/* Drop Zone */}
                <Box
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  sx={{
                    border: '2px dashed',
                    borderColor: dragActive ? '#2563EB' : '#D1D5DB',
                    borderRadius: '14px',
                    p: { xs: 3, md: 5 },
                    textAlign: 'center',
                    bgcolor: dragActive ? '#EFF6FF' : '#FAFBFD',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: '#93C5FD',
                      bgcolor: '#F0F7FF',
                      '& .upload-icon-ring': {
                        transform: 'scale(1.08)',
                        bgcolor: '#DBEAFE',
                      },
                    },
                  }}
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx,.mp4,.avi,.mov,.mp3,.wav,.jpg,.jpeg,.png,.gif"
                  />
                  <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                    <Box
                      className="upload-icon-ring"
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: dragActive ? '#DBEAFE' : '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2.5,
                        transition: 'all 0.3s ease',
                        boxShadow: dragActive ? '0 0 0 8px rgba(37,99,235,0.08)' : 'none',
                      }}
                    >
                      <CloudUpload sx={{ color: '#2563EB', fontSize: 32 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#1E293B', mb: 0.8 }}>
                      {dragActive ? 'Drop your files here' : 'Drag & drop files here'}
                    </Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.85rem', mb: 0.5 }}>
                      or <Box component="span" sx={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>browse from your computer</Box>
                    </Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem', mt: 2, lineHeight: 1.7 }}>
                      PDF, DOC, DOCX, PPT, PPTX, TXT, XLS, XLSX, MP4, AVI, MOV, MP3, WAV, JPG, PNG, GIF
                    </Typography>
                    <Typography sx={{ color: '#CBD5E1', fontSize: '0.72rem', mt: 0.5, fontWeight: 600 }}>
                      Maximum 50 MB per file
                    </Typography>
                  </label>
                </Box>

                {/* ── Selected Files ── */}
                {files.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        mb: 1.5,
                      }}
                    >
                      Selected Files
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {files.map((file, index) => {
                        const type = getFileType(file);
                        const config = fileTypeConfig[type] || fileTypeConfig.TXT;
                        return (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: '12px',
                              border: '1px solid #F1F5F9',
                              bgcolor: '#FAFBFD',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#F0F7FF',
                                borderColor: '#BFDBFE',
                                transform: 'translateX(2px)',
                                '& .file-delete': { opacity: 1 },
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 42,
                                height: 42,
                                borderRadius: '10px',
                                bgcolor: config.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: 20,
                              }}
                            >
                              {config.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  color: '#1E293B',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {file.name}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={0.3}>
                                <Chip
                                  label={type}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    bgcolor: config.bg,
                                    color: config.color,
                                    borderRadius: '5px',
                                    '& .MuiChip-label': { px: 0.8 },
                                  }}
                                />
                                <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                                  {formatFileSize(file.size)}
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton
                              className="file-delete"
                              onClick={() => removeFile(index)}
                              disabled={uploading}
                              size="small"
                              sx={{
                                opacity: 0.4,
                                color: '#94A3B8',
                                transition: 'all 0.2s ease',
                                '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' },
                              }}
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* ── Upload Progress ── */}
                {uploading && (
                  <Box sx={{ mt: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#334155' }}>
                        Uploading documents...
                      </Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#2563EB' }}>
                        {uploadProgress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress}
                      sx={{
                        height: 6,
                        borderRadius: '3px',
                        bgcolor: '#EFF6FF',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: '3px',
                          background: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 100%)',
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>

          {/* ────── RIGHT: Summary Sidebar ────── */}
          <Box sx={{ flex: 0.55, minWidth: 280 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                position: 'sticky',
                top: 24,
                transition: 'box-shadow 0.3s ease',
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.04)' },
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: '#F8FAFC',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Upload Summary
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                {!formData.title && !formData.batchId && files.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '16px',
                        bgcolor: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        fontSize: 28,
                      }}
                    >
                      📁
                    </Box>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.6 }}>
                      Fill in the details and select files to see your upload summary
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Summary info cards */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                      {/* Title */}
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          bgcolor: '#FAFBFD',
                          border: '1px solid #F1F5F9',
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#94A3B8',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            mb: 0.5,
                          }}
                        >
                          Title
                        </Typography>
                        <Typography
                          sx={{
                            color: formData.title ? '#1E293B' : '#CBD5E1',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                          }}
                        >
                          {formData.title || 'Not set'}
                        </Typography>
                      </Box>

                      {/* Batch */}
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          bgcolor: '#FAFBFD',
                          border: '1px solid #F1F5F9',
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#94A3B8',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            mb: 0.5,
                          }}
                        >
                          Batch
                        </Typography>
                        {selectedBatch ? (
                          <Box>
                            <Chip
                              label={selectedBatch.Batch_Code || `Batch ${selectedBatch.Batch_ID}`}
                              size="small"
                              sx={{
                                height: 26,
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                bgcolor: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                borderRadius: '8px',
                              }}
                            />
                            {selectedBatch.Course_Name && (
                              <Typography sx={{ color: '#64748B', fontSize: '0.78rem', mt: 0.8 }}>
                                {selectedBatch.Course_Name}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography sx={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.9rem' }}>
                            Not set
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Files Summary */}
                    {files.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            mb: 1.5,
                          }}
                        >
                          Files ({files.length})
                        </Typography>

                        <Box display="flex" gap={0.8} flexWrap="wrap" mb={2}>
                          {Object.entries(
                            files.reduce((acc, file) => {
                              const type = getFileType(file);
                              acc[type] = (acc[type] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([type, count]) => {
                            const config = fileTypeConfig[type] || fileTypeConfig.TXT;
                            return (
                              <Chip
                                key={type}
                                label={`${count} ${type}`}
                                size="small"
                                sx={{
                                  height: 24,
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                  bgcolor: config.bg,
                                  color: config.color,
                                  borderRadius: '6px',
                                }}
                              />
                            );
                          })}
                        </Box>

                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            bgcolor: '#FAFBFD',
                            border: '1px solid #F1F5F9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography sx={{ color: '#64748B', fontSize: '0.82rem', fontWeight: 500 }}>
                            Total Size
                          </Typography>
                          <Typography sx={{ color: '#1E293B', fontSize: '0.85rem', fontWeight: 700 }}>
                            {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Status Indicator */}
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: isReady ? '#F0FDF4' : '#FFFBEB',
                        border: '1px solid',
                        borderColor: isReady ? '#A7F3D0' : '#FDE68A',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        {isReady ? (
                          <>
                            <CheckCircle sx={{ color: '#059669', fontSize: 20 }} />
                            <Typography sx={{ color: '#059669', fontWeight: 600, fontSize: '0.82rem' }}>
                              Ready to upload
                            </Typography>
                          </>
                        ) : (
                          <>
                            <ErrorOutline sx={{ color: '#D97706', fontSize: 20 }} />
                            <Box>
                              <Typography sx={{ color: '#D97706', fontWeight: 600, fontSize: '0.82rem' }}>
                                Missing required fields
                              </Typography>
                              <Typography sx={{ color: '#B45309', fontSize: '0.72rem', mt: 0.3 }}>
                                {[
                                  !formData.title && 'Title',
                                  !formData.batchId && 'Batch',
                                  files.length === 0 && 'Files'
                                ].filter(Boolean).join(' · ')}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* ────── FLOATING ACTION BAR ────── */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 1,
              borderRadius: '16px',
              bgcolor: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <Button
              variant="text"
              onClick={() => navigate('/trainer/course-documents')}
              disabled={uploading}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                color: '#64748B',
                px: 3,
                py: 1.2,
                fontSize: '0.88rem',
                '&:hover': { bgcolor: '#F1F5F9' },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploading || files.length === 0}
              startIcon={
                uploading
                  ? <CircularProgress size={18} sx={{ color: '#fff' }} />
                  : <CloudUpload sx={{ fontSize: 19 }} />
              }
              sx={{
                background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 50%, #06B6D4 100%)',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                px: 3.5,
                py: 1.2,
                fontSize: '0.88rem',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #172F4F 0%, #1D4ED8 50%, #0891B2 100%)',
                  boxShadow: '0 6px 24px rgba(37,99,235,0.4)',
                  transform: 'translateY(-1px)',
                },
                '&.Mui-disabled': {
                  background: '#CBD5E1',
                  color: 'rgba(255,255,255,0.8)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {uploading
                ? `Uploading... ${uploadProgress}%`
                : `Upload Document${files.length !== 1 ? 's' : ''}`}
            </Button>
          </Paper>
        </Box>
      </form>
    </Box>
  );
};

export default AddCourseDocument;