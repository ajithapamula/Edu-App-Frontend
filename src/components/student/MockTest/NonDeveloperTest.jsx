// src/components/student/MockTest/NonDeveloperTest.jsx
// FIXED: Now properly gets and passes evaluation results from backend
// UPDATED: Comprehensive navigation blocking - back, forward, refresh, close, keyboard shortcuts
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
  LinearProgress,
  Paper,
  Chip,
  useTheme,
  // alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Send as SendIcon,
  Quiz as QuizIcon,
  Calculate as CalculateIcon,
  PlayArrow as PlayArrowIcon,
  SkipNext as SkipNextIcon,
  Edit as EditIcon,
  Help as HelpIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { mockTestAPI } from '../../../services/API/studentmocktest';
import ProctorCamera from './ProctorCamera';

// ═══ iMeetPro Theme Tokens ═══
const THEME = {
  primary: '#00838f',
  primaryLight: '#26c6da',
  primaryDark: '#004d54',
  secondary: '#0d9488',
  secondaryLight: '#5eead4',
  navy: '#1a5276',
  blue: '#2980b9',
  blueLight: '#3498c8',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  surface: '#f0f4f8',
  cardBg: '#fff',
  borderLight: 'rgba(41,128,185,0.08)',
  borderMedium: 'rgba(41,128,185,0.15)',
  success: '#0d9488',
  warning: '#f59e0b',
  error: '#ef4444',
  gradientPrimary: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
  gradientTeal: 'linear-gradient(135deg, #00838f 0%, #26c6da 100%)',
  gradientSuccess: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)',
  gradientCoding: 'linear-gradient(135deg, #1a5276 0%, #0d9488 100%)',
};

// Card style matching dashboard
const cardBase = {
  borderRadius: '18px',
  background: THEME.cardBg,
  border: `1px solid ${THEME.borderLight}`,
  boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
  overflow: 'hidden',
  transition: 'box-shadow 0.3s ease, transform 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 24px rgba(26,82,118,0.10), 0 1px 4px rgba(41,128,185,0.06)',
  },
};

// Custom Stepper Connector - iMeetPro themed
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  alternativeLabel: {
    top: 22,
  },
  '& .MuiStepConnector-line': {
    height: 3,
    border: 0,
    backgroundColor: 'rgba(41,128,185,0.12)',
    borderRadius: 1,
  },
  '&.Mui-active .MuiStepConnector-line': {
    backgroundImage: THEME.gradientTeal,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    backgroundImage: THEME.gradientSuccess,
  },
}));

// Section configurations - 2 sections for Non-Developer (NO CODING!) - iMeetPro themed
const SECTIONS = {
  aptitude: {
    name: 'Aptitude',
    icon: CalculateIcon,
    color: THEME.blue,
    gradient: 'linear-gradient(135deg, #2980b9 0%, #3498c8 100%)',
    description: 'Logical reasoning & problem solving',
    questionCount: 10,
    timePerQuestion: 120
  },
  mcq: {
    name: 'MCQ',
    icon: QuizIcon,
    color: THEME.primary,
    gradient: THEME.gradientTeal,
    description: 'SAP & Business content questions',
    questionCount: 20,
    timePerQuestion: 75
  }
};

const SECTION_ORDER = ['aptitude', 'mcq'];

// Calculate total test time
const calculateTotalTestTime = () => {
  return (SECTIONS.aptitude.questionCount * SECTIONS.aptitude.timePerQuestion) +
         (SECTIONS.mcq.questionCount * SECTIONS.mcq.timePerQuestion);
};

const totalTestTimeSeconds = calculateTotalTestTime();

// Determine section from question number
const getSectionFromQuestionNumber = (qNum) => {
  if (qNum <= 10) return 'aptitude';
  return 'mcq';
};

// Get section start question number
const getSectionStartQuestion = (sectionName) => {
  if (sectionName === 'aptitude') return 1;
  return 11;
};

const NonDeveloperTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Get test data from navigation state
  const testData = location.state?.testData || location.state;
  const testId = testData?.testId || testData?.test_id || testData?.sessionId || testData?.session_id || testData?.raw?.test_id || testData?.raw?.testId;
  const totalQuestions = testData?.totalQuestions || testData?.total_questions || testData?.raw?.total_questions || 30;

  // Verify this is a non-developer test
  const userType = testData?.userType || testData?.user_type || 'non_dev';
  
  // Check if state is valid
  const isValidState = !!(location.state && (testData || testId));

  // Initialize question helper
  const initializeQuestion = () => {
    if (!testData) {
      return {
        question: '',
        questionNumber: 1,
        questionType: 'aptitude',
        options: [],
        timeLimit: 60,
        title: ''
      };
    }
    const q = testData?.currentQuestion || testData?.raw || testData;
    const qNum = q.questionNumber || q.question_number || 1;
    let qType = q.questionType || q.question_type || getSectionFromQuestionNumber(qNum);
    
    return {
      question: q.questionHtml || q.question_html || q.question || '',
      questionNumber: qNum,
      questionType: qType,
      options: q.options || [],
      timeLimit: q.timeLimit || q.time_limit || 60,
      title: q.title || ''
    };
  };

  // ============ ALL HOOKS MUST BE HERE - BEFORE ANY CONDITIONAL RETURNS ============
  
  const [currentQuestion, setCurrentQuestion] = useState(initializeQuestion);
  const [currentSection, setCurrentSection] = useState(getSectionFromQuestionNumber(currentQuestion.questionNumber));
  const [completedSections, setCompletedSections] = useState([]);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [timeLeft, setTimeLeft] = useState(currentQuestion.timeLimit);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [nextSectionData, setNextSectionData] = useState(null);
  const [previousSection, setPreviousSection] = useState(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [testTerminated, setTestTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');

  // ============ NAVIGATION VIOLATION TRACKING ============
  const [navigationViolationCount, setNavigationViolationCount] = useState(0);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [navigationWarningMessage, setNavigationWarningMessage] = useState('');
  const MAX_NAVIGATION_VIOLATIONS = 3;
  const testActiveRef = useRef(true);

  const [testStartTime] = useState(Date.now());
  const [totalTimeUsed, setTotalTimeUsed] = useState(0);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(totalTestTimeSeconds);

  const questionCacheRef = useRef({});
  const [userAnswers, setUserAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([1]));
  const [skippedQuestions, setSkippedQuestions] = useState(new Set());

  const currentSectionConfig = SECTIONS[currentSection] || SECTIONS.mcq;

  // ════════════════════════════════════════════════════════════════════
  // NAVIGATION VIOLATION HANDLER - Central function for all violations
  // ════════════════════════════════════════════════════════════════════
  const handleNavigationViolation = useCallback((reason) => {
    if (!testActiveRef.current) return;
    
    setNavigationViolationCount(prev => {
      const newCount = prev + 1;
      console.log(`⚠️ Navigation violation #${newCount}: ${reason}`);
      
      if (newCount >= MAX_NAVIGATION_VIOLATIONS) {
        testActiveRef.current = false;
        if (testId) {
          sessionStorage.setItem(`test_terminated_${testId}`, 'true');
        }
        setTerminationReason(
          `Your test has been terminated because you attempted to navigate away ${MAX_NAVIGATION_VIOLATIONS} times. ` +
          `Last violation: ${reason}`
        );
        setTestTerminated(true);
      } else {
        setNavigationWarningMessage(
          `⚠️ Warning ${newCount}/${MAX_NAVIGATION_VIOLATIONS}: ${reason}. ` +
          `Your test will be terminated after ${MAX_NAVIGATION_VIOLATIONS - newCount} more violation(s).`
        );
        setShowNavigationWarning(true);
      }
      
      return newCount;
    });
  }, [testId]);

  // Log test type on mount
  useEffect(() => {
    console.log('🟠 NON-DEVELOPER TEST COMPONENT LOADED');
    console.log('📋 Test ID:', testId);
    console.log('📋 User Type:', userType);
    console.log('📋 Total Questions:', totalQuestions);
  }, []);

  // ============ EFFECT: Handle invalid state - redirect immediately ============
  useEffect(() => {
    if (!isValidState) {
      console.log('❌ Invalid state detected, redirecting to mock tests...');
      navigate('/student/mock-tests', { replace: true });
    }
  }, [isValidState, navigate]);

  // ============ EFFECT: Check if test was already submitted ============
  useEffect(() => {
    if (testId) {
      const isTestSubmitted = sessionStorage.getItem(`test_submitted_${testId}`);
      if (isTestSubmitted === 'true') {
        console.log('Test already submitted, redirecting...');
        navigate('/student/mock-tests', { replace: true });
      }
    }
  }, [testId, navigate]);

  // ════════════════════════════════════════════════════════════════════
  // 1. BLOCK BROWSER BACK & FORWARD (popstate) - MAXIMUM STRENGTH
  // Push 50 history entries so even rapid back-button spam can't escape
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const HISTORY_FLOOD_COUNT = 50;

    // Flood the history stack with guard entries
    const floodHistory = () => {
      for (let i = 0; i < HISTORY_FLOOD_COUNT; i++) {
        window.history.pushState(
          { page: 'test-guard', index: i, testId: testId },
          '',
          window.location.href
        );
      }
      console.log(`🔒 Flooded history with ${HISTORY_FLOOD_COUNT} guard entries`);
    };

    floodHistory();

    const handlePopState = (event) => {
      if (!testActiveRef.current || testCompleted) return;

      console.log('🔙 Browser navigation detected (back/forward) - blocking & re-flooding');

      // Re-flood history immediately so repeated presses are still caught
      for (let i = 0; i < HISTORY_FLOOD_COUNT; i++) {
        window.history.pushState(
          { page: 'test-guard', index: i, testId: testId },
          '',
          window.location.href
        );
      }

      // Record violation
      handleNavigationViolation('You attempted to use browser back/forward navigation, which is not allowed during the test.');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isValidState, testTerminated, testCompleted, handleNavigationViolation, testId]);

  // ════════════════════════════════════════════════════════════════════
  // 2. BLOCK TAB/WINDOW CLOSE & REFRESH (beforeunload)
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const handleBeforeUnload = (event) => {
      if (!testActiveRef.current) return;
      
      console.log('🚫 Attempting to close/refresh - blocking');
      event.preventDefault();
      event.returnValue = 'You have an active test in progress. If you leave, your test will be terminated. Are you sure?';
      return event.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isValidState, testTerminated, testCompleted]);

  // ════════════════════════════════════════════════════════════════════
  // 3. BLOCK KEYBOARD SHORTCUTS (F5, Ctrl+R, Ctrl+W, Alt+Left/Right, etc.)
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const handleKeyDown = (event) => {
      if (!testActiveRef.current) return;
      
      const key = event.key;
      const isCtrl = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;
      
      let blocked = false;
      let reason = '';

      if (key === 'F5') {
        blocked = true;
        reason = 'F5 (Refresh) is disabled during the test';
      }
      
      if (isCtrl && (key === 'r' || key === 'R')) {
        blocked = true;
        reason = 'Ctrl+R (Refresh) is disabled during the test';
      }
      
      if (isCtrl && (key === 'w' || key === 'W')) {
        blocked = true;
        reason = 'Ctrl+W (Close tab) is disabled during the test';
      }
      
      if (isCtrl && event.shiftKey && (key === 'w' || key === 'W')) {
        blocked = true;
        reason = 'Ctrl+Shift+W (Close window) is disabled during the test';
      }
      
      if (isAlt && key === 'ArrowLeft') {
        blocked = true;
        reason = 'Alt+Left (Browser back) is disabled during the test';
      }
      
      if (isAlt && key === 'ArrowRight') {
        blocked = true;
        reason = 'Alt+Right (Browser forward) is disabled during the test';
      }
      
      if (isCtrl && (key === 'l' || key === 'L')) {
        blocked = true;
        reason = 'Ctrl+L (Address bar) is disabled during the test';
      }
      
      if (isAlt && (key === 'd' || key === 'D')) {
        blocked = true;
        reason = 'Alt+D (Address bar) is disabled during the test';
      }
      
      if (key === 'F6') {
        blocked = true;
        reason = 'F6 (Address bar focus) is disabled during the test';
      }
      
      if (isAlt && key === 'Home') {
        blocked = true;
        reason = 'Alt+Home (Browser home) is disabled during the test';
      }
      
      if (isCtrl && (key === 'n' || key === 'N') && !event.shiftKey) {
        blocked = true;
        reason = 'Ctrl+N (New window) is disabled during the test';
      }
      
      if (isCtrl && (key === 't' || key === 'T') && !event.shiftKey) {
        blocked = true;
        reason = 'Ctrl+T (New tab) is disabled during the test';
      }
      
      if (isCtrl && event.shiftKey && (key === 't' || key === 'T')) {
        blocked = true;
        reason = 'Ctrl+Shift+T (Reopen tab) is disabled during the test';
      }
      
      if (key === 'Backspace') {
        const tagName = event.target.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea' || event.target.isContentEditable;
        if (!isInput) {
          blocked = true;
          reason = 'Backspace navigation is disabled during the test';
        }
      }

      if (isAlt && key === 'F4') {
        blocked = true;
        reason = 'Alt+F4 (Close window) is disabled during the test';
      }

      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
        console.log(`⌨️ Blocked keyboard shortcut: ${reason}`);
        
        setNavigationWarningMessage(`🚫 ${reason}`);
        setShowNavigationWarning(true);
        
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isValidState, testTerminated, testCompleted]);

  // ════════════════════════════════════════════════════════════════════
  // 4. BLOCK RIGHT-CLICK CONTEXT MENU
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const handleContextMenu = (event) => {
      if (!testActiveRef.current) return;
      
      event.preventDefault();
      console.log('🖱️ Right-click blocked during test');
      
      setNavigationWarningMessage('🚫 Right-click is disabled during the test to prevent navigation.');
      setShowNavigationWarning(true);
      
      return false;
    };

    window.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [isValidState, testTerminated, testCompleted]);

  // ════════════════════════════════════════════════════════════════════
  // 5. DETECT TAB VISIBILITY CHANGE (switching tabs / minimizing)
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const handleVisibilityChange = () => {
      if (!testActiveRef.current) return;
      
      if (document.hidden) {
        console.log('👁️ Tab became hidden - user switched away');
        handleNavigationViolation(
          'You switched away from the test tab. Leaving the test window is not allowed.'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isValidState, testTerminated, testCompleted, handleNavigationViolation]);

  // ════════════════════════════════════════════════════════════════════
  // 6. DETECT WINDOW BLUR (clicking outside browser window)
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    let blurTimeout = null;

    const handleWindowBlur = () => {
      if (!testActiveRef.current) return;
      
      blurTimeout = setTimeout(() => {
        if (document.hidden) return;
        console.log('🪟 Window lost focus');
        setNavigationWarningMessage(
          '⚠️ Warning: Please stay focused on the test window. Switching to other applications may be flagged.'
        );
        setShowNavigationWarning(true);
      }, 500);
    };

    const handleWindowFocus = () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (blurTimeout) clearTimeout(blurTimeout);
    };
  }, [isValidState, testTerminated, testCompleted]);

  // ════════════════════════════════════════════════════════════════════
  // 7. BLOCK DRAG AND DROP OF LINKS
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const handleDragStart = (event) => {
      if (event.target.tagName === 'A' || event.target.closest('a')) {
        event.preventDefault();
        console.log('🔗 Link drag blocked during test');
      }
    };

    const handleDrop = (event) => {
      event.preventDefault();
      console.log('📎 Drop blocked during test');
    };

    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('drop', handleDrop, true);

    return () => {
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('drop', handleDrop, true);
    };
  }, [isValidState, testTerminated, testCompleted]);

  // ════════════════════════════════════════════════════════════════════
  // 8. CLEANUP - Mark test as inactive when component unmounts
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      testActiveRef.current = false;
    };
  }, []);

  // ============ EFFECT: Cache initial question ============
  useEffect(() => {
    if (currentQuestion.question && currentQuestion.questionNumber && isValidState) {
      questionCacheRef.current[currentQuestion.questionNumber] = { ...currentQuestion };
    }
  }, [isValidState, currentQuestion.question, currentQuestion.questionNumber]);

  // ============ EFFECT: Total test time tracking ============
  useEffect(() => {
    if (!isValidState) return;

    const totalTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
      setTotalTimeUsed(elapsed);
      setTotalTimeRemaining(Math.max(0, totalTestTimeSeconds - elapsed));
    }, 1000);

    return () => clearInterval(totalTimer);
  }, [testStartTime, isValidState]);

  // ============ EFFECT: Per-question timer ============
  useEffect(() => {
    if (!isValidState || testCompleted || loading || !testId || showSectionDialog || showSubmitDialog) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSkipQuestion();
          return 0;
        }
        if (prev === 30) {
          setShowTimeWarning(true);
          setTimeout(() => setShowTimeWarning(false), 3000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isValidState, testCompleted, loading, currentQuestion.questionNumber, testId, showSectionDialog, showSubmitDialog]);

  // ============ EFFECT: Reset timer and restore answer ============
  useEffect(() => {
    if (!isValidState) return;

    setTimeLeft(currentQuestion.timeLimit || 60);
    setVisitedQuestions(prev => new Set([...prev, currentQuestion.questionNumber]));
    
    const savedAnswer = userAnswers[currentQuestion.questionNumber];
    if (savedAnswer !== undefined && savedAnswer !== '') {
      const hasMCQOptions = currentQuestion.options && currentQuestion.options.length > 0;
      if (hasMCQOptions) {
        setSelectedOption(savedAnswer);
        setAnswer('');
      } else {
        setAnswer(savedAnswer);
        setSelectedOption('');
      }
    } else {
      setAnswer('');
      setSelectedOption('');
    }
  }, [currentQuestion.questionNumber, currentQuestion.timeLimit, currentQuestion.options, userAnswers, isValidState]);

  // ============ EFFECT: Update current section ============
  useEffect(() => {
    if (!isValidState) return;
    setCurrentSection(getSectionFromQuestionNumber(currentQuestion.questionNumber));
  }, [currentQuestion.questionNumber, isValidState]);

  // Auto-dismiss navigation warning after 4 seconds
  useEffect(() => {
    if (showNavigationWarning) {
      const timer = setTimeout(() => {
        setShowNavigationWarning(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showNavigationWarning]);

  // ============ CONDITIONAL RETURNS - ONLY AFTER ALL HOOKS ============

  if (!isValidState) {
    return (
      <Box sx={{ minHeight: '100vh', background: THEME.surface }}>
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 3, color: THEME.primary }} />
          <Typography variant="h6" sx={{ color: THEME.textSecondary }}>
            Redirecting...
          </Typography>
        </Container>
      </Box>
    );
  }

  // ============ TEST TERMINATED SCREEN ============
  if (testTerminated) {
    return (
      <Box sx={{ minHeight: '100vh', background: THEME.surface }}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              ...cardBase,
              borderTop: `4px solid ${THEME.error}`
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '18px',
                background: 'rgba(239,68,68,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 3
              }}
            >
              <CancelIcon sx={{ fontSize: 48, color: THEME.error }} />
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 800, color: THEME.error, mb: 1 }}>
              Test Terminated
            </Typography>
            
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Typography variant="body1" fontWeight="medium" gutterBottom>
                Your test session has been terminated.
              </Typography>
              <Typography variant="body2">
                {terminationReason || 'The test was terminated due to a violation of test rules.'}
              </Typography>
            </Alert>

            {navigationViolationCount > 0 && (
              <Alert severity="warning" sx={{ mb: 3, textAlign: 'left', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Typography variant="body2">
                  Total navigation violations recorded: <strong>{navigationViolationCount}</strong>
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/student/mock-tests', { replace: true })}
                sx={{
                  py: 1.5,
                  borderRadius: '14px',
                  fontWeight: 700,
                  textTransform: 'none',
                  background: THEME.gradientPrimary,
                  boxShadow: '0 4px 14px rgba(26,82,118,0.25)',
                  '&:hover': { boxShadow: '0 6px 20px rgba(26,82,118,0.35)' },
                }}
              >
                Go to Mock Tests
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/student/dashboard', { replace: true })}
                sx={{
                  py: 1.5,
                  borderRadius: '14px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: THEME.borderMedium,
                  color: THEME.textSecondary,
                  '&:hover': {
                    borderColor: THEME.primary,
                    backgroundColor: 'rgba(0,131,143,0.04)',
                  },
                }}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Helper functions
  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeWithLabels = (seconds) => {
    if (seconds < 0) seconds = 0;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  };

  const hasMCQOptions = () => {
    return currentQuestion.options && currentQuestion.options.length > 0;
  };

  const handleAnswerChange = (event) => {
    const newAnswer = event.target.value;
    setAnswer(newAnswer);
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.questionNumber]: newAnswer
    }));
    if (newAnswer) {
      setSkippedQuestions(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(currentQuestion.questionNumber);
        return newSet;
      });
    }
  };

  const handleOptionSelect = (event) => {
    const newOption = event.target.value;
    setSelectedOption(newOption);
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.questionNumber]: newOption
    }));
    setSkippedQuestions(prev => {
      const newSet = new Set([...prev]);
      newSet.delete(currentQuestion.questionNumber);
      return newSet;
    });
  };

  const handleOptionDoubleClick = (optionValue) => {
    if (selectedOption === optionValue) {
      setSelectedOption('');
      setUserAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[currentQuestion.questionNumber];
        return newAnswers;
      });
    }
  };

  const getAnswerToSubmit = () => {
    if (hasMCQOptions()) {
      return selectedOption;
    }
    return answer.trim();
  };

  const hasAnswer = () => {
    if (hasMCQOptions()) {
      return selectedOption !== '';
    }
    return answer.trim() !== '';
  };

  const getQuestionStats = () => {
    let answered = 0;
    let unanswered = 0;
    const unansweredList = [];
    
    for (let q = 1; q <= totalQuestions; q++) {
      if (userAnswers[q] && userAnswers[q] !== '') {
        answered++;
      } else {
        unanswered++;
        unansweredList.push({
          questionNumber: q,
          section: getSectionFromQuestionNumber(q)
        });
      }
    }
    
    return { answered, unanswered, unansweredList };
  };

  const getSectionProgress = () => {
    const sectionStart = getSectionStartQuestion(currentSection);
    const sectionTotal = SECTIONS[currentSection]?.questionCount || 10;
    
    let answeredInSection = 0;
    for (let q = sectionStart; q < sectionStart + sectionTotal; q++) {
      if (userAnswers[q] && userAnswers[q] !== '') {
        answeredInSection++;
      }
    }
    
    return (answeredInSection / sectionTotal) * 100;
  };

  const getSectionQuestionDisplay = () => {
    const sectionStart = getSectionStartQuestion(currentSection);
    const sectionTotal = SECTIONS[currentSection]?.questionCount || 10;
    const currentInSection = currentQuestion.questionNumber - sectionStart + 1;
    return `${currentInSection}/${sectionTotal}`;
  };

  const getSectionIndex = () => {
    return SECTION_ORDER.indexOf(currentSection);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion.questionNumber <= 1) return;
    
    if (!hasAnswer()) {
      setSkippedQuestions(prev => new Set([...prev, currentQuestion.questionNumber]));
    }
    
    const prevQuestionNum = currentQuestion.questionNumber - 1;
    const cachedQuestion = questionCacheRef.current[prevQuestionNum];
    
    if (cachedQuestion) {
      setCurrentQuestion({ ...cachedQuestion });
    } else {
      setError('Previous question not available in cache.');
    }
  };

  const handleSkipQuestion = async () => {
    setSkippedQuestions(prev => new Set([...prev, currentQuestion.questionNumber]));
    
    if (!hasAnswer()) {
      setUserAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[currentQuestion.questionNumber];
        return newAnswers;
      });
    }

    const nextQuestionNum = currentQuestion.questionNumber + 1;
    
    if (nextQuestionNum > totalQuestions) {
      setShowSubmitDialog(true);
      return;
    }
    
    const cachedNextQuestion = questionCacheRef.current[nextQuestionNum];

    if (cachedNextQuestion) {
      const currentSec = getSectionFromQuestionNumber(currentQuestion.questionNumber);
      const nextSec = getSectionFromQuestionNumber(nextQuestionNum);
      
      if (currentSec !== nextSec) {
        setPreviousSection(currentSec);
        setCompletedSections(prev => {
          if (!prev.includes(currentSec)) {
            return [...prev, currentSec];
          }
          return prev;
        });
        setNextSectionData({
          question: cachedNextQuestion,
          section: nextSec,
          completedSection: currentSec
        });
        setShowSectionDialog(true);
      } else {
        setCurrentQuestion({ ...cachedNextQuestion });
      }
    } else {
      setSubmitting(true);
      setError('');

      try {
        const response = await mockTestAPI.submitAnswerWithData(
          testId,
          currentQuestion.questionNumber,
          userAnswers[currentQuestion.questionNumber] || '__SKIPPED__'
        );

        if (response.testCompleted || response.test_completed) {
          handleTestComplete(response);
        } else if (response.nextQuestion || response.next_question) {
          handleNextQuestion(response.nextQuestion || response.next_question, response);
        }
      } catch (error) {
        console.error('Failed to skip:', error);
        setError(`Failed to navigate: ${error.message}`);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!testId) {
      setError('Test ID is missing.');
      return;
    }

    const answerToSubmit = getAnswerToSubmit();

    if (!answerToSubmit) {
      setError('Please provide an answer before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.questionNumber]: answerToSubmit
      }));

      setSkippedQuestions(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(currentQuestion.questionNumber);
        return newSet;
      });

      const timeTaken = currentQuestion.timeLimit - timeLeft;
      
      const response = await mockTestAPI.submitAnswer({
        test_id: testId,
        question_number: currentQuestion.questionNumber,
        answer: answerToSubmit,
        time_taken: timeTaken
      });

      if (response.testCompleted || response.test_completed || response.isComplete || response.is_complete) {
        handleTestComplete(response);
        return;
      }

      const nq = response.nextQuestion || response.next_question || response;
      if (nq && (nq.questionHtml || nq.question_html || nq.question)) {
        handleNextQuestion(nq, response);
      } else {
        const nextQuestionNum = currentQuestion.questionNumber + 1;
        if (nextQuestionNum > totalQuestions) {
          setShowSubmitDialog(true);
        } else {
          const cachedQuestion = questionCacheRef.current[nextQuestionNum];
          if (cachedQuestion) {
            const currentSec = getSectionFromQuestionNumber(currentQuestion.questionNumber);
            const nextSec = getSectionFromQuestionNumber(nextQuestionNum);
            
            if (currentSec !== nextSec) {
              setPreviousSection(currentSec);
              setCompletedSections(prev => [...prev, currentSec]);
              setNextSectionData({
                question: cachedQuestion,
                section: nextSec,
                completedSection: currentSec
              });
              setShowSectionDialog(true);
            } else {
              setCurrentQuestion({ ...cachedQuestion });
            }
          } else {
            setShowSubmitDialog(true);
          }
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(`Failed to submit: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // FIXED: New function to handle test completion with API data
  // ════════════════════════════════════════════════════════════
  const handleTestComplete = (response) => {
    console.log('🎯 Test completed! API Response:', response);
    
    testActiveRef.current = false;
    
    sessionStorage.setItem(`test_submitted_${testId}`, 'true');
    
    const finalResults = {
      testId: testId,
      test_id: testId,
      score: response.score || 0,
      totalQuestions: response.totalQuestions || response.total_questions || totalQuestions,
      total_questions: response.totalQuestions || response.total_questions || totalQuestions,
      scorePercentage: response.scorePercentage || response.score_percentage || 0,
      score_percentage: response.scorePercentage || response.score_percentage || 0,
      analytics: response.analytics || response.evaluation_report || '',
      sectionScores: response.sectionScores || response.section_scores || {},
      section_scores: response.sectionScores || response.section_scores || {},
      sectionDetails: response.sectionDetails || response.section_details || {},
      section_details: response.sectionDetails || response.section_details || {},
      timeUsed: totalTimeUsed,
      warningCount: response.warningCount || response.warning_count || 0,
      terminatedByWarnings: response.terminatedByWarnings || response.terminated_by_warnings || false,
      summary: response.summary || {},
      navigationViolations: navigationViolationCount,
      raw: response
    };
    
    console.log('📊 Final Results to pass:', finalResults);
    
    setTestCompleted(true);
    setResults(finalResults);
    
    navigate('/student/mock-tests/results', {
      state: {
        results: finalResults,
        testType: 'non-developer',
        testData: testData
      },
      replace: true
    });
  };

  const handleNextQuestion = (nq, response) => {
    const nextQNum = nq.questionNumber || nq.question_number || currentQuestion.questionNumber + 1;
    const nextType = nq.questionType || nq.question_type || getSectionFromQuestionNumber(nextQNum);

    const nextQuestionData = {
      question: nq.questionHtml || nq.question_html || nq.question || '',
      questionNumber: nextQNum,
      questionType: nextType,
      options: nq.options || [],
      timeLimit: nq.timeLimit || nq.time_limit || 60,
      title: nq.title || ''
    };

    questionCacheRef.current[nextQuestionData.questionNumber] = { ...nextQuestionData };

    const currentSec = getSectionFromQuestionNumber(currentQuestion.questionNumber);
    const nextSec = getSectionFromQuestionNumber(nextQNum);

    if (currentSec !== nextSec) {
      setPreviousSection(currentSec);
      setCompletedSections(prev => {
        if (!prev.includes(currentSec)) {
          return [...prev, currentSec];
        }
        return prev;
      });
      setNextSectionData({
        question: nextQuestionData,
        section: nextSec,
        completedSection: currentSec
      });
      setShowSectionDialog(true);
    } else {
      setCurrentQuestion(nextQuestionData);
    }
  };

  const handleContinueToNextSection = () => {
    if (nextSectionData) {
      setCurrentQuestion(nextSectionData.question);
      setCurrentSection(nextSectionData.section);
      setShowSectionDialog(false);
      setNextSectionData(null);
    }
  };

  const navigateToQuestion = (questionNum) => {
    const cachedQuestion = questionCacheRef.current[questionNum];
    if (cachedQuestion) {
      setShowSubmitDialog(false);
      setCurrentQuestion({ ...cachedQuestion });
    } else {
      setError(`Question ${questionNum} is not available. Please navigate sequentially.`);
    }
  };

  // ════════════════════════════════════════════════════════════
  // FIXED: Final submit now properly calls backend and uses response
  // ════════════════════════════════════════════════════════════
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const answerToSubmit = getAnswerToSubmit();
      
      console.log('📤 Final submit - submitting last answer...');
      
      const response = await mockTestAPI.submitAnswer({
        test_id: testId,
        question_number: currentQuestion.questionNumber,
        answer: answerToSubmit || '__FINAL_SUBMIT__'
      });

      console.log('📥 Final submit response:', response);

      if (response.testCompleted || response.test_completed) {
        handleTestComplete(response);
      } else {
        console.log('⚠️ Test not marked complete, fetching results...');
        try {
          const resultsResponse = await mockTestAPI.getTestResults(testId);
          console.log('📊 Fetched results:', resultsResponse);
          
          handleTestComplete({
            ...resultsResponse,
            testCompleted: true
          });
        } catch (fetchError) {
          console.error('Failed to fetch results:', fetchError);
          handleTestComplete({
            testCompleted: true,
            score: 0,
            totalQuestions: totalQuestions,
            scorePercentage: 0,
            sectionScores: {},
            analytics: 'Results are being processed. Please check back later.'
          });
        }
      }
    } catch (error) {
      console.error('Failed to submit test:', error);
      setError(`Failed to submit test: ${error.message}`);
      setSubmitting(false);
    }
  };

  const canGoPrevious = currentQuestion.questionNumber > 1;
  const isCurrentAnswered = userAnswers[currentQuestion.questionNumber] && userAnswers[currentQuestion.questionNumber] !== '';
  const isCurrentSkipped = skippedQuestions.has(currentQuestion.questionNumber);
  const questionStats = getQuestionStats();

  // Error state - no question
  if (!currentQuestion.question && !loading) {
    return (
      <Box sx={{ minHeight: '100vh', background: THEME.surface }}>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ mb: 2, color: THEME.text }}>No Question Data Available</Typography>
            <Typography variant="body2" sx={{ color: THEME.textSecondary }}>Please start a new test.</Typography>
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/student/mock-tests')}
            sx={{
              borderRadius: '14px',
              fontWeight: 700,
              textTransform: 'none',
              background: THEME.gradientPrimary,
              boxShadow: '0 4px 14px rgba(26,82,118,0.25)',
            }}
          >
            Start New Test
          </Button>
        </Container>
      </Box>
    );
  }

  // Test completed state
  if (testCompleted && results) {
    return (
      <Box sx={{ minHeight: '100vh', background: THEME.surface }}>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '18px',
              background: 'rgba(245,158,11,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2,
            }}
          >
            <TrophyIcon sx={{ fontSize: 48, color: THEME.warning }} />
          </Box>
          <Typography variant="h4" sx={{ mb: 2, color: THEME.success, fontWeight: 800 }}>
            🎉 Test Completed!
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: THEME.text }}>
            Score: {results.score || 0} / {totalQuestions}
          </Typography>
          <CircularProgress sx={{ mt: 2, color: THEME.primary }} />
          <Typography variant="body2" sx={{ mt: 2, color: THEME.textSecondary }}>Redirecting to results...</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: THEME.surface }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>

        {/* ════════ NAVIGATION WARNING BANNER (floating) ════════ */}
        {showNavigationWarning && (
          <Paper
            elevation={6}
            sx={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              maxWidth: 600,
              width: '90%',
              borderRadius: '16px',
              overflow: 'hidden',
              animation: 'slideDown 0.3s ease-out',
              '@keyframes slideDown': {
                from: { opacity: 0, transform: 'translateX(-50%) translateY(-20px)' },
                to: { opacity: 1, transform: 'translateX(-50%) translateY(0)' }
              }
            }}
          >
            <Alert 
              severity="warning" 
              variant="filled"
              onClose={() => setShowNavigationWarning(false)}
              sx={{ 
                fontSize: '0.95rem',
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                {navigationWarningMessage}
              </Typography>
              {navigationViolationCount > 0 && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.9 }}>
                  Violations: {navigationViolationCount}/{MAX_NAVIGATION_VIOLATIONS} — Test will terminate at {MAX_NAVIGATION_VIOLATIONS} violations
                </Typography>
              )}
            </Alert>
          </Paper>
        )}

        {/* NON-DEVELOPER BADGE */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1.5, 
            mb: 2, 
            borderRadius: '14px', 
            background: THEME.cardBg,
            border: `1px solid ${THEME.borderMedium}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: THEME.gradientTeal,
              boxShadow: '0 0 8px rgba(0,131,143,0.4)',
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: THEME.primary,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
            }}
          >
            NON-DEVELOPER TRACK — SAP/Business Questions (No Coding)
          </Typography>
        </Paper>

        {/* Violation Counter Banner - persistent if violations > 0 */}
        {navigationViolationCount > 0 && !showNavigationWarning && (
          <Alert 
            severity={navigationViolationCount >= 2 ? 'error' : 'warning'} 
            sx={{ mb: 2, borderRadius: '12px', border: `1px solid ${navigationViolationCount >= 2 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}` }}
            icon={<WarningIcon />}
          >
            <Typography variant="body2">
              ⚠️ Navigation violations: <strong>{navigationViolationCount}/{MAX_NAVIGATION_VIOLATIONS}</strong>
              {navigationViolationCount >= 2 && ' — One more violation will terminate your test!'}
            </Typography>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Total Time Display */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, ...cardBase, borderRadius: '14px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: '8px',
                background: 'rgba(41,128,185,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AccessTimeIcon sx={{ fontSize: 18, color: THEME.blue }} />
              </Box>
              <Typography variant="body2" sx={{ color: THEME.textSecondary }}>
                Time Used: <strong style={{ color: THEME.text }}>{formatTimeWithLabels(totalTimeUsed)}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: '8px',
                background: totalTimeRemaining < 300 ? 'rgba(239,68,68,0.08)' : 'rgba(0,131,143,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TimerIcon sx={{ fontSize: 18, color: totalTimeRemaining < 300 ? THEME.error : THEME.primary }} />
              </Box>
              <Typography variant="body2" sx={{ color: totalTimeRemaining < 300 ? THEME.error : THEME.textSecondary }}>
                Total Remaining:{' '}
                <strong style={{ color: totalTimeRemaining < 300 ? THEME.error : THEME.text }}>
                  {formatTimeWithLabels(totalTimeRemaining)}
                </strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: '8px',
                background: 'rgba(13,148,136,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AssignmentIcon sx={{ fontSize: 18, color: THEME.success }} />
              </Box>
              <Typography variant="body2" sx={{ color: THEME.textSecondary }}>
                Answered:{' '}
                <strong style={{ color: THEME.text }}>
                  {questionStats.answered}/{totalQuestions}
                </strong>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Section Stepper - Only 2 sections for Non-Developer */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, ...cardBase }}>
          <Stepper 
            activeStep={getSectionIndex()} 
            alternativeLabel 
            connector={<ColorlibConnector />}
          >
            {SECTION_ORDER.map((key) => {
              const section = SECTIONS[key];
              const Icon = section.icon;
              return (
                <Step key={key} completed={completedSections.includes(key)}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: completedSections.includes(key)
                            ? THEME.gradientSuccess
                            : currentSection === key
                              ? section.gradient
                              : 'rgba(148,163,184,0.15)',
                          color: completedSections.includes(key) || currentSection === key
                            ? 'white'
                            : THEME.textMuted,
                          transition: 'all 0.3s ease',
                          boxShadow: currentSection === key
                            ? '0 4px 14px rgba(0,131,143,0.25)'
                            : 'none',
                        }}
                      >
                        {completedSections.includes(key) ? (
                          <CheckCircleIcon />
                        ) : (
                          <Icon />
                        )}
                      </Box>
                    )}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{
                        fontWeight: currentSection === key ? 700 : 500,
                        color: currentSection === key ? section.color : THEME.textSecondary,
                      }}
                    >
                      {section.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: THEME.textMuted }}>
                      {section.questionCount} questions
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Paper>

        {/* Header with Progress */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, ...cardBase }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: currentSectionConfig.gradient,
                  color: '#fff',
                  boxShadow: `0 4px 14px ${currentSectionConfig.color}33`,
                }}
              >
                {React.createElement(currentSectionConfig.icon)}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: currentSectionConfig.color }}>
                  {currentSectionConfig.name} Section
                </Typography>
                <Typography variant="body2" sx={{ color: THEME.textSecondary }}>
                  {currentSectionConfig.description}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Chip
                icon={<TimerIcon sx={{ color: '#fff !important' }} />}
                label={formatTime(timeLeft)}
                sx={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  px: 2,
                  py: 2.5,
                  borderRadius: '12px',
                  color: '#fff',
                  background: timeLeft < 30
                    ? `linear-gradient(135deg, ${THEME.error}, #f87171)`
                    : timeLeft < 60
                      ? `linear-gradient(135deg, ${THEME.warning}, #fbbf24)`
                      : currentSectionConfig.gradient,
                  boxShadow: timeLeft < 30
                    ? '0 4px 14px rgba(239,68,68,0.3)'
                    : `0 4px 14px ${currentSectionConfig.color}33`,
                }}
              />
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 700, color: THEME.text }}>
                  Question {currentQuestion.questionNumber} of {totalQuestions}
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.textMuted }}>
                  Section: {getSectionQuestionDisplay()}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={getSectionProgress()} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: `${currentSectionConfig.color}15`,
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: currentSectionConfig.gradient
              }
            }} 
          />
        </Paper>

        {/* Time Warning */}
        {showTimeWarning && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }} icon={<WarningIcon />}>
            Only 30 seconds remaining!
          </Alert>
        )}

        {/* Question Card */}
        <Card elevation={0} sx={{ mb: 4, ...cardBase, borderTop: `4px solid ${currentSectionConfig.color}` }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Q${currentQuestion.questionNumber}`}
                  sx={{ 
                    background: currentSectionConfig.gradient,
                    color: 'white',
                    fontWeight: 700,
                    borderRadius: '10px',
                  }}
                />
                <Chip 
                  label={hasMCQOptions() ? 'MCQ' : 'Text'}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: THEME.borderMedium,
                    color: THEME.textSecondary,
                    borderRadius: '10px',
                  }}
                />
                {isCurrentAnswered && (
                  <Chip 
                    label="Answered"
                    size="small"
                    icon={<CheckCircleIcon sx={{ color: `${THEME.success} !important` }} />}
                    sx={{
                      backgroundColor: 'rgba(13,148,136,0.08)',
                      color: THEME.success,
                      fontWeight: 600,
                      borderRadius: '10px',
                      border: '1px solid rgba(13,148,136,0.2)',
                    }}
                  />
                )}
                {isCurrentSkipped && !isCurrentAnswered && (
                  <Chip 
                    label="Skipped"
                    size="small"
                    icon={<SkipNextIcon sx={{ color: `${THEME.warning} !important` }} />}
                    sx={{
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      color: THEME.warning,
                      fontWeight: 600,
                      borderRadius: '10px',
                      border: '1px solid rgba(245,158,11,0.2)',
                    }}
                  />
                )}
              </Box>
              {hasAnswer() && (
                <CheckCircleIcon sx={{ color: THEME.success, fontSize: 32 }} />
              )}
            </Box>

            {currentQuestion.title && (
              <Typography variant="subtitle1" sx={{ color: THEME.textSecondary, mb: 1 }}>
                {currentQuestion.title}
              </Typography>
            )}

            <Box 
              sx={{ 
                mb: 4, 
                lineHeight: 1.8,
                fontSize: '1.1rem',
                color: THEME.text,
                '& pre': { 
                  backgroundColor: 'rgba(41,128,185,0.04)',
                  p: 2,
                  borderRadius: '10px',
                  overflow: 'auto',
                  border: `1px solid ${THEME.borderLight}`,
                },
                '& code': {
                  backgroundColor: 'rgba(41,128,185,0.06)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                }
              }}
              dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
            />

            {hasMCQOptions() ? (
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={selectedOption}
                  onChange={handleOptionSelect}
                >
                  {currentQuestion.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    const optionValue = option.value || option.text || option;
                    const optionText = option.text || option.label || option;

                    return (
                      <Paper
                        key={index}
                        elevation={0}
                        onDoubleClick={() => handleOptionDoubleClick(optionValue)}
                        sx={{
                          mb: 2,
                          p: 0,
                          borderRadius: '14px',
                          border: selectedOption === optionValue 
                            ? `2px solid ${currentSectionConfig.color}` 
                            : `1px solid ${THEME.borderMedium}`,
                          backgroundColor: selectedOption === optionValue 
                            ? `${currentSectionConfig.color}08` 
                            : THEME.cardBg,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          userSelect: 'none',
                          boxShadow: selectedOption === optionValue
                            ? `0 2px 12px ${currentSectionConfig.color}15`
                            : 'none',
                          '&:hover': {
                            backgroundColor: `${currentSectionConfig.color}06`,
                            borderColor: currentSectionConfig.color
                          }
                        }}
                      >
                        <FormControlLabel
                          value={optionValue}
                          control={
                            <Radio 
                              sx={{ 
                                color: THEME.textMuted,
                                '&.Mui-checked': { color: currentSectionConfig.color }
                              }} 
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                              <Chip 
                                label={optionLetter} 
                                size="small"
                                sx={{ 
                                  fontWeight: 700,
                                  borderRadius: '8px',
                                  backgroundColor: selectedOption === optionValue 
                                    ? currentSectionConfig.color 
                                    : 'rgba(148,163,184,0.12)',
                                  color: selectedOption === optionValue ? 'white' : THEME.textSecondary
                                }}
                              />
                              <Typography variant="body1" sx={{ color: THEME.text }}>{optionText}</Typography>
                            </Box>
                          }
                          sx={{ 
                            m: 0, 
                            p: 2, 
                            width: '100%',
                            '& .MuiFormControlLabel-label': { width: '100%' }
                          }}
                        />
                      </Paper>
                    );
                  })}
                </RadioGroup>
                <Typography variant="caption" sx={{ mt: 1, fontStyle: 'italic', color: THEME.textMuted }}>
                  💡 Tip: Double-click on a selected answer to unselect it
                </Typography>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Type your answer here..."
                value={answer}
                onChange={handleAnswerChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: 'rgba(41,128,185,0.02)',
                    '&:hover': {
                      backgroundColor: 'rgba(41,128,185,0.04)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(41,128,185,0.04)',
                    },
                    '& fieldset': {
                      borderColor: THEME.borderMedium,
                    },
                    '&:hover fieldset': {
                      borderColor: currentSectionConfig.color,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: currentSectionConfig.color,
                    },
                  }
                }}
              />
            )}

            {isCurrentSkipped && !isCurrentAnswered && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                You skipped this question earlier. You can now provide an answer.
              </Alert>
            )}
            
            {isCurrentAnswered && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: '12px', border: '1px solid rgba(41,128,185,0.15)' }} icon={<EditIcon />}>
                You can change your answer anytime before finishing the test.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<NavigateBeforeIcon />}
            onClick={handlePreviousQuestion}
            disabled={!canGoPrevious || submitting}
            sx={{ 
              py: 1.5, 
              px: 4,
              fontSize: '1rem',
              borderRadius: '14px',
              fontWeight: 600,
              textTransform: 'none',
              borderColor: THEME.borderMedium,
              color: THEME.textSecondary,
              '&:hover': {
                borderColor: THEME.primary,
                backgroundColor: 'rgba(0,131,143,0.04)',
              },
              '&.Mui-disabled': {
                borderColor: 'rgba(148,163,184,0.12)',
                color: 'rgba(148,163,184,0.4)',
              },
            }}
          >
            Previous
          </Button>

          <Button
            variant="outlined"
            size="large"
            endIcon={<SkipNextIcon />}
            onClick={handleSkipQuestion}
            disabled={submitting}
            sx={{ 
              py: 1.5, 
              px: 4,
              fontSize: '1rem',
              borderRadius: '14px',
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'rgba(245,158,11,0.3)',
              color: '#d97706',
              '&:hover': {
                borderColor: THEME.warning,
                backgroundColor: 'rgba(245,158,11,0.06)',
              }
            }}
          >
            {currentQuestion.questionNumber === totalQuestions ? 'Skip & Review' : 'Skip'}
          </Button>

          <Button
            variant="contained"
            size="large"
            endIcon={submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <NavigateNextIcon />}
            onClick={() => {
              if (currentQuestion.questionNumber === totalQuestions) {
                setShowSubmitDialog(true);
              } else {
                handleSubmitAnswer();
              }
            }}
            disabled={submitting || !hasAnswer()}
            sx={{ 
              py: 1.5, 
              px: 6,
              fontSize: '1.1rem',
              borderRadius: '14px',
              fontWeight: 700,
              textTransform: 'none',
              background: currentSectionConfig.gradient,
              boxShadow: `0 4px 14px ${currentSectionConfig.color}33`,
              '&:hover': {
                boxShadow: `0 6px 20px ${currentSectionConfig.color}44`,
              },
              '&.Mui-disabled': {
                background: 'rgba(148,163,184,0.15)',
                color: 'rgba(148,163,184,0.5)',
              },
            }}
          >
            {submitting ? 'Saving...' : 
             currentQuestion.questionNumber === totalQuestions ? 'Review & Finish' : 
             isCurrentAnswered ? 'Update & Next' : 'Save & Next'}
          </Button>
        </Box>

        {/* Section Complete Dialog */}
        <Dialog 
          open={showSectionDialog} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: '22px', overflow: 'hidden' }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{
                width: 60, height: 60, borderRadius: '18px',
                background: THEME.gradientSuccess,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 2,
                boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
              }}>
                <CheckCircleIcon sx={{ fontSize: 36, color: '#fff' }} />
              </Box>
              <Typography variant="h4" component="span" sx={{ fontWeight: 800, color: THEME.text }}>
                {SECTIONS[nextSectionData?.completedSection]?.name || 'Section'} Complete!
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, color: THEME.textSecondary }}>
              Great job! You've completed the {SECTIONS[nextSectionData?.completedSection]?.name || 'previous'} section.
            </Typography>
            
            <Divider sx={{ my: 3, borderColor: THEME.borderLight }} />
            
            <Typography variant="h6" sx={{ mb: 2, color: THEME.text, fontWeight: 700 }}>
              Next: {SECTIONS[nextSectionData?.section]?.name || 'Next'} Section
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.textSecondary }}>
              {SECTIONS[nextSectionData?.section]?.description || ''}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: THEME.textMuted }}>
              {SECTIONS[nextSectionData?.section]?.questionCount || 0} questions
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinueToNextSection}
              endIcon={<NavigateNextIcon />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: '14px',
                fontWeight: 700,
                textTransform: 'none',
                background: SECTIONS[nextSectionData?.section]?.gradient || THEME.gradientTeal,
                boxShadow: `0 4px 14px ${SECTIONS[nextSectionData?.section]?.color || THEME.primary}33`,
                '&:hover': {
                  boxShadow: `0 6px 20px ${SECTIONS[nextSectionData?.section]?.color || THEME.primary}44`,
                }
              }}
            >
              Start {SECTIONS[nextSectionData?.section]?.name || 'Next'} Section
            </Button>
          </DialogActions>
        </Dialog>

        {/* Final Submit/Review Dialog - UPDATED UI */}
        <Dialog 
          open={showSubmitDialog} 
          onClose={() => setShowSubmitDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: '22px', overflow: 'hidden' }
          }}
        >
          <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: '10px',
                background: THEME.gradientPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AssignmentIcon sx={{ fontSize: 20, color: '#fff' }} />
              </Box>
              <Typography variant="h6" component="span" sx={{ fontWeight: 800, color: THEME.text }}>
                Review & Submit Test
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pb: 2 }}>
            {/* Stats Cards */}
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 1.5, 
                mb: 3 
              }}
            >
              {/* Time Used Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '14px',
                  backgroundColor: 'rgba(41,128,185,0.06)',
                  border: `1px solid ${THEME.borderLight}`,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Box sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  background: 'rgba(41,128,185,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 0.5,
                }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: THEME.blue }} />
                </Box>
                <Typography variant="caption" sx={{ color: THEME.textMuted, fontSize: '0.7rem' }}>
                  Time Used
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: THEME.text }}>
                  {formatTimeWithLabels(totalTimeUsed)}
                </Typography>
              </Paper>

              {/* Time Remaining Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '14px',
                  backgroundColor: totalTimeRemaining < 300 ? 'rgba(239,68,68,0.06)' : 'rgba(0,131,143,0.06)',
                  border: `1px solid ${totalTimeRemaining < 300 ? 'rgba(239,68,68,0.12)' : THEME.borderLight}`,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Box sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  background: totalTimeRemaining < 300 ? 'rgba(239,68,68,0.1)' : 'rgba(0,131,143,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 0.5,
                }}>
                  <TimerIcon sx={{ fontSize: 16, color: totalTimeRemaining < 300 ? THEME.error : THEME.primary }} />
                </Box>
                <Typography variant="caption" sx={{ color: THEME.textMuted, fontSize: '0.7rem' }}>
                  Time Remaining
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: totalTimeRemaining < 300 ? THEME.error : THEME.text }}>
                  {formatTimeWithLabels(totalTimeRemaining)}
                </Typography>
              </Paper>

              {/* Answered Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '14px',
                  backgroundColor: 'rgba(13,148,136,0.06)',
                  border: '1px solid rgba(13,148,136,0.12)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Box sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  background: 'rgba(13,148,136,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 0.5,
                }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: THEME.success }} />
                </Box>
                <Typography variant="caption" sx={{ color: THEME.textMuted, fontSize: '0.7rem' }}>
                  Answered
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: THEME.success }}>
                  {questionStats.answered}
                </Typography>
              </Paper>

              {/* Unanswered Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '14px',
                  backgroundColor: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.12)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Box sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  background: 'rgba(245,158,11,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 0.5,
                }}>
                  <HelpIcon sx={{ fontSize: 16, color: THEME.warning }} />
                </Box>
                <Typography variant="caption" sx={{ color: THEME.textMuted, fontSize: '0.7rem' }}>
                  Unanswered
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: THEME.warning }}>
                  {questionStats.unanswered}
                </Typography>
              </Paper>
            </Box>

            {/* Section Summary */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: THEME.text }}>
              Section Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              {SECTION_ORDER.map((key) => {
                const section = SECTIONS[key];
                const sectionStart = getSectionStartQuestion(key);
                const sectionTotal = section.questionCount;
                let answeredInSection = 0;
                for (let q = sectionStart; q < sectionStart + sectionTotal; q++) {
                  if (userAnswers[q] && userAnswers[q] !== '') answeredInSection++;
                }
                const progressPercent = (answeredInSection / sectionTotal) * 100;
                
                return (
                  <Paper
                    key={key}
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: '14px',
                      border: `1px solid ${section.color}15`,
                      backgroundColor: THEME.cardBg,
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: section.color, 
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}
                    >
                      {section.name}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, my: 0.5, color: THEME.text }}>
                      {answeredInSection}/{sectionTotal}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercent}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: `${section.color}15`,
                        mb: 1,
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: section.gradient
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: THEME.textMuted, fontSize: '0.7rem' }}>
                      questions answered
                    </Typography>
                  </Paper>
                );
              })}
            </Box>

            {questionStats.unanswered > 0 && (
              <>
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 2, 
                    borderRadius: '12px',
                    border: '1px solid rgba(245,158,11,0.2)',
                    '& .MuiAlert-message': { width: '100%' }
                  }}
                >
                  You have {questionStats.unanswered} unanswered question{questionStats.unanswered > 1 ? 's' : ''}. Click on a question below to answer it.
                </Alert>
                
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: THEME.text }}>
                  Unanswered Questions (click to answer)
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    maxHeight: 180, 
                    overflow: 'auto', 
                    mb: 2,
                    borderRadius: '14px',
                    border: `1px solid ${THEME.borderMedium}`
                  }}
                >
                  <List dense disablePadding>
                    {questionStats.unansweredList.map((item, index) => {
                      const sectionConfig = SECTIONS[item.section];
                      const isCached = !!questionCacheRef.current[item.questionNumber];
                      return (
                        <ListItem 
                          key={item.questionNumber} 
                          disablePadding
                          divider={index < questionStats.unansweredList.length - 1}
                        >
                          <ListItemButton 
                            onClick={() => isCached ? navigateToQuestion(item.questionNumber) : null}
                            disabled={!isCached}
                            sx={{
                              py: 1.5,
                              '&:hover': {
                                backgroundColor: `${sectionConfig?.color || THEME.primary}08`
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 44 }}>
                              <Badge 
                                badgeContent={item.questionNumber} 
                                sx={{ 
                                  '& .MuiBadge-badge': { 
                                    backgroundColor: sectionConfig?.color, 
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.7rem'
                                  } 
                                }}
                              >
                                <HelpIcon sx={{ color: THEME.warning }} />
                              </Badge>
                            </ListItemIcon>
                            <ListItemText 
                              primary={`Question ${item.questionNumber}`}
                              secondary={`${sectionConfig?.name || item.section} Section`}
                              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem', color: THEME.text }}
                              secondaryTypographyProps={{ fontSize: '0.75rem', color: THEME.textMuted }}
                            />
                            {isCached && (
                              <Chip 
                                label="Go to Question" 
                                size="small" 
                                variant="outlined"
                                icon={<EditIcon sx={{ fontSize: 14 }} />}
                                sx={{ 
                                  borderColor: sectionConfig?.color,
                                  color: sectionConfig?.color,
                                  fontSize: '0.7rem',
                                  height: 28,
                                  borderRadius: '8px',
                                  '& .MuiChip-icon': { color: sectionConfig?.color }
                                }}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              </>
            )}

            {questionStats.unanswered === 0 && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: '12px', border: '1px solid rgba(13,148,136,0.2)' }}>
                🎉 Great job! You have answered all {totalQuestions} questions.
              </Alert>
            )}

            <Typography variant="body2" sx={{ mt: 2, fontSize: '0.8rem', color: THEME.textMuted }}>
              Once you submit, you cannot change your answers. Make sure you have reviewed all questions.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
            <Button 
              onClick={() => setShowSubmitDialog(false)} 
              disabled={submitting}
              startIcon={<CancelIcon />}
              sx={{ 
                mr: 'auto',
                color: THEME.textSecondary,
                borderRadius: '12px',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: 'rgba(148,163,184,0.08)' }
              }}
            >
              Continue Test
            </Button>
            <Button 
              onClick={handleFinalSubmit} 
              variant="contained" 
              size="large"
              startIcon={submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <SendIcon />}
              disabled={submitting}
              sx={{ 
                px: 4,
                borderRadius: '14px',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                background: THEME.gradientSuccess,
                boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
                '&:hover': { boxShadow: '0 6px 20px rgba(13,148,136,0.4)' },
                '&.Mui-disabled': { background: 'rgba(148,163,184,0.15)', color: 'rgba(148,163,184,0.5)' },
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Webcam Proctoring */}
        <ProctorCamera
          testId={testId}
          enabled={true}
          position="bottom-right"
          captureInterval={60000}
          showControls={true}
          onCaptureImage={(captureData) => {
            console.log('📸 Captured image:', captureData.captureNumber);
          }}
        />
      </Container>
    </Box>
  );
};

export default NonDeveloperTest;