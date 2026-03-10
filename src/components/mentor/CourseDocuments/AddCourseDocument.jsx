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
  Description,
  UploadFile
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseDocumentsAPI } from '../../../services/API/courseDocuments';
import { AuthContext } from '../../../context/AuthContext';

/* ── inject fonts ── */
const styleTag = document.getElementById('course-doc-add-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'course-doc-add-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes cdaFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(s);
  return s;
})();

const headingFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bodyFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const cardBase = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };
const accentBtn = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', color: '#fff',
  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.85rem',
  textTransform: 'none', borderRadius: '10px', px: 3, py: 1.2,
  boxShadow: '0 4px 14px rgba(14,165,233,0.25)', border: 'none',
  '&:hover': { background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)', boxShadow: '0 6px 20px rgba(14,165,233,0.30)', transform: 'translateY(-1px)' },
  transition: 'all 0.3s ease',
};
const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', background: '#f8fafc', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem',
    '& fieldset': { borderColor: '#e8ecf2' },
    '&:hover fieldset': { borderColor: '#bfdbfe' },
    '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root': { fontFamily: '"DM Sans", sans-serif', color: '#64748b' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0ea5e9' },
};

const MentorAddCourseDocument = () => {
  const [formData, setFormData] = useState({ title: '', batchId: '' });
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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
        setBatchOptions([]);
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchBatchOptions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowedTypes = [
      'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4','video/avi','video/quicktime','audio/mp3','audio/wav',
      'image/jpeg','image/jpg','image/png','image/gif'
    ];
    const validFiles = selectedFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) { setError(`File type ${file.type} is not supported for ${file.name}`); return false; }
      if (file.size > 50 * 1024 * 1024) { setError(`File ${file.name} is too large. Maximum size is 50MB`); return false; }
      return true;
    });
    if (validFiles.length > 0) { setFiles(prev => [...prev, ...validFiles]); setError(''); }
  };

  const removeFile = (index) => { setFiles(prev => prev.filter((_, i) => i !== index)); };

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
    if (validationErrors.length > 0) { setError(validationErrors.join(', ')); return; }
    setUploading(true); setError(''); setUploadProgress(0);
    let progressInterval;
    try {
      progressInterval = setInterval(() => {
        setUploadProgress(prev => { if (prev >= 90) { clearInterval(progressInterval); return 90; } return prev + 10; });
      }, 200);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || file.size === 0) throw new Error('Invalid file selected');
        const documentData = { Batch_ID: parseInt(formData.batchId), Document_Title: formData.title.trim(), file: file };
        const response = await courseDocumentsAPI.add(documentData);
        if (response && response.Document_ID) console.log('Successfully uploaded document with ID:', response.Document_ID);
      }
      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);
      setSnackbar({ open: true, message: `Successfully uploaded ${files.length} document(s)!`, severity: 'success' });
      setFormData({ title: '', batchId: '' }); setFiles([]);
      setTimeout(() => { navigate('/mentor/course-documents'); }, 2000);
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      const errorMessage = err.message || 'Failed to upload document. Please try again.';
      setError(`Failed to add course document: ${errorMessage}`);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setUploading(false);
      if (progressInterval) clearInterval(progressInterval);
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  const getFileType = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF'; case 'doc': case 'docx': return 'DOC'; case 'ppt': case 'pptx': return 'PPT';
      case 'xls': case 'xlsx': return 'XLS'; case 'mp4': case 'avi': case 'mov': return 'VIDEO';
      case 'mp3': case 'wav': return 'AUDIO'; case 'jpg': case 'jpeg': case 'png': case 'gif': return 'IMAGE';
      case 'txt': return 'TXT'; default: return extension?.toUpperCase() || 'UNKNOWN';
    }
  };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const handleCloseSnackbar = () => { setSnackbar({ ...snackbar, open: false }); };

  const getFileTypeColor = (file) => {
    const type = getFileType(file);
    const colors = { PDF: '#ef4444', DOC: '#1e3a8a', PPT: '#f57c00', XLS: '#0d9488', VIDEO: '#7b1fa2', AUDIO: '#0ea5e9', IMAGE: '#0d9488', TXT: '#64748b' };
    return colors[type] || '#94a3b8';
  };

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, animation: 'cdaFadeUp 0.5s ease-out both' }}>
        <IconButton onClick={() => navigate('/mentor/course-documents')} sx={{
          mr: 2, width: 40, height: 40, borderRadius: '10px',
          background: '#fff', border: '1px solid #e8ecf2',
          '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' },
          transition: 'all 0.3s ease',
        }}>
          <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
          }}>
            <UploadFile sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...headingFont, fontSize: { xs: '1.3rem', md: '1.55rem' }, lineHeight: 1.2 }}>
              Add Course Document
            </Typography>
            <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>
              Upload new learning resources for your students
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ ...cardBase, p: 3.5, animation: 'cdaFadeUp 0.5s ease-out 0.1s both' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Document Title" name="title" value={formData.title}
                onChange={handleInputChange} required disabled={uploading} placeholder="Enter document title" sx={inputStyle} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth disabled={uploading}>
                <InputLabel sx={{ fontFamily: '"DM Sans", sans-serif', color: '#64748b', '&.Mui-focused': { color: '#0ea5e9' } }}>
                  Batch
                </InputLabel>
                <Select
                  name="batchId"
                  value={formData.batchId}
                  onChange={handleInputChange}
                  label="Batch"
                  sx={{
                    borderRadius: '10px', background: '#f8fafc', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8ecf2' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bfdbfe' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0ea5e9', borderWidth: '1.5px' },
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

            {/* File Upload */}
            <Grid size={12}>
              <Typography sx={{ ...headingFont, fontSize: '0.95rem', mb: 1.5 }}>Upload Files (Required)</Typography>

              <Box sx={{
                border: '2px dashed #bfdbfe', borderRadius: '14px', p: 4, textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.02), rgba(13,148,136,0.02))',
                transition: 'all 0.3s ease',
                '&:hover': { borderColor: '#0ea5e9', background: 'rgba(14,165,233,0.04)' },
              }}>
                <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} id="file-upload"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx,.mp4,.avi,.mov,.mp3,.wav,.jpg,.jpeg,.png,.gif" />
                <Box sx={{
                  width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 2,
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(13,148,136,0.04))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CloudUpload sx={{ color: '#0ea5e9', fontSize: 28 }} />
                </Box>
                <label htmlFor="file-upload">
                  <Button variant="contained" component="span" disableElevation startIcon={<CloudUpload />}
                    disabled={uploading} sx={{ ...accentBtn, mb: 1.5 }}>
                    {uploading ? 'Uploading...' : 'Choose Files'}
                  </Button>
                </label>
                <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b', mt: 1 }}>
                  Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, XLS, XLSX, MP4, AVI, MOV, MP3, WAV, JPG, PNG, GIF
                </Typography>
                <Typography sx={{ ...bodyFont, fontSize: '0.78rem', color: '#94a3b8', mt: 0.5 }}>
                  Maximum file size: 50MB per file
                </Typography>
              </Box>

              {files.length > 0 && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography sx={{ ...headingFont, fontSize: '0.88rem', mb: 1.5 }}>
                    Selected Files ({files.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {files.map((file, index) => (
                      <Box key={index} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        p: 1.5, pr: 1, borderRadius: '10px', background: '#f8fafc',
                        border: '1px solid #e8ecf2', transition: 'all 0.25s ease',
                        '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' },
                      }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '8px',
                          background: `${getFileTypeColor(file)}10`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Description sx={{ color: getFileTypeColor(file), fontSize: 16 }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ ...bodyFont, fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                            {file.name}
                          </Typography>
                          <Typography sx={{ ...bodyFont, fontSize: '0.72rem', color: '#94a3b8' }}>
                            {formatFileSize(file.size)} · {getFileType(file)}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => removeFile(index)} disabled={uploading} sx={{
                          width: 28, height: 28, color: '#ef4444', borderRadius: '6px',
                          '&:hover': { background: 'rgba(239,68,68,0.08)' },
                        }}>
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>

            {/* Progress */}
            {uploading && (
              <Grid size={12}>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ ...bodyFont, fontSize: '0.84rem', fontWeight: 500 }}>Uploading documents...</Typography>
                    <Typography sx={{ ...headingFont, fontSize: '0.84rem', color: '#0ea5e9' }}>{uploadProgress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{
                    height: 6, borderRadius: 3, backgroundColor: '#e8ecf2',
                    '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg, #0ea5e9, #0d9488)' },
                  }} />
                </Box>
              </Grid>
            )}

            {/* Buttons */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
                <Button onClick={() => navigate('/mentor/course-documents')} disabled={uploading} sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none',
                  borderRadius: '10px', color: '#64748b', border: '1.5px solid #e8ecf2', px: 3, py: 1,
                  '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' }, transition: 'all 0.3s ease',
                }}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disableElevation
                  disabled={uploading || files.length === 0}
                  startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <Add />}
                  sx={accentBtn}>
                  {uploading ? `Uploading... (${uploadProgress}%)` : `Upload ${files.length > 0 ? files.length : ''} Document${files.length !== 1 ? 's' : ''}`}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircle /> : <ErrorOutline />}
          sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MentorAddCourseDocument;