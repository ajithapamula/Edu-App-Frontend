import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  LockReset,
  Email as EmailIcon,
  VpnKey,
  CheckCircleOutline,
  VideocamOutlined,
  EmailOutlined,
  VerifiedUserOutlined,
  SchoolOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ——— keyframes (same as LoginForm) ——— */
const keyframesStyle = document.getElementById('forgot-keyframes') || (() => {
  const style = document.createElement('style');
  style.id = 'forgot-keyframes';
  style.textContent = `
    @keyframes floatUpDown {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-14px); }
    }
    @keyframes floatLeftRight {
      0%, 100% { transform: translateX(0px); }
      50% { transform: translateX(10px); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 4px 24px rgba(0,0,0,0.1), 0 0 0 0 rgba(255,255,255,0); }
      50% { box-shadow: 0 4px 24px rgba(0,0,0,0.1), 0 0 18px 4px rgba(255,255,255,0.15); }
    }
    @keyframes shieldBounce {
      0%, 100% { transform: scale(1) rotate(0deg); }
      25% { transform: scale(1.25) rotate(-10deg); }
      50% { transform: scale(1.18) rotate(10deg); }
      75% { transform: scale(1.22) rotate(-5deg); }
    }
    @keyframes iconPulse {
      0%, 100% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.15); opacity: 1; }
    }
    @keyframes fadeSlideUp {
      0% { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  return style;
})();

// Step constants
const STEP_EMAIL = 'email';
const STEP_SELECT_ACCOUNT = 'select_account';
const STEP_OTP = 'otp';
const STEP_NEW_PASSWORD = 'new_password';
const STEP_SUCCESS = 'success';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [entityType, setEntityType] = useState('');
  const [matchedAccounts, setMatchedAccounts] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [step, setStep] = useState(STEP_EMAIL);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword, resetPassword } = useAuth();

  // Entity type display labels
  const entityTypeLabels = {
    super_admin: { label: 'Super Admin', icon: '⚙️' },
    organization: { label: 'Organization', icon: '🏢' },
    admin: { label: 'Admin', icon: '🛡️' },
    trainer: { label: 'Trainer', icon: '🎓' },
    mentor: { label: 'Mentor', icon: '👨‍🏫' },
    student: { label: 'Student', icon: '📚' },
    company: { label: 'Company', icon: '🏭' },
    college: { label: 'College', icon: '🎓' },
  };

  // ── Step 1: Submit email to request OTP ──
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('Forgot password request for:', email.trim());
      const response = await forgotPassword(email.trim(), entityType || null);
      console.log('Forgot password response:', response);

      if (response.multiAccount && response.matchedAccounts && response.matchedAccounts.length > 1) {
        setMatchedAccounts(response.matchedAccounts);
        setStep(STEP_SELECT_ACCOUNT);
        setMessage('Multiple accounts found. Please select your account type.');
        return;
      }

      if (response.matchedAccounts && response.matchedAccounts.length > 1) {
        setMatchedAccounts(response.matchedAccounts);
        setStep(STEP_SELECT_ACCOUNT);
        setMessage('Multiple accounts found. Please select your account type.');
        return;
      }

      if (response.entityType) {
        setEntityType(response.entityType);
      }
      setStep(STEP_OTP);
      setMessage('OTP has been sent to your email. Please check your inbox (and spam folder).');
    } catch (err) {
      console.error('Forgot password error:', err);

      const responseData = err.responseData;
      if (responseData && responseData.Matched_Accounts && responseData.Matched_Accounts.length > 1) {
        setMatchedAccounts(responseData.Matched_Accounts);
        setStep(STEP_SELECT_ACCOUNT);
        setMessage('Multiple accounts found. Please select your account type.');
        return;
      }

      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1b: Select account type and resend OTP ──
  const handleAccountSelect = async (e) => {
    e.preventDefault();
    if (!entityType) {
      setError('Please select your account type');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await forgotPassword(email.trim(), entityType);
      console.log('Account select response:', response);

      if (response.multiAccount) {
        setError('Please select a specific account type.');
        return;
      }

      if (response.entityType) {
        setEntityType(response.entityType);
      }
      setStep(STEP_OTP);
      setMessage('OTP has been sent to your email. Please check your inbox (and spam folder).');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setMessage('');
    setStep(STEP_NEW_PASSWORD);
  };

  // ── Step 3: Submit new password with OTP ──
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setError('Password must contain at least one number');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError('Password must contain at least one special character');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(email.trim(), otp.trim(), newPassword);
      console.log('Reset password response:', response);
      setStep(STEP_SUCCESS);
      setMessage('Password reset successfully! You can now login with your new password.');
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password');

      if (err.message && (err.message.includes('expired') || err.message.includes('Invalid OTP'))) {
        setOtp('');
        setStep(STEP_OTP);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await forgotPassword(email.trim(), entityType || null);

      if (response.multiAccount) {
        setMatchedAccounts(response.matchedAccounts);
        setStep(STEP_SELECT_ACCOUNT);
        setMessage('Please select your account type.');
        return;
      }

      setMessage('A new OTP has been sent to your email.');
      setOtp('');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Start over ──
  const handleStartOver = () => {
    setStep(STEP_EMAIL);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setEntityType('');
    setMatchedAccounts([]);
    setError('');
    setMessage('');
  };

  // Step indicator
  const getStepNumber = () => {
    switch (step) {
      case STEP_EMAIL: return 1;
      case STEP_SELECT_ACCOUNT: return 1;
      case STEP_OTP: return 2;
      case STEP_NEW_PASSWORD: return 3;
      case STEP_SUCCESS: return 4;
      default: return 1;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case STEP_EMAIL: return 'Reset Password';
      case STEP_SELECT_ACCOUNT: return 'Select Account';
      case STEP_OTP: return 'Verify OTP';
      case STEP_NEW_PASSWORD: return 'New Password';
      case STEP_SUCCESS: return 'All Done!';
      default: return 'Reset Password';
    }
  };

  // ── Shared input styles (matching LoginForm) ──
  const inputSx = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: 'rgba(255,255,255,0.50)',
      fontSize: '0.92rem',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.50)' },
      '&:hover fieldset': { borderColor: '#0ea5e9' },
      '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '2px' },
    },
    '& .MuiInputBase-input': { py: 1.5, px: 2 },
  };

  const labelSx = {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#475569',
    letterSpacing: '0.08em',
    mb: 0.8,
  };

  const primaryBtnSx = {
    py: 1.5,
    borderRadius: '12px',
    background: 'linear-gradient(90deg, #1e3a8a 0%, #0ea5e9 100%)',
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '0.95rem',
    letterSpacing: '0.02em',
    boxShadow: '0 6px 24px rgba(14,165,233,0.35), 0 2px 8px rgba(30,58,138,0.2)',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'linear-gradient(90deg, #172554 0%, #0284c7 100%)',
      boxShadow: '0 8px 32px rgba(14,165,233,0.45), 0 3px 12px rgba(30,58,138,0.25)',
      transform: 'translateY(-1px)',
    },
    '&:active': { transform: 'translateY(0)' },
    '&.Mui-disabled': {
      background: 'linear-gradient(90deg, #94a3b8, #94a3b8)',
      color: '#fff',
      opacity: 0.7,
    },
  };

  const floatingIconBase = {
    position: 'absolute',
    zIndex: 1,
    bgcolor: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    p: 1.3,
    display: { xs: 'none', md: 'flex' },
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  return (
    <Box
      display="flex"
      minHeight="100vh"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ── Background image (same as login) ── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=85")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* ── Gradient overlay ── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(30,58,138,0.90) 0%, rgba(14,165,233,0.70) 50%, rgba(13,148,136,0.80) 100%)',
          zIndex: 0,
        }}
      />

      {/* ===== Floating Animated Icons ===== */}
      <Box
        sx={{
          ...floatingIconBase,
          top: '22%',
          left: 40,
          animation: 'floatUpDown 4s ease-in-out infinite, pulseGlow 3s ease-in-out infinite',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.22)',
            transform: 'scale(1.18) rotate(-5deg)',
            boxShadow: '0 8px 32px rgba(14,165,233,0.4), 0 0 20px 6px rgba(14,165,233,0.25)',
            '& .MuiSvgIcon-root': { animation: 'iconPulse 0.6s ease-in-out infinite' },
          },
        }}
      >
        <VideocamOutlined sx={{ color: '#fff', fontSize: 28, transition: 'all 0.3s ease' }} />
      </Box>

      <Box
        sx={{
          ...floatingIconBase,
          bottom: '22%',
          left: 40,
          animation: 'floatLeftRight 5s ease-in-out infinite, pulseGlow 3.5s ease-in-out infinite 0.5s',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.22)',
            transform: 'scale(1.18) rotate(5deg)',
            boxShadow: '0 8px 32px rgba(14,165,233,0.4), 0 0 20px 6px rgba(14,165,233,0.25)',
            '& .MuiSvgIcon-root': { animation: 'iconPulse 0.6s ease-in-out infinite' },
          },
        }}
      >
        <EmailOutlined sx={{ color: '#fff', fontSize: 28, transition: 'all 0.3s ease' }} />
      </Box>

      <Box
        sx={{
          ...floatingIconBase,
          bottom: '18%',
          right: 40,
          animation: 'floatUpDown 4.5s ease-in-out infinite 1s, pulseGlow 4s ease-in-out infinite 1s',
          '&:hover': {
            bgcolor: 'rgba(13,148,136,0.3)',
            transform: 'scale(1.22)',
            boxShadow: '0 8px 36px rgba(13,148,136,0.5), 0 0 24px 8px rgba(14,165,233,0.3)',
            border: '1px solid rgba(14,165,233,0.5)',
            '& .MuiSvgIcon-root': { animation: 'shieldBounce 0.8s ease-in-out', color: '#5eead4' },
          },
        }}
      >
        <VerifiedUserOutlined sx={{ color: '#fff', fontSize: 28, transition: 'color 0.3s ease' }} />
      </Box>

      {/* ===== LEFT SIDE: Form Card ===== */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          width: { xs: '100%', md: '48%' },
          zIndex: 2,
          px: { xs: 2, sm: 4, md: 6 },
          py: 4,
        }}
      >
        <Card
          elevation={0}
          sx={{
            maxWidth: 440,
            width: '100%',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.70)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.40)',
            boxShadow: '0 32px 64px -16px rgba(0,0,0,0.3)',
            animation: 'fadeSlideUp 0.8s ease-out',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Brand */}
            <Box display="flex" alignItems="center" gap={1.2} mb={3}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '13px',
                  background: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'rotate(-10deg) scale(1.08)' },
                }}
              >
                <SchoolOutlined sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                }}
              >
                iMentora
              </Typography>
            </Box>

            {/* Title */}
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: '1.85rem',
                color: '#0f172a',
                mb: 0.5,
                letterSpacing: '-0.02em',
              }}
            >
              {getStepTitle()}
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.95rem', mb: 2 }}>
              {step === STEP_SUCCESS
                ? 'Your password has been updated.'
                : 'Recover access to your account.'}
            </Typography>

            {/* Step indicator */}
            {step !== STEP_SUCCESS && (
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                {[1, 2, 3].map((s) => (
                  <Box
                    key={s}
                    sx={{
                      height: 4,
                      flex: 1,
                      borderRadius: '2px',
                      bgcolor: getStepNumber() >= s ? '#0ea5e9' : 'rgba(148,163,184,0.3)',
                      transition: 'background-color 0.4s ease',
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Alerts */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  '& .MuiAlert-icon': { fontSize: '1.2rem' },
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            {message && (
              <Alert
                severity={step === STEP_SUCCESS ? 'success' : 'info'}
                sx={{
                  mb: 2,
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  '& .MuiAlert-icon': { fontSize: '1.2rem' },
                }}
              >
                {message}
              </Alert>
            )}

            {/* ── STEP: Enter Email ── */}
            {step === STEP_EMAIL && (
              <Box component="form" onSubmit={handleEmailSubmit}>
                <Typography sx={labelSx}>EMAIL ADDRESS</Typography>
                <TextField
                  fullWidth
                  name="email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !email.trim()}
                  sx={{ ...primaryBtnSx, mb: 2 }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                      Sending...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => navigate('/login')}
                    sx={{
                      textDecoration: 'none',
                      cursor: 'pointer',
                      color: '#0ea5e9',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      '&:hover': { color: '#0284c7', textDecoration: 'underline' },
                    }}
                  >
                    <ArrowBack sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    Back to Login
                  </Link>
                </Box>
              </Box>
            )}

            {/* ── STEP: Select Account Type ── */}
            {step === STEP_SELECT_ACCOUNT && (
              <Box component="form" onSubmit={handleAccountSelect}>
                <Typography sx={labelSx}>ACCOUNT TYPE</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    displayEmpty
                    disabled={loading}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'rgba(255,255,255,0.50)',
                      fontSize: '0.92rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0ea5e9',
                        borderWidth: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0284c7',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0ea5e9',
                        borderWidth: '2px',
                      },
                      '& .MuiSelect-select': { py: 1.5, px: 2 },
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonOutlined sx={{ color: '#0ea5e9', fontSize: 20 }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.92rem' }}>
                        Select your account type
                      </Typography>
                    </MenuItem>
                    {matchedAccounts.map((type) => {
                      const config = entityTypeLabels[type] || { label: type, icon: '👤' };
                      return (
                        <MenuItem key={type} value={type}>
                          <Box display="flex" alignItems="center" gap={1.2}>
                            <Typography sx={{ fontSize: '1.1rem' }}>{config.icon}</Typography>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f172a' }}>
                              {config.label}
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !entityType}
                  sx={{ ...primaryBtnSx, mb: 1.5 }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                      Sending...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  onClick={handleStartOver}
                  sx={{
                    textTransform: 'none',
                    color: '#0ea5e9',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    '&:hover': { bgcolor: 'rgba(14,165,233,0.08)' },
                  }}
                  startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
                >
                  Back
                </Button>
              </Box>
            )}

            {/* ── STEP: Enter OTP ── */}
            {step === STEP_OTP && (
              <Box component="form" onSubmit={handleOtpSubmit}>
                <Typography sx={{ color: '#64748b', fontSize: '0.88rem', mb: 2 }}>
                  Enter the 6-digit OTP sent to <strong style={{ color: '#0f172a' }}>{email}</strong>. Valid for 10 minutes.
                </Typography>

                <Typography sx={labelSx}>ONE-TIME PASSWORD</Typography>
                <TextField
                  fullWidth
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                  }}
                  required
                  autoFocus
                  disabled={loading}
                  inputProps={{
                    maxLength: 6,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 },
                  }}
                  placeholder="● ● ● ● ● ●"
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || otp.length !== 6}
                  sx={{ ...primaryBtnSx, mb: 1.5 }}
                >
                  Verify OTP
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleResendOtp}
                  disabled={loading}
                  sx={{
                    mb: 1,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    borderColor: 'rgba(14,165,233,0.4)',
                    color: '#0ea5e9',
                    '&:hover': {
                      borderColor: '#0ea5e9',
                      bgcolor: 'rgba(14,165,233,0.06)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={18} /> : 'Resend OTP'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  onClick={handleStartOver}
                  sx={{
                    textTransform: 'none',
                    color: '#0ea5e9',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    '&:hover': { bgcolor: 'rgba(14,165,233,0.08)' },
                  }}
                  startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
                >
                  Start Over
                </Button>
              </Box>
            )}

            {/* ── STEP: New Password ── */}
            {step === STEP_NEW_PASSWORD && (
              <Box component="form" onSubmit={handlePasswordReset}>
                <Typography sx={labelSx}>NEW PASSWORD</Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  sx={inputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: '#94a3b8' }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Typography sx={labelSx}>CONFIRM PASSWORD</Typography>
                <TextField
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  sx={inputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: '#94a3b8' }}
                        >
                          {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password strength hints */}
                {newPassword && (
                  <Box sx={{ mb: 2, pl: 0.5 }}>
                    {[
                      { test: newPassword.length >= 8, label: 'At least 8 characters' },
                      { test: /[A-Z]/.test(newPassword), label: 'One uppercase letter' },
                      { test: /[a-z]/.test(newPassword), label: 'One lowercase letter' },
                      { test: /\d/.test(newPassword), label: 'One number' },
                      { test: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), label: 'One special character' },
                    ].map((rule, i) => (
                      <Typography
                        key={i}
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: rule.test ? '#10b981' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 0.3,
                        }}
                      >
                        {rule.test ? '✓' : '○'} {rule.label}
                      </Typography>
                    ))}
                  </Box>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ ...primaryBtnSx, mb: 1.5 }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setStep(STEP_OTP)}
                  sx={{
                    textTransform: 'none',
                    color: '#0ea5e9',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    '&:hover': { bgcolor: 'rgba(14,165,233,0.08)' },
                  }}
                  startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
                >
                  Back to OTP
                </Button>
              </Box>
            )}

            {/* ── STEP: Success ── */}
            {step === STEP_SUCCESS && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleOutline sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/login')}
                  sx={primaryBtnSx}
                >
                  Go to Login
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ===== RIGHT SIDE: Hero (matching login) ===== */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '52%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: 8,
          zIndex: 2,
          animation: 'fadeSlideUp 1s ease-out 0.3s both',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50px',
            px: 2.5,
            py: 0.8,
            mb: 3,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <Typography
            sx={{
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Secure Account Recovery
          </Typography>
        </Box>

        <Typography
          sx={{
            fontWeight: 900,
            fontSize: { md: '3rem', lg: '3.8rem' },
            lineHeight: 1.08,
            color: '#fff',
            mb: 2.5,
            letterSpacing: '-0.03em',
          }}
        >
          Forgot your
          <br />
          <Box
            component="span"
            sx={{
              background: 'linear-gradient(90deg, #5eead4 0%, #bfdbfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Password?
          </Box>
        </Typography>

        <Typography
          sx={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: { md: '1rem', lg: '1.12rem' },
            lineHeight: 1.7,
            maxWidth: 480,
            mb: 5,
          }}
        >
          No worries — we'll send a one-time verification code to your registered email.
          Reset your password in three simple steps and get back to your learning journey.
        </Typography>

        <Box display="flex" gap={6}>
          <Box>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: '2.2rem',
                color: '#fff',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              256-bit
            </Typography>
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                mt: 0.5,
              }}
            >
              Encryption
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: '2.2rem',
                color: '#fff',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              10 min
            </Typography>
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                mt: 0.5,
              }}
            >
              OTP Validity
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;