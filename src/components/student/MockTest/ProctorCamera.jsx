// src/components/student/MockTest/ProctorCamera.jsx

// FAST DETECTION VERSION
// Face loop: 800ms | Object loop: 1000ms | Warnings trigger in ~2 seconds
// UI Updated: iMeetPro teal/cyan theme applied
//
import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Badge,
  Collapse,
  Alert,
  useTheme,
  alpha,
  Snackbar,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CameraAlt as CameraAltIcon,
  FiberManualRecord as RecordIcon,
  People as PeopleIcon,
  PhoneAndroid as PhoneIcon,
  VisibilityOff as VisibilityOffIcon,
  RemoveRedEye as EyeIcon,
  MenuBook as BookIcon
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
  gError: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
  gWarning: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  cameraBg: '#0a1f3d',
};

// ════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════
const API_BASE = 'http://192.128.48.201:8090';

const SCRIPTS = {
  tf: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js',
  cocoSsd: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js',
  blazeface: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js'
};

// ═══════════════════════════════════════════════════════════
// DETECTION SPEED CONFIG — tune these to adjust sensitivity
// ═══════════════════════════════════════════════════════════
const DETECTION_CONFIG = {
  // Loop intervals (milliseconds) — how fast each loop runs
  FACE_INTERVAL: 800,       // was 1500 → now 800ms (checks ~1.25x per second)
  OBJECT_INTERVAL: 1000,    // was 2500 → now 1000ms (checks 1x per second)

  // Consecutive frames needed before warning triggers
  NO_FACE_FRAMES: 3,        // was 5 → 3 frames × 800ms = ~2.4s
  MULTI_FACE_FRAMES: 2,     // was 4 → 2 frames × 800ms = ~1.6s
  TURN_LEFT_FRAMES: 3,      // was 5 → 3 frames × 800ms = ~2.4s
  TURN_RIGHT_FRAMES: 3,     // was 5 → 3 frames × 800ms = ~2.4s
  PHONE_FRAMES: 2,          // was 4 → 2 frames × 1000ms = ~2s
  MULTI_PERSON_FRAMES: 2,   // was 4 → 2 frames × 1000ms = ~2s
  BOOK_FRAMES: 2,           // was 4 → 2 frames × 1000ms = ~2s

  // Face turn threshold (0 = center, 0.5 = edge)
  TURN_THRESHOLD: 0.15,     // was 0.20 → more sensitive

  // Object confidence thresholds (0.0 to 1.0)
  PHONE_CONFIDENCE: 0.35,   // was 0.40 → catches more phones
  PERSON_CONFIDENCE: 0.40,  // was 0.45
  BOOK_CONFIDENCE: 0.40,    // was 0.45

  // Cooldown between same violation type (ms)
  WARNING_COOLDOWN: 2000,   // was 3000 → faster repeat warnings
};

// ════════════════════════════════════════════════════════════
// BACKEND WARNING REPORTER
// ════════════════════════════════════════════════════════════
const reportWarningToBackend = async (testId, studentId, warningType, details = {}) => {
  if (!testId) return null;
  try {
    const res = await fetch(`${API_BASE}/api/warnings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_id: testId,
        student_id: studentId || 0,
        warning_type: warningType,
        details: { ...details, reported_at: new Date().toISOString(), source: 'proctor_camera' }
      })
    });
    if (!res.ok) {
      console.error(`📡 Backend error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`📡 Backend: ${warningType} → ${data.warningCount || data.warning_count}/${data.maxWarnings || data.max_warnings}`);
    return data;
  } catch (err) {
    console.error('📡 Backend unreachable:', err.message);
    return null;
  }
};

const VIOLATION_TO_BACKEND = {
  MULTIPLE_FACES: 'face_multiple',
  FACE_NOT_VISIBLE: 'face_not_detected',
  LOOKING_AWAY: 'face_looking_away',
  FACE_TURNED_LEFT: 'face_turned_left',
  FACE_TURNED_RIGHT: 'face_turned_right',
  ELECTRONIC_DEVICE: 'object_phone',
  BOOK_DETECTED: 'object_book',
  MULTIPLE_PERSONS: 'object_person',
  TAB_SWITCH: 'tab_switch',
  RIGHT_CLICK: 'right_click'
};

// ════════════════════════════════════════════════════════════
// VIOLATION TYPES — iMeetPro themed colors
// ════════════════════════════════════════════════════════════
const VIOLATION_TYPES = {
  MULTIPLE_FACES: {
    code: 'multiple_faces',
    title: 'Multiple Faces Detected',
    message: 'More than one person detected in the camera frame.',
    severity: 'high',
    icon: PeopleIcon,
    color: T.error
  },
  FACE_NOT_VISIBLE: {
    code: 'face_not_visible',
    title: 'Face Not Visible',
    message: 'Your face is not visible in the camera. Please adjust your position.',
    severity: 'high',
    icon: VisibilityOffIcon,
    color: T.warning
  },
  LOOKING_AWAY: {
    code: 'looking_away',
    title: 'Looking Away',
    message: 'Please keep your eyes on the screen during the exam.',
    severity: 'medium',
    icon: EyeIcon,
    color: T.warning
  },
  FACE_TURNED_LEFT: {
    code: 'face_turned_left',
    title: 'Face Turned Left',
    message: 'You turned left. Please look at the screen.',
    severity: 'high',
    icon: EyeIcon,
    color: T.error
  },
  FACE_TURNED_RIGHT: {
    code: 'face_turned_right',
    title: 'Face Turned Right',
    message: 'You turned right. Please look at the screen.',
    severity: 'high',
    icon: EyeIcon,
    color: T.error
  },
  ELECTRONIC_DEVICE: {
    code: 'electronic_device',
    title: 'Electronic Device Detected',
    message: 'A mobile phone or electronic device was detected.',
    severity: 'high',
    icon: PhoneIcon,
    color: T.error
  },
  BOOK_DETECTED: {
    code: 'book_detected',
    title: 'Book Detected',
    message: 'A book or reading material was detected.',
    severity: 'high',
    icon: BookIcon,
    color: T.error
  },
  MULTIPLE_PERSONS: {
    code: 'multiple_persons',
    title: 'Multiple Persons Detected',
    message: 'More than one person detected in the frame.',
    severity: 'high',
    icon: PeopleIcon,
    color: T.error
  },
  LOW_LIGHT: {
    code: 'low_light',
    title: 'Low Light Condition',
    message: 'The lighting is too dim. Please improve the lighting.',
    severity: 'low',
    icon: VisibilityOffIcon,
    color: T.blue
  },
  TAB_SWITCH: {
    code: 'tab_switch',
    title: 'Tab Switch Detected',
    message: 'You switched to another tab or application.',
    severity: 'high',
    icon: WarningIcon,
    color: T.error
  },
  RIGHT_CLICK: {
    code: 'right_click',
    title: 'Right Click Detected',
    message: 'Right-click is not allowed during the exam.',
    severity: 'medium',
    icon: WarningIcon,
    color: T.warning
  }
};

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
const loadScript = (src, name) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
  const s = document.createElement('script');
  s.src = src;
  s.onload = () => { console.log(`📦 ${name}: ✅`); resolve(); };
  s.onerror = () => { console.error(`📦 ${name}: ❌`); reject(new Error(`${name} failed`)); };
  document.head.appendChild(s);
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const ProctorCamera = forwardRef(({
  onViolation,
  captureInterval = 30000,
  showControls = true,
  position = 'bottom-right',
  minimizable = true,
  warningsBeforeTermination = 3,
  onTestTerminate,
  testId,
  studentId
}, ref) => {
  const theme = useTheme();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // AI Model refs
  const blazefaceRef = useRef(null);
  const objectDetectorRef = useRef(null);
  const isTerminated = useRef(false);
  const pauseDetection = useRef(false);

  // Detection loop control refs
  const faceLoopRunning = useRef(false);
  const objectLoopRunning = useRef(false);

  // Consecutive detection counters
  const noFaceCount = useRef(0);
  const turnLeftCount = useRef(0);
  const turnRightCount = useRef(0);
  const multiFaceCount = useRef(0);
  const phoneCount = useRef(0);
  const multiPersonCount = useRef(0);
  const bookCount = useRef(0);

  // Last warning time ref
  const lastWarnTime = useRef({});
  const warningCountRef = useRef(0);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [lastCaptureTime, setLastCaptureTime] = useState(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [faceCount, setFaceCount] = useState(1);
  const [violations, setViolations] = useState([]);
  const [warningCount, setWarningCount] = useState(0);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [showAlertSnackbar, setShowAlertSnackbar] = useState(false);
  const [showViolationsDialog, setShowViolationsDialog] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('loading');
  const [modelStatus, setModelStatus] = useState('loading');
  const [debugText, setDebugText] = useState('Loading AI...');
  const [terminated, setTerminated] = useState(false);
  const [diagLog, setDiagLog] = useState([]);

  const addDiag = useCallback((msg) => {
    console.log('🔧 ' + msg);
    setDiagLog(prev => [...prev.slice(-6), msg]);
  }, []);

  // Position styles
  const positionStyles = {
    'bottom-right': { bottom: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'top-right': { top: 80, right: 16 },
    'top-left': { top: 80, left: 16 }
  };

  // Play warning sound
  const playWarningSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.value = 0.3;

      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 200);
    } catch (e) {
      console.log('Audio not supported');
      console.log(e);
    }
  }, []);

  // Terminate test
  const doTerminate = useCallback((reason) => {
    if (isTerminated.current) return;
    isTerminated.current = true;
    faceLoopRunning.current = false;
    objectLoopRunning.current = false;
    setTerminated(true);

    console.log('%c🛑 TERMINATED: ' + reason, 'background:red;color:white;font-size:20px;');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    if (onTestTerminate) {
      onTestTerminate({
        reason,
        violations,
        totalWarnings: warningCountRef.current,
        testId
      });
    }
  }, [violations, testId, onTestTerminate]);

  // Record violation with cooldown
  const recordViolation = useCallback((violationType) => {
    if (isTerminated.current) return;

    const cfg = VIOLATION_TYPES[violationType];
    if (!cfg) return;

    const now = Date.now();
    if (lastWarnTime.current[violationType] && (now - lastWarnTime.current[violationType]) < DETECTION_CONFIG.WARNING_COOLDOWN) {
      return;
    }
    lastWarnTime.current[violationType] = now;

    const violation = {
      ...cfg,
      timestamp: new Date().toISOString(),
      id: now
    };

    setViolations(prev => [...prev, violation]);

    warningCountRef.current += 1;
    const newCount = warningCountRef.current;
    setWarningCount(newCount);
    setCurrentAlert(violation);
    setShowAlertSnackbar(true);

    if (cfg.severity === 'high') {
      playWarningSound();
    }

    if (onViolation) {
      onViolation(violation);
    }

    console.log(`%c⚠️ WARNING ${newCount}/${warningsBeforeTermination}: ${cfg.title}`, 'background:orange;color:black;font-size:16px;padding:4px;');

    const backendType = VIOLATION_TO_BACKEND[violationType] || violationType.toLowerCase();
    reportWarningToBackend(testId, studentId, backendType, {
      title: cfg.title,
      message: cfg.message,
      severity: cfg.severity,
      count: newCount
    });

    if (newCount >= warningsBeforeTermination) {
      doTerminate(`${cfg.title} — Warning ${newCount}/${warningsBeforeTermination}`);
    }
  }, [warningsBeforeTermination, onViolation, playWarningSound, doTerminate, testId, studentId]);

  // ════════════════════════════════════════════════════════════
  // LOAD MODELS
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        addDiag('Loading TensorFlow.js...');
        await loadScript(SCRIPTS.tf, 'TensorFlow.js');
        await sleep(600);

        if (!alive) return;

        if (!window.tf) {
          addDiag('❌ TF.js missing!');
          setModelStatus('error');
          return;
        }
        await window.tf.setBackend('webgl');
        await window.tf.ready();
        addDiag(`✅ TF.js ${window.tf.version?.tfjs}`);

        addDiag('Loading BlazeFace...');
        await loadScript(SCRIPTS.blazeface, 'BlazeFace');
        await sleep(400);

        if (!alive) return;

        if (window.blazeface) {
          blazefaceRef.current = await window.blazeface.load();
          addDiag('✅ BlazeFace ready');
        } else {
          addDiag('❌ BlazeFace missing');
        }

        addDiag('Loading COCO-SSD...');
        await loadScript(SCRIPTS.cocoSsd, 'COCO-SSD');
        await sleep(400);

        if (!alive) return;

        if (window.cocoSsd) {
          objectDetectorRef.current = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
          addDiag('✅ COCO-SSD ready');
        } else {
          addDiag('❌ COCO-SSD missing');
        }

        if (!alive) return;
        const face = !!blazefaceRef.current;
        const obj = !!objectDetectorRef.current;
        addDiag(`DONE: Face=${face ? '✅' : '❌'} Obj=${obj ? '✅' : '❌'}`);

        if (!face && !obj) {
          setModelStatus('error');
          setDebugText('AI Failed');
        } else {
          setModelStatus('ready');
          setDebugText(face && obj ? 'AI ✓ All' : face ? 'Face Only' : 'Obj Only');
        }
      } catch (err) {
        addDiag('❌ ' + err.message);
        if (alive) {
          setModelStatus('error');
          setDebugText('Error');
        }
      }
    };

    load();
    return () => { alive = false; };
  }, [addDiag]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsStreaming(true);
          addDiag('✅ Camera on');
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found');
      } else {
        setError('Camera error');
      }
      setIsStreaming(false);
    }
  }, [addDiag]);

  // Stop camera
  const stopCamera = useCallback(() => {
    faceLoopRunning.current = false;
    objectLoopRunning.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Tab switch & right-click detection
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && !isTerminated.current) {
        pauseDetection.current = true;
        setTimeout(() => { pauseDetection.current = false; }, 3000);
        recordViolation('TAB_SWITCH');
      }
    };

    const onCtx = (e) => {
      if (!isTerminated.current) {
        e.preventDefault();
        recordViolation('RIGHT_CLICK');
      }
    };

    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('contextmenu', onCtx);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('contextmenu', onCtx);
    };
  }, [recordViolation]);

  // Auto-start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ════════════════════════════════════════════════════════════
  // FACE DETECTION — 800ms loop, 3 frames = ~2.4s to warn
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isStreaming || modelStatus !== 'ready' || !blazefaceRef.current) return;

    addDiag('🔄 Face loop ON (800ms)');
    faceLoopRunning.current = true;

    const detect = async () => {
      if (!faceLoopRunning.current || isTerminated.current) return;

      if (!videoRef.current || pauseDetection.current || videoRef.current.readyState !== 4) {
        if (faceLoopRunning.current && !isTerminated.current) {
          setTimeout(detect, DETECTION_CONFIG.FACE_INTERVAL);
        }
        return;
      }

      try {
        const faces = await blazefaceRef.current.estimateFaces(videoRef.current, false);
        const count = faces.length;
        setFaceCount(count);

        if (count === 0) {
          // ── NO FACE ──
          noFaceCount.current++;
          turnLeftCount.current = 0;
          turnRightCount.current = 0;
          multiFaceCount.current = 0;
          setFaceDetected(false);
          setAnalysisStatus('no_face');
          setDebugText(`No face ${noFaceCount.current}/${DETECTION_CONFIG.NO_FACE_FRAMES}`);

          if (noFaceCount.current >= DETECTION_CONFIG.NO_FACE_FRAMES) {
            recordViolation('FACE_NOT_VISIBLE');
            noFaceCount.current = 0;
          }

        } else if (count > 1) {
          // ── MULTIPLE FACES ──
          multiFaceCount.current++;
          noFaceCount.current = 0;
          turnLeftCount.current = 0;
          turnRightCount.current = 0;
          setFaceDetected(true);
          setAnalysisStatus('multiple_faces');
          setDebugText(`${count} faces ${multiFaceCount.current}/${DETECTION_CONFIG.MULTI_FACE_FRAMES}`);

          if (multiFaceCount.current >= DETECTION_CONFIG.MULTI_FACE_FRAMES) {
            recordViolation('MULTIPLE_FACES');
            multiFaceCount.current = 0;
          }

        } else {
          // ── SINGLE FACE — check LEFT / RIGHT ──
          noFaceCount.current = 0;
          multiFaceCount.current = 0;
          setFaceDetected(true);

          const face = faces[0];
          const tl = face.topLeft;
          const br = face.bottomRight;
          const faceCenterX = (tl[0] + br[0]) / 2;
          const videoWidth = videoRef.current.videoWidth || 640;
          const videoCenterX = videoWidth / 2;
          const signedOffset = (faceCenterX - videoCenterX) / videoWidth;
          const absOffset = Math.abs(signedOffset);

          if (absOffset > DETECTION_CONFIG.TURN_THRESHOLD) {
            if (signedOffset > 0) {
              // Camera mirrored: raw right = user turned LEFT
              turnLeftCount.current++;
              turnRightCount.current = 0;
              setAnalysisStatus('looking_away');
              setDebugText(`← LEFT ${absOffset.toFixed(2)} ${turnLeftCount.current}/${DETECTION_CONFIG.TURN_LEFT_FRAMES}`);

              if (turnLeftCount.current >= DETECTION_CONFIG.TURN_LEFT_FRAMES) {
                recordViolation('FACE_TURNED_LEFT');
                turnLeftCount.current = 0;
              }
            } else {
              // Camera mirrored: raw left = user turned RIGHT
              turnRightCount.current++;
              turnLeftCount.current = 0;
              setAnalysisStatus('looking_away');
              setDebugText(`→ RIGHT ${absOffset.toFixed(2)} ${turnRightCount.current}/${DETECTION_CONFIG.TURN_RIGHT_FRAMES}`);

              if (turnRightCount.current >= DETECTION_CONFIG.TURN_RIGHT_FRAMES) {
                recordViolation('FACE_TURNED_RIGHT');
                turnRightCount.current = 0;
              }
            }
          } else {
            turnLeftCount.current = 0;
            turnRightCount.current = 0;
            setAnalysisStatus('monitoring');
            setDebugText(`OK ${absOffset.toFixed(2)}`);
          }
        }
      } catch (err) {
        if (!err.message?.includes('disposed')) {
          console.error('Face detection error:', err.message);
        }
      }

      if (faceLoopRunning.current && !isTerminated.current) {
        setTimeout(detect, DETECTION_CONFIG.FACE_INTERVAL);
      }
    };

    setTimeout(detect, 500);

    return () => { faceLoopRunning.current = false; };
  }, [isStreaming, modelStatus, recordViolation, addDiag]);

  // ════════════════════════════════════════════════════════════
  // OBJECT DETECTION — 1000ms loop, 2 frames = ~2s to warn
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isStreaming || modelStatus !== 'ready' || !objectDetectorRef.current) {
      if (modelStatus === 'ready' && !objectDetectorRef.current) {
        addDiag('❌ Obj skip: null');
      }
      return;
    }

    addDiag('🔄 Object loop ON (1000ms)');
    objectLoopRunning.current = true;

    const detect = async () => {
      if (!objectLoopRunning.current || isTerminated.current) return;

      if (!videoRef.current || pauseDetection.current || videoRef.current.readyState !== 4) {
        if (objectLoopRunning.current && !isTerminated.current) {
          setTimeout(detect, DETECTION_CONFIG.OBJECT_INTERVAL);
        }
        return;
      }

      try {
        const preds = await objectDetectorRef.current.detect(videoRef.current);

        // Log everything above 25% for debugging
        const items = preds.filter(p => p.score > 0.25);
        if (items.length > 0) {
          console.log('🔍', items.map(p => `${p.class}(${Math.round(p.score * 100)}%)`).join(' '));
        }

        // PHONE / REMOTE
        const phone = preds.find(p =>
          (p.class === 'cell phone' || p.class === 'remote') && p.score > DETECTION_CONFIG.PHONE_CONFIDENCE
        );
        if (phone) {
          phoneCount.current++;
          console.log(`📱 PHONE: ${phone.class} ${Math.round(phone.score * 100)}% (${phoneCount.current}/${DETECTION_CONFIG.PHONE_FRAMES})`);

          if (phoneCount.current >= DETECTION_CONFIG.PHONE_FRAMES) {
            recordViolation('ELECTRONIC_DEVICE');
            phoneCount.current = 0;
          }
        } else {
          phoneCount.current = 0;
        }

        // MULTIPLE PERSONS
        const persons = preds.filter(p => p.class === 'person' && p.score > DETECTION_CONFIG.PERSON_CONFIDENCE);
        if (persons.length > 1) {
          multiPersonCount.current++;
          console.log(`👥 PERSONS: ${persons.length} (${multiPersonCount.current}/${DETECTION_CONFIG.MULTI_PERSON_FRAMES})`);

          if (multiPersonCount.current >= DETECTION_CONFIG.MULTI_PERSON_FRAMES) {
            recordViolation('MULTIPLE_PERSONS');
            multiPersonCount.current = 0;
          }
        } else {
          multiPersonCount.current = 0;
        }

        // BOOK
        const book = preds.find(p => p.class === 'book' && p.score > DETECTION_CONFIG.BOOK_CONFIDENCE);
        if (book) {
          bookCount.current++;
          console.log(`📚 BOOK: ${Math.round(book.score * 100)}% (${bookCount.current}/${DETECTION_CONFIG.BOOK_FRAMES})`);

          if (bookCount.current >= DETECTION_CONFIG.BOOK_FRAMES) {
            recordViolation('BOOK_DETECTED');
            bookCount.current = 0;
          }
        } else {
          bookCount.current = 0;
        }

      } catch (err) {
        if (!err.message?.includes('disposed') && !err.message?.includes('is not a function')) {
          console.error('Object detection error:', err.message);
        }
      }

      if (objectLoopRunning.current && !isTerminated.current) {
        setTimeout(detect, DETECTION_CONFIG.OBJECT_INTERVAL);
      }
    };

    setTimeout(detect, 1000);

    return () => { objectLoopRunning.current = false; };
  }, [isStreaming, modelStatus, recordViolation, addDiag]);

  // Capture screenshot
  const captureScreenshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);

    const img = canvas.toDataURL('image/jpeg', 0.7);
    const ts = new Date().toISOString();

    const capture = {
      image: img,
      timestamp: ts,
      id: Date.now(),
      faceDetected,
      faceCount,
      analysisStatus
    };

    setCapturedImages(prev => {
      const u = [...prev, capture];
      return u.length > 20 ? u.slice(-20) : u;
    });

    setLastCaptureTime(ts);
    return capture;
  }, [isStreaming, faceDetected, faceCount, analysisStatus]);

  // Periodic screenshot capture
  useEffect(() => {
    if (!isStreaming || captureInterval <= 0) return;

    const iv = setInterval(() => {
      const capture = captureScreenshot();
      if (capture) {
        console.log('📸 Capture at:', capture.timestamp);
      }
    }, captureInterval);

    return () => clearInterval(iv);
  }, [isStreaming, captureInterval, captureScreenshot]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    captureScreenshot,
    getCapturedImages: () => capturedImages,
    getViolations: () => violations,
    getWarningCount: () => warningCount,
    startCamera,
    stopCamera,
    isStreaming
  }), [captureScreenshot, capturedImages, violations, warningCount, startCamera, stopCamera, isStreaming]);

  // Get status color - iMeetPro themed
  const getStatusColor = () => {
    if (!isStreaming) return T.error;
    if (warningCount > 3) return T.error;
    if (warningCount >= 1) return T.warning;
    if (analysisStatus === 'no_face' || analysisStatus === 'multiple_faces') return T.error;
    if (analysisStatus === 'looking_away') return T.warning;
    return T.success;
  };

  // Get status text
  const getStatusText = () => {
    if (!isStreaming) return 'Off';
    if (modelStatus === 'loading') return 'Loading AI...';
    if (modelStatus === 'error') return 'AI Error';
    if (analysisStatus === 'multiple_faces') return 'Multiple Faces!';
    if (analysisStatus === 'no_face') return 'No Face!';
    if (analysisStatus === 'looking_away') return 'Look Here!';
    return 'Proctoring';
  };

  // ═══ TERMINATED — iMeetPro styled ═══
  if (terminated) {
    return (
      <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(10,31,61,0.97)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 420,
            borderRadius: '22px',
            border: `1px solid rgba(239,68,68,0.2)`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          <Box sx={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <Typography sx={{ fontSize: '2.2rem' }}>🚫</Typography>
          </Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: T.error, mb: 1, letterSpacing: '-0.02em' }}>
            Test Terminated
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', color: T.textSec, mb: 3 }}>
            Too many proctoring violations detected.
          </Typography>
          <Box sx={{ my: 2, textAlign: 'left', bgcolor: 'rgba(239,68,68,0.06)', p: 2.5, borderRadius: '14px', border: '1px solid rgba(239,68,68,0.15)' }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 'bold', color: T.text }}>
              Warnings: <strong style={{ color: T.error }}>{warningCount}/{warningsBeforeTermination}</strong>
            </Typography>
            {violations.map((v, i) => (
              <Typography key={v.id} sx={{ fontSize: '0.72rem', display: 'block', color: T.textSec, mt: 0.5 }}>
                #{i + 1} {v.title} — {new Date(v.timestamp).toLocaleTimeString()}
              </Typography>
            ))}
          </Box>
          <Alert
            severity="error"
            sx={{
              borderRadius: '12px',
              border: '1px solid rgba(239,68,68,0.2)',
              '& .MuiAlert-icon': { color: T.error }
            }}
          >
            This incident has been recorded.
          </Alert>
        </Paper>
      </Box>
    );
  }

  // ═══ MAIN RENDER — iMeetPro styled ═══
  return (
    <>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 1300,
          borderRadius: '14px',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          width: isMinimized ? 48 : 200,
          backgroundColor: T.card,
          border: `2px solid ${getStatusColor()}`,
          boxShadow: `0 4px 20px ${alpha(getStatusColor(), 0.2)}, 0 1px 3px rgba(26,82,118,0.08)`
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1,
            py: 0.5,
            background: `linear-gradient(135deg, ${alpha(getStatusColor(), 0.08)} 0%, ${alpha(getStatusColor(), 0.04)} 100%)`,
            borderBottom: `1px solid ${T.border}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Badge
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  width: 6,
                  height: 6,
                  minWidth: 6,
                  backgroundColor: isStreaming ? (warningCount > 0 ? T.warning : T.success) : T.error,
                  boxShadow: `0 0 6px ${isStreaming ? (warningCount > 0 ? alpha(T.warning, 0.6) : alpha(T.success, 0.6)) : alpha(T.error, 0.6)}`
                }
              }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              {isStreaming ? (
                <VideocamIcon sx={{ fontSize: 16, color: warningCount > 0 ? T.warning : T.success }} />
              ) : (
                <VideocamOffIcon sx={{ fontSize: 16, color: T.error }} />
              )}
            </Badge>
            {!isMinimized && (
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: getStatusColor(), letterSpacing: '0.02em' }}>
                {getStatusText()}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            {warningCount > 0 && !isMinimized && (
              <Tooltip title={`${warningCount} warning(s) - Click to view`}>
                <Chip
                  size="small"
                  label={`${warningCount}/${warningsBeforeTermination}`}
                  onClick={() => setShowViolationsDialog(true)}
                  sx={{
                    height: 18,
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: '6px',
                    bgcolor: warningCount >= 2 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: warningCount >= 2 ? T.error : T.warning,
                    border: `1px solid ${warningCount >= 2 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
              </Tooltip>
            )}

            {minimizable && (
              <IconButton
                size="small"
                onClick={() => setIsMinimized(!isMinimized)}
                sx={{ p: 0.25, color: T.textMuted, '&:hover': { color: T.blue, bgcolor: 'rgba(41,128,185,0.06)' } }}
              >
                {isMinimized ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Camera View */}
        <Collapse in={!isMinimized}>
          <Box sx={{ position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: 150,
                objectFit: 'cover',
                display: isStreaming ? 'block' : 'none',
                transform: 'scaleX(-1)',
                backgroundColor: T.cameraBg
              }}
            />

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Recording indicator */}
            {isStreaming && (
              <Box sx={{ position: 'absolute', top: 4, left: 4, display: 'flex', alignItems: 'center', gap: 0.25, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '5px', px: 0.5, py: 0.125 }}>
                <RecordIcon sx={{ fontSize: 8, color: T.error, animation: 'proctorPulse 1.5s infinite' }} />
                <Typography sx={{ color: 'white', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em' }}>REC</Typography>
              </Box>
            )}

            {/* AI Status */}
            {isStreaming && (
              <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', alignItems: 'center', gap: 0.25, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '5px', px: 0.5, py: 0.125 }}>
                <Typography sx={{ color: modelStatus === 'ready' ? (objectDetectorRef.current ? T.secondaryLight : T.warning) : modelStatus === 'error' ? T.error : T.warning, fontSize: '0.5rem', fontWeight: 700 }}>
                  {modelStatus === 'ready' ? (objectDetectorRef.current ? 'AI ✓' : 'Face ✓') : modelStatus === 'error' ? 'AI ✗' : 'AI...'}
                </Typography>
              </Box>
            )}

            {/* Debug text */}
            {isStreaming && (
              <Box sx={{ position: 'absolute', bottom: 24, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '5px', px: 0.5, py: 0.125 }}>
                <Typography sx={{ color: T.secondaryLight, fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.5rem' }}>
                  {debugText}
                </Typography>
              </Box>
            )}

            {/* Face status indicator */}
            {isStreaming && (
              <Box sx={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 0.25, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '5px', px: 0.5, py: 0.125 }}>
                {faceDetected ? (
                  <>
                    <CheckCircleIcon sx={{ fontSize: 10, color: faceCount === 1 ? T.success : T.error }} />
                    {faceCount > 1 && <Typography sx={{ color: T.error, fontSize: '0.5rem', fontWeight: 700 }}>{faceCount}</Typography>}
                  </>
                ) : (
                  <WarningIcon sx={{ fontSize: 10, color: T.warning }} />
                )}
              </Box>
            )}

            {/* Warning overlay */}
            {isStreaming && analysisStatus !== 'monitoring' && analysisStatus !== 'loading' && (
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: analysisStatus === 'multiple_faces' || analysisStatus === 'no_face'
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.92), rgba(248,113,113,0.92))'
                  : 'linear-gradient(135deg, rgba(245,158,11,0.92), rgba(251,191,36,0.92))',
                py: 0.5,
                px: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5
              }}>
                <WarningIcon sx={{ fontSize: 12, color: 'white' }} />
                <Typography sx={{ color: 'white', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                  {analysisStatus === 'no_face' ? '❌ NO FACE' : analysisStatus === 'multiple_faces' ? '❌ MULTIPLE FACES' : '⚠️ LOOK AT SCREEN'}
                </Typography>
              </Box>
            )}

            {/* Error state */}
            {!isStreaming && error && (
              <Box sx={{ p: 1.5, textAlign: 'center', backgroundColor: 'rgba(239,68,68,0.04)', height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <VideocamOffIcon sx={{ fontSize: 24, color: T.textMuted, mb: 0.5 }} />
                <Typography sx={{ fontSize: '0.6rem', color: T.error, mb: 0.5 }}>{error}</Typography>
                {showControls && (
                  <Tooltip title="Enable Camera">
                    <IconButton
                      size="small"
                      onClick={startCamera}
                      sx={{ p: 0.5, backgroundColor: 'rgba(0,131,143,0.08)', color: T.primary, '&:hover': { bgcolor: 'rgba(0,131,143,0.15)' } }}
                    >
                      <CameraAltIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}

            {/* Loading state */}
            {!isStreaming && !error && (
              <Box sx={{ p: 1.5, textAlign: 'center', backgroundColor: 'rgba(41,128,185,0.04)', height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <VideocamIcon sx={{ fontSize: 24, color: T.textMuted, mb: 0.5 }} />
                <Typography sx={{ fontSize: '0.6rem', color: T.textSec }}>Starting camera...</Typography>
              </Box>
            )}
          </Box>

          {/* Diag log during model loading */}
          {modelStatus === 'loading' && (
            <Box sx={{ px: 1, py: 0.5, backgroundColor: T.cameraBg, maxHeight: 60, overflow: 'auto' }}>
              {diagLog.map((msg, i) => (
                <Typography key={i} sx={{ display: 'block', color: msg.includes('✅') ? T.secondaryLight : msg.includes('❌') ? T.error : T.textMuted, fontSize: '0.5rem', fontFamily: 'Monaco, Consolas, monospace' }}>
                  {msg}
                </Typography>
              ))}
            </Box>
          )}

          {/* Footer */}
          {isStreaming && (
            <Box sx={{
              px: 1,
              py: 0.375,
              background: warningCount > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(41,128,185,0.03)',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography sx={{ fontSize: '0.5rem', color: T.textMuted }}>
                {lastCaptureTime ? new Date(lastCaptureTime).toLocaleTimeString() : 'Monitoring'}
              </Typography>
              <Typography sx={{
                fontSize: '0.5rem',
                fontWeight: 700,
                color: warningCount >= 2 ? T.error : warningCount >= 1 ? T.warning : T.success
              }}>
                ⚠ {warningCount}/{warningsBeforeTermination}
              </Typography>
            </Box>
          )}
        </Collapse>

        {/* Minimized state */}
        {isMinimized && (
          <Box sx={{ p: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Badge
              badgeContent={warningCount > 0 ? warningCount : null}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.5rem',
                  height: 12,
                  minWidth: 12,
                  bgcolor: T.error,
                  color: '#fff',
                  fontWeight: 700
                }
              }}
            >
              {isStreaming ? (
                <VideocamIcon sx={{ fontSize: 18, color: warningCount > 0 ? T.warning : T.success }} />
              ) : (
                <VideocamOffIcon sx={{ fontSize: 18, color: T.error }} />
              )}
            </Badge>
          </Box>
        )}

        <style>{`@keyframes proctorPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </Paper>

      {/* Warning Snackbar */}
      <Snackbar
        open={showAlertSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowAlertSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert
          severity={currentAlert?.severity === 'high' ? 'error' : 'warning'}
          variant="filled"
          onClose={() => setShowAlertSnackbar(false)}
          sx={{
            minWidth: 350,
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            background: currentAlert?.severity === 'high' ? T.gError : T.gWarning,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>{currentAlert?.title}</Typography>
            <Typography sx={{ fontSize: '0.78rem', opacity: 0.9 }}>{currentAlert?.message}</Typography>
            <Typography sx={{ fontSize: '0.68rem', opacity: 0.7, display: 'block', mt: 0.5 }}>
              Warning {warningCount} of {warningsBeforeTermination}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Violations Dialog */}
      <Dialog
        open={showViolationsDialog}
        onClose={() => setShowViolationsDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '22px', overflow: 'hidden' } }}
      >
        <Box sx={{ height: 4, background: T.gWarning }} />
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.2, pt: 3 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: T.gWarning, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WarningIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: T.text }}>
              Proctoring Warnings
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: T.textMuted }}>
              {warningCount}/{warningsBeforeTermination} warnings recorded
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: T.border }}>
          {violations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(13,148,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 28, color: T.success }} />
              </Box>
              <Typography sx={{ fontSize: '0.92rem', color: T.textSec }}>No warnings recorded</Typography>
            </Box>
          ) : (
            <List dense>
              {violations.map((violation, index) => {
                const IconComponent = violation.icon || WarningIcon;
                return (
                  <ListItem
                    key={violation.id}
                    sx={{
                      borderRadius: '14px',
                      mb: 1,
                      backgroundColor: alpha(violation.color || T.warning, 0.06),
                      border: `1px solid ${alpha(violation.color || T.warning, 0.15)}`
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: alpha(violation.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconComponent sx={{ color: violation.color, fontSize: 16 }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: T.text }}>{violation.title}</Typography>
                          <Chip
                            size="small"
                            label={`#${index + 1}`}
                            sx={{
                              height: 18,
                              fontSize: '0.55rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              bgcolor: alpha(violation.color, 0.1),
                              color: violation.color
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography sx={{ fontSize: '0.78rem', color: T.textSec }}>{violation.message}</Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: T.textMuted }}>{new Date(violation.timestamp).toLocaleString()}</Typography>
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}

          {warningCount >= 2 && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                borderRadius: '12px',
                border: '1px solid rgba(239,68,68,0.2)',
                '& .MuiAlert-icon': { color: T.error }
              }}
            >
              <Typography sx={{ fontSize: '0.82rem' }}>
                <strong>Warning:</strong> You have {warningCount} warnings. At {warningsBeforeTermination} warnings, your test will be automatically terminated.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setShowViolationsDialog(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              color: T.blue,
              '&:hover': { bgcolor: 'rgba(41,128,185,0.06)' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

ProctorCamera.displayName = 'ProctorCamera';

export default ProctorCamera;