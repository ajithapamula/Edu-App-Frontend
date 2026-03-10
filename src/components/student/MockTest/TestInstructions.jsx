// src/components/student/MockTest/TestInstructions.jsx
// UI Updated: iMeetPro teal/cyan theme applied
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Paper,
  useTheme,
  alpha,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Code as CodeIcon,
  Calculate as CalculateIcon,
  MenuBook as MenuBookIcon,
  Timer as TimerIcon,
  PlayArrow as PlayArrowIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Rule as RuleIcon,
  Laptop as LaptopIcon,
  FiberManualRecord as RecordIcon,
  ArrowBack as ArrowBackIcon,
  Face as FaceIcon,
  LightMode as LightModeIcon,
  Block as BlockIcon,
  VolumeUp as VolumeUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// ═══ iMeetPro Theme Tokens ═══
const T = {
  primary: '#00838f',
  primaryLight: '#26c6da',
  primaryDark: '#004d54',
  secondary: '#0d9488',
  secondaryLight: '#5eead4',
  navy: '#1a5276',
  blue: '#2980b9',
  blueLight: '#3498c8',
  text: '#0f172a',
  textSec: '#64748b',
  textMuted: '#94a3b8',
  surface: '#f0f4f8',
  card: '#fff',
  border: 'rgba(41,128,185,0.08)',
  borderMed: 'rgba(41,128,185,0.15)',
  success: '#0d9488',
  warning: '#f59e0b',
  error: '#ef4444',
  gPrimary: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
  gTeal: 'linear-gradient(135deg, #00838f 0%, #26c6da 100%)',
  gSuccess: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)',
  gCoding: 'linear-gradient(135deg, #1a5276 0%, #0d9488 100%)',
};

const cardBase = {
  borderRadius: '18px',
  background: T.card,
  border: `1px solid ${T.border}`,
  boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
  overflow: 'hidden',
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 24px rgba(26,82,118,0.10), 0 1px 4px rgba(41,128,185,0.06)',
  },
};

const TestInstructions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Get test data from navigation state
  const { testData, testConfig } = location.state || {};

  const isDevTest = testConfig?.user_type === 'dev';

const testMeta = isDevTest
  ? {
      totalQuestions: 25,
      totalTime: 62,
      sectionsCount: 3,
      sections: [
        { name: 'Aptitude', count: 10, totalTime: '20 min', icon: CalculateIcon, color: T.blue, gradient: 'linear-gradient(135deg, #2980b9 0%, #3498c8 100%)' },
        { name: ' MCQs', count: 10, totalTime: '20 min', icon: MenuBookIcon, color: T.primary, gradient: T.gTeal },
        { name: 'Coding', count: 5, totalTime: '25 min', icon: CodeIcon, color: T.navy, gradient: T.gCoding }
      ]
    }
  : {
      totalQuestions: 25,
      totalTime: 70,
      sectionsCount: 3,
      sections: [
        { name: 'Aptitude', count: 10, totalTime: ' 10 min', icon: CalculateIcon, color: T.blue, gradient: 'linear-gradient(135deg, #2980b9 0%, #3498c8 100%)' },
        { name: 'MCQs', count: 10, totalTime: ' 10 min', icon: MenuBookIcon, color: T.primary, gradient: T.gTeal },
        { name: 'Coding', count: 5, totalTime: ' 50 min', icon: CodeIcon, color: T.navy, gradient: T.gCoding },
      ]
    };


  // States
  const [cameraStatus, setCameraStatus] = useState('pending'); // 'pending', 'checking', 'granted', 'denied', 'error'
  const [cameraError, setCameraError] = useState('');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [agreedToProctoring, setAgreedToProctoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [systemChecks, setSystemChecks] = useState({
    browser: { status: 'pending', message: '' },
    camera: { status: 'pending', message: '' },
    internet: { status: 'pending', message: '' },
    fullscreen: { status: 'pending', message: '' }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Redirect if no test data
  useEffect(() => {
    if (!testData) {
      navigate('/student/mock-tests/start');
    }
  }, [testData, navigate]);

  // Run system checks when component mounts
  useEffect(() => {
    runSystemChecks();
  }, []);

  const runSystemChecks = async () => {
    // Check browser compatibility
    setSystemChecks(prev => ({
      ...prev,
      browser: { status: 'checking', message: 'Checking browser...' }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    setSystemChecks(prev => ({
      ...prev,
      browser: { 
        status: 'passed', 
        message: `${isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isEdge ? 'Edge' : isSafari ? 'Safari' : 'Browser'} detected` 
      }
    }));

    // Check internet connection
    setSystemChecks(prev => ({
      ...prev,
      internet: { status: 'checking', message: 'Checking internet...' }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSystemChecks(prev => ({
      ...prev,
      internet: { 
        status: navigator.onLine ? 'passed' : 'failed', 
        message: navigator.onLine ? 'Connected' : 'No internet connection' 
      }
    }));

    // Check fullscreen support
    setSystemChecks(prev => ({
      ...prev,
      fullscreen: { status: 'checking', message: 'Checking fullscreen...' }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const fullscreenSupported = document.fullscreenEnabled || 
                                document.webkitFullscreenEnabled || 
                                document.mozFullScreenEnabled ||
                                document.msFullscreenEnabled;
    
    setSystemChecks(prev => ({
      ...prev,
      fullscreen: { 
        status: fullscreenSupported ? 'passed' : 'warning', 
        message: fullscreenSupported ? 'Supported' : 'Not fully supported' 
      }
    }));
  };

  const startCamera = useCallback(async () => {
    setCameraStatus('checking');
    setCameraError('');
    setVideoReady(false);
    
    setSystemChecks(prev => ({
      ...prev,
      camera: { status: 'checking', message: 'Requesting camera access...' }
    }));

    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      });

      streamRef.current = stream;

      // Wait for video element to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Add event listeners for video ready state
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current.play()
            .then(() => {
              console.log('Video playing successfully');
              setVideoReady(true);
              setCameraStatus('granted');
              setSystemChecks(prev => ({
                ...prev,
                camera: { status: 'passed', message: 'Camera working' }
              }));
            })
            .catch(err => {
              console.error('Video play error:', err);
              setCameraError('Failed to play video stream');
              setCameraStatus('error');
            });
        };

        videoRef.current.onerror = (err) => {
          console.error('Video element error:', err);
          setCameraError('Video element error');
          setCameraStatus('error');
        };
      }

    } catch (err) {
      console.error('Camera error:', err);
      
      let errorMessage = 'Failed to access camera';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
        setCameraStatus('denied');
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera.';
        setCameraStatus('error');
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application. Please close other apps using the camera.';
        setCameraStatus('error');
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported. Trying with basic settings...';
        // Try again with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = basicStream;
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            await videoRef.current.play();
            setVideoReady(true);
            setCameraStatus('granted');
            setSystemChecks(prev => ({
              ...prev,
              camera: { status: 'passed', message: 'Camera working (basic mode)' }
            }));
            return;
          }
        } catch (basicErr) {
          errorMessage = 'Failed to access camera with any settings.';
          setCameraStatus('error',basicErr);
        }
      } else {
        setCameraStatus('error');
      }
      
      setCameraError(errorMessage);
      setSystemChecks(prev => ({
        ...prev,
        camera: { status: 'failed', message: errorMessage }
      }));
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoReady(false);
  }, []);

  const retryCamera = useCallback(() => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 500);
  }, [stopCamera, startCamera]);

  const handleStartExam = () => {
    if (!agreedToRules || !agreedToProctoring || cameraStatus !== 'granted') {
      return;
    }

    setLoading(true);

    // Stop the preview stream - the test page will create its own
    stopCamera();

    const testType = testConfig?.user_type || 'dev';
    const testRoute = testType === 'dev' 
    
    ? '/student/mock-tests/developer-test' 
    : '/student/mock-tests/non-developer-test';

    // Navigate to test with all data
    navigate(testRoute, {
      state: {
        testData,
        testConfig,
        proctorEnabled: true,
        instructionsAccepted: true,
        startTime: Date.now()
      }
    });
  };

  const handleBack = () => {
    stopCamera();
    navigate('/student/mock-tests/start');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon sx={{ color: T.success }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: T.error }} />;
      case 'warning':
        return <WarningIcon sx={{ color: T.warning }} />;
      case 'checking':
        return <CircularProgress size={20} sx={{ color: T.primary }} />;
      default:
        return <InfoIcon sx={{ color: T.textMuted }} />;
    }
  };

  const allChecksPass = systemChecks.browser.status === 'passed' &&
                        systemChecks.camera.status === 'passed' &&
                        systemChecks.internet.status === 'passed';

  const canStartExam = allChecksPass && agreedToRules && agreedToProctoring && cameraStatus === 'granted';


  return (
    <Box sx={{ bgcolor: T.surface, minHeight: '100vh', fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif" }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          ...cardBase,
          p: 3, 
          mb: 3, 
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle background circles */}
        <Box sx={{ position: 'absolute', top: -40, right: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(41,128,185,0.03)', display: { xs: 'none', sm: 'block' } }} />
        <Box sx={{ position: 'absolute', bottom: -30, right: 120, width: 100, height: 100, borderRadius: '50%', background: 'rgba(13,148,136,0.03)', display: { xs: 'none', sm: 'block' } }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: T.gPrimary,
                boxShadow: '0 4px 14px rgba(41,128,185,0.25)',
                color: '#fff'
              }}
            >
              <AssignmentIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
                Test Instructions
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: T.textSec }}>
                Please read carefully before starting your exam
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderRadius: '12px',
              borderColor: T.borderMed,
              color: T.blue,
              px: 2.5,
              '&:hover': { bgcolor: 'rgba(41,128,185,0.06)', borderColor: T.blue }
            }}
          >
            Back to Tests
          </Button>
        </Box>
      </Paper>

      {/* Main Content - Two Column Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1fr 400px'
          },
          gap: 2.5,
          width: '100%'
        }}
      >
        {/* Left Column - Instructions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Test Overview */}
          <Card elevation={0} sx={{ ...cardBase }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: T.gTeal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <InfoIcon sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>
                  Test Overview
                </Typography>
              </Box>
              
              <Box
  sx={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 2,
    mb: 3
  }}
>
  {/* Questions */}
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      textAlign: 'center',
      backgroundColor: 'rgba(41,128,185,0.05)',
      borderRadius: '14px',
      border: `1px solid rgba(41,128,185,0.08)`
    }}
  >
    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: T.blue, lineHeight: 1 }}>
      {testMeta.totalQuestions}
    </Typography>
    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
      Questions
    </Typography>
  </Paper>

  {/* Time */}
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      textAlign: 'center',
      backgroundColor: 'rgba(0,131,143,0.05)',
      borderRadius: '14px',
      border: '1px solid rgba(0,131,143,0.08)'
    }}
  >
    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: T.primary, lineHeight: 1 }}>
      {testMeta.totalTime}
    </Typography>
    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
      Minutes
    </Typography>
  </Paper>

  {/* Sections */}
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      textAlign: 'center',
      backgroundColor: 'rgba(13,148,136,0.05)',
      borderRadius: '14px',
      border: '1px solid rgba(13,148,136,0.08)'
    }}
  >
    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: T.secondary, lineHeight: 1 }}>
      {testMeta.sectionsCount}
    </Typography>
    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
      Sections
    </Typography>
  </Paper>
</Box>


              {/* Section Breakdown */}
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                Section Breakdown
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {testMeta.sections.map((section, index) => (
                  <Chip
                    key={index}
                    icon={React.createElement(section.icon, { sx: { fontSize: '15px !important', color: `${section.color} !important` } })}
                    label={`${section.name}: ${section.count}Q (${section.totalTime})`}
                    sx={{
                      backgroundColor: alpha(section.color, 0.08),
                      color: section.color,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderRadius: '10px',
                      height: 32,
                      border: `1px solid ${alpha(section.color, 0.12)}`
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Exam Rules */}
          <Card elevation={0} sx={{ ...cardBase }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RuleIcon sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: T.text }}>
                  Exam Rules
                </Typography>
              </Box>

              <List dense sx={{ '& .MuiListItem-root': { py: 0.8, px: 1.5, borderRadius: '10px', mb: 0.5, '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' } } }}>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: T.success }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Each question has a time limit"
                    secondary="Answer before the timer runs out, auto-submit on timeout"
                    primaryTypographyProps={{ sx: { fontSize: '0.88rem', fontWeight: 600, color: T.text } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: T.textMuted } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: T.success }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="You can go back to previous questions"
                    secondary="Review your answer carefully before submitting"
                    primaryTypographyProps={{ sx: { fontSize: '0.88rem', fontWeight: 600, color: T.text } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: T.textMuted } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: T.success }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Complete each section before moving to next"
                    secondary="Aptitude → Theory → Coding"
                    primaryTypographyProps={{ sx: { fontSize: '0.88rem', fontWeight: 600, color: T.text } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: T.textMuted } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <WarningIcon sx={{ fontSize: 18, color: T.warning }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Do not refresh or close the browser"
                    secondary="You may lose your progress"
                    primaryTypographyProps={{ sx: { fontSize: '0.88rem', fontWeight: 600, color: T.text } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: T.textMuted } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <WarningIcon sx={{ fontSize: 18, color: T.warning }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Do not switch tabs or windows"
                    secondary="This will be recorded as a violation"
                    primaryTypographyProps={{ sx: { fontSize: '0.88rem', fontWeight: 600, color: T.text } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: T.textMuted } }}
                  />
                </ListItem>
              </List>

              <FormControlLabel
                control={
                  <Checkbox 
                    checked={agreedToRules}
                    onChange={(e) => setAgreedToRules(e.target.checked)}
                    sx={{
                      color: T.textMuted,
                      '&.Mui-checked': { color: T.primary }
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.82rem', color: T.textSec }}>
                    I have read and agree to follow all exam rules
                  </Typography>
                }
                sx={{ mt: 2, ml: 0.5 }}
              />
            </CardContent>
          </Card>

          {/* Proctoring Guidelines */}
          <Card elevation={0} sx={{ ...cardBase, border: `1px solid rgba(239,68,68,0.15)` }}>
            <Box sx={{ height: 4, background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SecurityIcon sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: T.error }}>
                  Proctoring Guidelines
                </Typography>
              </Box>

              <Alert 
                severity="info" 
                sx={{ 
                  mb: 2.5, 
                  borderRadius: '12px', 
                  border: '1px solid rgba(41,128,185,0.15)', 
                  bgcolor: 'rgba(41,128,185,0.04)',
                  '& .MuiAlert-icon': { color: T.blue }
                }}
              >
                This is a proctored exam. Your camera will be active throughout the test.
              </Alert>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2
                }}
              >
                <Paper elevation={0} sx={{ p: 2.5, backgroundColor: 'rgba(13,148,136,0.04)', borderRadius: '14px', border: '1px solid rgba(13,148,136,0.1)', height: '100%' }}>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.success, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
                    ✓ Do's
                  </Typography>
                  <List dense disablePadding>
                    <ListItem disableGutters sx={{ py: 0.4 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <FaceIcon sx={{ fontSize: 16, color: T.success }} />
                      </ListItemIcon>
                      <ListItemText primary="Keep your face visible" primaryTypographyProps={{ sx: { fontSize: '0.82rem', color: T.text } }} />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 0.4 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <LightModeIcon sx={{ fontSize: 16, color: T.success }} />
                      </ListItemIcon>
                      <ListItemText primary="Ensure good lighting" primaryTypographyProps={{ sx: { fontSize: '0.82rem', color: T.text } }} />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 0.4 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <LaptopIcon sx={{ fontSize: 16, color: T.success }} />
                      </ListItemIcon>
                      <ListItemText primary="Stay in front of camera" primaryTypographyProps={{ sx: { fontSize: '0.82rem', color: T.text } }} />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 0.4 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <VolumeUpIcon sx={{ fontSize: 16, color: T.success }} />
                      </ListItemIcon>
                      <ListItemText primary="Keep environment quiet" primaryTypographyProps={{ sx: { fontSize: '0.82rem', color: T.text } }} />
                    </ListItem>
                  </List>
                </Paper>
                <Paper elevation={0} sx={{ p: 2.5, backgroundColor: 'rgba(239,68,68,0.03)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.1)', height: '100%' }}>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.error, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
                    ✗ Don'ts
                  </Typography>
                  <List dense disablePadding>
                    <ListItem disableGutters sx={{ py: 0.4 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <BlockIcon sx={{ fontSize: 16, color: T.error }} />
                      </ListItemIcon>
                      <ListItemText primary="Don't cover the camera" primaryTypographyProps={{ sx: { fontSize: '0.82rem', color: T.text } }} />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 0.4 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <BlockIcon sx={{ fontSize: 16, color: T.error }} />
                      </ListItemIcon>
                      <ListItemText primary="Don't look away frequently" primaryTypographyProps={{ sx: { fontSize: '0.82rem', color: T.text } }} />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 0.4 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <BlockIcon sx={{ fontSize: 16, color: T.error }} />
                      </ListItemIcon>
                      <ListItemText primary="Don't use other devices" primaryTypographyProps={{ sx: { fontSize: '0.82rem', color: T.text } }} />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 0.4 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <BlockIcon sx={{ fontSize: 16, color: T.error }} />
                      </ListItemIcon>
                      <ListItemText primary="Don't talk to others" primaryTypographyProps={{ sx: { fontSize: '0.82rem', color: T.text } }} />
                    </ListItem>
                  </List>
                </Paper>
              </Box>

              <FormControlLabel
                control={
                  <Checkbox 
                    checked={agreedToProctoring}
                    onChange={(e) => setAgreedToProctoring(e.target.checked)}
                    sx={{
                      color: T.textMuted,
                      '&.Mui-checked': { color: T.error }
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.82rem', color: T.textSec }}>
                    I understand that I will be monitored and agree to proctoring terms
                  </Typography>
                }
                sx={{ mt: 2, ml: 0.5 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Right Column - System Check & Camera (Fixed Width) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* System Check */}
          <Card elevation={0} sx={{ ...cardBase }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: T.gPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LaptopIcon sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: T.text }}>
                  System Check
                </Typography>
              </Box>

              <List dense sx={{ '& .MuiListItem-root': { py: 0.8, px: 1, borderRadius: '10px', mb: 0.3 } }}>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getStatusIcon(systemChecks.browser.status)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Browser"
                    secondary={systemChecks.browser.message || 'Checking...'}
                    primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 600, color: T.text } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.72rem', color: T.textMuted } }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getStatusIcon(systemChecks.internet.status)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Internet"
                    secondary={systemChecks.internet.message || 'Checking...'}
                    primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 600, color: T.text } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.72rem', color: T.textMuted } }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getStatusIcon(systemChecks.camera.status)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Camera"
                    secondary={systemChecks.camera.message || 'Click button to check'}
                    primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 600, color: T.text } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.72rem', color: T.textMuted } }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getStatusIcon(systemChecks.fullscreen.status)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Fullscreen"
                    secondary={systemChecks.fullscreen.message || 'Checking...'}
                    primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 600, color: T.text } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.72rem', color: T.textMuted } }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Camera Setup */}
          <Card 
            elevation={0} 
            sx={{ 
              ...cardBase,
              border: cameraStatus === 'granted' 
                ? `1px solid rgba(13,148,136,0.3)` 
                : `1px solid ${T.border}`
            }}
          >
            {cameraStatus === 'granted' && <Box sx={{ height: 3, background: T.gSuccess }} />}
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: cameraStatus === 'granted' ? T.gSuccess : T.gTeal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VideocamIcon sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: T.text }}>
                  Camera Setup
                </Typography>
                {cameraStatus === 'granted' && videoReady && (
                  <Chip 
                    label="Ready" 
                    size="small" 
                    icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{ 
                      ml: 'auto', 
                      bgcolor: 'rgba(13,148,136,0.1)', 
                      color: T.success, 
                      fontWeight: 600, 
                      fontSize: '0.7rem', 
                      borderRadius: '8px',
                      '& .MuiChip-icon': { color: T.success }
                    }}
                  />
                )}
              </Box>

              {/* Camera Preview - Compact Size */}
              <Paper
                elevation={0}
                sx={{
                  width: '100%',
                  height: 200,
                  mb: 2,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  backgroundColor: '#0a1f3d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {/* Video Element - Always rendered but hidden when not ready */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    display: videoReady ? 'block' : 'none'
                  }}
                />

                {/* Preview indicator when video is ready */}
                {videoReady && cameraStatus === 'granted' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: '6px',
                      px: 1,
                      py: 0.25
                    }}
                  >
                    <RecordIcon 
                      sx={{ 
                        fontSize: 8, 
                        color: T.success, 
                        animation: 'pulse 1.5s infinite' 
                      }} 
                    />
                    <Typography sx={{ color: 'white', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                      PREVIEW
                    </Typography>
                  </Box>
                )}

                {/* Face detection indicator */}
                {videoReady && cameraStatus === 'granted' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: '6px',
                      px: 0.75,
                      py: 0.25
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 12, color: T.success }} />
                  </Box>
                )}

                {/* Loading state */}
                {cameraStatus === 'checking' && (
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <CircularProgress size={32} sx={{ color: T.primaryLight, mb: 1 }} />
                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                      Accessing camera...
                    </Typography>
                  </Box>
                )}

                {/* Pending state - camera not started */}
                {cameraStatus === 'pending' && (
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <VideocamOffIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.25)', mb: 0.5 }} />
                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                      Click "Enable Camera" to start
                    </Typography>
                  </Box>
                )}

                {/* Error/Denied state */}
                {(cameraStatus === 'error' || cameraStatus === 'denied') && !videoReady && (
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <VideocamOffIcon sx={{ fontSize: 40, color: T.error, mb: 0.5 }} />
                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                      Camera access failed
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Camera Error */}
              {cameraError && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2, 
                    py: 0.5, 
                    borderRadius: '12px', 
                    border: '1px solid rgba(239,68,68,0.2)',
                    '& .MuiAlert-icon': { color: T.error }
                  }}
                  action={
                    <Button 
                      size="small" 
                      onClick={retryCamera} 
                      startIcon={<RefreshIcon />}
                      sx={{ textTransform: 'none', fontWeight: 600, color: T.error, fontSize: '0.75rem' }}
                    >
                      Retry
                    </Button>
                  }
                >
                  <Typography sx={{ fontSize: '0.75rem' }}>{cameraError}</Typography>
                </Alert>
              )}

              {/* Camera Tips */}
              {cameraStatus !== 'granted' && !cameraError && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 2, 
                    py: 0.5, 
                    borderRadius: '12px', 
                    border: '1px solid rgba(41,128,185,0.15)', 
                    bgcolor: 'rgba(41,128,185,0.04)',
                    '& .MuiAlert-icon': { color: T.blue }
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem' }}>
                    Position yourself with good lighting. Face should be visible.
                  </Typography>
                </Alert>
              )}

              {/* Camera Button */}
              {cameraStatus !== 'granted' && (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={cameraStatus === 'checking' ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <VideocamIcon />}
                  onClick={startCamera}
                  disabled={cameraStatus === 'checking'}
                  sx={{ 
                    py: 1.25, 
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    background: T.gTeal,
                    boxShadow: '0 4px 12px rgba(0,131,143,0.25)',
                    '&:hover': { boxShadow: '0 6px 18px rgba(0,131,143,0.35)' },
                    '&.Mui-disabled': { background: 'rgba(148,163,184,0.15)', color: 'rgba(148,163,184,0.5)' }
                  }}
                >
                  {cameraStatus === 'checking' ? 'Checking...' : 'Enable Camera'}
                </Button>
              )}

              {/* Retry button when granted but video not ready */}
              {cameraStatus === 'granted' && !videoReady && (
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={retryCamera}
                  sx={{ 
                    py: 1.25, 
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: T.borderMed,
                    color: T.blue,
                    '&:hover': { bgcolor: 'rgba(41,128,185,0.06)', borderColor: T.blue }
                  }}
                >
                  Retry Camera
                </Button>
              )}

              {cameraStatus === 'granted' && videoReady && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    py: 0.5, 
                    borderRadius: '12px', 
                    border: '1px solid rgba(13,148,136,0.2)', 
                    bgcolor: 'rgba(13,148,136,0.04)',
                    '& .MuiAlert-icon': { color: T.success }
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 14 }} />
                    Camera ready! You're all set.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Start Exam Button */}
          <Card 
            elevation={0} 
            sx={{ 
              ...cardBase,
              backgroundColor: canStartExam 
                ? 'rgba(13,148,136,0.04)' 
                : T.card,
              border: canStartExam 
                ? '1px solid rgba(13,148,136,0.15)' 
                : `1px solid ${T.border}`
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              {!canStartExam && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 2, 
                    py: 0.5, 
                    borderRadius: '12px', 
                    border: '1px solid rgba(245,158,11,0.2)',
                    '& .MuiAlert-icon': { color: T.warning }
                  }}
                >
                  <Typography variant="caption" component="div" sx={{ fontSize: '0.75rem' }}>
                    Please complete:
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                      {cameraStatus !== 'granted' && <li>Enable camera</li>}
                      {cameraStatus === 'granted' && !videoReady && <li>Wait for camera</li>}
                      {!agreedToRules && <li>Accept exam rules</li>}
                      {!agreedToProctoring && <li>Accept proctoring</li>}
                    </ul>
                  </Typography>
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <PlayArrowIcon />}
                onClick={handleStartExam}
                disabled={!canStartExam || loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '14px',
                  textTransform: 'none',
                  background: canStartExam ? T.gSuccess : 'rgba(148,163,184,0.15)',
                  color: canStartExam ? '#fff' : 'rgba(148,163,184,0.5)',
                  boxShadow: canStartExam ? '0 4px 16px rgba(13,148,136,0.3)' : 'none',
                  '&:hover': {
                    transform: canStartExam ? 'translateY(-2px)' : 'none',
                    boxShadow: canStartExam ? '0 8px 24px rgba(13,148,136,0.4)' : 'none'
                  },
                  '&.Mui-disabled': {
                    background: 'rgba(148,163,184,0.12)',
                    color: 'rgba(148,163,184,0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Starting...' : 'Start Exam'}
              </Button>

              <Typography sx={{ fontSize: '0.72rem', color: T.textMuted, textAlign: 'center', mt: 1.5 }}>
                By starting, you confirm you're ready for the exam
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* CSS for animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
    </Container>
    </Box>
  );
};

export default TestInstructions;