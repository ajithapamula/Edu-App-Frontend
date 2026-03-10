// ═══════════════════════════════════════════════════════════════
// ProfileShared.jsx — Shared components for Student/Trainer/Mentor profiles
// Place in: src/components/shared/ProfileShared.jsx
// ═══════════════════════════════════════════════════════════════
import React from 'react';
import {
  Box, Typography, Avatar, Paper, IconButton, Button, Chip,
  CircularProgress, Tooltip, Dialog, DialogContent, TextField,
  MenuItem as MuiMenuItem, Select, FormControl,
} from '@mui/material';
import {
  EditOutlined, SaveOutlined, CloudUploadOutlined,
  CloseOutlined, DeleteOutlined, CameraAltOutlined,
} from '@mui/icons-material';

/* ── Theme ── */
export const T = {
  primary: '#3B5998', secondary: '#2D7DD2', accent: '#1A8A8A',
  grad: 'linear-gradient(135deg, #3B5998 0%, #2D7DD2 50%, #1A8A8A 100%)',
  txt: { p: '#0f172a', s: '#475569', m: '#94a3b8', l: '#cbd5e1' },
  bg: { page: '#f1f5f9', card: '#fff', hover: 'rgba(45,125,210,0.04)' },
  ok: '#10b981', err: '#ef4444', warn: '#f59e0b',
};

/* ── Keyframes (inject once) ── */
if (typeof document !== 'undefined' && !document.getElementById('pf-kf')) {
  const s = document.createElement('style'); s.id = 'pf-kf';
  s.textContent = '@keyframes pfUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}@keyframes pfScale{0%{opacity:0;transform:scale(.92)}100%{opacity:1;transform:scale(1)}}@keyframes pfPulse{0%,100%{box-shadow:0 0 0 0 rgba(45,125,210,.3)}50%{box-shadow:0 0 0 8px rgba(45,125,210,0)}}@keyframes pfFadeIn{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(s);
}

/* ── Input field styling ── */
const fSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', fontSize: '.88rem', fontWeight: 600,
    bgcolor: 'rgba(45,125,210,.03)',
    '& fieldset': { borderColor: 'rgba(45,125,210,.2)' },
    '&:hover fieldset': { borderColor: T.secondary },
    '&.Mui-focused fieldset': { borderColor: T.secondary, borderWidth: 2 },
  },
  '& .MuiInputLabel-root': { fontSize: '.8rem', fontWeight: 600, color: T.txt.m, '&.Mui-focused': { color: T.secondary } },
};

/* ── Helpers ── */
export const fmtDate = (str) => {
  if (!str) return '\u2014';
  try { return new Date(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }); }
  catch { return str; }
};
export const getInitials = (name) => name?.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase() || 'U';

/* ══════════════════════════════════════════════════════════════ */
/*  DetailRow — single field display / edit                      */
/* ══════════════════════════════════════════════════════════════ */
export const DetailRow = ({ icon: Icon, label, value, iconColor, delay = 0, editing, editValue, onEditChange, type = 'text', selectOptions, multiline }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: editing ? 1.2 : 1.8, px: .5, borderRadius: '10px', transition: 'all .2s', animation: `pfUp .5s ease-out ${delay}s both`, '&:hover': { bgcolor: T.bg.hover } }}>
    <Box sx={{ width: 38, height: 38, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconColor ? `${iconColor}14` : 'rgba(45,125,210,.08)', flexShrink: 0, mt: editing ? 1 : .2 }}>
      <Icon sx={{ fontSize: 19, color: iconColor || T.secondary }} />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      {editing ? (
        selectOptions ? (
          <FormControl fullWidth size="small">
            <Select value={editValue || ''} onChange={e => onEditChange(e.target.value)} displayEmpty
              sx={{ borderRadius: '10px', fontSize: '.88rem', fontWeight: 600, bgcolor: 'rgba(45,125,210,.03)', '& fieldset': { borderColor: 'rgba(45,125,210,.2)' }, '&:hover fieldset': { borderColor: T.secondary }, '&.Mui-focused fieldset': { borderColor: T.secondary } }}>
              <MuiMenuItem value="" disabled><em>Select {label}</em></MuiMenuItem>
              {selectOptions.map(o => <MuiMenuItem key={o} value={o}>{o}</MuiMenuItem>)}
            </Select>
          </FormControl>
        ) : (
          <TextField fullWidth size="small" label={label} type={type} value={editValue ?? ''} onChange={e => onEditChange(e.target.value)} multiline={multiline} minRows={multiline ? 2 : undefined} sx={fSx} />
        )
      ) : (
        <>
          <Typography sx={{ fontSize: '.68rem', fontWeight: 700, color: T.txt.m, letterSpacing: '.08em', textTransform: 'uppercase', lineHeight: 1, mb: .5 }}>{label}</Typography>
          <Typography sx={{ fontSize: '.88rem', fontWeight: 600, color: T.txt.p, lineHeight: 1.3, wordBreak: 'break-word' }}>{value || '\u2014'}</Typography>
        </>
      )}
    </Box>
  </Box>
);

/* ══════════════════════════════════════════════════════════════ */
/*  AccCard — small info card for account section                */
/* ══════════════════════════════════════════════════════════════ */
export const AccCard = ({ icon: Icon, label, value, iconColor, chipColor, delay = 0 }) => (
  <Box sx={{ flex: '1 1 160px', minWidth: 140, p: 2, borderRadius: '14px', bgcolor: T.bg.card, border: '1px solid rgba(0,0,0,.05)', textAlign: 'center', transition: 'all .25s', animation: `pfUp .5s ease-out ${delay}s both`, '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,.06)' } }}>
    <Box sx={{ width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconColor ? `${iconColor}14` : 'rgba(45,125,210,.08)', mx: 'auto', mb: 1 }}>
      <Icon sx={{ fontSize: 18, color: iconColor || T.secondary }} />
    </Box>
    <Typography sx={{ fontSize: '.62rem', fontWeight: 700, color: T.txt.m, letterSpacing: '.1em', textTransform: 'uppercase', mb: .6 }}>{label}</Typography>
    {chipColor
      ? <Chip label={value || '\u2014'} size="small" sx={{ bgcolor: `${chipColor}18`, color: chipColor, fontWeight: 700, fontSize: '.72rem', height: 24, borderRadius: '6px' }} />
      : <Typography sx={{ fontSize: '.82rem', fontWeight: 700, color: T.txt.p, lineHeight: 1.2 }}>{value || '\u2014'}</Typography>}
  </Box>
);

/* ══════════════════════════════════════════════════════════════ */
/*  Section — card wrapper with optional edit/save/cancel        */
/* ══════════════════════════════════════════════════════════════ */
export const Section = ({ title, subtitle, children, delay = 0, sx: sxProp = {}, onEdit, editing, onSave, onCancel, saving }) => (
  <Paper elevation={0} sx={{ borderRadius: '18px', border: '1px solid rgba(0,0,0,.06)', overflow: 'hidden', animation: `pfUp .5s ease-out ${delay}s both`, ...(editing ? { borderColor: `${T.secondary}40`, boxShadow: `0 0 0 2px ${T.secondary}15` } : {}), ...sxProp }}>
    {title && (
      <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: T.txt.p }}>{title}</Typography>
          {subtitle && <Typography sx={{ fontSize: '.76rem', color: T.txt.m, mt: .2 }}>{subtitle}</Typography>}
        </Box>
        {onEdit && !editing && (
          <Tooltip title="Edit"><IconButton onClick={onEdit} size="small" sx={{ bgcolor: `${T.secondary}0a`, color: T.secondary, borderRadius: '10px', width: 34, height: 34, '&:hover': { bgcolor: `${T.secondary}18` } }}><EditOutlined sx={{ fontSize: 17 }} /></IconButton></Tooltip>
        )}
        {editing && (
          <Box sx={{ display: 'flex', gap: .8 }}>
            <Button size="small" variant="outlined" onClick={onCancel} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '.76rem', borderRadius: '9px', borderColor: 'rgba(0,0,0,.15)', color: T.txt.s, px: 1.5, minWidth: 'auto', '&:hover': { borderColor: T.err, color: T.err } }}>Cancel</Button>
            <Button size="small" variant="contained" onClick={onSave} disabled={saving}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlined sx={{ fontSize: 15 }} />}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '.76rem', borderRadius: '9px', px: 1.8, minWidth: 'auto', background: T.grad, boxShadow: '0 2px 10px rgba(45,125,210,.25)', '&.Mui-disabled': { background: T.grad, color: 'rgba(255,255,255,.6)' } }}
            >{saving ? 'Saving...' : 'Save'}</Button>
          </Box>
        )}
      </Box>
    )}
    <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2.5, pt: title ? 1 : 2.5 }}>{children}</Box>
  </Paper>
);

/* ══════════════════════════════════════════════════════════════ */
/*  HeroCard — gradient banner + avatar + name + subtitle        */
/*  showPhotoButton: if false, hides the camera overlay button   */
/* ══════════════════════════════════════════════════════════════ */
export const HeroCard = ({ fullName, subtitle, chipLabel, profilePhoto, onPhotoClick, actions, quote, showPhotoButton = true }) => (
  <Paper elevation={0} sx={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(0,0,0,.06)', mb: 3, animation: 'pfScale .5s ease-out both' }}>
    <Box sx={{ height: { xs: 100, sm: 120 }, background: T.grad, position: 'relative', '&::after': { content: '""', position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 50%,rgba(255,255,255,.12) 0%,transparent 50%)' } }}>
      {quote && <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', zIndex: 1, width: '80%', display: { xs: 'none', sm: 'block' } }}><Typography key={quote} sx={{ fontSize: '.72rem', color: 'rgba(255,255,255,.7)', fontStyle: 'italic', animation: 'pfFadeIn .6s ease-out' }}>{quote}</Typography></Box>}
    </Box>
    <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3, position: 'relative' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-end' }, gap: { xs: 1.5, sm: 2.5 }, mt: { xs: '-45px', sm: '-50px' }, position: 'relative', zIndex: 2 }}>
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={profilePhoto || undefined}
            imgProps={{ referrerPolicy: 'no-referrer', onError: e => { e.target.style.display = 'none'; } }}
            sx={{ width: { xs: 90, sm: 105 }, height: { xs: 90, sm: 105 }, fontSize: '2rem', fontWeight: 800, background: profilePhoto ? 'transparent' : T.grad, color: '#fff', border: '4px solid #fff', boxShadow: '0 6px 24px rgba(0,0,0,.12)', cursor: showPhotoButton ? 'pointer' : 'default', '&:hover': showPhotoButton ? { transform: 'scale(1.03)' } : {} }}
            onClick={showPhotoButton ? onPhotoClick : undefined}>{getInitials(fullName)}</Avatar>
          <Box sx={{ position: 'absolute', bottom: 6, right: 6, width: 14, height: 14, borderRadius: '50%', bgcolor: T.ok, border: '3px solid #fff', animation: 'pfPulse 2s infinite' }} />
          {showPhotoButton && (
            <IconButton onClick={onPhotoClick} sx={{ position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, bgcolor: T.secondary, color: '#fff', boxShadow: '0 2px 8px rgba(45,125,210,.4)', '&:hover': { bgcolor: T.primary } }}>
              <CameraAltOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          )}
        </Box>
        <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' }, pb: { xs: 0, sm: .5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: { xs: '1.25rem', sm: '1.45rem' }, fontWeight: 800, color: T.txt.p, letterSpacing: '-.02em', textTransform: 'uppercase' }}>{fullName}</Typography>
            {chipLabel && <Chip label={chipLabel} size="small" sx={{ bgcolor: `${T.secondary}14`, color: T.secondary, fontWeight: 700, fontSize: '.68rem', height: 22, borderRadius: '6px' }} />}
          </Box>
          {subtitle}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-end' }, mt: { xs: 1, sm: 0 } }}>{actions}</Box>}
      </Box>
    </Box>
  </Paper>
);

/* ══════════════════════════════════════════════════════════════ */
/*  PhotoDialog — upload / delete profile photo                  */
/* ══════════════════════════════════════════════════════════════ */
export const PhotoDialog = ({ open, onClose, profilePhoto, fullName, uploading, fileInputRef, onUpload, onDelete }) => (
  <Dialog open={open} onClose={() => !uploading && onClose()} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden' } }}>
    <Box sx={{ background: T.grad, px: 3, py: 2, position: 'relative' }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>Profile Photo</Typography>
      <Typography sx={{ color: 'rgba(255,255,255,.7)', fontSize: '.78rem', mt: .3 }}>View, change, or remove your photo</Typography>
      <IconButton onClick={() => !uploading && onClose()} sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,.7)' }}><CloseOutlined /></IconButton>
    </Box>
    <DialogContent sx={{ textAlign: 'center', py: 4 }}>
      <Avatar src={profilePhoto || undefined}
        imgProps={{ referrerPolicy: 'no-referrer', onError: e => { e.target.style.display = 'none'; } }}
        sx={{ width: 130, height: 130, fontSize: '2.5rem', fontWeight: 800, background: profilePhoto ? 'transparent' : T.grad, color: '#fff', mx: 'auto', mb: 3, boxShadow: '0 8px 32px rgba(0,0,0,.15)' }}>{getInitials(fullName)}</Avatar>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
      <Button variant="contained" fullWidth
        startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadOutlined />}
        onClick={() => fileInputRef.current?.click()} disabled={uploading}
        sx={{ background: T.grad, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: '.88rem', borderRadius: '12px', py: 1.3, '&.Mui-disabled': { background: T.grad, color: 'rgba(255,255,255,.7)' } }}
      >{uploading ? 'Uploading...' : 'Upload New Photo'}</Button>
      {profilePhoto && (
        <Button variant="outlined" fullWidth startIcon={<DeleteOutlined sx={{ fontSize: 18 }} />} onClick={onDelete} disabled={uploading}
          sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '.82rem', borderRadius: '12px', py: 1, borderColor: 'rgba(239,68,68,.3)', color: T.err, '&:hover': { borderColor: T.err, bgcolor: 'rgba(239,68,68,.04)' } }}
        >Remove Photo</Button>
      )}
      <Typography sx={{ fontSize: '.72rem', color: T.txt.m, mt: 1.5 }}>Supported: JPG, PNG, GIF — Max 5MB</Typography>
    </DialogContent>
  </Dialog>
);

/* ── ActionBtn ── */
export const ActionBtn = ({ icon, label, onClick }) => (
  <Button variant="outlined" size="small" startIcon={icon} onClick={onClick}
    sx={{ borderColor: 'rgba(0,0,0,.12)', color: T.txt.s, textTransform: 'none', fontWeight: 600, fontSize: '.76rem', borderRadius: '10px', px: 1.8, '&:hover': { borderColor: T.secondary, color: T.secondary, bgcolor: `${T.secondary}08` } }}
  >{label}</Button>
);