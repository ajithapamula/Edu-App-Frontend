// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Paper,
//   Typography,
//   Button,
//   TextField,
//   Alert,
//   Snackbar,
//   Card,
//   CardContent,
//   CardActions,
//   Chip,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   LinearProgress,
//   Divider,
// } from '@mui/material';
// import Grid from '@mui/material/Grid';
// import {
//   CloudUpload,
//   Assignment,
//   Visibility,
//   Delete,
//   AttachFile,
//   Close,
//   CheckCircle,
//   Warning,
//   Upload,
//   Person,
//   Search,
//   BugReport,
// } from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom';
// import LoadingSpinner from '../../common/LoadingSpinner';
// import { taskSubmissionsAPI } from '../../../services/API/studenttask';

// const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

// const inputSx = {
//   '& .MuiOutlinedInput-root': {
//     borderRadius: '10px', fontFamily: fontStack, fontSize: '0.88rem',
//     '& fieldset': { borderColor: 'rgba(41,128,185,0.15)' },
//     '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.30)' },
//     '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
//   },
//   '& .MuiInputLabel-root': { fontFamily: fontStack, fontSize: '0.88rem' },
//   '& .MuiInputLabel-root.Mui-focused': { color: '#2980b9' },
// };

// const cardSx = {
//   borderRadius: '16px', bgcolor: '#fff',
//   border: '1px solid rgba(41,128,185,0.08)',
//   boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
//   height: '100%', display: 'flex', flexDirection: 'column',
//   transition: 'all 0.2s ease',
//   '&:hover': { boxShadow: '0 4px 24px rgba(26,82,118,0.10)', transform: 'translateY(-1px)' },
// };

// const TaskSubmissionPage = () => {
//   const [submissions, setSubmissions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
//   const [formData, setFormData] = useState({ Student_ID: '', Task_Submit: null });
//   const [studentLoading, setStudentLoading] = useState(false);
//   const [studentFound, setStudentFound] = useState(null);
//   const [studentName, setStudentName] = useState('');
//   const [debugInfo, setDebugInfo] = useState(null);
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
//   const navigate = useNavigate();

//   const debugSubmission = async () => {
//     try {
//       const studentsResponse = await fetch('/api/debug/students', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
//       if (studentsResponse.ok) {
//         const studentsData = await studentsResponse.json();
//         setDebugInfo(studentsData);
//         setSnackbar({ open: true, message: `Found ${studentsData.total_students} students in database.`, severity: 'info' });
//       } else {
//         setSnackbar({ open: true, message: 'Debug endpoint not available.', severity: 'warning' });
//       }
//     } catch (error) {
//       setSnackbar({ open: true, message: 'Debug failed. Check console.', severity: 'error' });
//     }
//   };

//   const fetchSubmissions = async () => {
//     try {
//       setLoading(true);
//       const response = await taskSubmissionsAPI.getAll();
//       let subs = [];
//       if (Array.isArray(response)) subs = response;
//       else if (response && Array.isArray(response.data)) subs = response.data;
//       else if (response && typeof response === 'object') subs = [response];
//       setSubmissions(subs);
//     } catch (error) {
//       setSnackbar({ open: true, message: `Error loading submissions: ${error.message}`, severity: 'error' });
//       setSubmissions([]);
//     } finally { setLoading(false); }
//   };

//   const fetchStudentName = async (studentId) => {
//     if (!studentId.trim()) { setStudentName(''); setStudentFound(null); return; }
//     try {
//       setStudentLoading(true); setStudentFound(null);
//       try {
//         const response = await fetch(`/api/get-student-name/${studentId}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
//         if (response.ok) {
//           const contentType = response.headers.get('content-type');
//           if (contentType && contentType.includes('application/json')) {
//             const data = await response.json();
//             const name = data.student_name || data.name || '';
//             if (name) { setStudentName(name); setStudentFound(true); return; }
//           }
//         }
//       } catch (e) { /* fallback */ }
//       try {
//         const existing = await taskSubmissionsAPI.getById(studentId);
//         if (existing && existing.Student_Name) { setStudentName(existing.Student_Name); setStudentFound(true); return; }
//       } catch (e) { /* fallback */ }
//       setStudentName(''); setStudentFound(false);
//     } catch (error) { setStudentName(''); setStudentFound(false); }
//     finally { setStudentLoading(false); }
//   };

//   const useDebounce = (callback, delay) => {
//     const timeoutRef = React.useRef(null);
//     return React.useCallback((...args) => { clearTimeout(timeoutRef.current); timeoutRef.current = setTimeout(() => callback(...args), delay); }, [callback, delay]);
//   };
//   const debouncedFetchStudentName = useDebounce(fetchStudentName, 800);

//   const handleStudentIdChange = (value) => { setFormData(prev => ({ ...prev, Student_ID: value })); debouncedFetchStudentName(value); };

//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'];
//       if (!allowedTypes.includes(file.type)) { setSnackbar({ open: true, message: 'Invalid file type.', severity: 'error' }); return; }
//       if (file.size > 5 * 1024 * 1024) { setSnackbar({ open: true, message: 'File size exceeds 5MB limit.', severity: 'error' }); return; }
//       setFormData(prev => ({ ...prev, Task_Submit: file }));
//     }
//   };

//   const handleSubmitTask = async () => {
//     try {
//       if (!formData.Student_ID.trim()) { setSnackbar({ open: true, message: 'Please enter your Student ID', severity: 'error' }); return; }
//       if (!formData.Task_Submit) { setSnackbar({ open: true, message: 'Please select a file to submit', severity: 'error' }); return; }
//       setSubmitting(true); setUploadProgress(0);
//       const submissionData = new FormData();
//       submissionData.append('Student_ID', formData.Student_ID.trim());
//       submissionData.append('Task_Submit', formData.Task_Submit);
//       const progressInterval = setInterval(() => { setUploadProgress(prev => { if (prev >= 90) { clearInterval(progressInterval); return 90; } return prev + 10; }); }, 200);
//       await taskSubmissionsAPI.add(submissionData);
//       clearInterval(progressInterval); setUploadProgress(100);
//       setSnackbar({ open: true, message: 'Task submitted successfully!', severity: 'success' });
//       setFormData({ Student_ID: '', Task_Submit: null }); setStudentName(''); setStudentFound(null);
//       setOpenSubmitDialog(false); await fetchSubmissions();
//     } catch (error) {
//       let msg = 'Failed to submit task.';
//       if (error.message.includes('Invalid or non-existent Student_ID')) msg = `Student ID "${formData.Student_ID}" not found.`;
//       setSnackbar({ open: true, message: msg, severity: 'error' });
//     } finally { setSubmitting(false); setUploadProgress(0); }
//   };

//   const handleViewSubmission = (studentId) => navigate(`/student/task-submissions/view/${studentId}`);

//   const handleDeleteSubmission = async (studentId) => {
//     if (window.confirm('Are you sure you want to delete this submission?')) {
//       try {
//         await taskSubmissionsAPI.remove(studentId);
//         setSnackbar({ open: true, message: 'Submission deleted successfully', severity: 'success' });
//         fetchSubmissions();
//       } catch (error) { setSnackbar({ open: true, message: 'Failed to delete submission', severity: 'error' }); }
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
//   };

//   const getFileIcon = (fileName) => {
//     if (!fileName) return <AttachFile sx={{ color: '#94a3b8' }} />;
//     const ext = fileName.split('.').pop()?.toLowerCase();
//     const colorMap = { pdf: '#ef4444', doc: '#2980b9', docx: '#2980b9', xls: '#0d9488', xlsx: '#0d9488', jpg: '#f59e0b', jpeg: '#f59e0b', png: '#f59e0b' };
//     return <AttachFile sx={{ color: colorMap[ext] || '#94a3b8' }} />;
//   };

//   const getFileName = (filePath) => { if (!filePath) return 'No file'; return filePath.includes('/') ? filePath.split('/').pop() : filePath; };
//   const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

//   useEffect(() => { fetchSubmissions(); }, []);

//   if (loading) return <LoadingSpinner message="Loading task submissions..." />;

//   return (
//     <Box sx={{ fontFamily: fontStack }}>
//       {/* Header */}
//       <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
//         <Box display="flex" alignItems="center" gap={1.5}>
//           <Box sx={{ width: 38, height: 38, borderRadius: '11px', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//             <Assignment sx={{ color: '#fff', fontSize: 20 }} />
//           </Box>
//           <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>Task Submissions</Typography>
//         </Box>
//         <Button variant="contained" startIcon={<Upload sx={{ fontSize: '18px !important' }} />}
//           onClick={() => setOpenSubmitDialog(true)}
//           sx={{
//             textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', borderRadius: '10px',
//             background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', px: 2.5, fontFamily: fontStack,
//             boxShadow: '0 4px 12px rgba(41,128,185,0.25)', '&:hover': { opacity: 0.9 },
//           }}>
//           Submit New Task
//         </Button>
//       </Box>

//       {/* Debug Info */}
//       {debugInfo && (
//         <Box sx={{ p: 2.5, mb: 3, borderRadius: '14px', bgcolor: 'rgba(41,128,185,0.04)', border: '1px solid rgba(41,128,185,0.10)' }}>
//           <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', mb: 1, fontFamily: fontStack }}>Debug Information</Typography>
//           <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack }}><strong>Total Students:</strong> {debugInfo.total_students}</Typography>
//           <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack }}><strong>Sample IDs:</strong> {debugInfo.students?.map(s => s.ID).join(', ')}</Typography>
//         </Box>
//       )}

//       {/* Submissions */}
//       {submissions.length === 0 ? (
//         <Box sx={{ p: 5, textAlign: 'center', borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
//           <Assignment sx={{ fontSize: 52, color: '#cbd5e1', mb: 1.5 }} />
//           <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5, fontFamily: fontStack }}>No Task Submissions Yet</Typography>
//           <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mb: 2.5, fontFamily: fontStack }}>Click "Submit New Task" to get started.</Typography>
//           <Button variant="contained" startIcon={<Upload />} onClick={() => setOpenSubmitDialog(true)}
//             sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', fontFamily: fontStack }}>
//             Submit Your First Task
//           </Button>
//         </Box>
//       ) : (
//         <Grid container spacing={2.5}>
//           {submissions.map((submission, index) => (
//             <Grid item xs={12} md={6} lg={4} key={submission.Student_ID || index}>
//               <Card sx={cardSx}>
//                 <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
//                   <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
//                     <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>{submission.Student_Name || 'Unknown Student'}</Typography>
//                     <Chip icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} label="Submitted" size="small"
//                       sx={{ height: 24, fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px', bgcolor: 'rgba(13,148,136,0.10)', color: '#0d9488', '& .MuiChip-icon': { color: '#0d9488' } }} />
//                   </Box>
//                   <Box display="flex" flexDirection="column" gap={0.8}>
//                     <Box display="flex" alignItems="center" gap={0.8}>
//                       <Person sx={{ fontSize: 16, color: '#94a3b8' }} />
//                       <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack }}><strong>ID:</strong> {submission.Student_ID}</Typography>
//                     </Box>
//                     <Box display="flex" alignItems="center" gap={0.8}>
//                       <Person sx={{ fontSize: 16, color: '#94a3b8' }} />
//                       <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack }}><strong>Name:</strong> {submission.Student_Name || 'N/A'}</Typography>
//                     </Box>
//                     <Box display="flex" alignItems="center" gap={0.8}>
//                       {getFileIcon(submission.Task_Submit)}
//                       <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack }}><strong>File:</strong> {getFileName(submission.Task_Submit)}</Typography>
//                     </Box>
//                     {submission.created_at && (
//                       <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}><strong>Submitted:</strong> {formatDate(submission.created_at)}</Typography>
//                     )}
//                   </Box>
//                   {submission.grade && (
//                     <Alert severity="success" sx={{ mt: 2, borderRadius: '10px', py: 0.5, '& .MuiAlert-message': { fontSize: '0.82rem' } }}>
//                       <strong>Grade:</strong> {submission.grade}
//                     </Alert>
//                   )}
//                 </CardContent>
//                 <CardActions sx={{ px: 2.5, pb: 2, pt: 0 }}>
//                   <Button variant="outlined" startIcon={<Visibility sx={{ fontSize: '16px !important' }} />} size="small"
//                     onClick={() => handleViewSubmission(submission.Student_ID)}
//                     sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', borderRadius: '8px', borderColor: 'rgba(41,128,185,0.20)', color: '#2980b9', '&:hover': { borderColor: '#2980b9' } }}>
//                     View Details
//                   </Button>
//                   <IconButton size="small" onClick={() => handleDeleteSubmission(submission.Student_ID)}
//                     sx={{ color: '#ef4444', ml: 'auto', '&:hover': { bgcolor: 'rgba(239,68,68,0.06)' } }}>
//                     <Delete sx={{ fontSize: 18 }} />
//                   </IconButton>
//                 </CardActions>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>
//       )}

//       {/* Submit Dialog */}
//       <Dialog open={openSubmitDialog} onClose={() => !submitting && setOpenSubmitDialog(false)} maxWidth="sm" fullWidth
//         PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
//         <Box sx={{ height: '3px', background: 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)' }} />
//         <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: fontStack, color: '#0f172a' }}>Submit New Task</DialogTitle>
//         <DialogContent>
//           <Box sx={{ pt: 1 }}>
//             <Alert severity="info" sx={{ mb: 2.5, borderRadius: '12px', border: '1px solid rgba(41,128,185,0.15)', '& .MuiAlert-message': { fontSize: '0.82rem', fontFamily: fontStack } }}>
//               <strong>Requirements:</strong> Student ID, File (PDF/Word/Excel/Image, max 5MB)
//             </Alert>
//             <TextField label="Student ID" value={formData.Student_ID} onChange={(e) => handleStudentIdChange(e.target.value)}
//               fullWidth required margin="normal" placeholder="Enter your Student ID" disabled={submitting} sx={inputSx}
//               InputProps={{
//                 endAdornment: studentLoading ? <Search sx={{ color: '#94a3b8' }} /> : studentFound === true ? <CheckCircle sx={{ color: '#0d9488' }} /> : studentFound === false ? <Warning sx={{ color: '#f59e0b' }} /> : null
//               }}
//               helperText={studentFound === false ? 'Student ID not found (you can still submit)' : studentFound === true ? `Student found: ${studentName}` : 'Enter Student ID'} />
//             <TextField label="Student Name" value={studentName} fullWidth margin="normal" disabled placeholder="Auto-filled" sx={inputSx}
//               InputProps={{ readOnly: true }}
//               helperText="Auto-fetched from database"
//               FormHelperTextProps={{ sx: { fontFamily: fontStack } }} />
//             <Box mt={2.5}>
//               <Button variant="outlined" component="label" startIcon={<CloudUpload />} fullWidth disabled={submitting}
//                 sx={{
//                   mb: 2, py: 2, borderRadius: '12px', textTransform: 'none', fontWeight: 600, fontSize: '0.88rem',
//                   borderColor: 'rgba(41,128,185,0.20)', color: '#2980b9', fontFamily: fontStack,
//                   borderStyle: 'dashed', '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
//                 }}>
//                 {formData.Task_Submit ? 'Change File' : 'Choose Task File'}
//                 <input type="file" hidden onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
//               </Button>
//               {formData.Task_Submit && (
//                 <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(41,128,185,0.04)', border: '1px solid rgba(41,128,185,0.08)' }}>
//                   <Box display="flex" alignItems="center" justifyContent="space-between">
//                     <Box display="flex" alignItems="center" gap={1}>
//                       {getFileIcon(formData.Task_Submit.name)}
//                       <Box>
//                         <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>{formData.Task_Submit.name}</Typography>
//                         <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>{(formData.Task_Submit.size / 1024 / 1024).toFixed(2)} MB</Typography>
//                       </Box>
//                     </Box>
//                     <IconButton size="small" onClick={() => setFormData(prev => ({ ...prev, Task_Submit: null }))} disabled={submitting} sx={{ color: '#94a3b8' }}>
//                       <Close sx={{ fontSize: 18 }} />
//                     </IconButton>
//                   </Box>
//                 </Box>
//               )}
//             </Box>
//             {submitting && (
//               <Box mt={2}>
//                 <Typography sx={{ fontSize: '0.82rem', color: '#475569', mb: 0.5, fontFamily: fontStack }}>Uploading... {uploadProgress}%</Typography>
//                 <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 4, height: 6, bgcolor: 'rgba(41,128,185,0.10)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #2980b9, #0d9488)', borderRadius: 4 } }} />
//               </Box>
//             )}
//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2.5 }}>
//           <Button onClick={debugSubmission} color="info" variant="outlined" startIcon={<BugReport />} sx={{ mr: 'auto', textTransform: 'none', borderRadius: '10px', fontSize: '0.82rem' }} disabled={submitting}>Debug</Button>
//           <Button onClick={() => setOpenSubmitDialog(false)} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', color: '#64748b' }}>Cancel</Button>
//           <Button variant="contained" onClick={handleSubmitTask} disabled={submitting || !formData.Student_ID.trim() || !formData.Task_Submit || studentLoading}
//             startIcon={submitting ? null : <Upload />}
//             sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', px: 3, fontFamily: fontStack, '&:hover': { opacity: 0.9 } }}>
//             {submitting ? 'Submitting...' : 'Submit Task'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
//         <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>{snackbar.message}</Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default TaskSubmissionPage;



import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Divider,
  Skeleton,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Assignment,
  Visibility,
  Delete,
  AttachFile,
  CheckCircle,
  Person,
  Upload,
  ArrowForward,
  Schedule,
  Group,
  InsertDriveFile,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/LoadingSpinner';
import { taskSubmissionsAPI } from '../../../services/API/studenttask';
import { useAuth } from '../../../hooks/useAuth';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

const cardSx = {
  borderRadius: '16px', bgcolor: '#fff',
  border: '1px solid rgba(41,128,185,0.08)',
  boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
  height: '100%', display: 'flex', flexDirection: 'column',
  transition: 'all 0.2s ease',
  '&:hover': { boxShadow: '0 4px 24px rgba(26,82,118,0.10)', transform: 'translateY(-1px)' },
};

const TaskSubmissionPage = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const studentId = user?.id || user?.studentId || user?.student_id || user?.ID;

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);

      // Try fetching student's own submissions first
      if (studentId) {
        try {
          const response = await taskSubmissionsAPI.getMySubmissions(studentId);
          if (response && response.submissions && Array.isArray(response.submissions)) {
            setSubmissions(response.submissions);
            return;
          }
        } catch (err) {
          console.log('getMySubmissions failed, falling back to getAll:', err.message);
        }
      }

      // Fallback to getAll
      const response = await taskSubmissionsAPI.getAll();
      let subs = [];
      if (Array.isArray(response)) subs = response;
      else if (response && Array.isArray(response.data)) subs = response.data;
      else if (response && typeof response === 'object') subs = [response];

      // Filter to only this student's submissions if possible
      if (studentId) {
        const filtered = subs.filter(s => String(s.Student_ID) === String(studentId));
        setSubmissions(filtered.length > 0 ? filtered : subs);
      } else {
        setSubmissions(subs);
      }
    } catch (error) {
      setSnackbar({ open: true, message: `Error loading submissions: ${error.message}`, severity: 'error' });
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = (submissionId) => {
    navigate(`/student/task-submissions/view/${submissionId}`);
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await taskSubmissionsAPI.remove(submissionId, studentId);
        setSnackbar({ open: true, message: 'Submission deleted successfully', severity: 'success' });
        fetchSubmissions();
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete submission', severity: 'error' });
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
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

  if (loading) return <LoadingSpinner message="Loading task submissions..." />;

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 38, height: 38, borderRadius: '11px',
            background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Assignment sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Task Submissions
            </Typography>
            {submissions.length > 0 && (
              <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<ArrowForward sx={{ fontSize: '18px !important' }} />}
          onClick={() => navigate('/student/tasks')}
          sx={{
            textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', borderRadius: '10px',
            background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', px: 2.5, fontFamily: fontStack,
            boxShadow: '0 4px 12px rgba(41,128,185,0.25)', '&:hover': { opacity: 0.9 },
          }}
        >
          Go to Tasks
        </Button>
      </Box>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Box sx={{
          p: 5, textAlign: 'center', borderRadius: '16px', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
        }}>
          <Assignment sx={{ fontSize: 52, color: '#cbd5e1', mb: 1.5 }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5, fontFamily: fontStack }}>
            No Task Submissions Yet
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mb: 2.5, fontFamily: fontStack }}>
            Go to Trainer Tasks, view a task, and submit your work from there.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowForward />}
            onClick={() => navigate('/student/tasks')}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: '10px',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              fontFamily: fontStack,
            }}
          >
            View Trainer Tasks
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {submissions.map((submission, index) => {
            // Support both API response shapes
            const submissionId = submission.Submission_ID || submission.ID || submission.id;
            const taskId = submission.Task_ID || submission.task_id;
            const studentName = submission.Student_Name || submission.student_name || user?.name || 'You';
            const fileName = submission.Task_Submit || submission.file || submission.file_name;
            const submittedAt = submission.created_at || submission.submitted_at || submission.Submitted_At;
            const grade = submission.grade || submission.Grade;
            const batchId = submission.Batch_ID || submission.batch_id;
            const sessionId = submission.Session_ID || submission.session_id;
            const taskContent = submission.Task_Box || submission.task_content;

            return (
              <Grid item xs={12} md={6} lg={4} key={submissionId || index}>
                <Card sx={cardSx}>
                  {/* Top color bar */}
                  <Box sx={{ height: '3px', background: 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)' }} />
                  <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                    {/* Header row */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '8px',
                          background: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Assignment sx={{ color: '#fff', fontSize: 16 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                            {taskId ? `Task #${taskId}` : `Submission #${submissionId || index + 1}`}
                          </Typography>
                          {sessionId && (
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>
                              Session {sessionId}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                        label="Submitted"
                        size="small"
                        sx={{
                          height: 24, fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px',
                          bgcolor: 'rgba(13,148,136,0.10)', color: '#0d9488',
                          '& .MuiChip-icon': { color: '#0d9488' },
                        }}
                      />
                    </Box>

                    {/* Task content preview */}
                    {taskContent && (
                      <Typography sx={{
                        fontSize: '0.82rem', color: '#475569', mb: 2,
                        fontFamily: fontStack, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {taskContent}
                      </Typography>
                    )}

                    <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 1.5 }} />

                    {/* Details */}
                    <Box display="flex" flexDirection="column" gap={0.8}>
                      {batchId && (
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Group sx={{ fontSize: 16, color: '#94a3b8' }} />
                          <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack }}>
                            <strong>Batch:</strong> {batchId}
                          </Typography>
                        </Box>
                      )}
                      <Box display="flex" alignItems="center" gap={0.8}>
                        {getFileIcon(fileName)}
                        <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontFamily: fontStack, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong>File:</strong> {getFileName(fileName)}
                        </Typography>
                      </Box>
                      {submittedAt && (
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Schedule sx={{ fontSize: 16, color: '#94a3b8' }} />
                          <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
                            {formatDate(submittedAt)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Grade */}
                    {grade && (
                      <Alert severity="success" sx={{ mt: 2, borderRadius: '10px', py: 0.5, '& .MuiAlert-message': { fontSize: '0.82rem' } }}>
                        <strong>Grade:</strong> {grade}
                      </Alert>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 2.5, pb: 2, pt: 0 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility sx={{ fontSize: '16px !important' }} />}
                      size="small"
                      onClick={() => handleViewSubmission(submissionId)}
                      sx={{
                        textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                        borderRadius: '8px', borderColor: 'rgba(41,128,185,0.20)', color: '#2980b9',
                        fontFamily: fontStack,
                        '&:hover': { borderColor: '#2980b9' },
                      }}
                    >
                      View Details
                    </Button>
                    {taskId && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate(`/student/tasks/view/${taskId}`)}
                        sx={{
                          textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                          borderRadius: '8px', color: '#0d9488', fontFamily: fontStack,
                          '&:hover': { bgcolor: 'rgba(13,148,136,0.06)' },
                        }}
                      >
                        View Task
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSubmission(submissionId)}
                      sx={{ color: '#ef4444', ml: 'auto', '&:hover': { bgcolor: 'rgba(239,68,68,0.06)' } }}
                    >
                      <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskSubmissionPage;