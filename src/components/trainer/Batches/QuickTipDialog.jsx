// src/components/trainer/Batches/TrainerQuickTipDialog.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  Close,
  LightbulbOutlined,
  Send,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  TipsAndUpdates,
  FormatQuote,
} from '@mui/icons-material';
import { apiRequest } from '../../../services/API/index';

/* ── Helper: get user context from localStorage (same pattern as batches.js) ── */
const getUserContext = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) throw new Error('User not authenticated');
  const user = JSON.parse(userStr);
  const userId = user.id || user.Id || user.ID;
  if (!userId) throw new Error('User ID not found in session');
  const orgId = user.orgId || user.Org_Id || user.org_id || user.Org_ID || user.OrgId;
  if (!orgId) throw new Error('Organization ID not found in user session');
  return { userId, orgId };
};

/* ── inject keyframes once ── */
const _tqtStyles = document.getElementById('tqt-dialog-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'tqt-dialog-styles';
  s.textContent = `
    @keyframes tqtSlideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ── tokens ── */
const headingFont = {
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontWeight: 700,
  color: '#0f172a',
  letterSpacing: '-0.02em',
};
const bodyFont = {
  fontFamily: '"DM Sans", sans-serif',
  color: '#475569',
};

/* ═══════════════════ COMPONENT ═══════════════════ */
const TrainerQuickTipDialog = ({ open, onClose, batch }) => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTipText, setNewTipText] = useState('');
  const [editingTipId, setEditingTipId] = useState(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const batchId = batch?.Batch_ID;
  const batchCode = batch?.Batch_Code || '';

  /* ── Fetch tips ── */
  const fetchTips = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const { userId } = getUserContext();
      const data = await apiRequest(`/api/trainer/batch/tips/${userId}/${batchId}`, {
        method: 'GET',
      });
      setTips(Array.isArray(data.Tips) ? data.Tips : []);
    } catch (err) {
      console.error('Fetch trainer tips error:', err);
      setError(err.message || 'Failed to load tips');
      setTips([]);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (open && batchId) {
      fetchTips();
      setNewTipText('');
      setEditingTipId(null);
      setEditText('');
      setDeleteConfirmId(null);
    }
  }, [open, fetchTips, batchId]);

  /* ── Create tip ── */
  const handleCreateTip = async () => {
    const text = newTipText.trim();
    if (!text) return;
    if (text.length > 1000) {
      setError('Tip must be 1000 characters or less');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { userId, orgId } = getUserContext();
      await apiRequest('/api/trainer/batch/tip/create', {
        method: 'POST',
        body: JSON.stringify({
          trainer_id: userId,
          batch_id: batchId,
          org_id: orgId,
          tip_text: text,
        }),
      });
      setSuccess('Quick Tip posted successfully!');
      setNewTipText('');
      fetchTips();
    } catch (err) {
      console.error('Create trainer tip error:', err);
      setError(err.message || 'Failed to create tip');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Update tip ── */
  const handleUpdateTip = async (tipId) => {
    const text = editText.trim();
    if (!text) return;
    if (text.length > 1000) {
      setError('Tip must be 1000 characters or less');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { userId, orgId } = getUserContext();
      await apiRequest(`/api/trainer/batch/tip/update/${tipId}`, {
        method: 'PUT',
        body: JSON.stringify({
          trainer_id: userId,
          org_id: orgId,
          tip_text: text,
        }),
      });
      setSuccess('Tip updated successfully!');
      setEditingTipId(null);
      setEditText('');
      fetchTips();
    } catch (err) {
      console.error('Update trainer tip error:', err);
      setError(err.message || 'Failed to update tip');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete tip ── */
  const handleDeleteTip = async (tipId) => {
    setSubmitting(true);
    setError(null);
    try {
      const { userId, orgId } = getUserContext();
      await apiRequest(`/api/trainer/batch/tip/delete/${tipId}?trainer_id=${userId}&org_id=${orgId}`, {
        method: 'DELETE',
      });
      setSuccess('Tip deleted successfully!');
      setDeleteConfirmId(null);
      fetchTips();
    } catch (err) {
      console.error('Delete trainer tip error:', err);
      setError(err.message || 'Failed to delete tip');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (tip) => {
    setEditingTipId(tip.Tip_ID);
    setEditText(tip.Tip_Text);
    setDeleteConfirmId(null);
  };

  const cancelEditing = () => {
    setEditingTipId(null);
    setEditText('');
  };

  const charCount = newTipText.length;
  const editCharCount = editText.length;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: '1px solid #e8ecf2',
            boxShadow: '0 8px 40px rgba(124,58,237,0.12)',
            overflow: 'hidden',
          },
        }}
      >
        {/* ── Dialog Title ── */}
        <DialogTitle
          sx={{
            p: 0,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
          }}
        >
          <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: '12px',
                  bgcolor: 'rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <TipsAndUpdates sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ ...headingFont, color: '#fff', fontSize: '1.1rem', lineHeight: 1.2 }}>
                  Quick Tips
                </Typography>
                <Typography sx={{ fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,0.80)', fontSize: '0.78rem', mt: 0.2 }}>
                  {batchCode}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: 'rgba(255,255,255,0.85)',
                width: 34, height: 34,
                bgcolor: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(8px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' },
              }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* ── Dialog Content ── */}
        <DialogContent sx={{ p: 0 }}>

          {/* ── New Tip Input ── */}
          <Box sx={{ px: 3, pt: 3, pb: 2 }}>
            <Box display="flex" alignItems="center" gap={0.8} mb={1.5}>
              <LightbulbOutlined sx={{ fontSize: 16, color: '#f59e0b' }} />
              <Typography sx={{ ...headingFont, fontSize: '0.82rem', color: '#334155' }}>
                Share a tip with your students
              </Typography>
            </Box>
            <TextField
              multiline
              minRows={2}
              maxRows={4}
              placeholder="Write a motivational tip, study advice, or helpful reminder..."
              value={newTipText}
              onChange={(e) => setNewTipText(e.target.value)}
              fullWidth
              disabled={submitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.88rem',
                  background: '#f8fafc',
                  '& fieldset': { borderColor: '#e8ecf2' },
                  '&:hover fieldset': { borderColor: '#DDD6FE' },
                  '&.Mui-focused fieldset': { borderColor: '#7C3AED', borderWidth: '1.5px' },
                },
              }}
            />
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.72rem',
                  color: charCount > 1000 ? '#ef4444' : '#94a3b8',
                }}
              >
                {charCount}/1000 characters
              </Typography>
              <Button
                variant="contained"
                disableElevation
                size="small"
                startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <Send sx={{ fontSize: '16px !important' }} />}
                onClick={handleCreateTip}
                disabled={!newTipText.trim() || submitting || charCount > 1000}
                sx={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                  color: '#fff',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  borderRadius: '10px',
                  px: 2.5,
                  py: 0.7,
                  boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #6D28D9 0%, #A78BFA 100%)',
                    boxShadow: '0 6px 20px rgba(124,58,237,0.30)',
                  },
                  '&.Mui-disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8',
                    boxShadow: 'none',
                  },
                }}
              >
                Post Tip
              </Button>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#f1f5f9' }} />

          {/* ── Existing Tips List ── */}
          <Box sx={{ px: 3, py: 2, minHeight: 120, maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress size={28} sx={{ color: '#7C3AED' }} />
                <Typography sx={{ ...bodyFont, fontSize: '0.84rem', ml: 1.5, color: '#64748b' }}>
                  Loading tips...
                </Typography>
              </Box>
            ) : tips.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box
                  sx={{
                    width: 52, height: 52, borderRadius: '14px', mx: 'auto', mb: 1.5,
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(167,139,250,0.04))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <FormatQuote sx={{ color: '#7C3AED', fontSize: 26 }} />
                </Box>
                <Typography sx={{ ...headingFont, fontSize: '0.92rem', mb: 0.5, color: '#334155' }}>
                  No tips yet
                </Typography>
                <Typography sx={{ ...bodyFont, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Post your first quick tip for this batch above.
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Typography sx={{ ...headingFont, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                  Active Tips ({tips.length})
                </Typography>

                {tips.map((tip, index) => (
                  <Box
                    key={tip.Tip_ID}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e8ecf2',
                      transition: 'all 0.3s ease',
                      animation: `tqtSlideUp 0.35s ease-out ${index * 0.06}s both`,
                      '&:hover': {
                        background: '#F5F3FF',
                        borderColor: '#DDD6FE',
                        boxShadow: '0 2px 12px rgba(124,58,237,0.06)',
                      },
                    }}
                  >
                    {editingTipId === tip.Tip_ID ? (
                      /* ── Edit Mode ── */
                      <Box>
                        <TextField
                          multiline
                          minRows={2}
                          maxRows={4}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          fullWidth
                          disabled={submitting}
                          autoFocus
                          sx={{
                            mb: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: '0.86rem',
                              background: '#fff',
                              '& fieldset': { borderColor: '#DDD6FE' },
                              '&.Mui-focused fieldset': { borderColor: '#7C3AED', borderWidth: '1.5px' },
                            },
                          }}
                        />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            sx={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: '0.7rem',
                              color: editCharCount > 1000 ? '#ef4444' : '#94a3b8',
                            }}
                          >
                            {editCharCount}/1000
                          </Typography>
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              onClick={cancelEditing}
                              disabled={submitting}
                              startIcon={<Cancel sx={{ fontSize: '14px !important' }} />}
                              sx={{
                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                fontWeight: 600, fontSize: '0.76rem', textTransform: 'none',
                                borderRadius: '8px', color: '#64748b',
                                border: '1px solid #e2e8f0', px: 1.5,
                                '&:hover': { background: '#f1f5f9' },
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              disableElevation
                              onClick={() => handleUpdateTip(tip.Tip_ID)}
                              disabled={!editText.trim() || submitting || editCharCount > 1000}
                              startIcon={submitting ? <CircularProgress size={12} color="inherit" /> : <CheckCircle sx={{ fontSize: '14px !important' }} />}
                              sx={{
                                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                fontWeight: 600, fontSize: '0.76rem', textTransform: 'none',
                                borderRadius: '8px', px: 1.5,
                                '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
                              }}
                            >
                              Save
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    ) : deleteConfirmId === tip.Tip_ID ? (
                      /* ── Delete Confirmation ── */
                      <Box>
                        <Typography sx={{ ...bodyFont, fontSize: '0.84rem', fontWeight: 600, color: '#ef4444', mb: 1 }}>
                          Delete this tip?
                        </Typography>
                        <Typography sx={{ ...bodyFont, fontSize: '0.8rem', color: '#64748b', mb: 1.5 }}>
                          This tip will no longer be visible to students.
                        </Typography>
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={submitting}
                            sx={{
                              fontFamily: '"Plus Jakarta Sans", sans-serif',
                              fontWeight: 600, fontSize: '0.76rem', textTransform: 'none',
                              borderRadius: '8px', color: '#64748b',
                              border: '1px solid #e2e8f0', px: 1.5,
                              '&:hover': { background: '#f1f5f9' },
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            onClick={() => handleDeleteTip(tip.Tip_ID)}
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={12} color="inherit" /> : <Delete sx={{ fontSize: '14px !important' }} />}
                            sx={{
                              background: '#ef4444',
                              fontFamily: '"Plus Jakarta Sans", sans-serif',
                              fontWeight: 600, fontSize: '0.76rem', textTransform: 'none',
                              borderRadius: '8px', px: 1.5,
                              '&:hover': { background: '#dc2626' },
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      /* ── Normal View ── */
                      <Box>
                        <Typography
                          sx={{
                            ...bodyFont, fontSize: '0.86rem', fontWeight: 500,
                            color: '#334155', lineHeight: 1.6, fontStyle: 'italic', mb: 1,
                          }}
                        >
                          &ldquo;{tip.Tip_Text}&rdquo;
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.7rem', color: '#94a3b8' }}>
                            {tip.Created_At
                              ? new Date(tip.Created_At).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })
                              : ''}
                          </Typography>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="Edit tip" arrow>
                              <IconButton
                                size="small"
                                onClick={() => startEditing(tip)}
                                sx={{
                                  width: 30, height: 30, borderRadius: '8px',
                                  color: '#7C3AED',
                                  background: 'rgba(124,58,237,0.06)',
                                  border: '1px solid rgba(124,58,237,0.12)',
                                  transition: 'all 0.2s ease',
                                  '&:hover': { background: 'rgba(124,58,237,0.12)', borderColor: '#7C3AED', transform: 'translateY(-1px)' },
                                }}
                              >
                                <Edit sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete tip" arrow>
                              <IconButton
                                size="small"
                                onClick={() => { setDeleteConfirmId(tip.Tip_ID); setEditingTipId(null); }}
                                sx={{
                                  width: 30, height: 30, borderRadius: '8px',
                                  color: '#ef4444',
                                  background: 'rgba(239,68,68,0.06)',
                                  border: '1px solid rgba(239,68,68,0.12)',
                                  transition: 'all 0.2s ease',
                                  '&:hover': { background: 'rgba(239,68,68,0.12)', borderColor: '#ef4444', transform: 'translateY(-1px)' },
                                }}
                              >
                                <Delete sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* ── Dialog Footer ── */}
        <DialogActions
          sx={{
            px: 3, py: 2,
            borderTop: '1px solid #f1f5f9',
            background: '#fafbfc',
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 600, fontSize: '0.82rem', textTransform: 'none',
              borderRadius: '10px', color: '#475569',
              border: '1.5px solid #e8ecf2', px: 2.5, py: 0.7,
              '&:hover': { background: '#F5F3FF', borderColor: '#DDD6FE' },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Success Snackbar ── */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* ── Error Snackbar ── */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TrainerQuickTipDialog;