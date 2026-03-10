// ═══════════════════════════════════════════════════════════════
// StudentProfile.jsx — Place in: src/components/profile/StudentProfile.jsx
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';
import { Box, Divider, Snackbar, Alert, Skeleton, Typography, IconButton, Button, CircularProgress } from '@mui/material';
import {
  PersonOutline, EmailOutlined, PhoneOutlined, SchoolOutlined,
  CalendarTodayOutlined, BadgeOutlined, HomeOutlined, LocationOnOutlined,
  PublicOutlined, FingerprintOutlined, WorkOutlined, EventAvailableOutlined,
  LockOutlined, CheckCircleOutlined, GroupsOutlined, BusinessOutlined,
  Visibility, VisibilityOff, DescriptionOutlined, CloudUploadOutlined,
  OpenInNewOutlined, DeleteOutlineOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { apiRequest } from '../../services/API/index';
import { T, DetailRow, AccCard, Section, HeroCard, fmtDate } from '../shared/ProfileShared';

// ── Helper: notify Header about name changes ──
const notifyNameChange = (name) => {
  window.dispatchEvent(new CustomEvent('profileNameUpdated', { detail: { name } }));
};

const StudentProfile = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [d, setD] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [showPwd, setShowPwd] = useState(false);

  // ── Edit states: Personal section ──
  const [editPersonal, setEditPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    First_Name: '', Last_Name: '', Mobile_Number: '', Alternate_Number: '',
    Dob: '', Address: '', State: '', Pincode: '', Country: '',
  });

  // ── Edit states: Education section ──
  const [editEdu, setEditEdu] = useState(false);
  const [savingEdu, setSavingEdu] = useState(false);
  const [eduForm, setEduForm] = useState({
    Qualification: '', Passout_Year: '', University_School: '',
  });

  // ── Resume states ──
  const [resumeData, setResumeData] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeDeleting, setResumeDeleting] = useState(false);
  const resumeInputRef = useRef(null);

  // ── Rotating motivational quotes ──
  const studentQuotes = [
    '\u201CEducation is the passport to the future.\u201D',
    '\u201CThe beautiful thing about learning is that no one can take it away from you.\u201D',
    '\u201CSuccess is the sum of small efforts repeated day in and day out.\u201D',
    '\u201CDon\u2019t let what you cannot do interfere with what you can do.\u201D',
    '\u201CThe expert in anything was once a beginner.\u201D',
    '\u201CPush yourself, because no one else is going to do it for you.\u201D',
    '\u201CThe only way to do great work is to love what you learn.\u201D',
    '\u201CDream big, work hard, stay focused, and surround yourself with good people.\u201D',
    '\u201CYour limitation is only your imagination.\u201D',
    '\u201CIt always seems impossible until it\u2019s done.\u201D',
  ];
  const [quoteIdx, setQuoteIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setQuoteIdx(i => (i + 1) % studentQuotes.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const toast = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  // ── Fetch student data ──
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const r = await apiRequest(`/api/admin/org/students/list/${user.id}`, { method: 'GET' });
        if (r && !r.Error) setD(r);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user?.id]);

  // ── Fetch photo (read-only) ──
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const r = await apiRequest(`/api/student/photo/${user.id}/`, { method: 'GET' });
        if (r?.success && r?.s3_url) setPhoto(r.s3_url);
      } catch { /* no photo */ }
    })();
  }, [user?.id]);

  // ── Fetch resume on mount ──
  useEffect(() => {
    if (!user?.id) return;
    fetchResume();
  }, [user?.id]);

  const fetchResume = async () => {
    if (!user?.id) return;
    setResumeLoading(true);
    try {
      const r = await apiRequest(`/api/student/resume/${user.id}/`, { method: 'GET' });
      if (r?.success) {
        setResumeData(r);
      } else {
        setResumeData(null);
      }
    } catch {
      setResumeData(null);
    } finally {
      setResumeLoading(false);
    }
  };

  // ── Sync edit forms when data loads ──
  useEffect(() => {
    if (!d) return;
    setPersonalForm({
      First_Name: d.First_Name || '', Last_Name: d.Last_Name || '',
      Mobile_Number: d.Mobile_Number || '', Alternate_Number: d.Alternate_Number || '',
      Dob: d.Dob || '', Address: d.Address || '',
      State: d.State || '', Pincode: d.Pincode || '', Country: d.Country || '',
    });
    setEduForm({
      Qualification: d.Qualification || '',
      Passout_Year: d.Passout_Year != null ? String(d.Passout_Year) : '',
      University_School: d.University_School || '',
    });
  }, [d]);

  // ── Save personal — also notifies Header about name change ──
  const savePersonal = async () => {
    setSavingPersonal(true);
    try {
      await apiRequest(`/api/student/profile/update/${user.id}`, { method: 'PUT', body: JSON.stringify(personalForm) });
      setD(p => ({ ...p, ...personalForm })); setEditPersonal(false); toast('Personal details updated!');
      const newName = `${personalForm.First_Name || ''} ${personalForm.Last_Name || ''}`.trim();
      if (newName) notifyNameChange(newName);
    } catch (e) { toast(e.message || 'Failed to update', 'error'); }
    finally { setSavingPersonal(false); }
  };

  // ── Save education ──
  const saveEdu = async () => {
    setSavingEdu(true);
    try {
      await apiRequest(`/api/student/profile/update/${user.id}`, { method: 'PUT', body: JSON.stringify(eduForm) });
      setD(p => ({ ...p, ...eduForm })); setEditEdu(false); toast('Education updated!');
    } catch (e) { toast(e.message || 'Failed to update', 'error'); }
    finally { setSavingEdu(false); }
  };

  const cancelPersonal = () => {
    setPersonalForm({
      First_Name: d?.First_Name || '', Last_Name: d?.Last_Name || '',
      Mobile_Number: d?.Mobile_Number || '', Alternate_Number: d?.Alternate_Number || '',
      Dob: d?.Dob || '', Address: d?.Address || '',
      State: d?.State || '', Pincode: d?.Pincode || '', Country: d?.Country || '',
    });
    setEditPersonal(false);
  };
  const cancelEdu = () => {
    setEduForm({
      Qualification: d?.Qualification || '',
      Passout_Year: d?.Passout_Year != null ? String(d.Passout_Year) : '',
      University_School: d?.University_School || '',
    });
    setEditEdu(false);
  };

  // ── Resume upload handler ──
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast('Only PDF files are allowed.', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('Resume must be less than 10MB.', 'error');
      e.target.value = '';
      return;
    }

    setResumeUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target.result;
          await apiRequest(`/api/student/update-resume/${user.id}/`, {
            method: 'PUT',
            body: JSON.stringify({ resume_base64: base64Data }),
          });
          toast('Resume uploaded successfully!');
          await fetchResume();
        } catch (err) {
          toast(err.message || 'Failed to upload resume', 'error');
        } finally {
          setResumeUploading(false);
        }
      };
      reader.onerror = () => {
        toast('Failed to read file', 'error');
        setResumeUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast('Failed to upload resume', 'error');
      setResumeUploading(false);
    }
    e.target.value = '';
  };

  // ── Resume delete handler ──
  const handleResumeDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your resume?')) return;
    setResumeDeleting(true);
    try {
      await apiRequest(`/api/student/delete-resume/${user.id}/`, { method: 'DELETE' });
      setResumeData(null);
      toast('Resume removed successfully!');
    } catch (err) {
      toast(err.message || 'Failed to remove resume', 'error');
    } finally {
      setResumeDeleting(false);
    }
  };

  // ── Resume view handler ──
  const handleResumeView = () => {
    if (resumeData?.s3_url) {
      window.open(resumeData.s3_url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const fullName = `${d?.First_Name || ''} ${d?.Last_Name || ''}`.trim() || user?.name || 'Student';
  const email = d?.Email || '';
  const stBool = d?.status;
  const stLabel = stBool === true || stBool === 1 ? 'Active' : stBool === false || stBool === 0 ? 'Inactive' : '\u2014';
  const stColor = stLabel === 'Active' ? T.ok : stLabel === 'Inactive' ? T.err : T.warn;

  if (loading) return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 }, pt: { xs: 10, sm: 12 } }}>
      <Skeleton variant="rounded" height={220} sx={{ borderRadius: '18px', mb: 3 }} />
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Skeleton variant="rounded" height={350} sx={{ borderRadius: '18px', flex: '1 1 300px' }} />
        <Skeleton variant="rounded" height={350} sx={{ borderRadius: '18px', flex: '1 1 300px' }} />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 1.5, sm: 2.5, md: 3 }, pt: { xs: 10, sm: 12 }, pb: 6, minHeight: '100vh' }}>

      <HeroCard fullName={fullName} chipLabel={d?.Student_Code} profilePhoto={photo}
        showPhotoButton={false}
        quote={studentQuotes[quoteIdx]}
        subtitle={email && <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, justifyContent: { xs: 'center', sm: 'flex-start' }, mt: .5 }}><EmailOutlined sx={{ fontSize: 15, color: T.txt.m }} /><Typography sx={{ fontSize: '.82rem', color: T.txt.s }}>{email}</Typography></Box>}
      />

      {/* ── Two-column: Personal + Education ── */}
      <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', md: 'row' }, mb: 3 }}>

        {/* Personal Details */}
        <Section title="Personal Details" subtitle="Identity and contact" delay={.1} sx={{ flex: 1, minWidth: 0 }}
          editing={editPersonal} onEdit={() => setEditPersonal(true)} onSave={savePersonal} onCancel={cancelPersonal} saving={savingPersonal}>
          <DetailRow icon={PersonOutline} label="First Name" iconColor={T.primary} delay={.12}
            value={d?.First_Name} editing={editPersonal} editValue={personalForm.First_Name}
            onEditChange={v => setPersonalForm(p => ({ ...p, First_Name: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={PersonOutline} label="Last Name" iconColor={T.primary} delay={.14}
            value={d?.Last_Name} editing={editPersonal} editValue={personalForm.Last_Name}
            onEditChange={v => setPersonalForm(p => ({ ...p, Last_Name: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={EmailOutlined} label="Email" value={email} iconColor={T.secondary} delay={.15} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={PhoneOutlined} label="Phone" iconColor={T.accent} delay={.18}
            value={d?.Mobile_Number} editing={editPersonal} editValue={personalForm.Mobile_Number}
            onEditChange={v => setPersonalForm(p => ({ ...p, Mobile_Number: v }))} type="tel" />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={GroupsOutlined} label="Alt / Guardian Phone" iconColor="#f59e0b" delay={.21}
            value={d?.Alternate_Number} editing={editPersonal} editValue={personalForm.Alternate_Number}
            onEditChange={v => setPersonalForm(p => ({ ...p, Alternate_Number: v }))} type="tel" />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={BadgeOutlined} label="Gender" value={d?.Gender} iconColor="#8b5cf6" delay={.24} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={CalendarTodayOutlined} label="Date of Birth" iconColor="#ec4899" delay={.27}
            value={editPersonal ? personalForm.Dob : fmtDate(d?.Dob)} editing={editPersonal} editValue={personalForm.Dob}
            onEditChange={v => setPersonalForm(p => ({ ...p, Dob: v }))} type="date" />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={HomeOutlined} label="Address" iconColor="#6366f1" delay={.3}
            value={d?.Address} editing={editPersonal} editValue={personalForm.Address}
            onEditChange={v => setPersonalForm(p => ({ ...p, Address: v }))} multiline />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={LocationOnOutlined} label="State" iconColor="#14b8a6" delay={.33}
            value={d?.State} editing={editPersonal} editValue={personalForm.State}
            onEditChange={v => setPersonalForm(p => ({ ...p, State: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={LocationOnOutlined} label="Pincode" iconColor="#0ea5e9" delay={.35}
            value={d?.Pincode} editing={editPersonal} editValue={personalForm.Pincode}
            onEditChange={v => setPersonalForm(p => ({ ...p, Pincode: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={PublicOutlined} label="Country" iconColor="#f97316" delay={.37}
            value={d?.Country} editing={editPersonal} editValue={personalForm.Country}
            onEditChange={v => setPersonalForm(p => ({ ...p, Country: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={FingerprintOutlined} label={`Govt ID (${d?.Govt_Id_Type || 'Type'})`} value={d?.Govt_Id_Number} iconColor="#7c3aed" delay={.39} />
        </Section>

        {/* Education */}
        <Section title="Education" subtitle="Academic qualifications" delay={.15} sx={{ flex: 1, minWidth: 0 }}
          editing={editEdu} onEdit={() => setEditEdu(true)} onSave={saveEdu} onCancel={cancelEdu} saving={savingEdu}>
          <DetailRow icon={SchoolOutlined} label="Institution" iconColor={T.primary} delay={.18}
            value={d?.University_School} editing={editEdu} editValue={eduForm.University_School}
            onEditChange={v => setEduForm(p => ({ ...p, University_School: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={WorkOutlined} label="Qualification" iconColor={T.secondary} delay={.21}
            value={d?.Qualification} editing={editEdu} editValue={eduForm.Qualification}
            onEditChange={v => setEduForm(p => ({ ...p, Qualification: v }))} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={EventAvailableOutlined} label="Year of Passing" iconColor={T.accent} delay={.24}
            value={d?.Passout_Year} editing={editEdu} editValue={eduForm.Passout_Year}
            onEditChange={v => setEduForm(p => ({ ...p, Passout_Year: v }))} type="number" />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={SchoolOutlined} label="Course" iconColor="#8b5cf6" delay={.27} value={d?.Course} />
          <Divider sx={{ borderColor: 'rgba(0,0,0,.04)' }} />
          <DetailRow icon={GroupsOutlined} label="Batch" iconColor="#ec4899" delay={.3} value={d?.Batch} />
        </Section>
      </Box>

      {/* ── Resume Section (NEW) ── */}
      <Section title="Resume" subtitle="Your uploaded resume (PDF only)" delay={.22}>
        <Box sx={{ mt: 1.5 }}>
          {resumeLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2 }}>
              <CircularProgress size={20} />
              <Typography sx={{ fontSize: '.85rem', color: T.txt.s }}>Loading resume...</Typography>
            </Box>
          ) : resumeData ? (
            /* ── Resume exists — show info + actions ── */
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '14px',
              border: '1px solid rgba(22,163,74,0.15)', bgcolor: 'rgba(22,163,74,0.04)',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}>
              {/* PDF Icon */}
              <Box sx={{
                width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(220,38,38,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <DescriptionOutlined sx={{ fontSize: 24, color: '#dc2626' }} />
              </Box>

              {/* File info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '.9rem', fontWeight: 700, color: T.txt.p, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {resumeData.filename || 'Resume.pdf'}
                </Typography>
                <Typography sx={{ fontSize: '.75rem', color: T.txt.s, mt: 0.2 }}>
                  {formatFileSize(resumeData.file_size)} · PDF
                </Typography>
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                {/* View */}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<OpenInNewOutlined sx={{ fontSize: 16 }} />}
                  onClick={handleResumeView}
                  sx={{
                    textTransform: 'none', fontWeight: 600, fontSize: '.78rem',
                    borderRadius: '10px', borderColor: 'rgba(14,165,233,0.3)',
                    color: '#0369a1', px: 1.5, py: 0.6,
                    '&:hover': { borderColor: '#0ea5e9', bgcolor: 'rgba(14,165,233,0.06)' },
                  }}
                >
                  View
                </Button>

                {/* Update */}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={resumeUploading ? <CircularProgress size={14} /> : <CloudUploadOutlined sx={{ fontSize: 16 }} />}
                  disabled={resumeUploading}
                  onClick={() => resumeInputRef.current?.click()}
                  sx={{
                    textTransform: 'none', fontWeight: 600, fontSize: '.78rem',
                    borderRadius: '10px', borderColor: 'rgba(249,115,22,0.3)',
                    color: '#ea580c', px: 1.5, py: 0.6,
                    '&:hover': { borderColor: '#f97316', bgcolor: 'rgba(249,115,22,0.06)' },
                  }}
                >
                  {resumeUploading ? 'Uploading...' : 'Update'}
                </Button>

                {/* Delete
                <IconButton
                  size="small"
                  disabled={resumeDeleting}
                  onClick={handleResumeDelete}
                  sx={{
                    width: 34, height: 34, bgcolor: 'rgba(220,38,38,0.06)',
                    '&:hover': { bgcolor: 'rgba(220,38,38,0.12)' },
                  }}
                >
                  {resumeDeleting ? <CircularProgress size={14} /> : <DeleteOutlineOutlined sx={{ fontSize: 17, color: '#dc2626' }} />}
                </IconButton> */}
              </Box>
            </Box>
          ) : (
            /* ── No resume — show upload prompt ── */
            <Box sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
              p: 3, borderRadius: '14px', border: '2px dashed rgba(0,0,0,0.08)',
              bgcolor: 'rgba(0,0,0,0.01)',
            }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: '14px', bgcolor: 'rgba(156,163,175,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DescriptionOutlined sx={{ fontSize: 26, color: '#9ca3af' }} />
              </Box>
              <Typography sx={{ fontSize: '.88rem', fontWeight: 600, color: T.txt.s }}>
                No resume uploaded yet
              </Typography>
              <Typography sx={{ fontSize: '.75rem', color: '#9ca3af' }}>
                Upload your resume in PDF format (max 10MB)
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={resumeUploading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CloudUploadOutlined sx={{ fontSize: 18 }} />}
                disabled={resumeUploading}
                onClick={() => resumeInputRef.current?.click()}
                sx={{
                  textTransform: 'none', fontWeight: 700, fontSize: '.82rem',
                  borderRadius: '12px', px: 3, py: 1,
                  background: 'linear-gradient(135deg, #1e3a8a, #0ea5e9)',
                  boxShadow: '0 4px 14px rgba(14,165,233,0.3)',
                  '&:hover': { background: 'linear-gradient(135deg, #1e3a8a, #0284c7)' },
                }}
              >
                {resumeUploading ? 'Uploading...' : 'Upload Resume (PDF)'}
              </Button>
            </Box>
          )}

          {/* Hidden file input */}
          <input
            ref={resumeInputRef}
            type="file"
            accept="application/pdf,.pdf"
            style={{ display: 'none' }}
            onChange={handleResumeUpload}
          />
        </Box>
      </Section>

      {/* ── Account Info with Password Toggle ── */}
      <Section title="Account Information" delay={.2}>
        <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', mt: 1 }}>
          <AccCard icon={CheckCircleOutlined} label="Status" value={stLabel} iconColor={stColor} chipColor={stColor} delay={.25} />
          <AccCard icon={BusinessOutlined} label="Org ID" value={d?.Org_ID || '\u2014'} iconColor={T.accent} delay={.3} />

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

      {/* ── Snackbar ── */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.sev} variant="filled" sx={{ borderRadius: '12px', fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentProfile;