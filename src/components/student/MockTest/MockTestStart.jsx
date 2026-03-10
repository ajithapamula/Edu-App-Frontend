// src/components/student/MockTest/MockTestStart.jsx
// UPDATED: Navigation uses replace to prevent back-button access to test routes
// UI Updated: iMeetPro teal/cyan theme applied

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider
} from '@mui/material';
import {
  Code as CodeIcon,
  Calculate as CalculateIcon,
  MenuBook as MenuBookIcon,
  Timer as TimerIcon,
  PlayArrow as PlayArrowIcon,
  School as SchoolIcon,
  Videocam as VideocamIcon,
  Settings as SettingsIcon,
  Quiz as QuizIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { mockTestAPI } from '../../../services/API/studentmocktest';

// Dashboard color tokens
const colors = {
  primary: '#2980b9',
  primaryDark: '#1a5276',
  teal: '#0d9488',
  tealLight: '#5eead4',
  cyan: '#26c6da',
  cyanDark: '#00838f',
  dark: '#0f172a',
  subtle: '#64748b',
  muted: '#94a3b8',
  bg: '#f0f4f8',
  cardBorder: 'rgba(41,128,185,0.08)',
  cardShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
  gradientPrimary: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
  gradientTeal: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)',
  gradientMixed: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)',
  accent: '#e65100',
  // Section colors
  aptitude: '#2980b9',
  mcq: '#0d9488',
  coding: '#e65100',
  nondev: '#0d9488'
};

const cardBase = {
  borderRadius: '18px',
  background: '#fff',
  border: `1px solid ${colors.cardBorder}`,
  boxShadow: colors.cardShadow,
  overflow: 'hidden',
  transition: 'box-shadow 0.3s ease, transform 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 24px rgba(26,82,118,0.10), 0 1px 4px rgba(41,128,185,0.06)',
    transform: 'translateY(-3px)',
  },
};

const MockTestStart = () => {
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  // ════════════════════════════════════════════════════════════════════
  // GUARD: If user lands here via back button during/after a test,
  // check sessionStorage and redirect away from test routes
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Clean up any stale forward history entries by replacing current state
    window.history.replaceState({ page: 'mock-test-start' }, '', window.location.href);
  }, []);

  const handleStartTest = async (testType) => {
    setLoading(true);
    setLoadingType(testType);
    setError('');

    try {
      const testConfig = {
        student_id: localStorage.getItem('student_id') || null,
        timestamp: Date.now()
      };

      console.log('Starting test with config:', testConfig);

      const testData = await mockTestAPI.startTestWithConfig(testConfig);
      console.log('Test started successfully:', testData);

      // Mark test as active in sessionStorage so we can detect back-navigation
      if (testData.testId) {
        sessionStorage.setItem(`test_active_${testData.testId}`, 'true');
      }

      const navigationState = {
        testData: {
          testId: testData.testId,
          sessionId: testData.sessionId,
          userType: testData.userType,
          totalQuestions: testData.totalQuestions,
          timeLimit: testData.timeLimit,
          duration: testData.duration,
          examStructure: testData.examStructure,
          raw: testData.raw,
          currentQuestion: testData.currentQuestion
        },
        testConfig,
        testId: testData.testId,
        sessionId: testData.sessionId,
        userType: testData.userType,
        totalQuestions: testData.totalQuestions,
        timeLimit: testData.timeLimit,
        questions: [testData.currentQuestion],
        duration: testData.duration
      };

      // ════════════════════════════════════════════════════════════
      // CRITICAL: Use replace:true so MockTestStart is NOT in history
      // This means pressing back from instructions/test won't come here
      // ════════════════════════════════════════════════════════════
      navigate('/student/mock-tests/instructions', {
        state: navigationState,
        replace: true
      });

    } catch (err) {
      console.error('Failed to start test:', err);
      const errorMessage = mockTestAPI.getErrorMessage(err);
      setError(errorMessage || 'Failed to start test. Please try again.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 4 }}>
      <Container maxWidth="lg">
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 4, borderRadius: '12px' }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* Weekly Mock Test Header */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 5,
            borderRadius: '22px',
            textAlign: 'center',
            background: '#fff',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: colors.cardShadow,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'absolute', top: -50, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(41,128,185,0.04)', display: { xs: 'none', sm: 'block' } }} />
          <Box sx={{ position: 'absolute', bottom: -40, left: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(13,148,136,0.04)', display: { xs: 'none', sm: 'block' } }} />

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              width: 72,
              height: 72,
              borderRadius: '18px',
              background: colors.gradientMixed,
              boxShadow: '0 4px 12px rgba(41,128,185,0.25)'
            }}
          >
            <SchoolIcon sx={{ fontSize: 36, color: '#fff' }} />
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              mb: 1
            }}
          >
            Weekly Mock Test
          </Typography>

          <Typography variant="h6" sx={{ color: colors.subtle, fontWeight: 400 }}>
            Select your test type based on your course
          </Typography>
        </Paper>

        {/* Test Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
            width: '100%'
          }}
        >
          {/* Developer Test Card */}
          <Card elevation={0} sx={{ ...cardBase, height: '100%' }}>
            <Box sx={{ height: '3px', background: colors.gradientPrimary }} />
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: colors.gradientPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(41,128,185,0.25)'
                }}
              >
                <CodeIcon sx={{ fontSize: 28, color: '#fff' }} />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: colors.primary,
                  mb: 0.5,
                  letterSpacing: '-0.02em'
                }}
              >
                Developer Test
              </Typography>

              <Typography variant="body1" sx={{ color: colors.subtle, mb: 1 }}>
                Technical Assessment
              </Typography>

              <Typography variant="body2" sx={{ color: colors.muted, mb: 3 }}>
                For technical courses: Python, Java, Web Development, etc.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: colors.dark }}>25</Typography>
                  <Typography variant="body2" sx={{ color: colors.muted }}>Questions</Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(41,128,185,0.15)' }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: colors.dark }}>70</Typography>
                  <Typography variant="body2" sx={{ color: colors.muted }}>Minutes</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(41,128,185,0.08)' }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textAlign: 'left', color: colors.dark }}>
                  Sections:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CalculateIcon sx={{ fontSize: 16 }} />}
                    label="Aptitude: 10q"
                    size="small"
                    sx={{ backgroundColor: alpha(colors.aptitude, 0.08), color: colors.aptitude, fontWeight: 600, border: `1px solid ${alpha(colors.aptitude, 0.15)}` }}
                  />
                  <Chip
                    icon={<MenuBookIcon sx={{ fontSize: 16 }} />}
                    label="MCQs: 10q"
                    size="small"
                    sx={{ backgroundColor: alpha(colors.mcq, 0.08), color: colors.mcq, fontWeight: 600, border: `1px solid ${alpha(colors.mcq, 0.15)}` }}
                  />
                  <Chip
                    icon={<CodeIcon sx={{ fontSize: 16 }} />}
                    label="Coding: 5q"
                    size="small"
                    sx={{ backgroundColor: alpha(colors.coding, 0.08), color: colors.coding, fontWeight: 600, border: `1px solid ${alpha(colors.coding, 0.15)}` }}
                  />
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => handleStartTest('dev')}
                disabled={loading}
                startIcon={loading && loadingType === 'dev' ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: colors.gradientPrimary,
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(41,128,185,0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #153d6b 0%, #2471a3 100%)',
                    boxShadow: '0 6px 18px rgba(41,128,185,0.35)'
                  }
                }}
              >
                {loading && loadingType === 'dev' ? 'Loading...' : 'Start Developer Test'}
              </Button>
            </CardContent>
          </Card>

          {/* Non-Developer Test Card */}
          <Card elevation={0} sx={{ ...cardBase, height: '100%' }}>
            <Box sx={{ height: '3px', background: colors.gradientTeal }} />
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: colors.gradientTeal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(13,148,136,0.25)'
                }}
              >
                <SettingsIcon sx={{ fontSize: 28, color: '#fff' }} />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: colors.teal,
                  mb: 0.5,
                  letterSpacing: '-0.02em'
                }}
              >
                Non-Developer Test
              </Typography>

              <Typography variant="body1" sx={{ color: colors.subtle, mb: 1 }}>
                Professional Assessment
              </Typography>

              <Typography variant="body2" sx={{ color: colors.muted, mb: 3 }}>
                For non-technical courses: SAP, Digital Marketing, Business Analysis, etc.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: colors.dark }}>30</Typography>
                  <Typography variant="body2" sx={{ color: colors.muted }}>Questions</Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(13,148,136,0.15)' }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: colors.dark }}>45</Typography>
                  <Typography variant="body2" sx={{ color: colors.muted }}>Minutes</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(13,148,136,0.08)' }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textAlign: 'left', color: colors.dark }}>
                  Sections:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CalculateIcon sx={{ fontSize: 16 }} />}
                    label="Aptitude: 10q"
                    size="small"
                    sx={{ backgroundColor: alpha(colors.aptitude, 0.08), color: colors.aptitude, fontWeight: 600, border: `1px solid ${alpha(colors.aptitude, 0.15)}` }}
                  />
                  <Chip
                    icon={<QuizIcon sx={{ fontSize: 16 }} />}
                    label="MCQ: 20q"
                    size="small"
                    sx={{ backgroundColor: alpha(colors.mcq, 0.08), color: colors.mcq, fontWeight: 600, border: `1px solid ${alpha(colors.mcq, 0.15)}` }}
                  />
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => handleStartTest('non-dev')}
                disabled={loading}
                startIcon={loading && loadingType === 'non-dev' ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: colors.gradientTeal,
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0b7f74 0%, #4dd8b0 100%)',
                    boxShadow: '0 6px 18px rgba(13,148,136,0.35)'
                  }
                }}
              >
                {loading && loadingType === 'non-dev' ? 'Loading...' : 'Start Non-Developer Test'}
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Instructions Section */}
        <Card elevation={0} sx={{ ...cardBase }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  background: colors.gradientPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <DescriptionIcon sx={{ color: '#fff', fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.dark }}>
                Instructions
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3
              }}
            >
              <Box component="ul" sx={{ pl: 2, color: colors.subtle, m: 0, '& li': { mb: 1, lineHeight: 1.6 } }}>
                <li>Questions are based on your weekly course content</li>
                <li>Each question has a time limit - answer before time runs out</li>
                <li>You cannot go back to previous questions</li>
              </Box>
              <Box component="ul" sx={{ pl: 2, color: colors.subtle, m: 0, '& li': { mb: 1, lineHeight: 1.6 } }}>
                <li>Your score will be shown at the end with detailed feedback</li>
                <li>Camera will be active throughout the test for proctoring</li>
                <li>Ensure stable internet connection before starting</li>
              </Box>
            </Box>

            {/* Proctoring Notice */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mt: 3,
                backgroundColor: 'rgba(230,81,0,0.04)',
                borderRadius: '14px',
                border: '1px solid rgba(230,81,0,0.15)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #e65100 0%, #ff8f00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <VideocamIcon sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e65100' }}>
                    Proctored Exam
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.subtle }}>
                    This test requires camera access. You'll be monitored throughout the exam.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default MockTestStart;