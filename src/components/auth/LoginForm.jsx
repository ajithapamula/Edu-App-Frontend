import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  Collapse
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  VideocamOutlined,
  EmailOutlined,
  VerifiedUserOutlined,
  SchoolOutlined,
  PersonOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/* ——— keyframes injected once ——— */
const keyframesStyle = document.getElementById('login-keyframes') || (() => {
  const style = document.createElement('style');
  style.id = 'login-keyframes';
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
    @keyframes slideDown {
      0% { opacity: 0; transform: translateY(-10px); max-height: 0; }
      100% { opacity: 1; transform: translateY(0); max-height: 120px; }
    }
  `;
  document.head.appendChild(style);
  return style;
})();

/* ——— Entity type display labels & icons ——— */
const ENTITY_LABELS = {
  trainer: { label: 'Trainer', icon: '🎓' },
  mentor: { label: 'Mentor', icon: '👨‍🏫' },
  student: { label: 'Student', icon: '📚' },
  admin: { label: 'Admin', icon: '🛡️' },
  super_admin: { label: 'Super Admin', icon: '⚙️' },
  organization: { label: 'Organization', icon: '🏢' },
};

/* ——— Dashboard routes per entity type ——— */
const DASHBOARD_ROUTES = {
  trainer: '/trainer',
  mentor: '/mentor',
  student: '/student',
  admin: '/admin',
  super_admin: '/super-admin',
  organization: '/organization',
};

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  // ── Multi-account selection state ──
  const [matchedAccounts, setMatchedAccounts] = useState([]);   // e.g. ['trainer', 'mentor', 'student']
  const [selectedEntityType, setSelectedEntityType] = useState(''); // user's chosen type
  const [showEntitySelect, setShowEntitySelect] = useState(false);  // controls dropdown visibility

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');

    // If user changes email/password after seeing entity selector, reset it
    if (showEntitySelect && (e.target.name === 'email' || e.target.name === 'password')) {
      setShowEntitySelect(false);
      setMatchedAccounts([]);
      setSelectedEntityType('');
    }
  };

  const handleEntityChange = (e) => {
    setSelectedEntityType(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Determine Entity_Type to send:
      //   - If dropdown is visible and user selected a type, send it
      //   - Otherwise, send null (first attempt)
      const entityType = showEntitySelect && selectedEntityType ? selectedEntityType : null;

      const response = await login(formData.email, formData.password, entityType);

      // ── Login successful ──
      const userRole = response?.data?.user?.role       // adjust based on your actual response shape
                    || response?.data?.Entity_Type
                    || response?.Entity_Type
                    || entityType;

      if (!userRole) {
        setError('Login failed. Unable to determine user role.');
        return;
      }

      // Navigate to the correct dashboard
      const route = DASHBOARD_ROUTES[userRole] || '/';
      navigate(route);

    } catch (err) {
      const msg = err?.message || '';
      const responseData = err?.response?.data || err?.data || {};

      // ── Check if it's the "multiple accounts" error ──
      const matchedTypes = responseData?.Matched_Accounts;

      if (
        matchedTypes && Array.isArray(matchedTypes) && matchedTypes.length > 1
      ) {
        // Show entity type dropdown instead of error
        setMatchedAccounts(matchedTypes);
        setShowEntitySelect(true);
        setSelectedEntityType('');  // force user to pick
        setError('Multiple accounts found with this email. Please select your account type below.');
        return;
      }

      // ── Also detect from error message string (fallback) ──
      if (
        msg.toLowerCase().includes('multiple accounts') ||
        msg.toLowerCase().includes('select your account type')
      ) {
        // Try to parse matched accounts from the message or use defaults
        const fallbackTypes = matchedTypes || ['trainer', 'mentor', 'student'];
        setMatchedAccounts(fallbackTypes);
        setShowEntitySelect(true);
        setSelectedEntityType('');
        setError('Multiple accounts found with this email. Please select your account type below.');
        return;
      }

      // ── Standard error messages ──
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('password')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else if (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('approval')) {
        setError('Your account is pending admin approval. Please contact your administrator.');
      } else {
        setError(msg || 'Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
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
      {/* ── Students, books & laptops background ── */}
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

      {/* ── gradient overlay ── */}
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

      {/* ===== LEFT SIDE: Login Form Card ===== */}
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
              Login
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.95rem', mb: 3 }}>
              Access your mentor-led journey.
            </Typography>

            {error && (
              <Alert
                severity={showEntitySelect ? 'info' : 'error'}
                sx={{
                  mb: 2,
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  '& .MuiAlert-icon': { fontSize: '1.2rem' },
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#475569',
                  letterSpacing: '0.08em',
                  mb: 0.8,
                  mt: 1,
                }}
              >
                EMAIL ADDRESS
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                placeholder="name@university.edu"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
                variant="outlined"
                sx={{
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
                }}
              />

              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#475569',
                  letterSpacing: '0.08em',
                  mb: 0.8,
                }}
              >
                PASSWORD
              </Typography>
              <TextField
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                disabled={loading}
                variant="outlined"
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
                sx={{
  mb: 1.5,
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    bgcolor: 'rgba(255,255,255,0.50)',
    fontSize: '0.92rem',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.50)' },
    '&:hover fieldset': { borderColor: '#0ea5e9' },
    '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '2px' },
  },
  '& .MuiInputBase-input': {
    py: 1.5,
    px: 2,
    '&::-ms-reveal, &::-ms-clear': { display: 'none' },           // ← NEW (Edge)
    '&::-webkit-credentials-auto-fill-button': { display: 'none' }, // ← NEW (Chrome)
    '&::-webkit-textfield-decoration-container': { display: 'none' }, // ← NEW (Safari)
  },
}}
              />

              {/* ══════════════════════════════════════════════
                  ENTITY TYPE DROPDOWN — only visible when
                  the same email exists in multiple tables
                 ══════════════════════════════════════════════ */}
              <Collapse in={showEntitySelect} timeout={400}>
                <Box sx={{ mb: 2, animation: showEntitySelect ? 'slideDown 0.4s ease-out' : 'none' }}>
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#475569',
                      letterSpacing: '0.08em',
                      mb: 0.8,
                    }}
                  >
                    ACCOUNT TYPE
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={selectedEntityType}
                      onChange={handleEntityChange}
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
                        const config = ENTITY_LABELS[type] || { label: type, icon: '👤' };
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
                </Box>
              </Collapse>

              {/* Remember + Forgot */}
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      size="small"
                      sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#0ea5e9' }, p: 0.5 }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>Remember device</Typography>
                  }
                  sx={{ ml: 0 }}
                />
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/forgot-password')}
                  sx={{
                    textDecoration: 'none',
                    cursor: 'pointer',
                    color: '#0ea5e9',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    '&:hover': { color: '#0284c7', textDecoration: 'underline' },
                  }}
                  disabled={loading}
                >
                  Forgot?
                </Link>
              </Box>

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={
                  loading ||
                  !formData.email ||
                  !formData.password ||
                  (showEntitySelect && !selectedEntityType) // must pick entity type if dropdown is showing
                }
                sx={{
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
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                    Signing In...
                  </>
                ) : showEntitySelect && selectedEntityType ? (
                  `Continue as ${ENTITY_LABELS[selectedEntityType]?.label || selectedEntityType}`
                ) : (
                  'Authorize Access'
                )}
              </Button>

              <Box textAlign="center" sx={{ mt: 2.5 }}>
                <Typography component="span" sx={{ fontSize: '0.88rem', color: '#64748b' }}>
                  New applicant?{' '}
                </Typography>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  sx={{
                    textDecoration: 'none',
                    cursor: 'pointer',
                    color: '#0ea5e9',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    '&:hover': { color: '#0284c7', textDecoration: 'underline' },
                  }}
                  disabled={loading}
                >
                  Create Account
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ===== RIGHT SIDE: Hero ===== */}
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
            AI-Powered Mentorship
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
          Interview
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
            Confidence.
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
          Unlock your career potential with iMentora. Experience the world's most advanced mock interview
          platform designed for the next generation of talent.
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
              50k+
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
              Students Hired
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
              100%
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
              Precision
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm;