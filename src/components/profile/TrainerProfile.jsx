// ═══════════════════════════════════════════════════════════════
// TrainerProfile.jsx — Place in: src/components/profile/TrainerProfile.jsx
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';
import { Box, Divider, Snackbar, Alert, Skeleton, Typography, IconButton } from '@mui/material';
import {
  PersonOutline, EmailOutlined, PhoneOutlined, SchoolOutlined,
  CalendarTodayOutlined, HomeOutlined, LocationOnOutlined,
  PublicOutlined, FingerprintOutlined, LockOutlined, CheckCircleOutlined,
  TimerOutlined, GroupsOutlined, CameraAltOutlined, BusinessOutlined,
  CodeOutlined, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { apiRequest } from '../../services/API/index';
import { T, DetailRow, AccCard, Section, HeroCard, PhotoDialog, ActionBtn, fmtDate } from '../shared/ProfileShared';

// ── Helper: notify Header about photo changes ──
const notifyPhotoChange = (url) => {
  window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { url } }));
};

// ── Helper: notify Header about name changes ──
const notifyNameChange = (name) => {
  window.dispatchEvent(new CustomEvent('profileNameUpdated', { detail: { name } }));
};

const TrainerProfile = () => {
  const { user } = useAuth();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [d, setD] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoUp, setPhotoUp] = useState(false);
  const [photoDlg, setPhotoDlg] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [showPwd, setShowPwd] = useState(false);

  // ── Edit states: Contact section ──
  const [editContact, setEditContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    First_Name: '', Last_Name: '', Mobile_Number: '', Alternate_Number: '',
    Dob: '', Address: '', District: '', State: '', Pincode: '', Country: '',
  });

  // ── Edit states: Expertise section ──
  const [editExpert, setEditExpert] = useState(false);
  const [savingExpert, setSavingExpert] = useState(false);
  const [expertForm, setExpertForm] = useState({
    Qualification: '', Skills: '', Experience: '',
  });

  const toast = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  // ── Fetch trainer data ──
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const r = await apiRequest(`/api/admin/org/trainer/list/${user.id}`, { method: 'GET' });
        if (r && !r.Error) setD(r);
      } catch { }
      finally { setLoading(false); }
    })();
  }, [user?.id]);

  // ── Fetch photo ──
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const r = await apiRequest(`/api/admin/org/trainer/photo/view/${user.id}`, { method: 'GET' });
        if (r?.Photo_upload) setPhoto(r.Photo_upload);
      } catch { }
    })();
  }, [user?.id]);

  // ── Sync forms ──
  useEffect(() => {
    if (!d) return;
    setContactForm({
      First_Name: d.First_Name || '', Last_Name: d.Last_Name || '',
      Mobile_Number: d.Mobile_Number || '', Alternate_Number: d.Alternate_Number || '',
      Dob: d.Dob || '', Address: d.Address || '', District: d.District || '',
      State: d.State || '', Pincode: d.Pincode || '', Country: d.Country || '',
    });
    setExpertForm({
      Qualification: d.Qualification || '', Skills: d.Skills || '',
      Experience: d.Experience != null ? String(d.Experience) : '',
    });
  }, [d]);

  // ── Photo upload — also notifies Header ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Select an image', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Max 5MB', 'error'); return; }
    setPhotoUp(true);
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
      const resp = await apiRequest(`/api/admin/org/trainer/photo/upload/${user.id}`, { method: 'POST', body: JSON.stringify({ Photo_upload: b64 }) });

      let newUrl = null;
      if (resp?.Photo_upload) {
        newUrl = resp.Photo_upload;
      } else {
        // Re-fetch to get the URL
        try {
          const pr = await apiRequest(`/api/admin/org/trainer/photo/view/${user.id}`, { method: 'GET' });
          if (pr?.Photo_upload) newUrl = pr.Photo_upload;
        } catch { }
      }

      setPhoto(newUrl);
      notifyPhotoChange(newUrl);  // ← Sync with Header
      toast('Photo updated!'); setPhotoDlg(false);
    } catch { toast('Upload failed', 'error'); }
    finally { setPhotoUp(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handlePhotoDelete = async () => {
    setPhotoUp(true);
    try {
      await apiRequest(`/api/admin/org/trainer/photo/delete/${user.id}`, { method: 'DELETE' });
      setPhoto(null);
      notifyPhotoChange(null);  // ← Sync with Header
      toast('Photo removed'); setPhotoDlg(false);
    } catch { toast('Delete failed', 'error'); }
    finally { setPhotoUp(false); }
  };

  // ── Save contact — also notifies Header about name change ──
  const saveContact = async () => {
    setSavingContact(true);
    try {
      await apiRequest(`/api/trainer/profile/update/${user.id}`, { method: 'PUT', body: JSON.stringify(contactForm) });
      setD(p => ({ ...p, ...contactForm })); setEditContact(false); toast('Contact updated!');

      // Notify Header about name change
      const newName = `${contactForm.First_Name || ''} ${contactForm.Last_Name || ''}`.trim();
      if (newName) notifyNameChange(newName);
    } catch (e) { toast(e.message || 'Failed', 'error'); }
    finally { setSavingContact(false); }
  };

  // ── Save expertise ──
  const saveExpert = async () => {
    setSavingExpert(true);
    try {
      await apiRequest(`/api/trainer/profile/update/${user.id}`, { method: 'PUT', body: JSON.stringify(expertForm) });
      setD(p => ({ ...p, ...expertForm })); setEditExpert(false); toast('Expertise updated!');
    } catch (e) { toast(e.message || 'Failed', 'error'); }
    finally { setSavingExpert(false); }
  };

  const cancelContact = () => {
    setContactForm({
      First_Name: d?.First_Name || '', Last_Name: d?.Last_Name || '',
      Mobile_Number: d?.Mobile_Number || '', Alternate_Number: d?.Alternate_Number || '',
      Dob: d?.Dob || '', Address: d?.Address || '', District: d?.District || '',
      State: d?.State || '', Pincode: d?.Pincode || '', Country: d?.Country || '',
    });
    setEditContact(false);
  };
  const cancelExpert = () => {
    setExpertForm({
      Qualification: d?.Qualification || '', Skills: d?.Skills || '',
      Experience: d?.Experience != null ? String(d.Experience) : '',
    });
    setEditExpert(false);
  };

  const fullName = `${d?.First_Name || ''} ${d?.Last_Name || ''}`.trim() || user?.name || 'Trainer';
  const email = d?.Email || '';
  const stLabel = d?.status === 1 ? 'Active' : d?.status === 0 ? 'Pending' : d?.status === 2 ? 'Inactive' : '\u2014';
  const stColor = stLabel === 'Active' ? T.ok : stLabel === 'Inactive' ? T.err : T.warn;

  if (loading) return (<Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 }, pt: { xs: 10, sm: 12 } }}><Skeleton variant="rounded" height={220} sx={{ borderRadius: '18px', mb: 3 }} /><Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}><Skeleton variant="rounded" height={400} sx={{ borderRadius: '18px', flex: '1 1 300px' }} /><Skeleton variant="rounded" height={250} sx={{ borderRadius: '18px', flex: '1 1 300px' }} /></Box></Box>);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 1.5, sm: 2.5, md: 3 }, pt: { xs: 10, sm: 12 }, pb: 6, minHeight: '100vh' }}>

      <HeroCard fullName={fullName} chipLabel={d?.Trainer_Code || 'Trainer'} profilePhoto={photo}
        onPhotoClick={() => setPhotoDlg(true)} showPhotoButton={true}
        subtitle={email && <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, justifyContent: { xs: 'center', sm: 'flex-start' }, mt: .5 }}><EmailOutlined sx={{ fontSize: 15, color: T.txt.m }} /><Typography sx={{ fontSize: '.82rem', color: T.txt.s }}>{email}</Typography></Box>}
        actions={<ActionBtn icon={<CameraAltOutlined sx={{ fontSize: 16 }} />} label="Change Photo" onClick={() => setPhotoDlg(true)} />}
      />

      <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', md: 'row' }, mb: 3 }}>

        {/* ── Personal & Contact ── */}
        <Section title="Personal & Contact" subtitle="Your contact information" delay={.1} sx={{ flex: 1, minWidth: 0 }}
          editing={editContact} onEdit={() => setEditContact(true)} onSave={saveContact} onCancel={cancelContact} saving={savingContact}>
          <DetailRow icon={PersonOutline} label="First Name" iconColor={T.primary} delay={.12}
            value={d?.First_Name} editing={editContact} editValue={contactForm.First_Name}
            onEditChange={v => setContactForm(p => ({ ...p, First_Name: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={PersonOutline} label="Last Name" iconColor={T.primary} delay={.14}
            value={d?.Last_Name} editing={editContact} editValue={contactForm.Last_Name}
            onEditChange={v => setContactForm(p => ({ ...p, Last_Name: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={EmailOutlined} label="Email" value={email} iconColor={T.secondary} delay={.15} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={PhoneOutlined} label="Phone" iconColor={T.accent} delay={.18} value={d?.Mobile_Number}
            editing={editContact} editValue={contactForm.Mobile_Number} onEditChange={v => setContactForm(p => ({ ...p, Mobile_Number: v }))} type="tel" />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={GroupsOutlined} label="Alt Phone" iconColor="#f59e0b" delay={.21} value={d?.Alternate_Number}
            editing={editContact} editValue={contactForm.Alternate_Number} onEditChange={v => setContactForm(p => ({ ...p, Alternate_Number: v }))} type="tel" />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={CalendarTodayOutlined} label="Date of Birth" iconColor="#ec4899" delay={.24}
            value={editContact ? contactForm.Dob : fmtDate(d?.Dob)} editing={editContact} editValue={contactForm.Dob}
            onEditChange={v => setContactForm(p => ({ ...p, Dob: v }))} type="date" />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={HomeOutlined} label="Address" iconColor="#6366f1" delay={.3} value={d?.Address}
            editing={editContact} editValue={contactForm.Address} onEditChange={v => setContactForm(p => ({ ...p, Address: v }))} multiline />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={LocationOnOutlined} label="District" iconColor="#14b8a6" delay={.33} value={d?.District}
            editing={editContact} editValue={contactForm.District} onEditChange={v => setContactForm(p => ({ ...p, District: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={LocationOnOutlined} label="State" iconColor="#0ea5e9" delay={.36} value={d?.State}
            editing={editContact} editValue={contactForm.State} onEditChange={v => setContactForm(p => ({ ...p, State: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={LocationOnOutlined} label="Pincode" iconColor="#06b6d4" delay={.37} value={d?.Pincode}
            editing={editContact} editValue={contactForm.Pincode} onEditChange={v => setContactForm(p => ({ ...p, Pincode: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={PublicOutlined} label="Country" iconColor="#f97316" delay={.39} value={d?.Country}
            editing={editContact} editValue={contactForm.Country} onEditChange={v => setContactForm(p => ({ ...p, Country: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={FingerprintOutlined} label={`Govt ID (${d?.Govt_Id_Type || ''})`} value={d?.Govt_Id_Number} iconColor="#7c3aed" delay={.42} />
        </Section>

        {/* ── Expertise & Qualifications ── */}
        <Section title="Expertise & Qualifications" subtitle="Skills and experience" delay={.15} sx={{ flex: 1, minWidth: 0 }}
          editing={editExpert} onEdit={() => setEditExpert(true)} onSave={saveExpert} onCancel={cancelExpert} saving={savingExpert}>
          <DetailRow icon={SchoolOutlined} label="Qualification" iconColor={T.primary} delay={.18} value={d?.Qualification}
            editing={editExpert} editValue={expertForm.Qualification} onEditChange={v => setExpertForm(p => ({ ...p, Qualification: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={CodeOutlined} label="Skills" iconColor={T.secondary} delay={.21} value={d?.Skills}
            editing={editExpert} editValue={expertForm.Skills} onEditChange={v => setExpertForm(p => ({ ...p, Skills: v }))} multiline />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={TimerOutlined} label="Experience (Years)" iconColor={T.accent} delay={.24}
            value={d?.Experience != null ? `${d.Experience} years` : '\u2014'}
            editing={editExpert} editValue={expertForm.Experience} onEditChange={v => setExpertForm(p => ({ ...p, Experience: v }))} type="number" />
        </Section>
      </Box>

      {/* ── Account Info with Password Toggle ── */}
      <Section title="Account Information" delay={.2}>
        <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', mt: 1 }}>
          <AccCard icon={CheckCircleOutlined} label="Status" value={stLabel} iconColor={stColor} chipColor={stColor} delay={.25} />
          <AccCard icon={BusinessOutlined} label="Org ID" value={d?.Org_ID || '\u2014'} iconColor={T.secondary} delay={.3} />

          {/* ── Password Card with Show/Hide Toggle ── */}
          <Box sx={{
            flex: '1 1 140px', minWidth: 140, maxWidth: 220,
            bgcolor: '#fff', borderRadius: '14px', p: 1.8,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
            position: 'relative',
          }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              bgcolor: 'rgba(249,115,22,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LockOutlined sx={{ fontSize: 18, color: '#f97316' }} />
            </Box>
            <Typography sx={{ fontSize: '.68rem', fontWeight: 600, color: T.txt.m, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Password
            </Typography>
            <Typography sx={{
              fontSize: '.85rem', fontWeight: 700, color: T.txt.p,
              letterSpacing: showPwd ? 'normal' : '.12em',
              wordBreak: 'break-all', textAlign: 'center', maxWidth: '100%',
            }}>
              {showPwd ? (d?.Password || '\u2014') : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowPwd(p => !p)}
              sx={{
                position: 'absolute', top: 8, right: 8,
                width: 28, height: 28,
                bgcolor: 'rgba(0,0,0,0.04)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' },
              }}
            >
              {showPwd
                ? <VisibilityOff sx={{ fontSize: 15, color: '#94a3b8' }} />
                : <Visibility sx={{ fontSize: 15, color: '#94a3b8' }} />
              }
            </IconButton>
          </Box>
        </Box>
      </Section>

      <PhotoDialog open={photoDlg} onClose={() => setPhotoDlg(false)} profilePhoto={photo} fullName={fullName}
        uploading={photoUp} fileInputRef={fileRef} onUpload={handlePhotoUpload} onDelete={handlePhotoDelete} />
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.sev} variant="filled" sx={{ borderRadius: '12px', fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TrainerProfile;
