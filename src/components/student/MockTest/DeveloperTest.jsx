// src/components/student/MockTest/DeveloperTest.jsx
// FIXED: Now properly gets and passes evaluation results from backend (like NonDeveloperTest)
// UPDATED: Comprehensive navigation blocking - back, forward, refresh, close, keyboard shortcuts
// UI Updated: iMeetPro teal/cyan theme applied
// TIMING FIX: Synced all fallback timings with backend _get_time_limit (60s aptitude/mcq, 600s coding)

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Container,
  LinearProgress,
  Paper,
  Chip,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Grid,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Code as CodeIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Send as SendIcon,
  Calculate as CalculateIcon,
  MenuBook as MenuBookIcon,
  EmojiEvents as TrophyIcon,
  SkipNext as SkipNextIcon,
  Edit as EditIcon,
  Help as HelpIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from "@mui/icons-material";
import { mockTestAPI } from "../../../services/API/studentmocktest";
// import ProctorCamera from './ProctorCamera';
import CodeEditor from "./CodeEditor";

// ═══ iMeetPro Theme Tokens ═══
const THEME = {
  primary: "#00838f",
  primaryLight: "#26c6da",
  primaryDark: "#004d54",
  secondary: "#0d9488",
  secondaryLight: "#5eead4",
  navy: "#1a5276",
  blue: "#2980b9",
  blueLight: "#3498c8",
  text: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  surface: "#f0f4f8",
  cardBg: "#fff",
  borderLight: "rgba(41,128,185,0.08)",
  borderMedium: "rgba(41,128,185,0.15)",
  success: "#0d9488",
  warning: "#f59e0b",
  error: "#ef4444",
  gradientPrimary: "linear-gradient(135deg, #1a5276 0%, #2980b9 100%)",
  gradientTeal: "linear-gradient(135deg, #00838f 0%, #26c6da 100%)",
  gradientSuccess: "linear-gradient(135deg, #0d9488 0%, #5eead4 100%)",
  gradientCoding: "linear-gradient(135deg, #1a5276 0%, #0d9488 100%)",
};

// Custom Stepper Connector - iMeetPro themed
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  alternativeLabel: {
    top: 22,
  },
  "& .MuiStepConnector-line": {
    height: 3,
    border: 0,
    backgroundColor: "rgba(41,128,185,0.12)",
    borderRadius: 1,
  },
  "&.Mui-active .MuiStepConnector-line": {
    backgroundImage: THEME.gradientTeal,
  },
  "&.Mui-completed .MuiStepConnector-line": {
    backgroundImage: THEME.gradientSuccess,
  },
}));

// Section configurations - iMeetPro themed colors
const SECTIONS = {
  aptitude: {
    name: "Aptitude",
    icon: CalculateIcon,
    color: THEME.blue,
    gradient: "linear-gradient(135deg, #2980b9 0%, #3498c8 100%)",
    description: "Logical reasoning & problem solving",
    nextSection: "mcq",
    isMCQ: true,
  },
  mcq: {
    name: "Theory",
    icon: MenuBookIcon,
    color: THEME.primary,
    gradient: THEME.gradientTeal,
    description: "Conceptual understanding",
    nextSection: "coding",
    isMCQ: true,
  },
  theory: {
    name: "Theory",
    icon: MenuBookIcon,
    color: THEME.primary,
    gradient: THEME.gradientTeal,
    description: "Conceptual understanding",
    nextSection: "coding",
    isMCQ: true,
  },
  coding: {
    name: "Coding",
    icon: CodeIcon,
    color: THEME.navy,
    gradient: THEME.gradientCoding,
    description: "Programming challenges",
    nextSection: null,
    isMCQ: false,
  },
};

// Card style matching dashboard
const cardBase = {
  borderRadius: "18px",
  background: THEME.cardBg,
  border: `1px solid ${THEME.borderLight}`,
  boxShadow: "0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)",
  overflow: "hidden",
  transition: "box-shadow 0.3s ease, transform 0.3s ease",
  "&:hover": {
    boxShadow:
      "0 4px 24px rgba(26,82,118,0.10), 0 1px 4px rgba(41,128,185,0.06)",
  },
};

// Helper to normalize section name (backend uses 'mcq', frontend might expect 'theory')
const normalizeSectionName = (section) => {
  if (section === "theory") return "mcq";
  return section || "aptitude";
};

const DeveloperTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract test data from navigation state
  const navigationState = location.state || {};
  const testData = navigationState.testData || navigationState;

  // Test configuration
  const testId =
    testData?.testId || testData?.raw?.test_id || navigationState.testId;
  const userType = testData?.userType || testData?.raw?.user_type || "dev";
  const totalQuestions =
    testData?.totalQuestions || testData?.raw?.total_questions || 25;
  const examStructure = testData?.examStructure ||
    testData?.raw?.exam_structure || {
      sections: {
        aptitude: { question_count: 10, time_per_question_sec: 60 },
        mcq: { question_count: 10, time_per_question_sec: 60 },
        coding: { question_count: 5, time_per_question_sec: 600 },
      },
    };

  // Calculate total test time in seconds
  const calculateTotalTestTime = () => {
    const sections = examStructure?.sections || {};
    let totalSeconds = 0;
    Object.values(sections).forEach((section) => {
      const questionCount = section.question_count || 0;
      const timePerQuestion = section.time_per_question_sec || 60;
      totalSeconds += questionCount * timePerQuestion;
    });
    return totalSeconds || totalQuestions * 60;
  };

  const totalTestTimeSeconds = calculateTotalTestTime();

  // Initialize current question state
  const initializeCurrentQuestion = () => {
    if (testData?.currentQuestion) {
      return {
        question: testData.currentQuestion.questionHtml || "",
        questionNumber: testData.currentQuestion.questionNumber || 1,
        questionType: normalizeSectionName(
          testData.currentQuestion.questionType || "aptitude",
        ),
        options: testData.currentQuestion.options || null,
        isMCQ:
          testData.currentQuestion.isMcq !== undefined
            ? testData.currentQuestion.isMcq
            : true,
        timeLimit: testData.currentQuestion.timeLimit || 60,
      };
    } else if (testData?.raw) {
      return {
        question: testData.raw.question_html || "",
        questionNumber: testData.raw.question_number || 1,
        questionType: normalizeSectionName(
          testData.raw.question_type || "aptitude",
        ),
        options: testData.raw.options || null,
        isMCQ: testData.raw.is_mcq !== undefined ? testData.raw.is_mcq : true,
        timeLimit: testData.raw.time_limit || 60,
      };
    } else if (testData?.questionHtml || testData?.question_html) {
      return {
        question: testData.questionHtml || testData.question_html || "",
        questionNumber:
          testData.questionNumber || testData.question_number || 1,
        questionType: normalizeSectionName(
          testData.questionType || testData.question_type || "aptitude",
        ),
        options: testData.options || null,
        isMCQ:
          testData.isMcq !== undefined
            ? testData.isMcq
            : testData.is_mcq !== undefined
              ? testData.is_mcq
              : true,
        timeLimit: testData.timeLimit || testData.time_limit || 60,
      };
    }
    return {
      question: "",
      questionNumber: 1,
      questionType: "aptitude",
      options: null,
      isMCQ: true,
      timeLimit: 60,
    };
  };

  // Initialize section question counts from exam structure
  const initializeSectionCounts = () => {
    const sections = examStructure?.sections || {};
    return {
      aptitude: {
        answered: 0,
        total: sections.aptitude?.question_count || 10,
      },
      mcq: {
        answered: 0,
        total:
          sections.mcq?.question_count || sections.theory?.question_count || 10,
      },
      coding: {
        answered: 0,
        total: sections.coding?.question_count || 5,
      },
    };
  };

  const [currentQuestion, setCurrentQuestion] = useState(
    initializeCurrentQuestion,
  );
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [timeLeft, setTimeLeft] = useState(currentQuestion.timeLimit);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showSectionCompleteDialog, setShowSectionCompleteDialog] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [navigating, setNavigating] = useState(false);

  // Section tracking
  const [currentSection, setCurrentSection] = useState(
    normalizeSectionName("aptitude"),
  );
  const [completedSections, setCompletedSections] = useState([]);
  const [previousSection, setPreviousSection] = useState(null);
  const [nextSectionName, setNextSectionName] = useState(null);
  const [sectionScores, setSectionScores] = useState({});
  const [sectionQuestionCount, setSectionQuestionCount] = useState(
    initializeSectionCounts,
  );

  // Test termination state
  const [testTerminated, setTestTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");

  // ============ NAVIGATION VIOLATION TRACKING ============
  const [navigationViolationCount, setNavigationViolationCount] = useState(0);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [navigationWarningMessage, setNavigationWarningMessage] = useState("");
  const MAX_NAVIGATION_VIOLATIONS = 3;
  const testActiveRef = useRef(true);
  const testContainerRef = useRef(null);

  // ============ TOTAL TEST TIME TRACKING ============
  const [testStartTime] = useState(Date.now());
  const [totalTimeUsed, setTotalTimeUsed] = useState(0);
  const [totalTimeRemaining, setTotalTimeRemaining] =
    useState(totalTestTimeSeconds);

  // ============ CLIENT-SIDE CACHING FOR NAVIGATION ============
  const questionCacheRef = useRef({});
  const [userAnswers, setUserAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([1]));
  const [skippedQuestions, setSkippedQuestions] = useState(new Set());
  const [highestQuestionReached, setHighestQuestionReached] = useState(1);
  const [expiredQuestions, setExpiredQuestions] = useState(new Set());

  // Check if state is valid
  const isValidState = !!(location.state && (testData || testId));

  // ════════════════════════════════════════════════════════════════════
  // NAVIGATION VIOLATION HANDLER - Central function for all violations
  // ════════════════════════════════════════════════════════════════════
  const handleNavigationViolation = useCallback(
    (reason) => {
      if (!testActiveRef.current) return;

      setNavigationViolationCount((prev) => {
        const newCount = prev + 1;
        console.log(`⚠️ Navigation violation #${newCount}: ${reason}`);

        if (newCount >= MAX_NAVIGATION_VIOLATIONS) {
          testActiveRef.current = false;
          if (testId) {
            sessionStorage.setItem(`test_terminated_${testId}`, "true");
          }
          setTerminationReason(
            `Your test has been terminated because you attempted to navigate away ${MAX_NAVIGATION_VIOLATIONS} times. ` +
              `Last violation: ${reason}`,
          );
          setTestTerminated(true);
        } else {
          setNavigationWarningMessage(
            `⚠️ Warning ${newCount}/${MAX_NAVIGATION_VIOLATIONS}: ${reason}. ` +
              `Your test will be terminated after ${MAX_NAVIGATION_VIOLATIONS - newCount} more violation(s).`,
          );
          setShowNavigationWarning(true);
        }

        return newCount;
      });
    },
    [testId],
  );

  // Log test type on mount
  useEffect(() => {
    console.log("🔵 DEVELOPER TEST COMPONENT LOADED");
    console.log("📋 Test ID:", testId);
    console.log("📋 User Type:", userType);
    console.log("📋 Total Questions:", totalQuestions);
    console.log("📋 Exam Structure:", examStructure);
  }, []);

  // ============ EFFECT: Handle invalid state - redirect immediately ============
  useEffect(() => {
    if (!isValidState) {
      console.log("❌ Invalid state detected, redirecting to mock tests...");
      navigate("/student/mock-tests", { replace: true });
    }
  }, [isValidState, navigate]);

  // ============ BROWSER BACK NAVIGATION PREVENTION ============
  useEffect(() => {
    if (testId) {
      const isTestSubmitted = sessionStorage.getItem(
        `test_submitted_${testId}`,
      );
      if (isTestSubmitted === "true") {
        console.log("Test already submitted, redirecting to mock tests page");
        navigate("/student/mock-tests", { replace: true });
        return;
      }
    }
  }, [testId, navigate]);

  // ════════════════════════════════════════════════════════════════════
  // 1. BLOCK BROWSER BACK & FORWARD (popstate) - MAXIMUM STRENGTH
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const HISTORY_FLOOD_COUNT = 50;

    const floodHistory = () => {
      for (let i = 0; i < HISTORY_FLOOD_COUNT; i++) {
        window.history.pushState(
          { page: "test-guard", index: i, testId: testId },
          "",
          window.location.href,
        );
      }
      console.log(
        `🔒 Flooded history with ${HISTORY_FLOOD_COUNT} guard entries`,
      );
    };

    floodHistory();

    const handlePopState = (event) => {
      if (!testActiveRef.current || testCompleted) return;

      console.log(
        "🔙 Browser navigation detected (back/forward) - blocking & re-flooding",
      );

      for (let i = 0; i < HISTORY_FLOOD_COUNT; i++) {
        window.history.pushState(
          { page: "test-guard", index: i, testId: testId },
          "",
          window.location.href,
        );
      }

      handleNavigationViolation(
        "You attempted to use browser back/forward navigation, which is not allowed during the test.",
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    isValidState,
    testTerminated,
    testCompleted,
    handleNavigationViolation,
    testId,
  ]);

  // ════════════════════════════════════════════════════════════════════
  // 2. BLOCK TAB/WINDOW CLOSE & REFRESH (beforeunload)
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const handleBeforeUnload = (event) => {
      if (!testActiveRef.current) return;

      console.log("🚫 Attempting to close/refresh - blocking");

      event.preventDefault();
      event.returnValue =
        "You have an active test in progress. If you leave, your test will be terminated. Are you sure?";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isValidState, testTerminated, testCompleted]);

  // ════════════════════════════════════════════════════════════════════
  // 3. BLOCK KEYBOARD SHORTCUTS
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const handleKeyDown = (event) => {
      if (!testActiveRef.current) return;

      const key = event.key;
      const isCtrl = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;

      let blocked = false;
      let reason = "";

      if (key === "F5") {
        blocked = true;
        reason = "F5 (Refresh) is disabled during the test";
      }
      if (isCtrl && (key === "r" || key === "R")) {
        blocked = true;
        reason = "Ctrl+R (Refresh) is disabled during the test";
      }
      if (isCtrl && (key === "w" || key === "W")) {
        blocked = true;
        reason = "Ctrl+W (Close tab) is disabled during the test";
      }
      if (isCtrl && event.shiftKey && (key === "w" || key === "W")) {
        blocked = true;
        reason = "Ctrl+Shift+W (Close window) is disabled during the test";
      }
      if (isAlt && key === "ArrowLeft") {
        blocked = true;
        reason = "Alt+Left (Browser back) is disabled during the test";
      }
      if (isAlt && key === "ArrowRight") {
        blocked = true;
        reason = "Alt+Right (Browser forward) is disabled during the test";
      }
      if (isCtrl && (key === "l" || key === "L")) {
        blocked = true;
        reason = "Ctrl+L (Address bar) is disabled during the test";
      }
      if (isAlt && (key === "d" || key === "D")) {
        blocked = true;
        reason = "Alt+D (Address bar) is disabled during the test";
      }
      if (key === "F6") {
        blocked = true;
        reason = "F6 (Address bar focus) is disabled during the test";
      }
      if (isAlt && key === "Home") {
        blocked = true;
        reason = "Alt+Home (Browser home) is disabled during the test";
      }
      if (isCtrl && (key === "n" || key === "N") && !event.shiftKey) {
        blocked = true;
        reason = "Ctrl+N (New window) is disabled during the test";
      }
      if (isCtrl && (key === "t" || key === "T") && !event.shiftKey) {
        blocked = true;
        reason = "Ctrl+T (New tab) is disabled during the test";
      }
      if (isCtrl && event.shiftKey && (key === "t" || key === "T")) {
        blocked = true;
        reason = "Ctrl+Shift+T (Reopen tab) is disabled during the test";
      }
      if (key === "Backspace") {
        const tagName = event.target.tagName.toLowerCase();
        const isInput =
          tagName === "input" ||
          tagName === "textarea" ||
          event.target.isContentEditable;
        if (!isInput) {
          blocked = true;
          reason = "Backspace navigation is disabled during the test";
        }
      }
      if (isAlt && key === "F4") {
        blocked = true;
        reason = "Alt+F4 (Close window) is disabled during the test";
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

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
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
      console.log("🖱️ Right-click blocked during test");

      setNavigationWarningMessage(
        "🚫 Right-click is disabled during the test to prevent navigation.",
      );
      setShowNavigationWarning(true);

      return false;
    };

    window.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [isValidState, testTerminated, testCompleted]);

  // ════════════════════════════════════════════════════════════════════
  // 5. DETECT TAB VISIBILITY CHANGE
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const handleVisibilityChange = () => {
      if (!testActiveRef.current) return;

      if (document.hidden) {
        console.log("👁️ Tab became hidden - user switched away");
        handleNavigationViolation(
          "You switched away from the test tab. Leaving the test window is not allowed.",
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isValidState, testTerminated, testCompleted, handleNavigationViolation]);

  // ════════════════════════════════════════════════════════════════════
  // 6. DETECT WINDOW BLUR
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    let blurTimeout = null;

    const handleWindowBlur = () => {
      if (!testActiveRef.current) return;

      blurTimeout = setTimeout(() => {
        if (document.hidden) {
          return;
        }
        console.log("🪟 Window lost focus");
        setNavigationWarningMessage(
          "⚠️ Warning: Please stay focused on the test window. Switching to other applications may be flagged.",
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

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      if (blurTimeout) clearTimeout(blurTimeout);
    };
  }, [isValidState, testTerminated, testCompleted]);

  // ════════════════════════════════════════════════════════════════════
  // 7. BLOCK DRAG AND DROP OF LINKS
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isValidState || testTerminated || testCompleted) return;

    const handleDragStart = (event) => {
      if (event.target.tagName === "A" || event.target.closest("a")) {
        event.preventDefault();
        console.log("🔗 Link drag blocked during test");
      }
    };

    const handleDrop = (event) => {
      event.preventDefault();
      console.log("📎 Drop blocked during test");
    };

    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("drop", handleDrop, true);

    return () => {
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("drop", handleDrop, true);
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

  // Cache the initial question
  useEffect(() => {
    if (
      currentQuestion.question &&
      currentQuestion.questionNumber &&
      isValidState
    ) {
      questionCacheRef.current[currentQuestion.questionNumber] = {
        ...currentQuestion,
      };
      console.log(
        "Cached question:",
        currentQuestion.questionNumber,
        questionCacheRef.current,
      );
    }
  }, [isValidState, currentQuestion.question, currentQuestion.questionNumber]);

  // Determine if current question is MCQ
  const isCurrentMCQ = () => {
    if (currentQuestion.options && currentQuestion.options.length > 0) {
      return true;
    }
    if (currentQuestion.isMCQ !== undefined && currentQuestion.isMCQ !== null) {
      return currentQuestion.isMCQ;
    }
    const sectionConfig = SECTIONS[currentQuestion.questionType];
    return sectionConfig?.isMCQ ?? false;
  };

  // Get section start question number
  const getSectionStartQuestion = (sectionName) => {
    const normalized = normalizeSectionName(sectionName);
    if (normalized === "aptitude") return 1;
    if (normalized === "mcq")
      return (sectionQuestionCount.aptitude?.total || 10) + 1;
    if (normalized === "coding")
      return (
        (sectionQuestionCount.aptitude?.total || 10) +
        (sectionQuestionCount.mcq?.total || 10) +
        1
      );
    return 1;
  };

  // Get section for a question number
  const getSectionForQuestion = (questionNum) => {
    const aptitudeEnd = sectionQuestionCount.aptitude?.total || 10;
    const mcqEnd = aptitudeEnd + (sectionQuestionCount.mcq?.total || 10);

    if (questionNum <= aptitudeEnd) return "aptitude";
    if (questionNum <= mcqEnd) return "mcq";
    return "coding";
  };

  // Calculate section progress based on answered questions
  const getSectionProgress = () => {
    const normalizedSection = normalizeSectionName(currentSection);
    const sectionConfig = sectionQuestionCount[normalizedSection];
    if (!sectionConfig) return 0;

    let answeredInSection = 0;
    const sectionStart = getSectionStartQuestion(normalizedSection);
    const sectionEnd = sectionStart + sectionConfig.total - 1;

    for (let q = sectionStart; q <= sectionEnd; q++) {
      if (userAnswers[q] && userAnswers[q] !== "") {
        answeredInSection++;
      }
    }

    return (answeredInSection / sectionConfig.total) * 100;
  };

  // Get current section index for stepper
  const getSectionIndex = () => {
    const sections = ["aptitude", "mcq", "coding"];
    const normalizedSection = normalizeSectionName(currentSection);
    return sections.indexOf(normalizedSection);
  };

  // Get section display order for stepper
  const getStepperSections = () => {
    return [
      { key: "aptitude", ...SECTIONS.aptitude },
      { key: "mcq", ...SECTIONS.mcq },
      { key: "coding", ...SECTIONS.coding },
    ];
  };

  // Get answered and unanswered question counts
  const getQuestionStats = () => {
    let answered = 0;
    let unanswered = 0;
    const unansweredList = [];

    for (let q = 1; q <= totalQuestions; q++) {
      if (userAnswers[q] && userAnswers[q] !== "") {
        answered++;
      } else {
        unanswered++;
        unansweredList.push({
          questionNumber: q,
          section: getSectionForQuestion(q),
        });
      }
    }

    return { answered, unanswered, unansweredList };
  };

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format time for display with labels
  const formatTimeWithLabels = (seconds) => {
    if (seconds < 0) seconds = 0;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(" ");
  };
const handleFullscreen = () => {
  setIsFullscreen(prev => !prev);
};

  // Sync state if user exits fullscreen via Escape key
  // useEffect(() => {
  //   const handleFullscreenChange = () => {
  //     setIsFullscreen(!!document.fullscreenElement);
  //   };
  //   document.addEventListener("fullscreenchange", handleFullscreenChange);
  //   return () =>
  //     document.removeEventListener("fullscreenchange", handleFullscreenChange);
  // }, []);
  

// Auto-enter fullscreen when test starts
useEffect(() => {
  if (!isValidState) return;

const enterFullscreen = async () => {
    try {
      const elem = testContainerRef.current;
      if (elem && !document.fullscreenElement) {
        await elem.requestFullscreen();
      }
    } catch (err) {
      console.warn("Auto fullscreen failed:", err);
    }
    setIsFullscreen(true);
  };

  const timer = setTimeout(enterFullscreen, 500);
  return () => clearTimeout(timer);
}, [isValidState]);


  // Total test time tracking
  useEffect(() => {
    if (!isValidState) return;

    const totalTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
      setTotalTimeUsed(elapsed);
      setTotalTimeRemaining(Math.max(0, totalTestTimeSeconds - elapsed));
    }, 1000);

    return () => clearInterval(totalTimer);
  }, [testStartTime, totalTestTimeSeconds, isValidState]);

  // Per-question timer effect
  useEffect(() => {
    if (
      !isValidState ||
      testCompleted ||
      loading ||
      !testId ||
      showSectionCompleteDialog ||
      navigating ||
      showSubmitDialog
    )
      return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Mark this question's time as expired BEFORE skipping
          setExpiredQuestions(
            (prevSet) => new Set([...prevSet, currentQuestion.questionNumber]),
          );
          handleSkipQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isValidState,
    testCompleted,
    loading,
    currentQuestion.questionNumber,
    testId,
    showSectionCompleteDialog,
    navigating,
    showSubmitDialog,
  ]);

  // Reset timer and restore answer when question changes
  useEffect(() => {
    if (!isValidState) return;

    setTimeLeft(currentQuestion.timeLimit || 60);
    setVisitedQuestions(
      (prev) => new Set([...prev, currentQuestion.questionNumber]),
    );

    const savedAnswer = userAnswers[currentQuestion.questionNumber];
    if (savedAnswer !== undefined && savedAnswer !== "") {
      const isMCQ =
        (currentQuestion.options && currentQuestion.options.length > 0) ||
        currentQuestion.isMCQ === true;

      if (isMCQ) {
        setSelectedOption(savedAnswer);
        setAnswer("");
      } else {
        setAnswer(savedAnswer);
        setSelectedOption("");
      }
    } else {
      setAnswer("");
      setSelectedOption("");
    }
  }, [
    currentQuestion.questionNumber,
    currentQuestion.timeLimit,
    currentQuestion.options,
    currentQuestion.isMCQ,
    userAnswers,
    isValidState,
  ]);

  // Update current section based on question type
  useEffect(() => {
    if (!isValidState) return;
    if (currentQuestion.questionType) {
      setCurrentSection(normalizeSectionName(currentQuestion.questionType));
    }
  }, [currentQuestion.questionType, isValidState]);

  // Update highest question reached
  useEffect(() => {
    if (currentQuestion.questionNumber > highestQuestionReached) {
      setHighestQuestionReached(currentQuestion.questionNumber);
    }
  }, [currentQuestion.questionNumber]);

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
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress sx={{ mb: 3, color: THEME.primary }} />
        <Typography variant="h6" color="text.secondary">
          Redirecting...
        </Typography>
      </Container>
    );
  }

  // ============ TEST TERMINATED SCREEN ============
  if (testTerminated) {
    return (
      <Box sx={{ bgcolor: THEME.surface, minHeight: "100vh", py: 8 }}>
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              ...cardBase,
              p: 4,
              textAlign: "center",
              borderTop: `4px solid ${THEME.error}`,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "rgba(239,68,68,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                mb: 3,
              }}
            >
              <CancelIcon sx={{ fontSize: 48, color: THEME.error }} />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: THEME.error,
                mb: 1,
                letterSpacing: "-0.02em",
              }}
            >
              Test Terminated
            </Typography>

            <Alert
              severity="error"
              sx={{
                mb: 3,
                textAlign: "left",
                borderRadius: "12px",
                border: "1px solid rgba(239,68,68,0.2)",
                "& .MuiAlert-icon": { color: THEME.error },
              }}
            >
              <Typography variant="body1" fontWeight="medium" gutterBottom>
                Your test session has been terminated.
              </Typography>
              <Typography variant="body2">
                {terminationReason ||
                  "The test was terminated due to a violation of test rules."}
              </Typography>
            </Alert>

            {navigationViolationCount > 0 && (
              <Alert
                severity="warning"
                sx={{
                  mb: 3,
                  textAlign: "left",
                  borderRadius: "12px",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <Typography variant="body2">
                  Total navigation violations recorded:{" "}
                  <strong>{navigationViolationCount}</strong>
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() =>
                  navigate("/student/mock-tests", { replace: true })
                }
                sx={{
                  py: 1.5,
                  borderRadius: "12px",
                  background: THEME.gradientPrimary,
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 12px rgba(41,128,185,0.25)",
                  "&:hover": { boxShadow: "0 6px 18px rgba(41,128,185,0.35)" },
                }}
              >
                Go to Mock Tests
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() =>
                  navigate("/student/dashboard", { replace: true })
                }
                sx={{
                  py: 1.5,
                  borderRadius: "12px",
                  borderColor: THEME.borderMedium,
                  color: THEME.blue,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  "&:hover": {
                    bgcolor: "rgba(41,128,185,0.06)",
                    borderColor: THEME.blue,
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

  const handleAnswerChange = (event) => {
    const newAnswer = event.target.value;
    setAnswer(newAnswer);
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionNumber]: newAnswer,
    }));
    if (newAnswer) {
      setSkippedQuestions((prev) => {
        const newSet = new Set([...prev]);
        newSet.delete(currentQuestion.questionNumber);
        return newSet;
      });
    }
  };

  const handleOptionSelect = (event) => {
    const newOption = event.target.value;
    setSelectedOption(newOption);
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionNumber]: newOption,
    }));
    setSkippedQuestions((prev) => {
      const newSet = new Set([...prev]);
      newSet.delete(currentQuestion.questionNumber);
      return newSet;
    });
  };

  const handleOptionDoubleClick = (optionIndex) => {
    if (selectedOption === optionIndex) {
      setSelectedOption("");
      setUserAnswers((prev) => {
        const newAnswers = { ...prev };
        delete newAnswers[currentQuestion.questionNumber];
        return newAnswers;
      });
    }
  };

  const getAnswerToSubmit = () => {
    if (isCurrentMCQ()) {
      const optionIndex = parseInt(selectedOption);
      if (
        !isNaN(optionIndex) &&
        currentQuestion.options &&
        currentQuestion.options[optionIndex] !== undefined
      ) {
        const answerText = currentQuestion.options[optionIndex];
        console.log(
          `MCQ Answer: Index ${selectedOption} -> Text "${answerText}"`,
        );
        return answerText;
      }
      return selectedOption;
    }
    return answer.trim();
  };
  const hasAnswer = () => {
    if (isCurrentMCQ()) return selectedOption !== "";
    const trimmed = answer.trim();
    if (!trimmed) return false;

    const LANGUAGES_LIST = [
      `# Write your solution here\ndef solution():\n    # Your code here\n    pass\n\n# Test your solution\nif __name__ == "__main__":\n    solution()`,
      `// Write your solution here\nfunction solution() {\n  // Your code here\n}\n\n// Test your solution\nsolution();`,
      `public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n        solution();\n    }\n\n    public static void solution() {\n        // Your code here\n    }\n}`,
      `#include <iostream>\nusing namespace std;\n\n// Write your solution here\nvoid solution() {\n    // Your code here\n}\n\nint main() {\n    solution();\n    return 0;\n}`,
      `#include <stdio.h>\n\n// Write your solution here\nvoid solution() {\n    // Your code here\n}\n\nint main() {\n    solution();\n    return 0;\n}`,
      `// Write your solution here\nfunction solution(): void {\n  // Your code here\n}\n\n// Test your solution\nsolution();`,
    ];

    if (LANGUAGES_LIST.some((template) => trimmed === template.trim())) {
      return false;
    }

    return true;
  };

  // ════════════════════════════════════════════════════════════
  // FIXED: New function to handle test completion with API data
  // ════════════════════════════════════════════════════════════
  const handleTestComplete = (response) => {
    console.log("🎯 Test completed! API Response:", response);

    testActiveRef.current = false;

    sessionStorage.setItem(`test_submitted_${testId}`, "true");

    const finalResults = {
      testId: testId,
      test_id: testId,
      userType: userType,
      user_type: userType,
      score: response.score || 0,
      totalQuestions:
        response.totalQuestions || response.total_questions || totalQuestions,
      total_questions:
        response.totalQuestions || response.total_questions || totalQuestions,
      scorePercentage:
        response.scorePercentage || response.score_percentage || 0,
      score_percentage:
        response.scorePercentage || response.score_percentage || 0,
      analytics: response.analytics || response.evaluation_report || "",
      sectionScores: response.sectionScores || response.section_scores || {},
      section_scores: response.sectionScores || response.section_scores || {},
      sectionDetails: response.sectionDetails || response.section_details || {},
      section_details:
        response.sectionDetails || response.section_details || {},
      timeUsed: totalTimeUsed,
      warningCount: response.warningCount || response.warning_count || 0,
      terminatedByWarnings:
        response.terminatedByWarnings ||
        response.terminated_by_warnings ||
        false,
      summary: response.summary || {},
      codingResults: response.codingResults || response.coding_results || {},
      coding_results: response.codingResults || response.coding_results || {},
      navigationViolations: navigationViolationCount,
      raw: response,
    };

    console.log("📊 Final Results to pass:", finalResults);

    setTestCompleted(true);
    setResults(finalResults);

    navigate("/student/mock-tests/results", {
      state: {
        results: finalResults,
        testType: "developer",
        testData: testData,
      },
      replace: true,
    });
  };

  // ============ PREVIOUS BUTTON - Client-side navigation ============
  const handlePreviousQuestion = () => {
    if (currentQuestion.questionNumber <= 1) return;

    if (!hasAnswer()) {
      setSkippedQuestions(
        (prev) => new Set([...prev, currentQuestion.questionNumber]),
      );
    }

    const prevQuestionNum = currentQuestion.questionNumber - 1;
    const cachedQuestion = questionCacheRef.current[prevQuestionNum];

    if (cachedQuestion) {
      console.log(
        "Navigating to cached question:",
        prevQuestionNum,
        cachedQuestion,
      );
      setCurrentQuestion({ ...cachedQuestion });
    } else {
      setError("Previous question not available in cache.");
    }
  };

  // ============ SKIP BUTTON ============
  const handleSkipQuestion = async () => {
    setSkippedQuestions(
      (prev) => new Set([...prev, currentQuestion.questionNumber]),
    );

    if (!hasAnswer()) {
      setUserAnswers((prev) => {
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
      console.log("Skipping to cached question:", nextQuestionNum);

      const currentSec = getSectionForQuestion(currentQuestion.questionNumber);
      const nextSec = getSectionForQuestion(nextQuestionNum);

      if (currentSec !== nextSec) {
        setPreviousSection(currentSec);
        setNextSectionName(nextSec);
        setCompletedSections((prev) => {
          if (!prev.includes(currentSec)) {
            return [...prev, currentSec];
          }
          return prev;
        });
        setShowSectionCompleteDialog(true);
      }

      setCurrentQuestion({ ...cachedNextQuestion });
    } else {
      setSubmitting(true);
      setError("");

      try {
        const response = await mockTestAPI.submitAnswerWithData(
          testId,
          currentQuestion.questionNumber,
          userAnswers[currentQuestion.questionNumber] || "__SKIPPED__",
        );

        console.log("Skip/Navigate response:", response);

        if (response.testCompleted || response.test_completed) {
          handleTestComplete(response);
        } else if (response.nextQuestion || response.next_question) {
          handleNextQuestion(
            response.nextQuestion || response.next_question,
            response,
          );
        }
      } catch (error) {
        console.error("Failed to get next question:", error);
        setError(`Failed to navigate: ${mockTestAPI.getErrorMessage(error)}`);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // ============ SUBMIT/SAVE ANSWER ============
  const handleSubmitAnswer = async (
    isAutoSubmit = false,
    latestCode = null,
  ) => {
    if (!testId) {
      setError("Test ID is missing. Cannot submit answer.");
      return;
    }

    // ✅ FIX: Use latestCode passed directly from button click
    // This bypasses stale closure problem entirely
    let answerToSubmit;
    if (!isCurrentMCQ()) {
      // Use latestCode if provided, fallback to answer state, fallback to userAnswers cache
      const codeToUse =
        latestCode ||
        answer ||
        userAnswers[currentQuestion.questionNumber] ||
        "";
      answerToSubmit = codeToUse.trim();

      // ✅ Also sync it into userAnswers so cache is updated
      if (answerToSubmit) {
        setUserAnswers((prev) => ({
          ...prev,
          [currentQuestion.questionNumber]: answerToSubmit,
        }));
      }
    } else {
      answerToSubmit = getAnswerToSubmit();
    }

    if (!isAutoSubmit && !answerToSubmit) {
      setError("Please provide an answer before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestion.questionNumber]:
          selectedOption !== "" ? selectedOption : answerToSubmit || "",
      }));

      setSkippedQuestions((prev) => {
        const newSet = new Set([...prev]);
        newSet.delete(currentQuestion.questionNumber);
        return newSet;
      });

      const timeTaken = currentQuestion.timeLimit - timeLeft;

      const response = await mockTestAPI.submitAnswer({
        test_id: testId,
        question_number: currentQuestion.questionNumber,
        answer: answerToSubmit || "No answer provided",
        time_taken: timeTaken,
      });

      console.log("Submit response:", response);

      if (
        response.testCompleted ||
        response.test_completed ||
        response.isComplete ||
        response.is_complete
      ) {
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
            const currentSec = getSectionForQuestion(
              currentQuestion.questionNumber,
            );
            const nextSec = getSectionForQuestion(nextQuestionNum);

            if (currentSec !== nextSec) {
              setPreviousSection(currentSec);
              setNextSectionName(nextSec);
              setCompletedSections((prev) => {
                if (!prev.includes(currentSec)) {
                  return [...prev, currentSec];
                }
                return prev;
              });
              setShowSectionCompleteDialog(true);
            }

            setCurrentQuestion({ ...cachedQuestion });
          } else {
            setShowSubmitDialog(true);
          }
        }
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setError(
        `Failed to submit answer: ${mockTestAPI.getErrorMessage(error)}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============ NAVIGATE TO SPECIFIC QUESTION ============
  const navigateToQuestion = (questionNum) => {
    const cachedQuestion = questionCacheRef.current[questionNum];
    if (cachedQuestion) {
      setShowSubmitDialog(false);
      setCurrentQuestion({ ...cachedQuestion });
    } else {
      setError(
        `Question ${questionNum} is not available. Please navigate sequentially.`,
      );
    }
  };

  // ════════════════════════════════════════════════════════════
  // FIXED: Final submit now properly calls backend and uses response
  // ════════════════════════════════════════════════════════════
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      // ✅ For coding questions use userAnswers cache (always up to date)
      // For MCQ use getAnswerToSubmit() as before
      const answerToSubmit = !isCurrentMCQ()
        ? (userAnswers[currentQuestion.questionNumber] || answer || "").trim()
        : getAnswerToSubmit();

      console.log("📤 Final submit - submitting last answer...");

      const response = await mockTestAPI.submitAnswer({
        test_id: testId,
        question_number: currentQuestion.questionNumber,
        answer: answerToSubmit || "__FINAL_SUBMIT__",
      });

      console.log("📥 Final submit response:", response);

      if (response.testCompleted || response.test_completed) {
        handleTestComplete(response);
      } else {
        console.log("⚠️ Test not marked complete, fetching results...");
        try {
          const resultsResponse = await mockTestAPI.getTestResults(testId);
          console.log("📊 Fetched results:", resultsResponse);

          handleTestComplete({
            ...resultsResponse,
            testCompleted: true,
          });
        } catch (fetchError) {
          console.error("Failed to fetch results:", fetchError);
          const stats = getQuestionStats();
          handleTestComplete({
            testCompleted: true,
            score: 0,
            totalQuestions: totalQuestions,
            scorePercentage: 0,
            sectionScores: {},
            analytics: "Results are being processed. Please check back later.",
            answered: stats.answered,
            unanswered: stats.unanswered,
          });
        }
      }
    } catch (error) {
      console.error("Failed to submit test:", error);
      setError(`Failed to submit test: ${mockTestAPI.getErrorMessage(error)}`);
      setSubmitting(false);
    }
  };

  // ============ HELPER: Handle next question ============
  const handleNextQuestion = (nextQuestion, response) => {
    const nextQuestionType = normalizeSectionName(
      nextQuestion.questionType || nextQuestion.question_type || "mcq",
    );
    const nextIsMCQ =
      nextQuestion.isMcq !== undefined
        ? nextQuestion.isMcq
        : nextQuestion.is_mcq !== undefined
          ? nextQuestion.is_mcq
          : nextQuestion.options && nextQuestion.options.length > 0;

    const newQuestion = {
      question:
        nextQuestion.questionHtml ||
        nextQuestion.question_html ||
        nextQuestion.question ||
        "",
      questionNumber:
        nextQuestion.questionNumber || nextQuestion.question_number,
      questionType: nextQuestionType,
      options: nextQuestion.options || null,
      isMCQ: nextIsMCQ,
      timeLimit: nextQuestion.timeLimit || nextQuestion.time_limit || 60,
      title: nextQuestion.title || "",
    };

    questionCacheRef.current[newQuestion.questionNumber] = { ...newQuestion };

    // ✅ ADD THIS: Initialize boilerplate for new coding questions
    if (!nextIsMCQ && !userAnswers[newQuestion.questionNumber]) {
      // Import or reference LANGUAGES from compilerService
      // Use the default python boilerplate as starting point
      const defaultBoilerplate = `# Write your solution here\ndef solution():\n    # Your code here\n    pass\n\n# Test your solution\nif __name__ == "__main__":\n    solution()`;

      setUserAnswers((prev) => ({
        ...prev,
        [newQuestion.questionNumber]: defaultBoilerplate,
      }));
    }
    console.log(
      "Cached new question:",
      newQuestion.questionNumber,
      questionCacheRef.current,
    );

    const currentSec = getSectionForQuestion(currentQuestion.questionNumber);
    const nextSec = getSectionForQuestion(newQuestion.questionNumber);

    if (currentSec !== nextSec) {
      setPreviousSection(currentSec);
      setNextSectionName(nextSec);
      setCompletedSections((prev) => {
        if (!prev.includes(currentSec)) {
          return [...prev, currentSec];
        }
        return prev;
      });
      setShowSectionCompleteDialog(true);
    }

    setCurrentQuestion(newQuestion);
    setAnswer("");
    setSelectedOption("");
  };

 const handleContinueToNextSection = () => {
    setShowSectionCompleteDialog(false);
    setCurrentSection(normalizeSectionName(currentQuestion.questionType));

    // If moving to coding section, enter native fullscreen immediately
    // (must be inside a click handler to satisfy browser user-gesture requirement)
    if (normalizeSectionName(nextSectionName) === "coding") {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Fullscreen failed:", err);
        });
      }
    }
  };

  const getSectionIcon = (sectionName) => {
    const normalizedName = normalizeSectionName(sectionName);
    const section = SECTIONS[normalizedName];
    if (!section) return <CodeIcon />;
    const IconComponent = section.icon;
    return <IconComponent />;
  };

  const canGoPrevious = currentQuestion.questionNumber > 1;
  const isCurrentAnswered =
    userAnswers[currentQuestion.questionNumber] &&
    userAnswers[currentQuestion.questionNumber] !== "";
  const isCurrentSkipped = skippedQuestions.has(currentQuestion.questionNumber);
  const questionStats = getQuestionStats();

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: THEME.surface,
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "16px",
            background: THEME.gradientTeal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={28} sx={{ color: "#fff" }} />
        </Box>
        <Typography
          sx={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: THEME.textSecondary,
          }}
        >
          Processing your answer...
        </Typography>
      </Box>
    );
  }

  // Error state - no question
  if (!currentQuestion.question && !loading) {
    return (
      <Box sx={{ bgcolor: THEME.surface, minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          <Alert
            severity="error"
            sx={{
              mb: 4,
              borderRadius: "14px",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              No Question Data Available
            </Typography>
            <Typography variant="body2">Please start a new test.</Typography>
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate("/student/mock-tests")}
            sx={{
              background: THEME.gradientPrimary,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              px: 4,
              py: 1.2,
              boxShadow: "0 4px 12px rgba(41,128,185,0.25)",
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
      <Box sx={{ bgcolor: THEME.surface, minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(245,158,11,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              mb: 2,
            }}
          >
            <TrophyIcon sx={{ fontSize: 48, color: THEME.warning }} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              mb: 1,
              fontWeight: 800,
              background: THEME.gradientSuccess,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Test Completed!
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: THEME.text, fontWeight: 600 }}
          >
            Score: {results.score || 0} / {totalQuestions}
          </Typography>
          <CircularProgress sx={{ mt: 2, color: THEME.primary }} />
          <Typography
            variant="body2"
            sx={{ mt: 2, color: THEME.textSecondary }}
          >
            Redirecting to results...
          </Typography>
        </Container>
      </Box>
    );
  }

  const normalizedCurrentSection = normalizeSectionName(currentSection);
  const currentSectionConfig =
    SECTIONS[normalizedCurrentSection] || SECTIONS.aptitude;
  const showMCQOptions =
    isCurrentMCQ() &&
    currentQuestion.options &&
    currentQuestion.options.length > 0;
  const isTimeExpired = expiredQuestions.has(currentQuestion.questionNumber);

  const getSectionQuestionDisplay = () => {
    const sectionStart = getSectionStartQuestion(normalizedCurrentSection);
    const sectionTotal =
      sectionQuestionCount[normalizedCurrentSection]?.total || 0;
    const currentInSection = currentQuestion.questionNumber - sectionStart + 1;
    return `${currentInSection}/${sectionTotal}`;
  };

  return (
    <Box
      ref={testContainerRef}
      sx={{
        bgcolor: THEME.surface,
        minHeight: "100vh",
        fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
        ...(isFullscreen && {
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }),
      }}
    >
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* ════════ NAVIGATION WARNING BANNER (floating) ════════ */}
        {showNavigationWarning && (
          <Paper
            elevation={6}
            sx={{
              position: "fixed",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              maxWidth: 600,
              width: "90%",
              borderRadius: "16px",
              overflow: "hidden",
              animation: "slideDown 0.3s ease-out",
              "@keyframes slideDown": {
                from: {
                  opacity: 0,
                  transform: "translateX(-50%) translateY(-20px)",
                },
                to: { opacity: 1, transform: "translateX(-50%) translateY(0)" },
              },
            }}
          >
            <Alert
              severity="warning"
              variant="filled"
              onClose={() => setShowNavigationWarning(false)}
              sx={{
                fontSize: "0.95rem",
                borderRadius: "16px",
                "& .MuiAlert-message": { width: "100%" },
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                {navigationWarningMessage}
              </Typography>
              {navigationViolationCount > 0 && (
                <Typography
                  variant="caption"
                  sx={{ mt: 0.5, display: "block", opacity: 0.9 }}
                >
                  Violations: {navigationViolationCount}/
                  {MAX_NAVIGATION_VIOLATIONS} — Test will terminate at{" "}
                  {MAX_NAVIGATION_VIOLATIONS} violations
                </Typography>
              )}
            </Alert>
          </Paper>
        )}

        {/* Violation Counter Banner - persistent if violations > 0 */}
        {navigationViolationCount > 0 && !showNavigationWarning && (
          <Alert
            severity={navigationViolationCount >= 2 ? "error" : "warning"}
            sx={{
              mb: 2,
              borderRadius: "14px",
              border: `1px solid ${navigationViolationCount >= 2 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
            }}
            icon={<WarningIcon />}
          >
            <Typography variant="body2">
              ⚠️ Navigation violations:{" "}
              <strong>
                {navigationViolationCount}/{MAX_NAVIGATION_VIOLATIONS}
              </strong>
              {navigationViolationCount >= 2 &&
                " — One more violation will terminate your test!"}
            </Typography>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: "14px",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

       

        {/* Header with Progress */}

        <Paper elevation={0} sx={{ ...cardBase, p: 3, mb: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.3rem",
                    color: THEME.text,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {currentSectionConfig.name} Section
                </Typography>
                <Typography
                  sx={{ fontSize: "0.78rem", color: THEME.textSecondary }}
                >
                  {currentSectionConfig.description}
                </Typography>
              </Box>
            </Box>

           <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>

              {/* Time Used */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: THEME.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Time Used</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: THEME.text }}>{formatTimeWithLabels(totalTimeUsed)}</Typography>
                </Box>
              </Box>

              {/* Remaining */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: THEME.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Remaining</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: totalTimeRemaining < 300 ? THEME.error : THEME.text }}>{formatTimeWithLabels(totalTimeRemaining)}</Typography>
                </Box>
              </Box>

              {/* Answered */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: THEME.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Answered</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: THEME.text }}>{questionStats.answered}/{totalQuestions}</Typography>
                </Box>
              </Box>


          

            </Box> {/* closes right-side flex Box */}
              {/* Timer */}
          </Box>

          {/* Progress bar */}
          <Box
            sx={{
              height: 6,
              borderRadius: 10,
              bgcolor: alpha(currentSectionConfig.color, 0.1),
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${getSectionProgress()}%`,
                borderRadius: 10,
                background:
                  currentSectionConfig.gradient || THEME.gradientPrimary,
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </Box>
        </Paper>
        {/* Fullscreen wrapper for MCQ/Theory */}
<Box
  sx={{
    ...(isFullscreen && isCurrentMCQ() && {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      bgcolor: THEME.surface,
      overflowY: "auto",
      px: 4, py: 3,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }),
  }}
>

  {/* Fullscreen Section Header */}
  {isFullscreen && isCurrentMCQ() && (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
        px: 1,
      }}
    >
      {/* Left: Section badge */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            px: 2, py: 0.6,
            borderRadius: "20px",
            background: currentSectionConfig.gradient || THEME.gradientPrimary,
            display: "flex", alignItems: "center", gap: 1,
          }}
        >
          {React.createElement(currentSectionConfig.icon, { sx: { fontSize: 16, color: "#fff" } })}
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
            {currentSectionConfig.name} Round
          </Typography>
        </Box>

        <Typography sx={{ fontSize: "0.78rem", color: THEME.textSecondary }}>
          {currentSectionConfig.description}
        </Typography>
      </Box>

      {/* Right: Time Used / Remaining / Answered */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.55rem", fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Time Used</Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: THEME.text }}>{formatTimeWithLabels(totalTimeUsed)}</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.55rem", fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Remaining</Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: totalTimeRemaining < 300 ? THEME.error : THEME.text }}>{formatTimeWithLabels(totalTimeRemaining)}</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.55rem", fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Answered</Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: THEME.text }}>{questionStats.answered}/{totalQuestions}</Typography>
        </Box>
      </Box>
    </Box>
  )}

{/* Question Card */}
{/* <Card elevation={0} sx={{ ...cardBase, mb: 3, position: "relative" }}></Card> */}

        {/* Question Card */}
        <Card elevation={0} sx={{ ...cardBase, mb: 3, position: "relative" }}>
          {/* Top accent bar */}
          
          <Box
            sx={{
              height: 4,
              background:
                currentSectionConfig.gradient || THEME.gradientPrimary,
            }}
          />

          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Question Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 3,
              }}
            >
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`Q${currentQuestion.questionNumber}`}
                  sx={{
                    background:
                      currentSectionConfig.gradient || THEME.gradientPrimary,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    height: 30,
                    borderRadius: "8px",
                  }}
                />
                <Chip
                  label={showMCQOptions ? "MCQ" : "Coding"}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: THEME.borderMedium,
                    color: THEME.textSecondary,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    borderRadius: "8px",
                    height: 30,
                  }}
                />
                {isTimeExpired && (
                  <Chip
                    label="Time Expired"
                    size="small"
                    icon={<TimerIcon sx={{ fontSize: "14px !important" }} />}
                    sx={{
                      bgcolor: "rgba(239,68,68,0.1)",
                      color: THEME.error,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      borderRadius: "8px",
                      height: 30,
                      "& .MuiChip-icon": { color: THEME.error },
                    }}
                  />
                )}
                {isCurrentAnswered && (
                  <Chip
                    label="Answered"
                    size="small"
                    icon={
                      <CheckCircleIcon sx={{ fontSize: "14px !important" }} />
                    }
                    sx={{
                      bgcolor: "rgba(13,148,136,0.1)",
                      color: THEME.success,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      borderRadius: "8px",
                      height: 30,
                      "& .MuiChip-icon": { color: THEME.success },
                    }}
                  />
                )}
                {isCurrentSkipped && !isCurrentAnswered && (
                  <Chip
                    label="Skipped"
                    size="small"
                    icon={<SkipNextIcon sx={{ fontSize: "14px !important" }} />}
                    sx={{
                      bgcolor: "rgba(245,158,11,0.1)",
                      color: THEME.warning,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      borderRadius: "8px",
                      height: 30,
                      "& .MuiChip-icon": { color: THEME.warning },
                    }}
                  />
                )}
              </Box>
              {hasAnswer() && (
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: "rgba(13,148,136,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleIcon
                    sx={{ color: THEME.success, fontSize: 22 }}
                  />
                </Box>
              )}


                  {/* Per-question Timer */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{
                  width: 30, height: 30, borderRadius: "8px",
                  bgcolor: timeLeft <= 10 ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <TimerIcon sx={{ fontSize: 16, color: timeLeft <= 10 ? THEME.error : THEME.warning }} />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  
                  <Typography sx={{
                    fontSize: "0.85rem", fontWeight: 700,
                    color: timeLeft <= 10 ? THEME.error : THEME.text,
                  }}>
                    {formatTime(timeLeft)}
                  </Typography>
                </Box>
              </Box>

              {/* Question Count */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: THEME.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Question
                  </Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: THEME.text }}>
                    {getSectionQuestionDisplay()}
                  </Typography>
                </Box>
              </Box>

            </Box>

            {/* Question Title */}
            {currentQuestion.title && (
              <Typography
                sx={{ fontSize: "0.88rem", color: THEME.textSecondary, mb: 1 }}
              >
                {currentQuestion.title}
              </Typography>
            )}

            {/* Question */}
            <Box
              sx={{
                mb: 4,
                lineHeight: 1.8,
                fontSize: "1.05rem",
                color: THEME.text,
                "& pre": {
                  backgroundColor: "rgba(41,128,185,0.04)",
                  p: 2.5,
                  borderRadius: "12px",
                  overflow: "auto",
                  fontFamily: "Monaco, Consolas, monospace",
                  border: "1px solid rgba(41,128,185,0.08)",
                },
                "& code": {
                  backgroundColor: "rgba(41,128,185,0.06)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontFamily: "Monaco, Consolas, monospace",
                  fontSize: "0.92em",
                },
              }}
              dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
            />

            {/* Answer Section */}
            {showMCQOptions ? (
              <FormControl component="fieldset" sx={{ width: "100%" }}>
                <RadioGroup
                  value={selectedOption}
                  onChange={isTimeExpired ? undefined : handleOptionSelect}
                >
                  {currentQuestion.options.map((option, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      onDoubleClick={() =>
                        handleOptionDoubleClick(String(index))
                      }
                      sx={{
                        mb: 1.5,
                        p: 0,
                        borderRadius: "14px",
                        border:
                          selectedOption === String(index)
                            ? `2px solid ${currentSectionConfig.color}`
                            : `1px solid ${THEME.borderLight}`,
                        backgroundColor:
                          selectedOption === String(index)
                            ? alpha(currentSectionConfig.color, 0.04)
                            : THEME.cardBg,
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        userSelect: "none",
                        "&:hover": {
                          backgroundColor: alpha(
                            currentSectionConfig.color,
                            0.06,
                          ),
                          borderColor: alpha(currentSectionConfig.color, 0.3),
                        },
                      }}
                    >
                      <FormControlLabel
                        value={String(index)}
                        control={
                          <Radio
                            sx={{
                              color: THEME.textMuted,
                              "&.Mui-checked": {
                                color: currentSectionConfig.color,
                              },
                            }}
                          />
                        }
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              py: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                minWidth: 28,
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                background:
                                  selectedOption === String(index)
                                    ? currentSectionConfig.gradient ||
                                      THEME.gradientPrimary
                                    : "rgba(148,163,184,0.12)",
                                color:
                                  selectedOption === String(index)
                                    ? "#fff"
                                    : THEME.textMuted,
                              }}
                            >
                              {String.fromCharCode(65 + index)}
                            </Box>
                            <Typography
                              sx={{ fontSize: "0.95rem", color: THEME.text }}
                            >
                              {option}
                            </Typography>
                          </Box>
                        }
                        sx={{
                          m: 0,
                          p: 2,
                          width: "100%",
                          "& .MuiFormControlLabel-label": { width: "100%" },
                        }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: THEME.textMuted,
                    mt: 1,
                    fontStyle: "italic",
                  }}
                >
                  💡 Tip: Double-click on a selected answer to unselect it
                </Typography>
              </FormControl>
            ) : (
              <CodeEditor
                value={answer}
                startFullscreen={true}
                onChange={(newCode) => {
                  setAnswer(newCode);
                  setUserAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.questionNumber]: newCode,
                  }));
                  if (newCode) {
                    setSkippedQuestions((prev) => {
                      const newSet = new Set([...prev]);
                      newSet.delete(currentQuestion.questionNumber);
                      return newSet;
                    });
                  }
                }}
                questionNumber={currentQuestion.questionNumber}
                questionHtml={currentQuestion.question}
                questionTitle={currentQuestion.title}
                testId={testId}
                timeLeft={timeLeft}
                onPrevious={handlePreviousQuestion}
                onSkip={handleSkipQuestion}
                onNext={(currentCode) => {
                  if (currentQuestion.questionNumber === totalQuestions) {
                    if (currentCode && !isCurrentMCQ()) {
                      setAnswer(currentCode);
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.questionNumber]: currentCode,
                      }));
                    }
                    // ✅ Exit fullscreen AND fix aria-hidden before opening dialog
                    if (document.fullscreenElement) {
                      document
                        .exitFullscreen()
                        .then(() => {
                          // ✅ Remove aria-hidden that browser leaves behind
                          document
                            .getElementById("root")
                            ?.removeAttribute("aria-hidden");
                          setShowSubmitDialog(true);
                        })
                        .catch(() => {
                          document
                            .getElementById("root")
                            ?.removeAttribute("aria-hidden");
                          setShowSubmitDialog(true);
                        });
                    } else {
                      // ✅ Also fix aria-hidden even if not in fullscreen (safety net)
                      document
                        .getElementById("root")
                        ?.removeAttribute("aria-hidden");
                      setShowSubmitDialog(true);
                    }
                  } else {
                    handleSubmitAnswer(false, currentCode || answer);
                  }
                }}
                canGoPrevious={canGoPrevious}
                isLastQuestion={
                  currentQuestion.questionNumber === totalQuestions
                }
                hasAnswer={hasAnswer()}
                isSubmitting={submitting}
                isTimeExpired={isTimeExpired}
                isAnswered={isCurrentAnswered}
              />
            )}

            {/* Skipped indicator */}
            {isCurrentSkipped && !isCurrentAnswered && (
              <Alert
                severity="warning"
                sx={{
                  mt: 2,
                  borderRadius: "12px",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                You skipped this question earlier. You can now provide an
                answer.
              </Alert>
            )}

            {/* Answer can be changed indicator */}
            {isCurrentAnswered && (
              <Alert
                severity="info"
                sx={{
                  mt: 2,
                  borderRadius: "12px",
                  border: "1px solid rgba(41,128,185,0.15)",
                  bgcolor: "rgba(41,128,185,0.04)",
                }}
                icon={<EditIcon sx={{ color: THEME.blue }} />}
              >
                You can change your answer anytime before finishing the test.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Button
            variant="outlined"
            size="large"
            startIcon={<NavigateBeforeIcon />}
            onClick={handlePreviousQuestion}
            disabled={!canGoPrevious || submitting}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: "0.95rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "12px",
              borderColor: THEME.borderMedium,
              color: THEME.textSecondary,
              "&:hover": {
                borderColor: THEME.blue,
                backgroundColor: "rgba(41,128,185,0.06)",
                color: THEME.blue,
              },
              "&.Mui-disabled": {
                borderColor: "rgba(148,163,184,0.15)",
                color: "rgba(148,163,184,0.4)",
              },
            }}
          >
            Previous
          </Button>

          {/* ✅ SKIP BUTTON - added back in the middle */}
          <Button
            variant="outlined"
            size="large"
            endIcon={<SkipNextIcon />}
            onClick={handleSkipQuestion}
            disabled={submitting}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: "0.95rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "12px",
              borderColor: "rgba(245,158,11,0.3)",
              color: THEME.warning,
              "&:hover": {
                borderColor: THEME.warning,
                backgroundColor: "rgba(245,158,11,0.06)",
              },
              "&.Mui-disabled": {
                borderColor: "rgba(148,163,184,0.15)",
                color: "rgba(148,163,184,0.4)",
              },
            }}
          >
            {currentQuestion.questionNumber === totalQuestions
              ? "Skip & Review"
              : "Skip"}
          </Button>

          <Button
            variant="contained"
            size="large"
            endIcon={
              submitting ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                <NavigateNextIcon />
              )
            }
            onClick={() => {
              if (currentQuestion.questionNumber === totalQuestions) {
                setShowSubmitDialog(true);
              } else {
                // ✅ Pass current answer directly, don't rely on stale state
                handleSubmitAnswer(false, answer);
              }
            }}
            disabled={submitting || !hasAnswer() || isTimeExpired}
            sx={{
              py: 1.5,
              px: 5,
              fontSize: "0.98rem",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "12px",
              background: THEME.blue,
              boxShadow: "0 4px 14px rgba(41,128,185,0.3)",
              "&:hover": {
                background: THEME.blueLight,
                boxShadow: "0 6px 20px rgba(41,128,185,0.4)",
              },
              "&.Mui-disabled": {
                background: "rgba(148,163,184,0.15)",
                color: "rgba(148,163,184,0.5)",
              },
            }}
          >
            {submitting
              ? "Saving..."
              : currentQuestion.questionNumber === totalQuestions
                ? "Review & Finish"
                : isCurrentAnswered
                  ? "Update & Next Question"
                  : "Next Question"}
          </Button>
        </Box>
        </Box>
        {/* Section Complete Dialog */}
        <Dialog
          open={showSectionCompleteDialog}
          maxWidth="sm"
          fullWidth
           container={testContainerRef.current}
          sx={{ zIndex: 10000 }}
         
          PaperProps={{
            sx: { borderRadius: "22px", overflow: "hidden" },
          }}
        >
          <Box sx={{ height: 4, background: THEME.gradientSuccess }} />
          <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(13,148,136,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 40, color: THEME.success }} />
              </Box>
              <Typography
                sx={{ fontSize: "1.5rem", fontWeight: 800, color: THEME.text }}
              >
                {SECTIONS[previousSection]?.name || "Section"} Complete!
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center", pb: 2 }}>
            <Typography
              sx={{ fontSize: "0.92rem", color: THEME.textSecondary, mb: 3 }}
            >
              Great job! You've completed the{" "}
              {SECTIONS[previousSection]?.name || "previous"} section.
            </Typography>

            <Divider sx={{ my: 3, borderColor: THEME.borderLight }} />

            <Typography
              sx={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: THEME.text,
                mb: 1,
              }}
            >
              Next: {SECTIONS[nextSectionName]?.name || "Next"} Section
            </Typography>
            <Typography
              sx={{ fontSize: "0.82rem", color: THEME.textSecondary }}
            >
              {SECTIONS[nextSectionName]?.description || ""}
            </Typography>
            <Typography
              sx={{ fontSize: "0.78rem", color: THEME.textMuted, mt: 0.5 }}
            >
              {sectionQuestionCount[nextSectionName]?.total || 0} questions •
              {nextSectionName === "coding"
                ? " Text input (write code)"
                : " Multiple Choice"}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinueToNextSection}
              endIcon={<NavigateNextIcon />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: "14px",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
                background:
                  SECTIONS[nextSectionName]?.gradient || THEME.gradientPrimary,
                boxShadow: `0 4px 14px ${alpha(SECTIONS[nextSectionName]?.color || THEME.blue, 0.3)}`,
                "&:hover": {
                  boxShadow: `0 6px 20px ${alpha(SECTIONS[nextSectionName]?.color || THEME.blue, 0.4)}`,
                },
              }}
            >
              Start {SECTIONS[nextSectionName]?.name || "Next"} Section
            </Button>
          </DialogActions>
        </Dialog>

        {/* Final Submit/Review Dialog */}
        <Dialog
          open={showSubmitDialog}
          onClose={() => setShowSubmitDialog(false)}
          maxWidth="sm"
          fullWidth
          container={testContainerRef.current}
          sx={{ zIndex: 10000 }}
          PaperProps={{
            sx: { borderRadius: "22px", overflow: "hidden" },
          }}
        >
          <Box sx={{ height: 4, background: THEME.gradientPrimary }} />
          <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: THEME.gradientPrimary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AssignmentIcon sx={{ fontSize: 20, color: "#fff" }} />
              </Box>
              <Typography
                sx={{ fontSize: "1.1rem", fontWeight: 800, color: THEME.text }}
              >
                Review & Submit Test
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pb: 2 }}>
            {/* Stats Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 1.5,
                mb: 3,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "14px",
                  backgroundColor: "rgba(41,128,185,0.06)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <AccessTimeIcon
                  sx={{ fontSize: 24, color: THEME.textMuted, mb: 0.5 }}
                />
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: THEME.textMuted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Time Used
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: THEME.text,
                    lineHeight: 1.2,
                  }}
                >
                  {formatTimeWithLabels(totalTimeUsed)}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "14px",
                  backgroundColor:
                    totalTimeRemaining < 300
                      ? "rgba(239,68,68,0.06)"
                      : "rgba(0,131,143,0.06)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <TimerIcon
                  sx={{
                    fontSize: 24,
                    color:
                      totalTimeRemaining < 300 ? THEME.error : THEME.primary,
                    mb: 0.5,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: THEME.textMuted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Remaining
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: totalTimeRemaining < 300 ? THEME.error : THEME.text,
                    lineHeight: 1.2,
                  }}
                >
                  {formatTimeWithLabels(totalTimeRemaining)}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "14px",
                  backgroundColor: "rgba(13,148,136,0.06)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <CheckCircleIcon
                  sx={{ fontSize: 24, color: THEME.success, mb: 0.5 }}
                />
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: THEME.textMuted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Answered
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: THEME.success,
                    lineHeight: 1.2,
                  }}
                >
                  {questionStats.answered}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "14px",
                  backgroundColor: "rgba(245,158,11,0.06)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <HelpIcon
                  sx={{ fontSize: 24, color: THEME.warning, mb: 0.5 }}
                />
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: THEME.textMuted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Unanswered
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: THEME.warning,
                    lineHeight: 1.2,
                  }}
                >
                  {questionStats.unanswered}
                </Typography>
              </Paper>
            </Box>

            {/* Section Summary */}
            <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
              {getStepperSections().map(({ key, name, color, gradient }) => {
                const sectionStart = getSectionStartQuestion(key);
                const sectionTotal = sectionQuestionCount[key]?.total || 0;
                let answeredInSection = 0;
                for (
                  let q = sectionStart;
                  q < sectionStart + sectionTotal;
                  q++
                ) {
                  if (userAnswers[q] && userAnswers[q] !== "")
                    answeredInSection++;
                }
                const progressPercent =
                  sectionTotal > 0
                    ? (answeredInSection / sectionTotal) * 100
                    : 0;

                return (
                  <Paper
                    key={key}
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: "14px",
                      border: `1px solid ${alpha(color, 0.15)}`,
                      backgroundColor: THEME.cardBg,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: color,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        color: THEME.text,
                        my: 0.5,
                      }}
                    >
                      {answeredInSection}/{sectionTotal}
                    </Typography>
                    <Box
                      sx={{
                        height: 5,
                        borderRadius: 10,
                        bgcolor: alpha(color, 0.1),
                        overflow: "hidden",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          width: `${progressPercent}%`,
                          borderRadius: 10,
                          background: gradient || THEME.gradientPrimary,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{ fontSize: "0.62rem", color: THEME.textMuted }}
                    >
                      questions answered
                    </Typography>
                  </Paper>
                );
              })}
            </Box>

            {/* Unanswered Questions List */}
            {questionStats.unanswered > 0 && (
              <>
                <Alert
                  severity="warning"
                  sx={{
                    mb: 2,
                    borderRadius: "12px",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  You have {questionStats.unanswered} unanswered question
                  {questionStats.unanswered > 1 ? "s" : ""}. Click on a question
                  below to answer it.
                </Alert>

                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: THEME.text,
                    mb: 1,
                  }}
                >
                  Unanswered Questions (click to answer)
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    maxHeight: 200,
                    overflow: "auto",
                    mb: 2,
                    borderRadius: "14px",
                    borderColor: THEME.borderLight,
                  }}
                >
                  <List dense>
                    {questionStats.unansweredList.map((item) => {
                      const sectionConfig = SECTIONS[item.section];
                      const isCached =
                        !!questionCacheRef.current[item.questionNumber];
                      return (
                        <ListItem key={item.questionNumber} disablePadding>
                          <ListItemButton
                            onClick={() =>
                              isCached
                                ? navigateToQuestion(item.questionNumber)
                                : null
                            }
                            disabled={!isCached}
                            sx={{
                              borderRadius: "10px",
                              mx: 0.5,
                              my: 0.3,
                              "&:hover": {
                                backgroundColor: alpha(
                                  sectionConfig?.color || THEME.blue,
                                  0.06,
                                ),
                              },
                            }}
                          >
                            <ListItemIcon>
                              <Badge
                                badgeContent={item.questionNumber}
                                sx={{
                                  "& .MuiBadge-badge": {
                                    background:
                                      sectionConfig?.gradient ||
                                      THEME.gradientPrimary,
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.65rem",
                                  },
                                }}
                              >
                                <HelpIcon sx={{ color: THEME.warning }} />
                              </Badge>
                            </ListItemIcon>
                            <ListItemText
                              primary={`Question ${item.questionNumber}`}
                              secondary={`${sectionConfig?.name || item.section} Section`}
                              primaryTypographyProps={{
                                sx: {
                                  fontSize: "0.88rem",
                                  fontWeight: 600,
                                  color: THEME.text,
                                },
                              }}
                              secondaryTypographyProps={{
                                sx: {
                                  fontSize: "0.72rem",
                                  color: THEME.textMuted,
                                },
                              }}
                            />
                            {isCached ? (
                              <Chip
                                label="Go to Question"
                                size="small"
                                icon={
                                  <EditIcon
                                    sx={{ fontSize: "14px !important" }}
                                  />
                                }
                                sx={{
                                  borderRadius: "8px",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  bgcolor: "rgba(41,128,185,0.08)",
                                  color: THEME.blue,
                                  border: `1px solid ${THEME.borderMedium}`,
                                  "& .MuiChip-icon": { color: THEME.blue },
                                }}
                              />
                            ) : (
                              <Chip
                                label="Not visited yet"
                                size="small"
                                sx={{
                                  borderRadius: "8px",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  bgcolor: "rgba(148,163,184,0.08)",
                                  color: THEME.textMuted,
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
              <Alert
                severity="success"
                sx={{
                  mb: 2,
                  borderRadius: "12px",
                  border: "1px solid rgba(13,148,136,0.2)",
                  bgcolor: "rgba(13,148,136,0.04)",
                }}
                icon={<CheckCircleIcon sx={{ color: THEME.success }} />}
              >
                Great job! You have answered all {totalQuestions} questions.
              </Alert>
            )}

            <Divider sx={{ my: 2, borderColor: THEME.borderLight }} />

            <Typography sx={{ fontSize: "0.82rem", color: THEME.textMuted }}>
              Once you submit, you cannot change your answers. Make sure you
              have reviewed all questions.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
            <Button
              onClick={() => setShowSubmitDialog(false)}
              disabled={submitting}
              startIcon={<CancelIcon />}
              sx={{
                mr: "auto",
                textTransform: "none",
                fontWeight: 600,
                color: THEME.textSecondary,
                borderRadius: "12px",
                "&:hover": { bgcolor: "rgba(148,163,184,0.08)" },
              }}
            >
              Continue Test
            </Button>

            <Button
              onClick={handleFinalSubmit}
              variant="contained"
              size="large"
              startIcon={
                submitting ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  <SendIcon />
                )
              }
              disabled={submitting}
              sx={{
                px: 4,
                borderRadius: "14px",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
                background: THEME.gradientSuccess,
                boxShadow: "0 4px 14px rgba(13,148,136,0.3)",
                "&:hover": { boxShadow: "0 6px 20px rgba(13,148,136,0.4)" },
                "&.Mui-disabled": {
                  background: "rgba(148,163,184,0.15)",
                  color: "rgba(148,163,184,0.5)",
                },
              }}
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Webcam Proctoring */}
        {/* <ProctorCamera
          testId={testId}
          enabled={true}
          position="bottom-right"
          captureInterval={60000}
          showControls={true}
          onCaptureImage={(captureData) => {
            console.log('📸 Captured image:', captureData.captureNumber);
          }}
        /> */}
      </Container>
    </Box>
  );
};

export default DeveloperTest;
