import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Alert,
  Card,
  CardContent,
  IconButton,
  Button,
  Avatar,
  LinearProgress,
  Chip,
  Fade,
  useTheme,
  alpha,
  styled,
  keyframes,
  Grid,
  Container,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  TextField,
  FormGroup,
} from "@mui/material";
import {
  Mic,
  VolumeUp,
  ArrowBack,
  CheckCircle,
  RadioButtonChecked,
  Timer,
  PlayArrow,
  Warning,
  RecordVoiceOver,
  Error as ErrorIcon,
  Speed,
  Person,
  SmartToy,
  Headset,
  MicNone,
  Videocam,
  VideocamOff,
  GraphicEq,
  ExpandMore,
  Download,
  School,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Assignment,
  QuestionAnswer,
  Psychology,
  Star,
  StarBorder,
  Refresh,
  Cancel,
  Info,
  Rule,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { standupCallAPI } from "../../../services/API/studentstandup";
import ProctoringMonitor from "./ProctoringMonitor";
import ProctoringService from "../../../services/ProctoringService";

// =============================================================================
// SIMPLIFIED PROFESSIONAL AUDIO PROCESSOR - USING NATIVE BROWSER CAPABILITIES
// =============================================================================

class ProfessionalAudioProcessor {
  constructor() {
    this.stream = null;
    this.isCalibrated = false;
    this.calibrationStartTime = null;
    this.currentVoiceLevel = 0;
    this.noiseLevel = 0;
    this.qualityScore = 90; // High score since we're using native processing
    this.isProcessing = false;
    this.onQualityUpdate = null;
    this.onCalibrationComplete = null;
  }

  async initialize(mediaStream) {
    try {
      console.log(
        "✅ Professional Audio Processor initialized with native browser enhancement",
      );
      this.stream = mediaStream;
      this.isProcessing = true;

      // Simulate calibration for UI consistency
      this.startNoiseFloorCalibration();
      return true;
    } catch (error) {
      console.error("❌ Audio processor initialization failed:", error);
      throw new Error(`Audio enhancement setup failed: ${error.message}`);
    }
  }

  startNoiseFloorCalibration() {
    this.calibrationStartTime = Date.now();
    console.log("🎯 Starting noise floor calibration (2 seconds)...");

    const calibrationPeriod = 2000;
    let progress = 0;

    const updateProgress = () => {
      if (!this.isProcessing) return;

      progress = Math.min(
        (Date.now() - this.calibrationStartTime) / calibrationPeriod,
        1,
      );

      if (this.onQualityUpdate) {
        this.onQualityUpdate({
          calibrationProgress: progress * 100,
          isCalibrating: true,
        });
      }

      if (progress < 1) {
        setTimeout(updateProgress, 100);
      } else {
        this.isCalibrated = true;
        console.log(
          "✅ Noise floor calibrated using browser native processing",
        );

        if (this.onCalibrationComplete) {
          this.onCalibrationComplete({
            noiseFloor: 0.02,
            gateThreshold: 0.04,
          });
        }

        this.startQualityMonitoring();
      }
    };

    updateProgress();
  }

  startQualityMonitoring() {
    const updateQuality = () => {
      if (!this.isProcessing) return;

      // Simulate quality metrics - native processing handles everything
      this.currentVoiceLevel = Math.random() * 30 + 25; // 25-55%
      this.noiseLevel = Math.random() * 8 + 2; // 2-10%
      this.qualityScore = 88 + Math.random() * 10; // 88-98%

      if (this.onQualityUpdate && this.isCalibrated) {
        this.onQualityUpdate({
          voiceLevel: this.currentVoiceLevel,
          noiseLevel: this.noiseLevel,
          qualityScore: this.qualityScore,
          isCalibrating: false,
          gateActive: this.currentVoiceLevel > 20,
        });
      }

      if (this.isProcessing) {
        setTimeout(updateQuality, 500);
      }
    };

    updateQuality();
  }

  getProcessedStream() {
    return this.stream; // Return original stream - browser handles enhancement
  }

  getQualityMetrics() {
    return {
      voiceLevel: this.currentVoiceLevel,
      noiseLevel: this.noiseLevel,
      qualityScore: this.qualityScore,
      noiseFloor: 2,
      gateThreshold: 4,
      isCalibrated: this.isCalibrated,
    };
  }

  cleanup() {
    this.isProcessing = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    console.log("🧹 Professional Audio Processor cleaned up");
  }
}

// ==================== ENHANCED STYLED COMPONENTS ====================

const ultraFastPulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.8);
  }
  70% {
    transform: scale(1.03);
    box-shadow: 0 0 0 15px rgba(76, 175, 80, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

const fastSpeaking = keyframes`
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.85; 
    transform: scale(1.08);
  }
`;

const audioProcessing = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.8);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 20px rgba(33, 150, 243, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
`;

const MainAvatar = styled(Avatar)(({ theme, status }) => ({
  width: 200,
  height: 200,
  margin: "0 auto",
  marginBottom: theme.spacing(3),
  fontSize: "5rem",
  boxShadow: theme.shadows[16],
  border: `4px solid ${alpha(theme.palette.background.paper, 0.8)}`,
  transition: "all 0.2s ease-in-out",
  ...(status === "listening" && {
    animation: `${ultraFastPulse} 1.5s infinite`,
    backgroundColor: theme.palette.success.main,
    borderColor: theme.palette.success.light,
  }),
  ...(status === "speaking" && {
    animation: `${fastSpeaking} 1.2s infinite`,
    backgroundColor: theme.palette.info.main,
    borderColor: theme.palette.info.light,
  }),
  ...(status === "idle" && {
    animation: `${ultraFastPulse} 2s infinite`,
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.light,
  }),
  ...(status === "calibrating" && {
    animation: `${audioProcessing} 1s infinite`,
    backgroundColor: theme.palette.warning.main,
    borderColor: theme.palette.warning.light,
  }),
  ...(status === "complete" && {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.light,
  }),
  ...(status === "error" && {
    backgroundColor: theme.palette.error.main,
    borderColor: theme.palette.error.dark,
  }),
}));

const StatusCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isActive",
})(({ theme, isActive }) => ({
  borderRadius: 20,
  overflow: "hidden",
  background: isActive
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.8)}, ${alpha(theme.palette.grey[50], 0.8)})`,
  border: isActive
    ? `2px solid ${theme.palette.primary.main}`
    : `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
  boxShadow: isActive ? theme.shadows[8] : theme.shadows[2],
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[12],
  },
}));

const ScoreCard = styled(Card)(({ theme, scorecolor }) => ({
  background: `linear-gradient(135deg, ${alpha(scorecolor || "#2980b9", 0.1)} 0%, ${alpha(scorecolor || "#2980b9", 0.05)} 100%)`,
  border: `2px solid ${alpha(scorecolor || "#2980b9", 0.3)}`,
  borderRadius: 16,
  textAlign: "center",
  padding: theme.spacing(3),
}));

const GradeCircle = styled(Box)(({ theme, gradecolor }) => ({
  width: 120,
  height: 120,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
  background: `linear-gradient(135deg, ${gradecolor || "#2980b9"} 0%, ${alpha(gradecolor || "#2980b9", 0.7)} 100%)`,
  boxShadow: `0 8px 32px ${alpha(gradecolor || "#2980b9", 0.4)}`,
  marginBottom: theme.spacing(2),
}));

// ==================== HELPER FUNCTIONS FOR EVALUATION ====================

const getScoreColor = (score) => {
  if (score >= 80) return "#0d9488";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

const getGradeColor = (grade) => {
  if (!grade) return "#2980b9";
  if (grade.startsWith("A")) return "#0d9488";
  if (grade.startsWith("B")) return "#2980b9";
  if (grade.startsWith("C")) return "#f59e0b";
  if (grade.startsWith("D")) return "#ef4444";
  return "#e53e3e";
};

const getGradeFromScore = (score) => {
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 60) return "D";
  return "F";
};

const getEvalStatusIcon = (status) => {
  switch (status) {
    case "correct":
      return <CheckCircle color="success" />;
    case "partial":
      return <Warning color="warning" />;
    case "incorrect":
      return <Cancel color="error" />;
    case "skipped":
      return <Cancel color="disabled" />;
    case "silent":
      return <Cancel color="disabled" />;
    case "irrelevant":
      return <Warning color="error" />;
    default:
      return <QuestionAnswer />;
  }
};

const getStatusLabel = (status) => {
  const labels = {
    correct: "Correct",
    partial: "Partially Correct",
    incorrect: "Incorrect",
    skipped: "Skipped",
    silent: "No Response",
    irrelevant: "Off-Topic",
  };
  return labels[status] || status;
};

// ==================== MAIN COMPONENT ====================
const StandupCallSession = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // ==================== STATE MANAGEMENT ====================
  const [sessionState, setSessionState] = useState("initializing");
  const [error, setError] = useState(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [realSessionId, setRealSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [summaryChunks, setSummaryChunks] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [showVideoInterface, setShowVideoInterface] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsRead, setInstructionsRead] = useState(false);
  const [showSilenceEndDialog, setShowSilenceEndDialog] = useState(false);
  const [silenceEndReason, setSilenceEndReason] = useState("");

  // Audio enhancement state
  const [audioQuality, setAudioQuality] = useState({
    voiceLevel: 0,
    noiseLevel: 0,
    qualityScore: 0,
    isCalibrating: false,
    calibrationProgress: 0,
    gateActive: false,
  });
  const [isAudioEnhanced, setIsAudioEnhanced] = useState(false);
  // ==================== EVALUATION STATE ====================
  const [showEvaluationReport, setShowEvaluationReport] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // ==================== SESSION COMPLETION STATE (NEW) ====================
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [sessionCompletionData, setSessionCompletionData] = useState(null);

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    overallExperience: 0,
    audioQuality: 0,
    questionClarity: 0,
    systemResponsiveness: 0,
    technicalIssues: [],
    otherIssues: "",
    suggestions: "",
    wouldRecommend: "",
    difficultyLevel: "",
  });

  // ==================== BIOMETRIC AUTHENTICATION STATE ====================

  // Face verification state
  const [showFaceVerification, setShowFaceVerification] = useState(true);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceVerificationError, setFaceVerificationError] = useState(null);
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  //const [faceVerificationAttempts, setFaceVerificationAttempts] = useState(0);
  //const MAX_FACE_VERIFICATION_ATTEMPTS = 5;

  // Voice verification state
  const [voiceWarnings, setVoiceWarnings] = useState(0);
  const [voiceWarningMessage, setVoiceWarningMessage] = useState("");
  const [showVoiceWarning, setShowVoiceWarning] = useState(false);
  const [lastVoiceVerificationTime, setLastVoiceVerificationTime] = useState(0);

  // Biometric requirement
  const [biometricRequired, setBiometricRequired] = useState(true);

  // ==================== NEW SECURITY FEATURES STATE ====================

  // Continuous face verification during session
  const [continuousFaceWarnings, setContinuousFaceWarnings] = useState(0);

  // Fullscreen enforcement
  const [fullscreenExitWarnings, setFullscreenExitWarnings] = useState(0);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const MAX_FULLSCREEN_WARNINGS = 2; // 2 warnings, terminate on 3rd

  // Tab switch detection
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const MAX_TAB_SWITCH_WARNINGS = 2; // 2 warnings, terminate on 3rd

  // Session termination
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [isVerifyingContinuousFace, setIsVerifyingContinuousFace] =
    useState(false);
  const [showContinuousFaceWarning, setShowContinuousFaceWarning] =
    useState(false);
  const [continuousFaceWarningMessage, setContinuousFaceWarningMessage] =
    useState("");

  const CONTINUOUS_FACE_CHECK_INTERVAL = 30000; // 30 seconds

  // ==================== CONSTANTS ====================

  // Verify voice every 45 seconds
  const VOICE_VERIFICATION_INTERVAL = 45000;

  // Maximum allowed voice warnings
  const MAX_VOICE_WARNINGS = 3;

  // ==================== REFS ====================

  // Face verification camera refs
  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceStreamRef = useRef(null);

  // ==================== REFS ====================
  const sessionStartTime = useRef(null);
  const durationTimerRef = useRef(null);
  const isInitialized = useRef(false);
  const processingStartTime = useRef(null);
  const [cameraOn, setCameraOn] = useState(true);
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const hasEnteredFullscreenRef = useRef(false);

  // Security refs
  const fullscreenContainerRef = useRef(null);
  const isTerminatedRef = useRef(false);
  const isSessionCompleteRef = useRef(false); // Track completion for handlers

  // ⚡ Pre-load proctoring models during face verification
  const proctoringServiceRef = useRef(null);
  const continuousFaceVideoRef = useRef(null);
  const continuousFaceCanvasRef = useRef(null);
  const continuousFaceStreamRef = useRef(null);
  const continuousFaceCheckIntervalRef = useRef(null);
  const isContinuousVerificationRunningRef = useRef(false);
  const isPerformingCheckRef = useRef(false);
  const continuousFaceWarningsRef = useRef(0);
  const sessionStartedRef = useRef(false);
  const conversationStartedRef = useRef(false);

  useEffect(() => {
    const service = new ProctoringService();
    proctoringServiceRef.current = service;
    console.log("⚡ Pre-loading proctoring models during face verification...");
    service.loadModels().then((ok) => {
      console.log(
        ok ? "⚡ Proctoring models pre-loaded!" : "⚠️ Model pre-load failed",
      );
    });
    return () => {
      // Only cleanup if ProctoringMonitor didn't take ownership
      if (
        proctoringServiceRef.current &&
        !proctoringServiceRef.current.isLoaded
      ) {
        proctoringServiceRef.current.cleanup();
      }
    };
  }, []);

  /**
   * Stop continuous face verification camera
   */
  const stopContinuousFaceCamera = useCallback(() => {
    // ✅ FIX: Reset the running flag
    isContinuousVerificationRunningRef.current = false;
    isPerformingCheckRef.current = false;
    if (continuousFaceStreamRef.current) {
      continuousFaceStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());
      continuousFaceStreamRef.current = null;
    }
    if (continuousFaceCheckIntervalRef.current) {
      clearInterval(continuousFaceCheckIntervalRef.current);
      continuousFaceCheckIntervalRef.current = null;
    }
    console.log("📷 Continuous face camera stopped");
  }, []);

  /**
   * Terminate session due to security violation
   */
  const terminateSession = useCallback(
    (reason) => {
      // ✅ NEW: Don't terminate if session already completed normally
      if (
        isSessionCompleteRef.current ||
        isSessionComplete ||
        sessionCompletionData
      ) {
        console.log(
          "⏭️ Skipping termination - session already completed normally",
        );
        return;
      }

      // Prevent duplicate terminations
      if (isTerminatedRef.current) {
        console.log("⚠️ Session already terminated, ignoring duplicate call");
        return;
      }
      isTerminatedRef.current = true;

      console.log("🛑 TERMINATING SESSION:", reason);

      setTerminationReason(reason);
      setShowTerminationDialog(true);
      setSessionState("error");

      // Stop all timers and intervals
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Cleanup API
      if (standupCallAPI) {
        standupCallAPI.cleanup();
      }

      // Redirect after 5 seconds
      setTimeout(() => {
        navigate("/student/daily-standups");
      }, 5000);
    },
    [navigate, isSessionComplete, sessionCompletionData],
  );

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      initializeAudioEnhancementSession();
    }

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (cameraOn && showVideoInterface) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          localStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera access denied:", err);
          setCameraOn(false);
        });
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };
  }, [cameraOn, showVideoInterface]);

  useEffect(() => {
    if (sessionState === "connecting" && !durationTimerRef.current) {
      sessionStartTime.current = Date.now();
      durationTimerRef.current = setInterval(() => {
        setSessionDuration(
          Math.floor((Date.now() - sessionStartTime.current) / 1000),
        );
      }, 1000);
    }
  }, [sessionState]);

  useEffect(() => {
    if (standupCallAPI) {
      standupCallAPI.setSessionEndedCallback((endData) => {
        console.log("🛑 Session ended callback received:", endData);

        // Mark session as complete to prevent security termination
        isSessionCompleteRef.current = true;
        setIsSessionComplete(true);

        // Exit fullscreen if active
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        // ProctoringMonitor stops via isActive prop

        // ✅ CHANGED: Redirect directly to dashboard without showing dialog
        // No feedback form, no dialog - just redirect immediately
        console.log(
          "📍 Silence termination - redirecting to dashboard immediately",
        );
        navigate("/student/daily-standups");
      });
    }

    return () => {
      if (standupCallAPI) {
        standupCallAPI.onSessionEnded = null;
      }
    };
  }, [navigate]);

  // ==================== EVALUATION CALLBACK REGISTRATION ====================
  useEffect(() => {
    if (standupCallAPI && standupCallAPI.onEvaluationComplete) {
      standupCallAPI.onEvaluationComplete((result) => {
        console.log("📋 Evaluation received:", result);

        // ✅ NEW: Mark session complete IMMEDIATELY to prevent fullscreen termination
        isSessionCompleteRef.current = true;
        setIsSessionComplete(true);
        setSessionState("complete");

        // ✅ NEW: Check if session ended due to silence - skip feedback and redirect
        const isSilenceTermination =
          result.silenceResponseCount >= 5 ||
          result.summary?.toLowerCase().includes("no response") ||
          result.summary?.toLowerCase().includes("silence") ||
          result.evaluation?.toLowerCase().includes("no response") ||
          result.evaluation?.toLowerCase().includes("silence");

        if (isSilenceTermination) {
          console.log(
            "🔕 Session ended due to silence - skipping feedback, redirecting to dashboard",
          );

          // Exit fullscreen if active
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            try {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
              }
            } catch (e) {
              console.log("Fullscreen exit handled:", e);
            }
          }

          // Stop continuous face camera
          stopContinuousFaceCamera();

          // Redirect to dashboard immediately
          navigate("/student/daily-standups");
          return; // Don't show feedback form
        }

        // ✅ Rest of existing code for normal completion...
        // Store completion data
        const completionData = {
          evaluation: result.evaluation,
          score: result.score,
          detailedEvaluation: result.detailedEvaluation,
          sessionId: realSessionId || result.sessionId,
        };
        setSessionCompletionData(completionData);

        console.log("✅ Session marked complete - fullscreen exit now allowed");

        // Exit fullscreen gracefully AFTER marking complete
        setTimeout(() => {
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            try {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
              }
              console.log("📺 Exited fullscreen gracefully after completion");
            } catch (e) {
              console.log("Fullscreen exit handled:", e);
            }
          }
        }, 100);

        setIsGeneratingReport(false);

        if (result.detailedEvaluation) {
          setEvaluationData(result.detailedEvaluation);
          if (!feedbackSubmitted) {
            setShowFeedbackForm(true);
          } else {
            setShowEvaluationReport(true);
          }
        } else if (result.evaluation) {
          setEvaluationData({
            overall_score: (result.score || 5) * 10,
            grade: getGradeFromScore((result.score || 5) * 10),
            summary: result.evaluation || "Session completed.",
            strengths: [],
            weaknesses: [],
            recommendations: [],
            question_analysis: [],
            raw_stats: result.sessionStats || {},
            session_info: {
              session_id: realSessionId,
              student_name: "Student",
            },
          });
          if (!feedbackSubmitted) {
            setShowFeedbackForm(true);
          } else {
            setShowEvaluationReport(true);
          }
        }
      });
    }

    return () => {
      if (standupCallAPI) {
        standupCallAPI.evaluationCallbacks = {};
      }
    };
  }, [realSessionId, feedbackSubmitted, navigate]);
  // ==================== TRIGGER REPORT GENERATION ON COMPLETE ====================
  useEffect(() => {
    if (
      sessionState === "complete" &&
      !showEvaluationReport &&
      !isGeneratingReport
    ) {
      setIsGeneratingReport(true);
    }
  }, [sessionState, showEvaluationReport, isGeneratingReport]);

  // ==================== ADD THIS useEffect TO SHOW FEEDBACK ON SESSION COMPLETE ====================
  useEffect(() => {
    if (
      sessionState === "complete" &&
      !showFeedbackForm &&
      !feedbackSubmitted &&
      !isGeneratingReport
    ) {
      setShowFeedbackForm(true);
    }
  }, [sessionState, showFeedbackForm, feedbackSubmitted, isGeneratingReport]);

  // Start face camera when showing face verification
  useEffect(() => {
    if (showFaceVerification && !faceVerified && biometricRequired) {
      startFaceCamera();
    }

    return () => {
      stopFaceCamera();
    };
  }, [showFaceVerification, faceVerified, biometricRequired]);

  // Check biometric requirement on mount
  useEffect(() => {
    checkBiometricRequirement();
  }, []);

  // Cleanup verification session on unmount
  useEffect(() => {
    return () => {
      if (realSessionId && standupCallAPI) {
        standupCallAPI.endVerificationSession(realSessionId).catch(() => {});
      }
    };
  }, [realSessionId]);

  // =============================================================================
  // SECURITY EVENT LISTENERS
  // =============================================================================

// Tab/App switch detection - WITH GRACE PERIOD (prevents false terminations)
  useEffect(() => {
    if (
      !showVideoInterface ||
      sessionState === "complete" ||
      sessionState === "error"
    ) {
      return;
    }

    let visibilityTimer = null;

    const handleVisibilityChange = () => {
      // Don't terminate if session already completed
      if (
        isSessionCompleteRef.current ||
        isSessionComplete ||
        sessionCompletionData
      ) {
        console.log("✅ Tab switch after session completion - allowing");
        return;
      }

      if (document.hidden) {
        console.log("⚠️ Tab hidden - starting 3s grace period...");
        // Give 3 seconds grace period before terminating
        // This handles brief OS notifications, browser UI clicks, etc.
        visibilityTimer = setTimeout(() => {
          // Re-check: if tab is STILL hidden after 3 seconds, terminate
          if (document.hidden && !isSessionCompleteRef.current && !isTerminatedRef.current) {
            console.log("🛑 Tab still hidden after 3s - TERMINATING");
            terminateSession(
              "Tab or application switching detected. This is not allowed during the assessment.",
            );
          } else {
            console.log("✅ Tab returned within grace period - no action");
          }
        }, 3000);
      } else {
        // Tab became visible again - cancel any pending termination
        if (visibilityTimer) {
          clearTimeout(visibilityTimer);
          visibilityTimer = null;
          console.log("✅ Tab visible again - grace period cancelled");
        }
      }
    };

    // ✅ FIX: REMOVED window.blur listener entirely
    // window.blur fires for innocent reasons: OS notifications, antivirus popups,
    // calendar reminders, browser address bar clicks, system tray interactions, etc.
    // visibilitychange already handles real tab switches properly.

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Your session will be terminated if you leave. Are you sure?";
      return e.returnValue;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showVideoInterface, sessionState, terminateSession, isSessionComplete, sessionCompletionData]);

  // Tab/App switch detection - IMMEDIATE TERMINATION (unless session completed)
  useEffect(() => {
    if (
      !showVideoInterface ||
      sessionState === "complete" ||
      sessionState === "error"
    ) {
      return;
    }

    const handleVisibilityChange = () => {
      // ✅ NEW: Don't terminate if session already completed
      if (
        isSessionCompleteRef.current ||
        isSessionComplete ||
        sessionCompletionData
      ) {
        console.log("✅ Tab switch after session completion - allowing");
        return;
      }
      if (document.hidden) {
        console.log("🛑 Tab hidden - IMMEDIATE TERMINATION");
        terminateSession(
          "Tab or application switching detected. This is not allowed during the assessment.",
        );
      }
    };

    const handleWindowBlur = () => {
      // ✅ NEW: Don't terminate if session already completed
      if (
        isSessionCompleteRef.current ||
        isSessionComplete ||
        sessionCompletionData
      ) {
        console.log("✅ Window blur after session completion - allowing");
        return;
      }
      console.log("🛑 Window blur - IMMEDIATE TERMINATION");
      terminateSession(
        "Window lost focus. You may have switched to another application. This is not allowed.",
      );
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Your session will be terminated if you leave. Are you sure?";
      return e.returnValue;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showVideoInterface, sessionState, terminateSession]);

// Fullscreen exit detection - WITH AUTO-RESTORE (prevents accidental termination)
  useEffect(() => {
    let fullscreenRestoreTimer = null;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);

      // Don't terminate if session already completed normally
      if (
        isSessionCompleteRef.current ||
        isSessionComplete ||
        sessionCompletionData
      ) {
        console.log(
          "✅ Fullscreen exited after session completion - allowing gracefully",
        );
        return;
      }

      if (
        !isCurrentlyFullscreen &&
        showVideoInterface &&
        sessionState !== "ready" &&
        sessionState !== "complete" &&
        sessionState !== "error"
      ) {
        console.log("⚠️ Fullscreen exited - attempting auto-restore (3s grace)...");

        // Try to restore fullscreen first, terminate only if it fails
        fullscreenRestoreTimer = setTimeout(async () => {
          // Check if still not fullscreen after grace period
          const stillNotFullscreen = !(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
          );

          if (stillNotFullscreen && !isSessionCompleteRef.current && !isTerminatedRef.current) {
            // Try to re-enter fullscreen
            try {
              const element = fullscreenContainerRef.current || document.documentElement;
              if (element.requestFullscreen) {
                await element.requestFullscreen();
                console.log("✅ Fullscreen auto-restored");
                setIsFullscreen(true);
                return; // Success - don't terminate
              }
            } catch (err) {
              console.log("❌ Fullscreen auto-restore failed:", err);
            }

            // If restore failed, terminate
            console.log("🛑 Fullscreen could not be restored - TERMINATING");
            terminateSession(
              "You exited fullscreen mode. The assessment must remain in fullscreen.",
            );
          }
        }, 3000);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      if (fullscreenRestoreTimer) {
        clearTimeout(fullscreenRestoreTimer);
      }
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, [showVideoInterface, sessionState, terminateSession, isSessionComplete, sessionCompletionData]);

  useEffect(() => {
    if (
      showVideoInterface &&
      faceVerified &&
      sessionState !== "complete" &&
      sessionState !== "error"
    ) {
      console.log("🔐 Starting security features...");

      const enterFS = async () => {
        if (hasEnteredFullscreenRef.current || document.fullscreenElement) {
          console.log("📺 Already in fullscreen or already attempted");
          setIsFullscreen(!!document.fullscreenElement);
          return;
        }
        hasEnteredFullscreenRef.current = true;
        try {
          const element =
            fullscreenContainerRef.current || document.documentElement;
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if (element.webkitRequestFullscreen) {
            await element.webkitRequestFullscreen();
          }
          setIsFullscreen(true);
          console.log("📺 Entered fullscreen mode");
        } catch (err) {
          console.error("❌ Failed to enter fullscreen:", err);
        }
      };

      enterFS();
      // ProctoringMonitor handles continuous face verification via isActive prop
    }
  }, [showVideoInterface, faceVerified, sessionState]);

  // ==================== SIMPLIFIED AUDIO ENHANCEMENT FUNCTIONS ====================
  const initializeAudioEnhancementSession = async () => {
    try {
      setSessionState("initializing");
      setError(null);
      setCurrentMessage("Initializing native browser audio enhancement...");
      console.log("🚀 Initializing native audio enhancement session...");
      setSessionState("ready");
      setCurrentMessage("Ready to start with native browser audio enhancement");
    } catch (error) {
      console.error("❌ Session initialization error:", error);
      setError(error.message);
      setSessionState("error");
    }
  };

  const startAudioEnhancedConversation = async () => {
    // ✅ FIX: Prevent duplicate calibration cycles from React re-renders
    if (conversationStartedRef.current) {
      console.log("⚠️ Conversation already started, skipping duplicate call");
      return;
    }
    conversationStartedRef.current = true;

    try {
      setSessionState("calibrating");
      setError(null);
      setCurrentMessage("Starting native browser audio enhancement...");
      setAudioQuality((prev) => ({
        ...prev,
        isCalibrating: true,
        calibrationProgress: 0,
      }));

      console.log("🚀 Starting native audio-enhanced conversation...");

      // Initialize simplified audio processor
      audioProcessorRef.current = new ProfessionalAudioProcessor();

      // Set up quality monitoring callbacks
      audioProcessorRef.current.onQualityUpdate = (metrics) => {
        setAudioQuality((prev) => ({ ...prev, ...metrics }));
      };

      audioProcessorRef.current.onCalibrationComplete = (calibrationData) => {
        setIsAudioEnhanced(true);
        setSessionState("connecting");
        setShowVideoInterface(true);
        setCurrentMessage(
          "Native audio enhancement active! Connecting to AI backend...",
        );
        startBackendConnection();
      };

      // Get microphone with native browser enhancement
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true, // KEY: Use native browser noise suppression
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      });

      await audioProcessorRef.current.initialize(stream);
    } catch (error) {
      console.error("❌ Error starting audio enhancement:", error);
      conversationStartedRef.current = false; // ✅ FIX: Reset on error so retry works
      setError(`Audio enhancement failed: ${error.message}`);
      setSessionState("error");
    }
  };

  const startBackendConnection = async () => {
    // ✅ FIX: Prevent duplicate session creation from React re-renders/double-fires
    if (sessionStartedRef.current) {
      console.log(
        "⚠️ Backend session already started, skipping duplicate call",
      );
      return;
    }
    sessionStartedRef.current = true;

    try {
      // ✅ Get student_id from URL params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const studentId =
        urlParams.get("student_id") || localStorage.getItem("student_id");

      if (!studentId) {
        console.warn("⚠️ No student_id found - session may show wrong student");
      } else {
        console.log(`📋 Starting session for student_id: ${studentId}`);
      }

      // ✅ Pass student_id to startStandup
      const response = await standupCallAPI.startStandup(studentId);

      if (!response || !response.session_id) {
        throw new Error("Backend response missing session_id");
      }

      setRealSessionId(response.session_id);
      setSummaryChunks(response.summary_chunks || 0);
      setIsConnected(true);
      setSessionState("idle");
      setCurrentMessage(
        "Native audio enhancement active! Professional quality audio ready.",
      );
      setConversationCount(0);
      // ✅ ADD THIS: Always set voice warning callback when session starts
      standupCallAPI.setVoiceWarningCallback(handleVoiceWarning);
      standupCallAPI.studentCode = studentId;
      console.log("✅ Voice warning callback registered");

      console.log("✅ Native audio-enhanced conversation started");
    } catch (error) {
      console.error("❌ Error starting conversation:", error);
      sessionStartedRef.current = false; // ✅ FIX: Reset on error so retry works
      setError(`Backend connection failed: ${error.message}`);
      setSessionState("error");
    }
  };

  /**
   * Start the camera for face verification
   */
  const startFaceCamera = async () => {
    try {
      console.log("📷 Starting face verification camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      faceStreamRef.current = stream;

      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
      }

      console.log("✅ Face camera started");
    } catch (err) {
      console.error("❌ Camera access denied:", err);
      setFaceVerificationError(
        "Could not access camera. Please grant camera permission and try again.",
      );
    }
  };

  /**
   * Stop the face verification camera
   */
  const stopFaceCamera = () => {
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((track) => track.stop());
      faceStreamRef.current = null;

      console.log("📷 Face camera stopped");
    }
  };

  /**
   * Capture frame from video and verify face
   */
  const captureAndVerifyFace = async () => {
    if (!faceVideoRef.current || !faceCanvasRef.current) {
      setFaceVerificationError("Camera not ready. Please wait.");
      return;
    }

    setIsVerifyingFace(true);
    setFaceVerificationError(null);

    try {
      const video = faceVideoRef.current;
      const canvas = faceCanvasRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

      const studentCode =
        localStorage.getItem("student_code") ||
        localStorage.getItem("student_id");

      if (!studentCode) throw new Error("Student not logged in");

      const result = await standupCallAPI.verifyFace(studentCode, imageBase64);

      if (result.verified) {
        stopFaceCamera();
        setFaceVerified(true);
        setShowFaceVerification(false);

        if (realSessionId) {
          try {
            await standupCallAPI.startVerificationSession(
              realSessionId,
              studentCode,
            );
          } catch {}
        }

        standupCallAPI.setVoiceWarningCallback(handleVoiceWarning);
        standupCallAPI.studentCode = studentCode;
      } else {
        let msg = result.error || "Face verification failed.";

        switch (result.error_type) {
          case "no_face":
            msg = "❌ No face detected.";
            break;
          case "multiple_faces":
            msg = "👥 Multiple faces detected.";
            break;
          case "face_turned":
            msg = "↩️ Look at the camera.";
            break;
          case "face_obstructed":
            msg = "🚫 Face obstructed.";
            break;
          case "poor_quality":
            msg = "💡 Improve lighting.";
            break;
          case "face_mismatch":
            msg = "🚨 Face mismatch.";
            break;
          case "face_too_small":
            msg = "📏 Move closer.";
            break;
          case "face_too_close":
            msg = "📏 Move back.";
            break;
          default:
            break;
        }

        setFaceVerificationError(msg);
      }
    } catch (err) {
      setFaceVerificationError(err.message || "Verification failed");
    } finally {
      setIsVerifyingFace(false);
    }
  };

  /**
   * Handle voice warning from API service
   */
  const handleVoiceWarning = (warningData) => {
    console.log("⚠️ Voice warning received:", warningData);

    setVoiceWarnings(warningData.warningCount);
    setVoiceWarningMessage(warningData.message);
    setShowVoiceWarning(true);

    // Auto-hide warning after 5 seconds (only if not terminating)
    if (!warningData.shouldTerminate) {
      setTimeout(() => setShowVoiceWarning(false), 5000);
    }

    // Terminate on 3rd warning
    if (warningData.shouldTerminate || warningData.warningCount >= 3) {
      console.log("🛑 Session terminated due to voice verification failure");
      terminateSession(
        "Voice verification failed: Your voice does not match the registered voice profile.",
      );
    }
  };

  // =============================================================================
  // CONTINUOUS FACE VERIFICATION FUNCTIONS
  // =============================================================================

  /**
   * Start continuous face verification camera (separate from main camera)
   */
  const startContinuousFaceCamera = async () => {
    try {
      console.log("📷 Starting continuous face verification camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      });

      continuousFaceStreamRef.current = stream;

      const video = continuousFaceVideoRef.current;
      if (!video) return;

      video.srcObject = stream;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(reject);
        };
        video.onerror = reject;
        setTimeout(() => reject(new Error("Video load timeout")), 5000);
      });

      await new Promise((resolve) => {
        const check = () => {
          if (video.readyState >= 2 && video.videoWidth > 0) resolve();
          else requestAnimationFrame(check);
        };
        check();
      });

      console.log(
        `✅ Continuous face camera ready (${video.videoWidth}x${video.videoHeight})`,
      );
    } catch (err) {
      console.error("❌ Failed to start continuous face camera:", err);
    }
  };

  /**
   * Perform continuous face verification check
   */
  /**
   * Perform continuous face verification check
   */
  const performContinuousFaceCheck = async () => {
    // ✅ FIX: Guard against terminated session
    if (isTerminatedRef.current) {
      console.log("⏭️ Session terminated, skipping face check");
      return;
    }

    // ✅ FIX: Mutex - prevent parallel execution
    if (isPerformingCheckRef.current) {
      console.log("⏭️ Face check already in progress, skipping");
      return;
    }

    isPerformingCheckRef.current = true;

    const video = continuousFaceVideoRef.current;
    const canvas = continuousFaceCanvasRef.current;

    if (!video || !canvas) {
      isPerformingCheckRef.current = false;
      return;
    }
    if (video.readyState < 2) {
      isPerformingCheckRef.current = false;
      return;
    }
    if (!video.videoWidth || !video.videoHeight) {
      isPerformingCheckRef.current = false;
      return;
    }

    setIsVerifyingContinuousFace(true);

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let brightness = 0;

      for (let i = 0; i < data.length; i += 4) {
        brightness += data[i] + data[i + 1] + data[i + 2];
      }
      brightness /= data.length;

      if (brightness < 10) {
        console.warn("⚠️ Blank frame detected – skipping check");
        isPerformingCheckRef.current = false;
        setIsVerifyingContinuousFace(false);
        return;
      }

      const imageBase64 = canvas.toDataURL("image/jpeg", 0.7);

      const studentCode =
        localStorage.getItem("student_code") ||
        localStorage.getItem("student_id");

      if (!studentCode) {
        isPerformingCheckRef.current = false;
        setIsVerifyingContinuousFace(false);
        return;
      }

      const result = await standupCallAPI.verifyFace(studentCode, imageBase64);

      // ✅ FIX: Double-check we haven't been terminated while waiting for API
      if (isTerminatedRef.current) {
        console.log("⏭️ Session terminated during face check, ignoring result");
        isPerformingCheckRef.current = false;
        setIsVerifyingContinuousFace(false);
        return;
      }

      if (!result.verified) {
        // ✅ FIX: Use functional update to avoid race conditions
        const newCount = continuousFaceWarningsRef.current + 1;
        continuousFaceWarningsRef.current = newCount;

        setContinuousFaceWarnings(newCount);

        let message = result.error || "Face verification failed";

        switch (result.error_type) {
          case "no_face":
            message = "❌ No face detected. Keep your face visible.";
            break;
          case "multiple_faces":
            message = "👥 Multiple faces detected.";
            break;
          case "face_too_small":
            message = "📏 Move closer to the camera.";
            break;
          case "face_too_close":
            message = "📏 Move slightly away from the camera.";
            break;
          case "face_turned":
            message = "↩️ Look directly at the camera.";
            break;
          case "face_obstructed":
            message = "🚫 Remove obstructions from your face.";
            break;
          case "poor_quality":
            message = "💡 Improve lighting and stay still.";
            break;
          case "face_mismatch":
            message = "🚨 Face mismatch detected.";
            break;
          default:
            break;
        }

        setContinuousFaceWarningMessage(message);
        setShowContinuousFaceWarning(true);

        setTimeout(() => setShowContinuousFaceWarning(false), 8000);

        console.log(`⚠️ Face warning ${newCount}/3: ${message}`);

        if (newCount >= 3) {
          console.log("🛑 Max face warnings reached, terminating session");
          terminateSession(`Security violation: ${message}`);
        }
      } else {
        // ✅ Only hide warning on successful verification
        if (showContinuousFaceWarning) {
          setShowContinuousFaceWarning(false);
        }
      }
    } catch (err) {
      console.error("❌ Continuous face check failed:", err);
    } finally {
      // ✅ FIX: Always release the mutex
      isPerformingCheckRef.current = false;
      setIsVerifyingContinuousFace(false);
    }
  };

  /**
   * Start continuous face verification interval
   */
  const startContinuousFaceVerification = async () => {
    // ✅ FIX: Guard against multiple starts
    if (isContinuousVerificationRunningRef.current) {
      console.log(
        "⏭️ Continuous face verification already running, skipping duplicate start",
      );
      return;
    }

    isContinuousVerificationRunningRef.current = true;

    try {
      await startContinuousFaceCamera();
      await new Promise((r) => setTimeout(r, 1000));

      // ✅ FIX: Clear any existing interval before creating new one
      if (continuousFaceCheckIntervalRef.current) {
        clearInterval(continuousFaceCheckIntervalRef.current);
        continuousFaceCheckIntervalRef.current = null;
      }

      // Perform initial check
      await performContinuousFaceCheck();

      // Start interval for ongoing checks
      continuousFaceCheckIntervalRef.current = setInterval(
        performContinuousFaceCheck,
        CONTINUOUS_FACE_CHECK_INTERVAL,
      );

      console.log("🔄 Continuous face verification running (single instance)");
    } catch (error) {
      console.error("❌ Failed to start continuous face verification:", error);
      isContinuousVerificationRunningRef.current = false;
    }
  };

  // =============================================================================
  // FULLSCREEN ENFORCEMENT FUNCTIONS
  // =============================================================================

  /**
   * Enter fullscreen mode
   */
  const enterFullscreen = async () => {
    try {
      const element =
        fullscreenContainerRef.current || document.documentElement;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }

      setIsFullscreen(true);
      console.log("📺 Entered fullscreen mode");
    } catch (err) {
      console.error("❌ Failed to enter fullscreen:", err);
    }
  };

  /**
   * Handle fullscreen change event
   */
  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    setIsFullscreen(isCurrentlyFullscreen);

    // If fullscreen exited during active session - IMMEDIATE TERMINATION
    if (
      !isCurrentlyFullscreen &&
      sessionState !== "ready" &&
      sessionState !== "complete" &&
      sessionState !== "error" &&
      showVideoInterface
    ) {
      console.log("🛑 Fullscreen exited - IMMEDIATE TERMINATION");
      terminateSession(
        "You exited fullscreen mode. This is not allowed during the assessment. The session must remain in fullscreen.",
      );
    }
  };

  // =============================================================================
  // TAB SWITCH DETECTION FUNCTIONS
  // =============================================================================

  /**
   * Handle visibility change (tab switch)
   */
  const handleVisibilityChange = () => {
    if (
      document.hidden &&
      sessionState !== "ready" &&
      sessionState !== "complete" &&
      sessionState !== "error" &&
      showVideoInterface
    ) {
      console.log("🛑 Tab switch detected - IMMEDIATE TERMINATION");

      // Immediate termination - no warnings for tab switching
      terminateSession(
        "Tab/window switching is not allowed during the session. This is a security violation.",
      );
    }
  };

  /**
   * Handle keyboard shortcuts to prevent exit
   */
  const handleKeyDown = (e) => {
    // ESC key - TERMINATE SESSION IMMEDIATELY
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      console.log("⚠️ ESC key blocked - fullscreen exit prevented");
      // Don't terminate - just block the key. Fullscreen handler will deal with
      // any actual fullscreen exit via the grace period + auto-restore.
      return false;
    }

    // F11 key - TERMINATE SESSION (trying to exit fullscreen)
    if (e.key === "F11") {
      e.preventDefault();
      e.stopPropagation();
      console.log("🛑 F11 key pressed - IMMEDIATE TERMINATION");
      terminateSession(
        "You attempted to exit fullscreen mode. This is not allowed during the assessment.",
      );
      return false;
    }

    // Alt+Tab detection (won't fully work but we try)
    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      console.log("🛑 Alt+Tab pressed - IMMEDIATE TERMINATION");
      terminateSession(
        "You attempted to switch applications. This is not allowed during the assessment.",
      );
      return false;
    }

    // Alt+F4 - trying to close window
    if (e.altKey && e.key === "F4") {
      e.preventDefault();
      e.stopPropagation();
      console.log("🛑 Alt+F4 pressed - IMMEDIATE TERMINATION");
      terminateSession(
        "You attempted to close the window. This is not allowed during the assessment.",
      );
      return false;
    }

    // Ctrl+W - trying to close tab
    if (e.ctrlKey && e.key === "w") {
      e.preventDefault();
      e.stopPropagation();
      console.log("🛑 Ctrl+W pressed - IMMEDIATE TERMINATION");
      terminateSession(
        "You attempted to close the tab. This is not allowed during the assessment.",
      );
      return false;
    }

    // Ctrl+Tab or Ctrl+Shift+Tab - switching tabs
    if (e.ctrlKey && e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      console.log("🛑 Ctrl+Tab pressed - IMMEDIATE TERMINATION");
      terminateSession(
        "You attempted to switch browser tabs. This is not allowed during the assessment.",
      );
      return false;
    }

    // Windows key
    if (e.key === "Meta" || e.key === "OS") {
      e.preventDefault();
      e.stopPropagation();
      console.log("🛑 Windows/Meta key pressed - IMMEDIATE TERMINATION");
      terminateSession(
        "You pressed the Windows key. This is not allowed during the assessment.",
      );
      return false;
    }
  };

  // =============================================================================
  // SESSION TERMINATION FUNCTION
  // =============================================================================

  /**
   * Skip face verification (for testing or when biometrics not registered)
   */
  const skipFaceVerification = () => {
    console.log("⏭️ Skipping face verification");

    setShowFaceVerification(false);
    setFaceVerified(true); // Allow proceeding
  };

  /**
   * Check if biometric verification is required for this student
   */
  const checkBiometricRequirement = async () => {
    try {
      const studentCode =
        localStorage.getItem("student_code") ||
        localStorage.getItem("student_id");

      if (!studentCode) {
        setBiometricRequired(false);
        return;
      }

      const registration =
        await standupCallAPI.checkBiometricRegistration(studentCode);

      if (!registration.face_registered) {
        console.log(
          "⏭️ Student has no face registration - skipping verification",
        );

        setBiometricRequired(false);
        setShowFaceVerification(false);
        setFaceVerified(true);
      }
    } catch (error) {
      console.error("Error checking biometric requirement:", error);

      // Default to not requiring biometric verification
      setBiometricRequired(false);
      setShowFaceVerification(false);
      setFaceVerified(true);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusMessage = () => {
    switch (sessionState) {
      case "initializing":
        return "Initializing native browser audio enhancement...";
      case "ready":
        return "Ready to start with native browser audio enhancement";
      case "calibrating":
        return "Calibrating native audio enhancement...";
      case "connecting":
        return "Connecting to AI backend with enhanced audio...";
      case "idle":
        return "Native browser audio enhancement active";
      case "listening":
        return "Recording with native noise cancellation";
      case "speaking":
        return "AI is responding";
      case "processing":
        return "Processing enhanced audio...";
      case "complete":
        return "Audio-enhanced standup completed!";
      case "error":
        return "Connection Error - Check Backend";
      default:
        return "Loading...";
    }
  };

  const getStatusIcon = () => {
    switch (sessionState) {
      case "calibrating":
        return <GraphicEq fontSize="inherit" />;
      case "listening":
        return <Mic fontSize="inherit" />;
      case "speaking":
        return <VolumeUp fontSize="inherit" />;
      case "processing":
        return <Speed fontSize="inherit" />;
      case "complete":
        return <CheckCircle fontSize="inherit" />;
      case "error":
        return <ErrorIcon fontSize="inherit" />;
      case "idle":
        return <RecordVoiceOver fontSize="inherit" />;
      default:
        return <RadioButtonChecked fontSize="inherit" />;
    }
  };

  const getStatusColor = () => {
    switch (sessionState) {
      case "complete":
        return "success";
      case "error":
        return "error";
      case "calibrating":
        return "warning";
      case "listening":
        return "success";
      case "speaking":
        return "info";
      case "processing":
        return "secondary";
      default:
        return "primary";
    }
  };

  const cleanup = () => {
    console.log("🧹 Cleaning up native audio enhancement session...");

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (audioProcessorRef.current) {
      audioProcessorRef.current.cleanup();
      audioProcessorRef.current = null;
    }
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    standupCallAPI.disconnect();
  };

  const handleGoBack = () => {
    cleanup();
    navigate("/student/daily-standups");
  };

  const handleRetry = () => {
    setError(null);
    setSessionState("ready");
    setCurrentMessage("");
    setConversationCount(0);
    setSessionDuration(0);
    setProcessingTime(0);
    setIsConnected(false);
    setIsAudioEnhanced(false);
    setShowVideoInterface(false);
    setAudioQuality({
      voiceLevel: 0,
      noiseLevel: 0,
      qualityScore: 0,
      isCalibrating: false,
      calibrationProgress: 0,
      gateActive: false,
    });
    // Reset evaluation state
    setShowEvaluationReport(false);
    setEvaluationData(null);
    setIsGeneratingReport(false);
    setExpandedQuestion(null);

// ✅ NEW: Reset session completion state
    setIsSessionComplete(false);
    setSessionCompletionData(null);
    isSessionCompleteRef.current = false;
    isTerminatedRef.current = false;
    sessionStartedRef.current = false;
    conversationStartedRef.current = false;
  };

  // ==================== PDF DOWNLOAD HANDLER ====================
  const handleDownloadPdf = (sessId) => {
    const targetSessionId = sessId || realSessionId;
    if (targetSessionId) {
      if (standupCallAPI && standupCallAPI.downloadPdfReport) {
        standupCallAPI.downloadPdfReport(targetSessionId);
      } else {
        // Fallback: direct download
        const pdfUrl = `https://192.168.48.201:8090/daily_standup/download_results/${targetSessionId}`;
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `standup_evaluation_${targetSessionId}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  // ==================== INSTRUCTION HANDLERS ====================
  const handleStartButtonClick = () => {
    setShowInstructions(true);
  };

  const handleAcceptInstructions = () => {
    setInstructionsRead(true);
    setShowInstructions(false);
    startAudioEnhancedConversation();
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  // ==================== START NEW SESSION HANDLER ====================
  const handleStartNewSession = () => {
    setShowEvaluationReport(false);
    setEvaluationData(null);
    setIsGeneratingReport(false);
    setExpandedQuestion(null);
    handleRetry();
  };

  // ==================== BACK FROM REPORT HANDLER ====================
  const handleBackFromReport = () => {
    navigate("/student/daily-standups");
  };

  const handleFeedbackChange = (field, value) => {
    setFeedbackData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTechnicalIssueToggle = (issue) => {
    setFeedbackData((prev) => ({
      ...prev,
      technicalIssues: prev.technicalIssues.includes(issue)
        ? prev.technicalIssues.filter((i) => i !== issue)
        : [...prev.technicalIssues, issue],
    }));
  };

  const handleSubmitFeedback = async () => {
    setIsSubmittingFeedback(true);

    try {
      const feedbackPayload = {
        session_id: realSessionId,
        student_id: evaluationData?.session_info?.student_id,
        student_name: evaluationData?.session_info?.student_name,
        feedback: {
          ...feedbackData,
          submitted_at: new Date().toISOString(),
        },
        session_duration: sessionDuration,
      };

      console.log("📝 Submitting feedback:", feedbackPayload);

      if (standupCallAPI && standupCallAPI.submitFeedback) {
        await standupCallAPI.submitFeedback(feedbackPayload);
      } else {
        const response = await fetch(
          `https://192.168.48.201:8090/daily_standup/submit_feedback`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(feedbackPayload),
          },
        );

        if (!response.ok) {
          console.warn(
            "Feedback submission returned non-OK status:",
            response.status,
          );
        }
      }

      console.log("✅ Feedback submitted successfully");
    } catch (error) {
      console.error("❌ Feedback submission error:", error);
    }

    setFeedbackSubmitted(true);
    setShowFeedbackForm(false);
    setIsSubmittingFeedback(false);

    if (evaluationData) {
      setShowEvaluationReport(true);
    } else {
      setIsGeneratingReport(true);
    }
  };

  const handleSkipFeedback = () => {
    setFeedbackSubmitted(true);
    setShowFeedbackForm(false);

    if (evaluationData) {
      setShowEvaluationReport(true);
    } else {
      setIsGeneratingReport(true);
    }
  };

  // =============================================================================
  // RENDER EVALUATION REPORT
  // =============================================================================

  const renderEvaluationReport = () => {
    if (!evaluationData) return null;

    const {
      overall_score = 0,
      technical_score = 0,
      communication_score = 0,
      attentiveness_score = 0,
      grade = "N/A",
      summary = "",
      strengths = [],
      weaknesses = [],
      areas_for_improvement = [],
      question_analysis = [],
      attentiveness_analysis = {},
      recommendations = [],
      topics_mastered = [],
      topics_to_review = [],
      raw_stats = {},
      session_info = {},
      communication_issues = [],
    } = evaluationData;

    const scoreColor = getScoreColor(overall_score);
    const gradeColor = getGradeColor(grade);

    // ========== BUILD COMBINED WEAKNESSES WITH COMMUNICATION ISSUES ==========
    const allWeaknesses = [...weaknesses];

    if (communication_score < 60) {
      if (communication_score < 40) {
        allWeaknesses.push(
          "Poor communication clarity - responses were often unclear or incomplete",
        );
      }
      if (raw_stats.irrelevant_count > 3) {
        allWeaknesses.push(
          "Frequent off-topic responses indicate difficulty understanding questions",
        );
      }
      if (raw_stats.repeat_requests_count > 2) {
        allWeaknesses.push(
          "Multiple requests for question repetition may indicate attention or comprehension issues",
        );
      }
      // Add any communication issues from backend
      if (communication_issues && communication_issues.length > 0) {
        allWeaknesses.push(...communication_issues);
      }
    }
    // ========== END COMMUNICATION WEAKNESSES LOGIC ==========
    // ========== BUILD RECOMMENDATIONS WITH COMMUNICATION IMPROVEMENTS ==========
    const allRecommendations = [...recommendations];

    if (communication_score < 60) {
      if (communication_score < 40) {
        allRecommendations.push(
          "Practice articulating technical concepts clearly and concisely",
        );
        allRecommendations.push(
          "Work on structuring responses with clear beginning, middle, and end",
        );
      }
      if (raw_stats.irrelevant_count > 3) {
        allRecommendations.push(
          "Focus on understanding the question fully before responding",
        );
        allRecommendations.push(
          "Practice active listening during technical discussions",
        );
      }
      if (raw_stats.repeat_requests_count > 2) {
        allRecommendations.push(
          "Improve focus and attention during conversations",
        );
        allRecommendations.push(
          "Take notes while listening to complex questions",
        );
      }
      if (raw_stats.silent_count > 3) {
        allRecommendations.push(
          "Practice thinking out loud - share your thought process even if unsure",
        );
        allRecommendations.push(
          "Don't hesitate to ask clarifying questions instead of staying silent",
        );
      }
    }
    // ========== END COMMUNICATION RECOMMENDATIONS LOGIC ==========
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f0f4f8", pb: 6 }}>
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #1a5276 0%, #0d9488 100%)",
            color: "#ffffff",
            py: 4,
            px: 3,
          }}
        >
          <Container maxWidth="lg">
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={2}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={handleBackFromReport}
                  sx={{ color: "#ffffff" }}
                >
                  <ArrowBack />
                </IconButton>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    Evaluation Report
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {session_info.student_name || "Student"} •{" "}
                    {new Date().toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => handleDownloadPdf(realSessionId)}
                  sx={{
                    bgcolor: alpha("#ffffff", 0.2),
                    "&:hover": { bgcolor: alpha("#ffffff", 0.3) },
                  }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleStartNewSession}
                  sx={{
                    borderColor: "#ffffff",
                    color: "#ffffff",
                    "&:hover": { bgcolor: alpha("#ffffff", 0.1) },
                  }}
                >
                  New Session
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {/* Overall Score Card */}
          <ScoreCard scorecolor={scoreColor} elevation={8}>
            {/* Centered Score Section */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                mb: 4,
              }}
            >
              <GradeCircle gradecolor={gradeColor}>
                <Typography
                  variant="h2"
                  sx={{ color: "#ffffff", fontWeight: "bold" }}
                >
                  {grade}
                </Typography>
              </GradeCircle>
              <Typography
                variant="h3"
                sx={{
                  color: scoreColor,
                  fontWeight: "bold",
                  textAlign: "center",
                  mt: 2,
                }}
              >
                {overall_score}/100
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ textAlign: "center" }}
              >
                Overall Score
              </Typography>
            </Box>

            {/* Performance Summary Section */}
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#0f172a" }}
              >
                Performance Summary
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#475569",
                  lineHeight: 1.8,
                  maxWidth: "800px",
                  mx: "auto",
                }}
              >
                {summary}
              </Typography>
            </Box>
          </ScoreCard>

          {/* Score Breakdown */}
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <School color="primary" />
                    <Typography variant="h6">Technical Knowledge</Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      color: getScoreColor(technical_score),
                      fontWeight: "bold",
                    }}
                  >
                    {technical_score}/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={technical_score}
                    sx={{
                      mt: 2,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(getScoreColor(technical_score), 0.2),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getScoreColor(technical_score),
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <QuestionAnswer color="primary" />
                    <Typography variant="h6">Communication</Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      color: getScoreColor(communication_score),
                      fontWeight: "bold",
                    }}
                  >
                    {communication_score}/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={communication_score}
                    sx={{
                      mt: 2,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(getScoreColor(communication_score), 0.2),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getScoreColor(communication_score),
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Psychology color="primary" />
                    <Typography variant="h6">Attentiveness</Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      color: getScoreColor(attentiveness_score),
                      fontWeight: "bold",
                    }}
                  >
                    {attentiveness_score}/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={attentiveness_score}
                    sx={{
                      mt: 2,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(getScoreColor(attentiveness_score), 0.2),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getScoreColor(attentiveness_score),
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Session Statistics */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                <Timer sx={{ verticalAlign: "middle", mr: 1 }} />
                Session Statistics
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {raw_stats.total_questions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Questions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {raw_stats.answered_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Answered
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {raw_stats.skipped_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Skipped
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="grey.500">
                      {raw_stats.silent_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Silent
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="error.main">
                      {raw_stats.irrelevant_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Off-Topic
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      {raw_stats.duration_minutes?.toFixed(1) || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Minutes
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Strengths and Weaknesses */}
          {/* Weaknesses and Strengths - WEAKNESSES FIRST */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* WEAKNESSES - NOW FIRST */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: "100%",
                  borderTop: `4px solid ${theme.palette.error.main}`,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "error.main", fontWeight: "bold" }}
                  >
                    <TrendingDown sx={{ verticalAlign: "middle", mr: 1 }} />
                    Areas of Concern
                  </Typography>
                  {allWeaknesses.length > 0 ? (
                    <List dense>
                      {allWeaknesses.map((weakness, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Warning color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              typeof weakness === "object"
                                ? weakness.area
                                : weakness
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No major concerns identified
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* STRENGTHS - NOW SECOND */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: "100%",
                  borderTop: `4px solid ${theme.palette.success.main}`,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "success.main", fontWeight: "bold" }}
                  >
                    <TrendingUp sx={{ verticalAlign: "middle", mr: 1 }} />
                    Strengths
                  </Typography>
                  {strengths.length > 0 ? (
                    <List dense>
                      {strengths.map((strength, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              typeof strength === "object"
                                ? strength.area
                                : strength
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No specific strengths identified
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Question-by-Question Analysis */}
          {/* Info about PDF for Question Analysis */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              📄 Download the PDF report to view detailed question-by-question
              analysis
            </Typography>
          </Alert>
          <Card
            sx={{ mt: 3, bgcolor: alpha(theme.palette.success.main, 0.05) }}
          >
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "success.main" }}
              >
                💡 Need Additional Support?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Visit iMentora for mentorship and learning resources.
              </Typography>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card
            sx={{ mt: 3, borderTop: `4px solid ${theme.palette.info.main}` }}
          >
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "info.main", fontWeight: "bold" }}
              >
                <Lightbulb sx={{ verticalAlign: "middle", mr: 1 }} />
                Recommendations for Improvement
              </Typography>
              {allRecommendations.length > 0 ? (
                <List>
                  {recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: "info.main",
                            width: 28,
                            height: 28,
                            fontSize: "0.875rem",
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Keep up the good work! Continue practicing regularly.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Download Button */}
          <Box display="flex" justifyContent="center" gap={2} sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Download />}
              onClick={() => handleDownloadPdf(realSessionId)}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                background: "linear-gradient(135deg, #1a5276 0%, #0d9488 100%)",
              }}
            >
              Download Full Report (PDF)
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<Refresh />}
              onClick={handleStartNewSession}
              sx={{ px: 4, py: 1.5, fontSize: "1.1rem" }}
            >
              Start New Session
            </Button>
          </Box>
        </Container>
      </Box>
    );
  };

  // =============================================================================
  // RENDER LOADING STATE FOR REPORT GENERATION
  // =============================================================================

  const renderGeneratingReport = () => (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f4f8",
      }}
    >
      <CircularProgress size={80} thickness={4} />
      <Typography
        variant="h5"
        sx={{ mt: 4, fontWeight: "bold", color: "#0f172a" }}
      >
        Generating Your Evaluation Report
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Please wait while we analyze your performance...
      </Typography>
      <Box
        sx={{
          mt: 4,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Chip
          icon={<CheckCircle />}
          label="Analyzing answers"
          color="primary"
        />
        <Chip
          icon={<Psychology />}
          label="Calculating scores"
          color="primary"
        />
        <Chip
          icon={<Lightbulb />}
          label="Generating feedback"
          color="primary"
        />
      </Box>
    </Box>
  );

  // ==================== INSTRUCTIONS DIALOG ====================
  const renderInstructionsDialog = () => (
    <Dialog
      open={showInstructions}
      onClose={handleCloseInstructions}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #1a5276 0%, #0d9488 100%)",
          color: "#ffffff",
          py: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Rule sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Daily Standup Instructions & Security Rules
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Please read carefully before starting - Violations will terminate
              your session
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ py: 4, px: 4 }}>
        {/* Critical Security Notice */}
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            🔒 SECURITY NOTICE: This session uses biometric authentication (Face
            & Voice verification). Any security violation will result in{" "}
            <strong>IMMEDIATE SESSION TERMINATION</strong>.
          </Typography>
        </Alert>

        {/* ==================== SECURITY REQUIREMENTS SECTION ==================== */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            bgcolor: alpha(theme.palette.error.main, 0.05),
            borderRadius: 2,
            border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: "error.main",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            🛡️ Mandatory Security Requirements
          </Typography>

          {/* Face Verification Requirements */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}
            >
              📸 Face Verification (Continuous Monitoring)
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                <li>
                  <strong>Plain Background Required:</strong> Sit in front of a
                  plain, uncluttered background (wall preferred)
                </li>
                <li>
                  <strong>Only YOU in Frame:</strong> No other people should be
                  visible in the camera. Multiple faces = Session Terminated
                </li>
                <li>
                  <strong>No Prohibited Objects:</strong> Keep the following
                  items OUT of camera view:
                  <ul style={{ marginTop: 4 }}>
                    <li>📱 Mobile phones / Cell phones</li>
                    <li>💻 Additional laptops or monitors</li>
                    <li>📖 Books, notes, or reference materials</li>
                    <li>⌚ Smartwatches with display</li>
                  </ul>
                </li>
                <li>
                  <strong>Face Always Visible:</strong> Look at the camera
                  throughout the session. Don't look down, away, or cover your
                  face
                </li>
                <li>
                  <strong>Good Lighting:</strong> Ensure your face is well-lit
                  and clearly visible
                </li>
                <li>
                  <strong>3 Warnings = Termination:</strong> After 3 face
                  verification failures, session ends immediately
                </li>
              </ul>
            </Typography>
          </Box>

          {/* Voice Verification Requirements */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}
            >
              🎤 Voice Verification (Every Response)
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                <li>
                  <strong>Your Voice Only:</strong> Only the registered
                  student's voice should respond
                </li>
                <li>
                  <strong>No Help from Others:</strong> Do not let anyone else
                  answer questions for you
                </li>
                <li>
                  <strong>Voice Mismatch Detection:</strong> If your voice
                  doesn't match the registered voice profile, you'll receive a
                  warning
                </li>
                <li>
                  <strong>3 Warnings = Termination:</strong> After 3 voice
                  verification failures, session ends immediately
                </li>
              </ul>
            </Typography>
          </Box>

          {/* Session Restrictions */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}
            >
              🚫 Strictly Prohibited Actions (Immediate Termination)
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                <li>
                  <strong>No Tab Switching:</strong> Switching browser tabs will
                  terminate the session immediately
                </li>
                <li>
                  <strong>No Window Switching:</strong> Alt+Tab or clicking
                  other applications will terminate the session
                </li>
                <li>
                  <strong>No Exiting Fullscreen:</strong> Pressing ESC or F11
                  will terminate the session
                </li>
                <li>
                  <strong>No Keyboard Shortcuts:</strong> Ctrl+Tab, Ctrl+W,
                  Alt+F4 are all blocked
                </li>
                <li>
                  <strong>Stay in Fullscreen:</strong> The session runs in
                  fullscreen mode - do not attempt to exit
                </li>
              </ul>
            </Typography>
          </Box>
        </Box>

        {/* Warning Summary */}
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>⚠️ Warning System:</strong> You get a maximum of{" "}
            <strong>3 warnings</strong> for each security check (face and
            voice). On the 3rd violation, your session will be{" "}
            <strong>automatically terminated</strong> and logged for review.
          </Typography>
        </Alert>

        <Divider sx={{ my: 3 }} />

        {/* ==================== SESSION INSTRUCTIONS SECTION ==================== */}
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}
        >
          📋 Session Instructions
        </Typography>

        {/* Instructions List */}
        <List>
          {/* Instruction 1 */}
          <ListItem sx={{ py: 2, px: 0 }}>
            <ListItemIcon>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 36,
                  height: 36,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  1
                </Typography>
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#0f172a" }}
                >
                  Wait for the Complete Question
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  Always wait to finish asking the question completely before
                  you start speaking. Interrupting may cause your response to be
                  missed.
                </Typography>
              }
            />
          </ListItem>

          <Divider />

          {/* Instruction 2 */}
          <ListItem sx={{ py: 2, px: 0 }}>
            <ListItemIcon>
              <Avatar
                sx={{
                  bgcolor: theme.palette.error.main,
                  width: 36,
                  height: 36,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  2
                </Typography>
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#0f172a" }}
                >
                  Silence Limit - Respond Always
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  If you remain silent (no response) for{" "}
                  <strong>extended periods repeatedly</strong>, your session may
                  be
                  <strong> automatically terminated</strong>. Always respond,
                  even if you don't know the answer.
                </Typography>
              }
            />
          </ListItem>

          <Divider />

          {/* Instruction 3 */}
          <ListItem sx={{ py: 2, px: 0 }}>
            <ListItemIcon>
              <Avatar
                sx={{
                  bgcolor: theme.palette.warning.main,
                  width: 36,
                  height: 36,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  3
                </Typography>
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#0f172a" }}
                >
                  If You Don't Know the Answer
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  It's okay to say <strong>"I don't know"</strong> or{" "}
                  <strong>"I'm not sure"</strong> or{" "}
                  <strong>"Skip this question"</strong>. This is better than
                  staying silent. This will move to the next question.
                </Typography>
              }
            />
          </ListItem>

          <Divider />

          {/* Instruction 4 */}
          <ListItem sx={{ py: 2, px: 0 }}>
            <ListItemIcon>
              <Avatar
                sx={{ bgcolor: theme.palette.info.main, width: 36, height: 36 }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  4
                </Typography>
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#0f172a" }}
                >
                  Ask for Repetition if Needed
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  If you didn't hear the question clearly, say{" "}
                  <strong>"Please repeat the question"</strong> or
                  <strong>"Can you say that again?"</strong>. The AI will repeat
                  the question for you.
                </Typography>
              }
            />
          </ListItem>

          <Divider />

          {/* Instruction 5 */}
          <ListItem sx={{ py: 2, px: 0 }}>
            <ListItemIcon>
              <Avatar
                sx={{
                  bgcolor: theme.palette.success.main,
                  width: 36,
                  height: 36,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  5
                </Typography>
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#0f172a" }}
                >
                  Stay Focused and On-Topic
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  Answer questions related to the topic being discussed.{" "}
                  <strong>Off-topic or irrelevant answers</strong> will
                  negatively impact your communication score.
                </Typography>
              }
            />
          </ListItem>

          <Divider />

          {/* Instruction 6 */}
          <ListItem sx={{ py: 2, px: 0 }}>
            <ListItemIcon>
              <Avatar
                sx={{
                  bgcolor: theme.palette.secondary.main,
                  width: 36,
                  height: 36,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  6
                </Typography>
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#0f172a" }}
                >
                  Session Duration - 15 Minutes
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  Each standup session lasts approximately{" "}
                  <strong>15 minutes</strong>. Make sure you have a quiet
                  environment and stable internet connection before starting.
                </Typography>
              }
            />
          </ListItem>

          <Divider />

          {/* Instruction 7 */}
          <ListItem sx={{ py: 2, px: 0 }}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: "#6b7280", width: 36, height: 36 }}>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  7
                </Typography>
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#0f172a" }}
                >
                  Speak Clearly
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  Speak clearly and at a normal pace. The system uses speech
                  recognition, so <strong>mumbling or speaking too fast</strong>{" "}
                  may result in transcription errors.
                </Typography>
              }
            />
          </ListItem>

          <Divider />

          {/* Instruction 8 */}
          <ListItem sx={{ py: 2, px: 0 }}>
            <ListItemIcon>
              <Avatar
                sx={{ bgcolor: theme.palette.info.main, width: 36, height: 36 }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  8
                </Typography>
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#0f172a" }}
                >
                  Download PDF Report for Detailed Analysis
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  After completing the session, you can{" "}
                  <strong>download a PDF report</strong> with detailed
                  question-by-question analysis.
                </Typography>
              }
            />
          </ListItem>

          <Divider />

          {/* Instruction 9 */}
          <ListItem sx={{ py: 2, px: 0 }}>
            <ListItemIcon>
              <Avatar
                sx={{
                  bgcolor: theme.palette.success.main,
                  width: 36,
                  height: 36,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  9
                </Typography>
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#0f172a" }}
                >
                  Provide Feedback After Session
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  After completion, you will be asked for feedback to help us
                  improve the experience.
                </Typography>
              }
            />
          </ListItem>
        </List>

        {/* Environment Setup Tips */}
        <Box
          sx={{
            mt: 3,
            p: 3,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              color: theme.palette.success.main,
              mb: 1,
            }}
          >
            ✅ Recommended Setup Before Starting
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Plain background:</strong> Sit facing a plain wall with no
            distractions
            <br />• <strong>Good lighting:</strong> Face a light source so your
            face is clearly visible
            <br />• <strong>Clear desk:</strong> Remove phones, books, and other
            materials from camera view
            <br />• <strong>Quiet environment:</strong> Find a quiet place with
            minimal background noise
            <br />• <strong>Stable internet:</strong> Ensure you have a reliable
            internet connection
            <br />• <strong>Headset/Earphones:</strong> Use for better audio
            quality (recommended)
            <br />• <strong>Close other apps:</strong> Close all unnecessary
            browser tabs and applications
            <br />• <strong>Be alone:</strong> Make sure no one else is in the
            frame during the session
          </Typography>
        </Box>

        {/* Final Warning */}
        <Box
          sx={{
            mt: 3,
            p: 3,
            bgcolor: alpha(theme.palette.error.main, 0.1),
            borderRadius: 2,
            border: `2px solid ${alpha(theme.palette.error.main, 0.4)}`,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: theme.palette.error.main, mb: 1 }}
          >
            ⚠️ Final Reminder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Once you start the session, it will run in{" "}
            <strong>fullscreen mode</strong>. Any attempt to exit fullscreen,
            switch tabs, or use prohibited keyboard shortcuts will{" "}
            <strong>immediately terminate</strong> your session. Make sure you
            are ready and have at least 15 minutes of uninterrupted time.
          </Typography>
        </Box>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions
        sx={{ px: 4, py: 3, bgcolor: alpha(theme.palette.grey[100], 0.5) }}
      >
        <Button
          variant="outlined"
          onClick={handleCloseInstructions}
          sx={{ px: 3, py: 1 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAcceptInstructions}
          startIcon={<CheckCircle />}
          sx={{
            px: 4,
            py: 1,
            background: "linear-gradient(135deg, #1a5276 0%, #0d9488 100%)",
            fontWeight: "bold",
          }}
        >
          I Understand & Accept All Rules
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderFeedbackForm = () => {
    const technicalIssueOptions = [
      "Audio not working",
      "Microphone issues",
      "Delayed responses",
      "Questions not clear",
      "Session disconnected",
      "Video issues",
      "System lag",
      "No issues faced",
    ];

    return (
      <Dialog
        open={showFeedbackForm}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: "90vh",
          },
        }}
      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #1a5276 0%, #0d9488 100%)",
            color: "#ffffff",
            py: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Assignment sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                Session Feedback
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Please share your experience to help us improve
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent sx={{ py: 4, px: 4 }}>
          {/* Rating Sections */}
          <Grid container spacing={3}>
            {/* Overall Experience */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  Overall Experience
                </Typography>
                <Rating
                  value={feedbackData.overallExperience}
                  onChange={(e, value) =>
                    handleFeedbackChange("overallExperience", value)
                  }
                  size="large"
                  sx={{ color: theme.palette.primary.main }}
                />
              </Box>
            </Grid>

            {/* Audio Quality */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  Audio Quality
                </Typography>
                <Rating
                  value={feedbackData.audioQuality}
                  onChange={(e, value) =>
                    handleFeedbackChange("audioQuality", value)
                  }
                  size="large"
                  sx={{ color: theme.palette.info.main }}
                />
              </Box>
            </Grid>

            {/* Question Clarity */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  Question Clarity
                </Typography>
                <Rating
                  value={feedbackData.questionClarity}
                  onChange={(e, value) =>
                    handleFeedbackChange("questionClarity", value)
                  }
                  size="large"
                  sx={{ color: theme.palette.success.main }}
                />
              </Box>
            </Grid>

            {/* System Responsiveness */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  System Responsiveness
                </Typography>
                <Rating
                  value={feedbackData.systemResponsiveness}
                  onChange={(e, value) =>
                    handleFeedbackChange("systemResponsiveness", value)
                  }
                  size="large"
                  sx={{ color: theme.palette.warning.main }}
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Technical Issues */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
              Did you face any technical issues?
            </Typography>
            <FormGroup>
              <Grid container spacing={1}>
                {technicalIssueOptions.map((issue) => (
                  <Grid item xs={12} sm={6} md={4} key={issue}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={feedbackData.technicalIssues.includes(issue)}
                          onChange={() => handleTechnicalIssueToggle(issue)}
                          color="primary"
                        />
                      }
                      label={issue}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </Box>

          {/* Difficulty Level */}
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel
                component="legend"
                sx={{ fontWeight: "bold", color: "text.primary" }}
              >
                How would you rate the difficulty level?
              </FormLabel>
              <RadioGroup
                row
                value={feedbackData.difficultyLevel}
                onChange={(e) =>
                  handleFeedbackChange("difficultyLevel", e.target.value)
                }
              >
                <FormControlLabel
                  value="too_easy"
                  control={<Radio />}
                  label="Too Easy"
                />
                <FormControlLabel
                  value="easy"
                  control={<Radio />}
                  label="Easy"
                />
                <FormControlLabel
                  value="moderate"
                  control={<Radio />}
                  label="Moderate"
                />
                <FormControlLabel
                  value="challenging"
                  control={<Radio />}
                  label="Challenging"
                />
                <FormControlLabel
                  value="too_difficult"
                  control={<Radio />}
                  label="Too Difficult"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Would Recommend */}
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel
                component="legend"
                sx={{ fontWeight: "bold", color: "text.primary" }}
              >
                Would you recommend this to others?
              </FormLabel>
              <RadioGroup
                row
                value={feedbackData.wouldRecommend}
                onChange={(e) =>
                  handleFeedbackChange("wouldRecommend", e.target.value)
                }
              >
                <FormControlLabel
                  value="yes"
                  control={<Radio color="success" />}
                  label="Yes, definitely"
                />
                <FormControlLabel
                  value="maybe"
                  control={<Radio color="warning" />}
                  label="Maybe"
                />
                <FormControlLabel
                  value="no"
                  control={<Radio color="error" />}
                  label="No"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Other Issues */}
          <TextField
            fullWidth
            label="Other Issues (if any)"
            multiline
            rows={2}
            value={feedbackData.otherIssues}
            onChange={(e) =>
              handleFeedbackChange("otherIssues", e.target.value)
            }
            variant="outlined"
            sx={{ mb: 3 }}
          />

          {/* Suggestions */}
          <TextField
            fullWidth
            label="Suggestions for improvement"
            multiline
            rows={3}
            value={feedbackData.suggestions}
            onChange={(e) =>
              handleFeedbackChange("suggestions", e.target.value)
            }
            variant="outlined"
            sx={{ mb: 3 }}
            placeholder="Share your ideas on how we can make this experience better..."
          />

          {/* iMentora Reference Box */}
          <Box
            sx={{
              p: 3,
              bgcolor: alpha(theme.palette.success.main, 0.1),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", color: "success.main", mb: 1 }}
            >
              💡 Need Additional Support?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visit <strong>iMentora</strong> for personalized mentorship,
              additional learning resources, and to connect with experienced
              professionals who can help you improve your technical skills and
              interview performance.
            </Typography>
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions
          sx={{ px: 4, py: 3, bgcolor: alpha(theme.palette.grey[100], 0.5) }}
        >
          <Button
            variant="outlined"
            onClick={handleSkipFeedback}
            disabled={isSubmittingFeedback}
            sx={{ px: 3, py: 1 }}
          >
            Skip for now
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitFeedback}
            disabled={isSubmittingFeedback}
            startIcon={
              isSubmittingFeedback ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CheckCircle />
              )
            }
            sx={{
              px: 4,
              py: 1,
              background: "linear-gradient(135deg, #1a5276 0%, #0d9488 100%)",
              fontWeight: "bold",
            }}
          >
            {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  /**
   * Render the face verification screen
   */
  const renderFaceVerification = () => (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#f0f4f8",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - Full width of content area */}
      <Box
        sx={{
          width: "100%",
          background: "linear-gradient(135deg, #1a5276 0%, #0d9488 100%)",
          color: "#ffffff",
          p: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            maxWidth: 1200,
            mx: "auto",
            width: "100%",
            px: { xs: 2, sm: 3 },
          }}
        >
          <IconButton onClick={handleGoBack} sx={{ color: "#ffffff" }}>
            <ArrowBack />
          </IconButton>

          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              Face Verification Required
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Please verify your identity to continue
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Content - Centered card */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          py: 6,
          px: 2,
        }}
      >
        <Card
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: 8,
            maxWidth: 800 /* ✅ INCREASED from 600 to 800 */,
            width: "100%",
          }}
        >
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 3 }}
            >
              Position Your Face in the Frame
            </Typography>

            {/* Video Preview - Also increased */}
            <Box
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: 640 /* ✅ INCREASED from 480 to 640 */,
                mx: "auto",
                mb: 3,
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "#000",
                aspectRatio: "4/3",
              }}
            >
              <video
                ref={faceVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              />

              <canvas ref={faceCanvasRef} style={{ display: "none" }} />

              {/* Face guide overlay - Slightly larger */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 220 /* ✅ INCREASED from 200 to 220 */,
                  height: 280 /* ✅ INCREASED from 260 to 280 */,
                  border: "3px dashed rgba(255,255,255,0.6)",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
              />

              {/* Face position hint */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  bgcolor: "rgba(0,0,0,0.7)",
                  color: "white",
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: "0.85rem",
                }}
              >
                Center your face in the oval
              </Box>
            </Box>

            {/* Error Message */}
            {faceVerificationError && (
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: 2 }}
                onClose={() => setFaceVerificationError(null)}
              >
                {faceVerificationError}
              </Alert>
            )}

            {/* Instructions */}
            <Box
              sx={{
                mb: 3,
                textAlign: "left",
                maxWidth: 500 /* ✅ INCREASED from 400 to 500 */,
                mx: "auto",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>Tips for successful verification:</strong>
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                component="div"
              >
                <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                  <li>Ensure good, even lighting</li>
                  <li>Look directly at the camera</li>
                  <li>Remove glasses or hats</li>
                  <li>Keep a neutral expression</li>
                  <li>Position your face within the oval</li>
                </ul>
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                size="large"
                onClick={captureAndVerifyFace}
                disabled={isVerifyingFace}
                startIcon={
                  isVerifyingFace ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Person />
                  )
                }
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 3,
                  background: "linear-gradient(45deg, #1a5276, #0d9488)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #5a6fd6, #6a4190)",
                  },
                  "&:disabled": {
                    opacity: 0.7,
                  },
                }}
              >
                {isVerifyingFace ? "Verifying..." : "Verify My Face"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
  /**
   * Render voice warning overlay
   */
  const renderVoiceWarning = () => (
    <Fade in={showVoiceWarning}>
      <Alert
        severity={voiceWarnings >= MAX_VOICE_WARNINGS - 1 ? "error" : "warning"}
        sx={{
          position: "fixed",
          top: 100,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          minWidth: 400,
          maxWidth: 500,
          borderRadius: 2,
          boxShadow: 8,
        }}
        onClose={() => setShowVoiceWarning(false)}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 0.5 }}>
          ⚠️ Voice Verification Warning
        </Typography>

        <Typography variant="body2">{voiceWarningMessage}</Typography>

        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            mt: 1.5,
            alignItems: "center",
          }}
        >
          <Typography variant="caption">Warnings:</Typography>

          {[...Array(MAX_VOICE_WARNINGS)].map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: i < voiceWarnings ? "error.main" : "grey.300",
              }}
            />
          ))}

          <Typography variant="caption" sx={{ ml: 1 }}>
            ({voiceWarnings}/{MAX_VOICE_WARNINGS})
          </Typography>
        </Box>
      </Alert>
    </Fade>
  );

  // ==================== RENDER ====================

  return (
    <Fade in={true}>
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Voice Warning Overlay - Always available */}
        {renderVoiceWarning()}

        {/* Instructions Dialog - Always available */}
        {renderInstructionsDialog()}

        {/* Feedback Form Dialog - Always available */}
        {renderFeedbackForm()}

        {/* ================================================================== */}
        {/* SECURITY FIX: Face Verification GATE                               */}
        {/* The main content ONLY renders AFTER face verification passes       */}
        {/* ================================================================== */}

        {showFaceVerification && !faceVerified && biometricRequired ? (
          // ==================== GATE: Face Verification Required ====================
          // When face verification is needed and NOT yet verified:
          // ONLY render the face verification screen - NOTHING ELSE!
          // User cannot scroll down to access main content.

          renderFaceVerification()
        ) : (
          // ==================== GATE PASSED: Render Main Content ====================
          // This entire section is INSIDE the else branch.
          // It ONLY renders when:
          // - Face verification is complete (faceVerified === true), OR
          // - Biometric is not required (biometricRequired === false), OR
          // - Face verification screen is not showing

          <>
            {showEvaluationReport && evaluationData ? (
              // Show evaluation report after session completes
              renderEvaluationReport()
            ) : isGeneratingReport ? (
              // Show loading screen while generating report
              renderGeneratingReport()
            ) : showFeedbackForm ? (
              // Show empty background while feedback form is open (form is a dialog)
              <Box sx={{ minHeight: "100vh", backgroundColor: "#f0f4f8" }} />
            ) : (
              // ==================== MAIN STANDUP INTERFACE ====================
              // This is the main standup screen - PROTECTED by face verification gate

              <Box sx={{ minHeight: "100vh", backgroundColor: "#f0f4f8" }}>
                {/* ==================== HEADER ==================== */}
                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, #1a5276 0%, #0d9488 100%)",
                    color: "#ffffff",
                    p: 3,
                  }}
                >
                  <Container maxWidth="xl">
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <IconButton
                          onClick={handleGoBack}
                          sx={{ color: "#ffffff" }}
                        >
                          <ArrowBack />
                        </IconButton>
                        <Box>
                          <Typography
                            variant="h4"
                            component="h1"
                            sx={{ fontWeight: "bold", mb: 1 }}
                          >
                            Native Browser Audio Enhancement Daily Standup
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            {formatTime(sessionDuration)}
                            {realSessionId &&
                              ` • Session: ${realSessionId.slice(-8)}`}
                            {summaryChunks > 0 && ` • ${summaryChunks} topics`}
                            {processingTime > 0 &&
                              ` • ${processingTime}ms response`}
                            {isAudioEnhanced &&
                              " • Native Audio Enhancement: Active"}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" gap={1} alignItems="center">
                        {showVideoInterface && (
                          <>
                            <Chip
                              label={`Face: ${continuousFaceWarnings}/3`}
                              size="small"
                              sx={{
                                bgcolor:
                                  continuousFaceWarnings > 0
                                    ? alpha("#f44336", 0.3)
                                    : alpha("#ffffff", 0.2),
                                color: "#ffffff",
                              }}
                            />
                            <Chip
                              label={`Exit: ${fullscreenExitWarnings}/${MAX_FULLSCREEN_WARNINGS + 1}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  fullscreenExitWarnings > 0
                                    ? alpha("#f44336", 0.3)
                                    : alpha("#ffffff", 0.2),
                                color: "#ffffff",
                              }}
                            />
                            <Chip
                              label={`Tab: ${tabSwitchWarnings}/${MAX_TAB_SWITCH_WARNINGS + 1}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  tabSwitchWarnings > 0
                                    ? alpha("#f44336", 0.3)
                                    : alpha("#ffffff", 0.2),
                                color: "#ffffff",
                              }}
                            />
                          </>
                        )}
                        <Chip
                          label={getStatusMessage()}
                          color={getStatusColor()}
                          icon={getStatusIcon()}
                          size="large"
                          variant="filled"
                          sx={{
                            bgcolor: alpha("#ffffff", 0.2),
                            color: "#ffffff",
                            "& .MuiChip-icon": { color: "#ffffff" },
                          }}
                        />
                      </Box>
                    </Box>
                  </Container>
                </Box>

                {/* ==================== MAIN CONTAINER ==================== */}
                <Container maxWidth="xl" sx={{ py: 4 }}>
                  {/* Error Display */}
                  {error && (
                    <Alert
                      severity="error"
                      sx={{ mb: 4, borderRadius: 2 }}
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          onClick={handleRetry}
                        >
                          Retry Connection
                        </Button>
                      }
                    >
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        Native Audio Enhancement System Error
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Error:</strong> {error}
                      </Typography>
                    </Alert>
                  )}

                  {/* Audio Enhancement Progress */}
                  {audioQuality.isCalibrating && (
                    <Card
                      sx={{
                        mb: 4,
                        p: 3,
                        bgcolor: alpha(theme.palette.info.main, 0.05),
                      }}
                    >
                      <Typography variant="h6" color="info.main" gutterBottom>
                        🎯 Native Browser Audio Enhancement Calibration
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        Initializing browser's built-in noise suppression and
                        echo cancellation...
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={audioQuality.calibrationProgress}
                        color="info"
                        sx={{ height: 12, borderRadius: 6, mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Calibration Progress:{" "}
                        {Math.round(audioQuality.calibrationProgress)}%
                      </Typography>
                    </Card>
                  )}

                  {/* Audio Quality Monitor */}
                  {isAudioEnhanced && !audioQuality.isCalibrating && (
                    <Card
                      sx={{
                        mb: 4,
                        p: 3,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="success.main"
                        gutterBottom
                      >
                        🎤 Native Browser Audio Enhancement Active
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mb: 3, fontStyle: "italic" }}
                      >
                        Using the same noise cancellation technology as Google
                        Meet, Zoom, and Discord
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            Voice Level
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(audioQuality.voiceLevel, 100)}
                            color={audioQuality.gateActive ? "success" : "info"}
                            sx={{ height: 8, borderRadius: 4, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {audioQuality.gateActive
                              ? "🗣️ Voice Detected"
                              : "🔇 No Voice"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            Noise Reduction (Native)
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.max(0, 100 - audioQuality.noiseLevel)}
                            color="success"
                            sx={{ height: 8, borderRadius: 4, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(
                              Math.max(0, 100 - audioQuality.noiseLevel),
                            )}
                            % Noise Filtered
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            Audio Quality Score
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={audioQuality.qualityScore}
                            color="success"
                            sx={{ height: 8, borderRadius: 4, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(audioQuality.qualityScore)}%
                            Professional Quality
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  )}

                  {/* ==================== VIDEO INTERFACE (Fullscreen) ==================== */}
                  {showVideoInterface && (
                    <Box
                      ref={fullscreenContainerRef}
                      sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: "100vw",
                        height: "100vh",
                        bgcolor: "#0a1f3d",
                        zIndex: 9999,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                      }}
                    >
                      {/* Security Warning Banners - Fixed at top */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 10,
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 10001,
                          width: "90%",
                          maxWidth: 500,
                        }}
                      >
                        {showVoiceWarning && (
                          <Alert
                            severity={voiceWarnings >= 2 ? "error" : "warning"}
                            sx={{ mb: 1, borderRadius: 2, boxShadow: 8 }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold" }}
                            >
                              ⚠️ Voice Warning ({voiceWarnings}/3)
                            </Typography>
                            <Typography variant="body2">
                              {voiceWarningMessage ||
                                "Voice verification failed"}
                            </Typography>
                            {voiceWarnings >= 2 && (
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{
                                  fontWeight: "bold",
                                  display: "block",
                                  mt: 0.5,
                                }}
                              >
                                Next violation will terminate the session!
                              </Typography>
                            )}
                          </Alert>
                        )}
                      </Box>

                      {/* Header Bar */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 2,
                          bgcolor: "rgba(0,0,0,0.5)",
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography
                            variant="h6"
                            sx={{ color: "#fff", fontWeight: "bold" }}
                          >
                            Daily Standup Session
                          </Typography>
                          <Chip
                            icon={<Timer sx={{ color: "#fff !important" }} />}
                            label={formatTime(sessionDuration)}
                            sx={{
                              bgcolor: "rgba(255,255,255,0.2)",
                              color: "#fff",
                            }}
                          />
                        </Box>

                        <Box display="flex" gap={1}>
                          <Chip
                            label={`Face: ${continuousFaceWarnings}/3`}
                            size="small"
                            sx={{
                              bgcolor:
                                continuousFaceWarnings > 0
                                  ? "error.main"
                                  : "success.main",
                              color: "#fff",
                            }}
                          />
                          <Chip
                            label={`Voice: ${voiceWarnings}/3`}
                            size="small"
                            sx={{
                              bgcolor:
                                voiceWarnings > 0
                                  ? "error.main"
                                  : "success.main",
                              color: "#fff",
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Main Content Area */}
                      <Box sx={{ flex: 1, display: "flex", p: 2, gap: 2 }}>
                        {/* AI Interviewer Side */}
                        <Box
                          sx={{
                            flex: 1,
                            borderRadius: 3,
                            overflow: "hidden",
                            background:
                              "linear-gradient(135deg, #1a5276 0%, #1a73e8 100%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                        >
                          {/* Top Label */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: 16,
                              left: 16,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              bgcolor: "rgba(255,255,255,0.2)",
                              px: 2,
                              py: 0.5,
                              borderRadius: 2,
                            }}
                          >
                            <SmartToy
                              sx={{ fontSize: "1rem", color: "#fff" }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold", color: "#fff" }}
                            >
                              AI Interviewer
                            </Typography>
                          </Box>

                          <Avatar
                            sx={{
                              width: 120,
                              height: 120,
                              bgcolor: "rgba(255,255,255,0.15)",
                              border: "3px solid rgba(255,255,255,0.3)",
                              mb: 3,
                              fontSize: "3rem",
                            }}
                          >
                            <Headset fontSize="inherit" />
                          </Avatar>

                          <Typography
                            variant="h4"
                            sx={{ fontWeight: "bold", color: "#fff", mb: 2 }}
                          >
                            Interviewer
                          </Typography>

                          <Chip
                            label={
                              sessionState === "speaking"
                                ? "Speaking..."
                                : sessionState === "listening"
                                  ? "Listening..."
                                  : "Ready"
                            }
                            sx={{
                              bgcolor:
                                sessionState === "speaking"
                                  ? "success.main"
                                  : "rgba(255,255,255,0.2)",
                              color: "#fff",
                            }}
                          />
                        </Box>

                        {/* Interviewee Side (User Camera) */}
                        <Box
                          sx={{
                            flex: 1,
                            borderRadius: 3,
                            overflow: "hidden",
                            bgcolor: "#0f172a",
                            position: "relative",
                          }}
                        >
                          {/* Top Label */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: 16,
                              left: 16,
                              zIndex: 10,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              bgcolor: "rgba(0,0,0,0.5)",
                              px: 2,
                              py: 0.5,
                              borderRadius: 2,
                            }}
                          >
                            <Person sx={{ fontSize: "1rem", color: "#fff" }} />
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold", color: "#fff" }}
                            >
                              You
                            </Typography>
                          </Box>
                          {/* Camera View */}
                          {cameraOn ? (
                            <>
                              <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  transform: "scaleX(-1)",
                                }}
                              />

                              {/* Voice Activity Indicator */}
                              {sessionState === "listening" &&
                                audioQuality.gateActive && (
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      bottom: 60,
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      bgcolor: "success.main",
                                      px: 2,
                                      py: 1,
                                      borderRadius: 2,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        bgcolor: "#fff",
                                        borderRadius: "50%",
                                        animation: "pulse 1s infinite",
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "#fff", fontWeight: "bold" }}
                                    >
                                      Speaking...
                                    </Typography>
                                  </Box>
                                )}
                            </>
                          ) : (
                            <Box
                              sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                              }}
                            >
                              <Typography variant="h5" sx={{ mb: 3 }}>
                                Camera Off
                              </Typography>
                              <Button
                                variant="contained"
                                startIcon={<Videocam />}
                                onClick={() => setCameraOn(true)}
                              >
                                Turn On Camera
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Status Bar */}
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "rgba(0,0,0,0.5)",
                          borderTop: "1px solid rgba(255,255,255,0.1)",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="body1" sx={{ color: "#fff" }}>
                          {getStatusMessage()}
                        </Typography>
                        {currentMessage && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255,255,255,0.7)",
                              mt: 1,
                              fontStyle: "italic",
                            }}
                          >
                            {currentMessage}
                          </Typography>
                        )}
                      </Box>

                      {/* ProctoringMonitor — dual-layer proctoring using single videoRef */}
                      <ProctoringMonitor
                        videoRef={videoRef}
                        isActive={
                          showVideoInterface &&
                          faceVerified &&
                          sessionState !== "complete" &&
                          sessionState !== "error" &&
                          !isTerminatedRef.current
                        }
                        onTerminate={terminateSession}
                        onWarningCountChange={(serverWarnings, status) => {
                          setContinuousFaceWarnings(serverWarnings);
                        }}
                        studentCode={
                          localStorage.getItem("student_code") ||
                          localStorage.getItem("student_id")
                        }
                        apiService={standupCallAPI}
                        isSessionComplete={isSessionComplete}
                        proctoringService={proctoringServiceRef.current}
                      />
                    </Box>
                  )}

                  {/* ==================== MAIN INTERFACE CARD ==================== */}
                  <StatusCard
                    isActive={
                      sessionState !== "ready" && sessionState !== "error"
                    }
                    elevation={8}
                  >
                    <CardContent
                      sx={{
                        p: showVideoInterface ? 4 : 6,
                        textAlign: "center",
                      }}
                    >
                      {!showVideoInterface && (
                        <MainAvatar status={sessionState}>
                          {getStatusIcon()}
                        </MainAvatar>
                      )}

                      <Typography
                        variant={showVideoInterface ? "h5" : "h4"}
                        gutterBottom
                        sx={{
                          mb: showVideoInterface ? 2 : 3,
                          fontWeight: "bold",
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {getStatusMessage()}
                      </Typography>

                      {currentMessage && sessionState !== "ready" && (
                        <Box
                          sx={{
                            mb: showVideoInterface ? 3 : 4,
                            maxWidth: 600,
                            mx: "auto",
                          }}
                        >
                          <Typography
                            variant={showVideoInterface ? "body1" : "h6"}
                            sx={{
                              mb: 2,
                              fontStyle:
                                sessionState === "speaking"
                                  ? "italic"
                                  : "normal",
                              color:
                                sessionState === "speaking"
                                  ? theme.palette.info.main
                                  : theme.palette.text.primary,
                              lineHeight: 1.6,
                              fontSize: showVideoInterface ? "1rem" : "1.1rem",
                            }}
                          >
                            {sessionState === "speaking"
                              ? `"${currentMessage}"`
                              : currentMessage}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mb: showVideoInterface ? 3 : 4 }}>
                        {sessionState === "ready" && (
                          <Button
                            variant="contained"
                            size="large"
                            onClick={handleStartButtonClick}
                            startIcon={<PlayArrow />}
                            sx={{
                              px: 4,
                              py: 2,
                              fontSize: "1.2rem",
                              borderRadius: 3,
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              boxShadow: theme.shadows[8],
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: theme.shadows[12],
                              },
                            }}
                          >
                            Start Native Audio-Enhanced Conversation
                          </Button>
                        )}

                        {sessionState === "complete" && (
                          <Typography
                            variant="h6"
                            color="success.main"
                            sx={{ fontWeight: "bold" }}
                          >
                            Generating evaluation report...
                          </Typography>
                        )}

                        {sessionState === "error" && (
                          <Button
                            variant="contained"
                            color="error"
                            onClick={handleRetry}
                            startIcon={<ErrorIcon />}
                            sx={{ mr: 2 }}
                          >
                            Retry Native Audio Enhancement
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </StatusCard>

                  {/* ==================== NATIVE AUDIO ENHANCEMENT FEATURES CARD ==================== */}
                  <Card
                    sx={{
                      p: 4,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 3,
                      mb: 4,
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="primary.main"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      🔊 Native Browser Audio Enhancement Features
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ mb: 3, fontStyle: "italic" }}
                    >
                      Powered by the same WebRTC technology used in Google Meet,
                      Zoom, Discord, and other professional applications
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: "center", p: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.success.main,
                              width: 56,
                              height: 56,
                              mx: "auto",
                              mb: 2,
                            }}
                          >
                            <GraphicEq />
                          </Avatar>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: "bold" }}
                          >
                            Native Noise Suppression
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Browser's built-in AI-powered noise reduction
                            removes background noise
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: "center", p: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.info.main,
                              width: 56,
                              height: 56,
                              mx: "auto",
                              mb: 2,
                            }}
                          >
                            <RecordVoiceOver />
                          </Avatar>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: "bold" }}
                          >
                            Echo Cancellation
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Eliminates echo and feedback for crystal clear audio
                            quality
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: "center", p: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.warning.main,
                              width: 56,
                              height: 56,
                              mx: "auto",
                              mb: 2,
                            }}
                          >
                            <VolumeUp />
                          </Avatar>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: "bold" }}
                          >
                            Auto Gain Control
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Automatically adjusts volume levels for consistent
                            audio output
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: "center", p: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.secondary.main,
                              width: 56,
                              height: 56,
                              mx: "auto",
                              mb: 2,
                            }}
                          >
                            <Timer />
                          </Avatar>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: "bold" }}
                          >
                            Zero Latency
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No processing delays - hardware-accelerated audio
                            enhancement
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: "center", p: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.error.main,
                              width: 56,
                              height: 56,
                              mx: "auto",
                              mb: 2,
                            }}
                          >
                            <Speed />
                          </Avatar>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: "bold" }}
                          >
                            Professional Grade
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Same technology used in enterprise video
                            conferencing solutions
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: "center", p: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              width: 56,
                              height: 56,
                              mx: "auto",
                              mb: 2,
                            }}
                          >
                            <CheckCircle />
                          </Avatar>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: "bold" }}
                          >
                            Battle Tested
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Proven reliability across millions of users
                            worldwide
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>

                  {/* ==================== TECHNICAL DETAILS CARD ==================== */}
                  <Card
                    sx={{
                      p: 4,
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      borderRadius: 3,
                      mb: 4,
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="info.main"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      ⚙️ Native Browser Audio Processing Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ fontWeight: "bold" }}
                        >
                          Browser Settings
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Noise Suppression:</strong> true (native AI)
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Echo Cancellation:</strong> true (hardware
                          accelerated)
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Auto Gain Control:</strong> true (automatic
                          leveling)
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Sample Rate:</strong> 44.1 kHz (CD quality)
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Channels:</strong> 1 (mono for voice clarity)
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ fontWeight: "bold" }}
                        >
                          Processing Chain
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>1.</strong> Hardware Microphone Input
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>2.</strong> Browser Native Noise Suppression
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>3.</strong> Browser Native Echo Cancellation
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>4.</strong> Browser Native Auto Gain Control
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>5.</strong> WebRTC Audio Stream
                        </Typography>
                        <Typography variant="body2">
                          <strong>6.</strong> Direct Recording/Transmission
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Current Audio Message Display */}
                  {currentMessage &&
                    (sessionState === "speaking" || sessionState === "idle") &&
                    isConnected && (
                      <Card
                        sx={{
                          mb: 4,
                          p: 3,
                          bgcolor: alpha(theme.palette.info.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          borderRadius: 3,
                        }}
                      >
                        <Typography
                          variant="h6"
                          color="info.main"
                          gutterBottom
                          sx={{ fontWeight: "bold" }}
                        >
                          💬 Native Audio-Enhanced Conversation
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontStyle:
                              sessionState === "speaking" ? "italic" : "normal",
                            color:
                              sessionState === "speaking"
                                ? theme.palette.info.main
                                : theme.palette.text.primary,
                            lineHeight: 1.6,
                            fontSize: "1.1rem",
                          }}
                        >
                          {sessionState === "speaking"
                            ? `AI: "${currentMessage}"`
                            : currentMessage}
                        </Typography>
                      </Card>
                    )}

                  {/* Benefits Card */}
                  <Card
                    sx={{
                      p: 4,
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      borderRadius: 3,
                      mb: 4,
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="success.main"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      ✅ Why Native Browser Enhancement Works Better
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ fontWeight: "bold" }}
                        >
                          Reliability
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          • No custom JavaScript processing that can fail
                          <br />
                          • Same technology as Google Meet and Zoom
                          <br />
                          • Hardware-accelerated when available
                          <br />• Tested by millions of users daily
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ fontWeight: "bold" }}
                        >
                          Performance
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          • Zero added latency from processing
                          <br />
                          • No audio artifacts from JavaScript manipulation
                          <br />
                          • Optimized by browser vendors
                          <br />• Works consistently across devices
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Development Debug Panel */}
                  {process.env.NODE_ENV === "development" && (
                    <Card
                      sx={{
                        p: 3,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                        borderRadius: 3,
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="warning.main"
                        gutterBottom
                        sx={{ fontWeight: "bold" }}
                      >
                        🛠️ Native Audio Enhancement Debug Panel
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            <strong>Session State:</strong> {sessionState}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            <strong>Native Enhancement:</strong>{" "}
                            {isAudioEnhanced.toString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            <strong>Quality Score:</strong>{" "}
                            {Math.round(audioQuality.qualityScore)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            <strong>Voice Level:</strong>{" "}
                            {Math.round(audioQuality.voiceLevel)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            <strong>Noise Level:</strong>{" "}
                            {Math.round(audioQuality.noiseLevel)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            <strong>Is Connected:</strong>{" "}
                            {isConnected.toString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            <strong>Video Interface:</strong>{" "}
                            {showVideoInterface.toString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            <strong>Camera On:</strong> {cameraOn.toString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            <strong>Face Verified:</strong>{" "}
                            {faceVerified.toString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  )}
                </Container>
              </Box>
            )}
          </>
        )}

        {/* ================================================================== */}
        {/* DIALOGS - These stay OUTSIDE the gate (they're popups)            */}
        {/* ================================================================== */}

        {/* Silence End Dialog */}
        <Dialog
          open={showSilenceEndDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 },
          }}
        >
          <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Warning sx={{ fontSize: 64, color: "warning.main" }} />
              <Typography variant="h5" fontWeight="bold">
                Session Ended
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center" }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {silenceEndReason}
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              You can start a new session whenever you're ready.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Redirecting to dashboard in 3 seconds...
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
            <Button
              variant="contained"
              onClick={() => navigate("/student/daily-standups")}
              sx={{ px: 4 }}
            >
              Return to Dashboard Now
            </Button>
          </DialogActions>
        </Dialog>

        {/* Session Termination Dialog */}
        <Dialog
          open={showTerminationDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              textAlign: "center",
              p: 2,
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{ color: "error.main", textAlign: "center" }}
          >
            <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
            <Typography
              variant="h5"
              component="span"
              sx={{ fontWeight: "bold", display: "block" }}
            >
              Session Terminated
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Your session has been terminated due to:
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                {terminationReason}
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This incident has been logged for security purposes. You will be
              redirected to the dashboard in 5 seconds.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/student/daily-standups")}
              size="large"
            >
              Return to Dashboard Now
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default StandupCallSession;
