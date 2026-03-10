import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import {
  Upload,
  CloudUpload,
  Close,
  ArrowBack,
  Assignment,
  AttachFile,
  Description,
  UploadFile,
  Delete,
  Info,
  CheckCircle
} from '@mui/icons-material';

/* ── inject fonts ── */
const _style = document.getElementById('ts-add-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'ts-add-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes tsaFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(s);
  return s;
})();

const hFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const crd = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', background: '#f8fafc',
    '& fieldset': { borderColor: '#e8ecf2' }, '&:hover fieldset': { borderColor: '#bfdbfe' },
    '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root': { fontFamily: '"DM Sans", sans-serif', color: '#64748b' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0ea5e9' },
  '& .MuiFormHelperText-root': { fontFamily: '"DM Sans", sans-serif' },
};
const accentBtn = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', color: '#fff',
  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.85rem',
  textTransform: 'none', borderRadius: '10px', px: 3, py: 1.2,
  boxShadow: '0 4px 14px rgba(14,165,233,0.25)', border: 'none',
  '&:hover': { background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)', boxShadow: '0 6px 20px rgba(14,165,233,0.30)', transform: 'translateY(-1px)' },
  transition: 'all 0.3s ease',
};

const MentorAddTaskSubmission = ({ onBack, onSave, taskId }) => {
  const [formData, setFormData] = useState({ taskId: taskId || '', submissionText: '', timeSpent: '', notes: '' });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tasks, setTasks] = useState([
    { id: 1, title: 'React Components Tutorial', dueDate: '2024-12-20' },
    { id: 2, title: 'Database Design Review', dueDate: '2024-12-18' },
    { id: 3, title: 'API Workshop Materials', dueDate: '2024-12-22' },
    { id: 4, title: 'Course Documentation Update', dueDate: '2024-12-25' }
  ]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) { setErrors(prev => ({ ...prev, [field]: '' })); }
  };

  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const newAttachments = selectedFiles.map(file => ({ file, name: file.name, size: file.size, type: file.type, id: Date.now() + Math.random() }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (attachmentId) => { setAttachments(prev => prev.filter(a => a.id !== attachmentId)); };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.taskId) newErrors.taskId = 'Please select a task';
    if (!formData.submissionText.trim()) newErrors.submissionText = 'Submission description is required';
    if (!formData.timeSpent.trim()) newErrors.timeSpent = 'Time spent is required';
    if (attachments.length === 0) newErrors.attachments = 'At least one attachment is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setUploading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const submissionData = { ...formData, attachments: attachments.map(att => ({ name: att.name, size: att.size, type: att.type })), submissionDate: new Date().toISOString(), status: 'submitted', submitter: 'Current User' };
      onSave && onSave(submissionData);
    } catch (error) { setErrors({ submit: 'Failed to submit. Please try again.' }); }
    finally { setUploading(false); }
  };

  const formatFileSize = (bytes) => { if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; };

  const getFileTypeColor = (type) => {
    if (type.includes('pdf')) return '#ef4444'; if (type.includes('image')) return '#0ea5e9';
    if (type.includes('video')) return '#7b1fa2'; if (type.includes('zip')) return '#0d9488';
    return '#64748b';
  };

  const selectedTask = tasks.find(task => task.id.toString() === formData.taskId);

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, animation: 'tsaFadeUp 0.5s ease-out both' }}>
        <IconButton onClick={onBack} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease' }}>
          <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
        </IconButton>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
          <UploadFile sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography sx={{ ...hFont, fontSize: { xs: '1.3rem', md: '1.55rem' }, lineHeight: 1.2 }}>Submit Task</Typography>
          <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>Upload your work and provide submission details</Typography>
        </Box>
      </Box>

      {uploading && (
        <Box sx={{ mb: 2.5 }}>
          <Alert severity="info" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', mb: 1 }}>Submitting your work... Please wait.</Alert>
          <LinearProgress sx={{ borderRadius: 3, height: 5, '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg, #0ea5e9, #0d9488)' } }} />
        </Box>
      )}
      {errors.submit && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>{errors.submit}</Alert>}

      <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', md: 'row' }, animation: 'tsaFadeUp 0.5s ease-out 0.1s both' }}>
        {/* Left – Form */}
        <Box sx={{ flex: '1 1 62%', minWidth: 0 }}>
          <Paper elevation={0} sx={{ ...crd, p: 3 }}>
            <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Assignment sx={{ color: '#0ea5e9', fontSize: 18 }} />
              </Box>
              Submission Details
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.taskId} sx={inputSx}>
                  <InputLabel>Select Task</InputLabel>
                  <Select value={formData.taskId} label="Select Task" onChange={(e) => handleInputChange('taskId', e.target.value)}
                    disabled={uploading || taskId} sx={{ borderRadius: '10px', background: '#f8fafc', '& fieldset': { borderColor: errors.taskId ? '#ef4444' : '#e8ecf2' }, '&:hover fieldset': { borderColor: '#bfdbfe' }, '&.Mui-focused fieldset': { borderColor: '#0ea5e9' } }}>
                    {tasks.map((task) => (
                      <MenuItem key={task.id} value={task.id.toString()}>
                        <Box><Typography sx={{ ...bFont, fontSize: '0.88rem', fontWeight: 500, color: '#0f172a' }}>{task.title}</Typography>
                          <Typography sx={{ ...bFont, fontSize: '0.74rem', color: '#94a3b8' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</Typography></Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.taskId && <Typography sx={{ ...bFont, fontSize: '0.74rem', color: '#ef4444', mt: 0.5, ml: 1.5 }}>{errors.taskId}</Typography>}
                </FormControl>
              </Grid>

              {selectedTask && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, borderRadius: '10px', background: '#f0f4ff', border: '1px solid #dbeafe' }}>
                    <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#1e3a8a' }}>
                      <strong>Task:</strong> {selectedTask.title} &nbsp;·&nbsp; <strong>Due:</strong> {new Date(selectedTask.dueDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField fullWidth multiline rows={6} label="Submission Description" value={formData.submissionText}
                  onChange={(e) => handleInputChange('submissionText', e.target.value)} error={!!errors.submissionText}
                  helperText={errors.submissionText || 'Describe what you have completed'} disabled={uploading} sx={inputSx} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Time Spent" value={formData.timeSpent}
                  onChange={(e) => handleInputChange('timeSpent', e.target.value)} error={!!errors.timeSpent}
                  helperText={errors.timeSpent || 'e.g., 5 hours, 2 days'} disabled={uploading} placeholder="e.g., 5 hours" sx={inputSx} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Additional Notes (Optional)" value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)} disabled={uploading}
                  placeholder="Any additional information or challenges faced..." sx={inputSx} />
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Right – Uploads & Guidelines */}
        <Box sx={{ flex: '1 1 38%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Upload */}
          <Paper elevation={0} sx={{ ...crd, p: 3 }}>
            <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AttachFile sx={{ color: '#0d9488', fontSize: 18 }} />
              </Box>
              Attachments
            </Typography>

            <Box sx={{
              border: `2px dashed ${errors.attachments ? '#fecaca' : '#bfdbfe'}`, borderRadius: '12px', p: 3, textAlign: 'center',
              background: errors.attachments ? 'rgba(239,68,68,0.02)' : 'linear-gradient(135deg, rgba(14,165,233,0.02), rgba(13,148,136,0.02))',
              cursor: 'pointer', transition: 'all 0.3s ease',
              '&:hover': { borderColor: '#0ea5e9', background: 'rgba(14,165,233,0.04)' },
            }} onClick={() => document.getElementById('file-upload').click()}>
              <input id="file-upload" type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
              <Box sx={{ width: 48, height: 48, borderRadius: '12px', mx: 'auto', mb: 1.5, background: 'rgba(14,165,233,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloudUpload sx={{ color: '#0ea5e9', fontSize: 24 }} />
              </Box>
              <Typography sx={{ ...hFont, fontSize: '0.95rem', mb: 0.3 }}>Upload Files</Typography>
              <Typography sx={{ ...bFont, fontSize: '0.78rem', color: '#94a3b8' }}>Drop files here or click to browse</Typography>
            </Box>
            {errors.attachments && <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.82rem' }}>{errors.attachments}</Alert>}

            {attachments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ ...hFont, fontSize: '0.88rem', mb: 1.5 }}>Attached Files ({attachments.length})</Typography>
                {attachments.map((att) => (
                  <Box key={att.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 1, borderRadius: '10px',
                    background: '#f8fafc', border: '1px solid #f1f5f9',
                    transition: 'all 0.2s ease', '&:hover': { borderColor: '#dbeafe', background: '#f0f4ff' },
                  }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: `${getFileTypeColor(att.type)}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Description sx={{ color: getFileTypeColor(att.type), fontSize: 16 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ ...bFont, fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8' }}>{formatFileSize(att.size)}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => removeAttachment(att.id)} disabled={uploading} sx={{ width: 28, height: 28, borderRadius: '6px', color: '#ef4444', '&:hover': { background: 'rgba(239,68,68,0.08)' } }}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>

          {/* Guidelines */}
          <Paper elevation={0} sx={{ ...crd, p: 3 }}>
            <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(30,58,138,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info sx={{ color: '#1e3a8a', fontSize: 18 }} />
              </Box>
              Submission Guidelines
            </Typography>
            <Typography sx={{ ...hFont, fontSize: '0.82rem', mb: 1 }}>Required Items:</Typography>
            {['Detailed description of completed work', 'All deliverable files', 'Accurate time tracking'].map((t, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1} sx={{ mb: 0.8 }}>
                <CheckCircle sx={{ fontSize: 15, color: '#0d9488' }} />
                <Typography sx={{ ...bFont, fontSize: '0.82rem' }}>{t}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />
            <Typography sx={{ ...hFont, fontSize: '0.82rem', mb: 1 }}>Tips for Success:</Typography>
            {['Be specific about what you accomplished', 'Include screenshots or examples when relevant', 'Note any challenges or learnings'].map((t, i) => (
              <Box key={i} display="flex" alignItems="flex-start" gap={1} sx={{ mb: 0.8 }}>
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: '#0ea5e9', mt: 0.8, flexShrink: 0 }} />
                <Typography sx={{ ...bFont, fontSize: '0.82rem' }}>{t}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>

      {/* Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end', animation: 'tsaFadeUp 0.5s ease-out 0.2s both' }}>
        <Button onClick={onBack} disabled={uploading} sx={{
          fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none',
          borderRadius: '10px', color: '#64748b', border: '1.5px solid #e8ecf2', px: 3, py: 1,
          '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' }, transition: 'all 0.3s ease',
        }}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={uploading} variant="contained" disableElevation startIcon={uploading ? null : <Upload />} sx={accentBtn}>
          {uploading ? 'Submitting...' : 'Submit Task'}
        </Button>
      </Box>
    </Box>
  );
};

export default MentorAddTaskSubmission;