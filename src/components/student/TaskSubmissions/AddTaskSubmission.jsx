import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CloudUpload as CloudUploadIcon,
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import studentService from '../../../services/studentService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate } from '../../../utils/dateUtils';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', fontFamily: fontStack, fontSize: '0.88rem',
    '& fieldset': { borderColor: 'rgba(41,128,185,0.15)' },
    '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.30)' },
    '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root': { fontFamily: fontStack, fontSize: '0.88rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#2980b9' },
};

const cardSx = {
  borderRadius: '16px', bgcolor: '#fff',
  border: '1px solid rgba(41,128,185,0.08)',
  boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
  overflow: 'hidden', position: 'relative',
};

const AddTaskSubmission = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    title: '', description: '', submissionType: 'file', textContent: '', url: '', notes: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [isDraft, setIsDraft] = useState(false);
  const { loading, error, makeRequest } = useApi();

  useEffect(() => { if (taskId) fetchTaskDetails(); }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      await makeRequest(async () => {
        const data = await studentService.getTrainerTask(taskId);
        setTask(data);
        if (data.existingSubmission) {
          setSubmissionData({
            title: data.existingSubmission.title || '', description: data.existingSubmission.description || '',
            submissionType: data.existingSubmission.type || 'file', textContent: data.existingSubmission.textContent || '',
            url: data.existingSubmission.url || '', notes: data.existingSubmission.notes || '',
          });
          setAttachments(data.existingSubmission.attachments || []);
        }
      });
    } catch (error) { console.error('Error fetching task details:', error); }
  };

  const handleInputChange = (field, value) => setSubmissionData(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(), file, name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB', type: file.type, uploaded: false,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (attachmentId) => setAttachments(prev => prev.filter(att => att.id !== attachmentId));

  const handleSubmit = async (asDraft = false) => {
    try {
      setIsDraft(asDraft);
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('title', submissionData.title);
      formData.append('description', submissionData.description);
      formData.append('submissionType', submissionData.submissionType);
      formData.append('textContent', submissionData.textContent);
      formData.append('url', submissionData.url);
      formData.append('notes', submissionData.notes);
      formData.append('isDraft', asDraft);
      attachments.forEach((attachment) => { if (attachment.file) formData.append('attachments', attachment.file); });
      await makeRequest(async () => { await studentService.addTaskSubmission(formData); });
      navigate('/student/task-submissions');
    } catch (error) { console.error('Error submitting task:', error); }
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date(); const due = new Date(dueDate);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  if (loading) return <LoadingSpinner />;

  if (!task) {
    return (
      <Box sx={{ fontFamily: fontStack }}>
        <Typography sx={{ mb: 2, color: '#475569' }}>Task not found.</Typography>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#2980b9', borderRadius: '10px' }}>Go Back</Button>
      </Box>
    );
  }

  const daysRemaining = getDaysRemaining(task.dueDate);

  return (
    <Box sx={{ fontFamily: fontStack }}>

      {/* ═══ Header ═══ */}
      <Box sx={{
        p: 2.5, mb: 3, borderRadius: '16px',
        background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)',
        boxShadow: '0 4px 20px rgba(26,82,118,0.18)', position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <Box display="flex" alignItems="center" position="relative" zIndex={1}>
          <IconButton onClick={() => navigate(-1)} sx={{
            mr: 2, width: 42, height: 42, borderRadius: '11px', bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.20)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
          }}>
            <ArrowBackIcon sx={{ fontSize: 22 }} />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', fontFamily: fontStack }}>
              Submit Task: {task.title}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', fontFamily: fontStack }}>
              Complete and submit your assignment
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Due Date Alert */}
      {daysRemaining <= 3 && (
        <Alert severity={daysRemaining < 0 ? 'error' : daysRemaining <= 1 ? 'warning' : 'info'}
          sx={{ mb: 2, borderRadius: '12px', border: '1px solid', fontFamily: fontStack }}>
          {daysRemaining < 0 ? `This task is overdue by ${Math.abs(daysRemaining)} day(s)!`
            : daysRemaining === 0 ? 'This task is due today!'
            : `This task is due in ${daysRemaining} day(s).`}
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      <Grid container spacing={2.5}>
        {/* ═══ LEFT — Form ═══ */}
        <Grid item xs={12} md={8}>
          <Box display="flex" flexDirection="column" gap={2.5}>

            {/* Submission Details */}
            <Card sx={cardSx}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)' }} />
              <CardContent sx={{ p: 3, pt: 3.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                  <AssignmentIcon sx={{ color: '#2980b9', fontSize: 22 }} />
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>Submission Details</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Submission Title" value={submissionData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter a title for your submission" required sx={inputSx} />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth sx={inputSx}>
                      <InputLabel>Submission Type</InputLabel>
                      <Select value={submissionData.submissionType} label="Submission Type"
                        onChange={(e) => handleInputChange('submissionType', e.target.value)}
                        sx={{ borderRadius: '10px' }}>
                        <MenuItem value="file">File Upload</MenuItem>
                        <MenuItem value="text">Text Content</MenuItem>
                        <MenuItem value="url">URL/Link</MenuItem>
                        <MenuItem value="mixed">Mixed (Files + Text)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="Description" value={submissionData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your submission and approach" sx={inputSx} />
                  </Grid>
                  {(submissionData.submissionType === 'text' || submissionData.submissionType === 'mixed') && (
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={8} label="Text Content" value={submissionData.textContent}
                        onChange={(e) => handleInputChange('textContent', e.target.value)}
                        placeholder="Enter your submission content here..." sx={inputSx} />
                    </Grid>
                  )}
                  {(submissionData.submissionType === 'url' || submissionData.submissionType === 'mixed') && (
                    <Grid item xs={12}>
                      <TextField fullWidth label="URL/Link" value={submissionData.url}
                        onChange={(e) => handleInputChange('url', e.target.value)}
                        placeholder="https://example.com/your-work" sx={inputSx} />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} label="Additional Notes" value={submissionData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any additional notes or comments" sx={inputSx} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* File Upload */}
            {(submissionData.submissionType === 'file' || submissionData.submissionType === 'mixed') && (
              <Card sx={cardSx}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <AttachFileIcon sx={{ color: '#2980b9', fontSize: 22 }} />
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>File Attachments</Typography>
                  </Box>
                  <Box
                    sx={{
                      border: '2px dashed rgba(41,128,185,0.20)', borderRadius: '14px', p: 4, textAlign: 'center', mb: 2,
                      cursor: 'pointer', transition: 'all 0.2s ease', bgcolor: 'rgba(41,128,185,0.02)',
                      '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
                    }}
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    <CloudUploadIcon sx={{ fontSize: 44, color: '#2980b9', mb: 1, opacity: 0.6 }} />
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', mb: 0.5, fontFamily: fontStack }}>Click to upload files</Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack }}>or drag and drop your files here</Typography>
                    <input id="file-upload" type="file" multiple hidden onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.png,.ppt,.pptx" />
                  </Box>
                  {attachments.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a5276', mb: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Attached Files:</Typography>
                      <List disablePadding>
                        {attachments.map((attachment, index) => (
                          <React.Fragment key={attachment.id}>
                            <ListItem disableGutters sx={{ px: 1.5, py: 1, borderRadius: '10px', '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' } }}>
                              <ListItemIcon sx={{ minWidth: 36 }}><AttachFileIcon sx={{ color: '#2980b9', fontSize: 20 }} /></ListItemIcon>
                              <ListItemText
                                primary={attachment.name}
                                secondary={`${attachment.size} • ${attachment.type}`}
                                primaryTypographyProps={{ sx: { fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack } }}
                                secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: '#94a3b8', fontFamily: fontStack } }}
                              />
                              <IconButton onClick={() => removeAttachment(attachment.id)} sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.06)' } }}>
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </ListItem>
                            {index < attachments.length - 1 && <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)' }} />}
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined" startIcon={<SaveIcon sx={{ fontSize: '18px !important' }} />}
                onClick={() => handleSubmit(true)} disabled={!submissionData.title.trim()}
                sx={{
                  textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', borderRadius: '10px',
                  borderColor: 'rgba(41,128,185,0.20)', color: '#2980b9', px: 2.5, fontFamily: fontStack,
                  '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
                }}>
                Save as Draft
              </Button>
              <Button variant="contained" startIcon={<SendIcon sx={{ fontSize: '18px !important' }} />}
                onClick={() => handleSubmit(false)} disabled={!submissionData.title.trim()}
                sx={{
                  textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', px: 3, fontFamily: fontStack,
                  boxShadow: '0 4px 12px rgba(41,128,185,0.25)', '&:hover': { opacity: 0.9 },
                }}>
                Submit Final
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* ═══ RIGHT — Task Info Sidebar ═══ */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={2.5}>
            <Card sx={{ ...cardSx, position: 'sticky', top: 80 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', mb: 2, fontFamily: fontStack }}>Task Information</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', mb: 1, fontFamily: fontStack }}>{task.title}</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mb: 2.5, lineHeight: 1.6, fontFamily: fontStack }}>{task.description}</Typography>

                <Box mb={2}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.3 }}>Due Date</Typography>
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: daysRemaining < 0 ? '#ef4444' : '#0f172a', fontFamily: fontStack }}>{formatDate(task.dueDate)}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.5 }}>Priority</Typography>
                  <Chip label={task.priority?.toUpperCase()} size="small"
                    sx={{
                      height: 24, fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px', fontFamily: fontStack,
                      bgcolor: task.priority === 'high' ? 'rgba(239,68,68,0.10)' : task.priority === 'medium' ? 'rgba(245,158,11,0.10)' : 'rgba(13,148,136,0.10)',
                      color: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#0d9488',
                    }} />
                </Box>
                <Box mb={2}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.3 }}>Estimated Time</Typography>
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>{task.estimatedHours || 'Not specified'} hours</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Requirements */}
            {task.requirements && task.requirements.length > 0 && (
              <Card sx={cardSx}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', mb: 2, fontFamily: fontStack }}>Requirements</Typography>
                  <List dense disablePadding>
                    {task.requirements.map((req, i) => (
                      <ListItem key={i} disableGutters sx={{ px: 1, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}><DescriptionIcon sx={{ color: '#2980b9', fontSize: 18 }} /></ListItemIcon>
                        <ListItemText primary={req} primaryTypographyProps={{ sx: { fontSize: '0.85rem', color: '#475569', fontFamily: fontStack } }} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Deliverables */}
            {task.deliverables && task.deliverables.length > 0 && (
              <Card sx={cardSx}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', mb: 2, fontFamily: fontStack }}>Expected Deliverables</Typography>
                  <List dense disablePadding>
                    {task.deliverables.map((d, i) => (
                      <ListItem key={i} disableGutters sx={{ px: 1, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}><AssignmentIcon sx={{ color: '#0d9488', fontSize: 18 }} /></ListItemIcon>
                        <ListItemText primary={d.title} secondary={d.description}
                          primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack } }}
                          secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: '#94a3b8', fontFamily: fontStack } }} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Guidelines */}
            <Box sx={{
              p: 2.5, borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(41,128,185,0.06) 0%, rgba(13,148,136,0.04) 100%)',
              border: '1px solid rgba(41,128,185,0.10)',
            }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a5276', mb: 1.5, fontFamily: fontStack }}>Submission Guidelines:</Typography>
              <Box component="ul" sx={{ pl: 2, mb: 0, '& li': { fontSize: '0.82rem', color: '#475569', mb: 0.5, fontFamily: fontStack } }}>
                <li>Ensure all requirements are met</li>
                <li>Use clear and descriptive titles</li>
                <li>Include proper documentation</li>
                <li>Test your work before submission</li>
                <li>Save drafts frequently</li>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddTaskSubmission;