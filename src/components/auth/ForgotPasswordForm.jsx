

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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// Step constants
const STEP_EMAIL = 'email';
const STEP_SELECT_ACCOUNT = 'select_account';
const STEP_OTP = 'otp';
const STEP_NEW_PASSWORD = 'new_password';
const STEP_SUCCESS = 'success';

const ForgotPasswordForm = () => {
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
      const response = await forgotPassword(email.trim(), entityType || null);
      console.log('Forgot password response:', response);

      // ── FIX: Handle multi-account response properly ──
      // authService.forgotPassword now returns { multiAccount: true, matchedAccounts: [...] }
      // instead of throwing, so we can populate the dropdown correctly.
      if (response.multiAccount && response.matchedAccounts && response.matchedAccounts.length > 1) {
        setMatchedAccounts(response.matchedAccounts);
        setStep(STEP_SELECT_ACCOUNT);
        setMessage('Multiple accounts found. Please select your account type.');
        return;
      }

      // If backend returned matched accounts on success path (unlikely but handle it)
      if (response.matchedAccounts && response.matchedAccounts.length > 1) {
        setMatchedAccounts(response.matchedAccounts);
        setStep(STEP_SELECT_ACCOUNT);
        setMessage('Multiple accounts found. Please select your account type.');
        return;
      }

      // OTP sent successfully — single account
      if (response.entityType) {
        setEntityType(response.entityType);
      }
      setStep(STEP_OTP);
      setMessage('OTP has been sent to your email. Please check your inbox (and spam folder).');
    } catch (err) {
      console.error('Forgot password error:', err);

      // ── FIX: Check error.responseData for Matched_Accounts ──
      const responseData = err.responseData;
      if (responseData && responseData.Matched_Accounts && responseData.Matched_Accounts.length > 1) {
        setMatchedAccounts(responseData.Matched_Accounts);
        setStep(STEP_SELECT_ACCOUNT);
        setMessage('Multiple accounts found. Please select your account type.');
        return;
      }

      setError(err.message || 'Failed to send OTP');
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
      
      // If it's still multi-account somehow, show error
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

  // ── Step 2: Verify OTP and show new password fields ──
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

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
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

      // If OTP expired or invalid, go back to OTP step
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
      
      // Handle multi-account on resend (shouldn't happen if entityType is set)
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

  // Entity type display labels
  const entityTypeLabels = {
    super_admin: 'Super Admin',
    organization: 'Organization',
    admin: 'Admin',
    trainer: 'Trainer',
    mentor: 'Mentor',
    student: 'Student',
    company: 'Company',
    college: 'College',
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity={step === STEP_SUCCESS ? 'success' : 'info'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* ── STEP: Enter Email ── */}
      {step === STEP_EMAIL && (
        <Box component="form" onSubmit={handleEmailSubmit}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your registered email address. We'll send you a one-time password (OTP) to reset your password.
          </Typography>

          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoFocus
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send OTP'}
          </Button>
        </Box>
      )}

      {/* ── STEP: Select Account Type (multi-account) ── */}
      {step === STEP_SELECT_ACCOUNT && (
        <Box component="form" onSubmit={handleAccountSelect}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This email is linked to multiple accounts. Please select which account you want to reset:
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>Account Type</InputLabel>
            <Select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              label="Account Type"
              required
            >
              {matchedAccounts.map((type) => (
                <MenuItem key={type} value={type}>
                  {entityTypeLabels[type] || type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || !entityType}
          >
            {loading ? <CircularProgress size={24} /> : 'Send OTP'}
          </Button>

          <Button fullWidth variant="text" onClick={handleStartOver} sx={{ mb: 1 }}>
            Back
          </Button>
        </Box>
      )}

      {/* ── STEP: Enter OTP ── */}
      {step === STEP_OTP && (
        <Box component="form" onSubmit={handleOtpSubmit}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the 6-digit OTP sent to <strong>{email}</strong>. The OTP is valid for 10 minutes.
          </Typography>

          <TextField
            fullWidth
            label="Enter OTP"
            value={otp}
            onChange={(e) => {
              // Only allow digits, max 6
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtp(val);
            }}
            margin="normal"
            required
            autoFocus
            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
            placeholder="123456"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 1 }}
            disabled={loading || otp.length !== 6}
          >
            Verify OTP
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={handleResendOtp}
            disabled={loading}
            sx={{ mb: 1 }}
          >
            {loading ? <CircularProgress size={18} /> : 'Resend OTP'}
          </Button>

          <Button fullWidth variant="text" onClick={handleStartOver}>
            Start Over
          </Button>
        </Box>
      )}

      {/* ── STEP: New Password ── */}
      {step === STEP_NEW_PASSWORD && (
        <Box component="form" onSubmit={handlePasswordReset}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your new password. It must be at least 8 characters with uppercase, lowercase, number, and special character.
          </Typography>

          <TextField
            fullWidth
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
            autoFocus
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>

          <Button fullWidth variant="text" onClick={() => setStep(STEP_OTP)}>
            Back to OTP
          </Button>
        </Box>
      )}

      {/* ── STEP: Success ── */}
      {step === STEP_SUCCESS && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your password has been reset successfully. You can now login with your new password.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            href="/login"
          >
            Go to Login
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ForgotPasswordForm;
