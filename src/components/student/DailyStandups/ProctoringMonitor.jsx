// =============================================================================
// PROCTORING MONITOR v9 - FALSE POSITIVE REDUCTION
// =============================================================================
// CHANGES from v8:
//   1. BlazeFace now starts AFTER baseline capture completes (~5s delay)
//      - Prevents "no face detected" warnings during camera warmup
//   2. WARNING_COOLDOWN increased from 5s → 8s
//      - Prevents rapid-fire warnings from same detection type
//   3. Per-source cooldown tracking (BlazeFace, COCO-SSD, FrameChange each
//      have independent cooldowns)
//   4. Intrusion detection only starts after baseline is confirmed ready
//   5. BlazeFace requires 2 consecutive no-face detections before warning
//      - Single-frame glitches no longer trigger warnings
//   6. Face state is fed back to ProctoringService for threshold boosting
//   7. Baseline refresh only when no intrusion AND face is detected
//
// Architecture:
//   Layer 1 (Client, 1.5s):  BlazeFace      → no_face, multiple_faces (delayed start)
//   Layer 2 (Client, 1.5s):  COCO-SSD       → prohibited objects (backup)
//   Layer 3 (Client, 500ms): Frame Change   → intrusion/motion detection ⭐
//   Layer 4 (Server, 4s):    InsightFace    → identity verification
//   3 warnings = session terminated.
// =============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Typography, Box, CircularProgress } from '@mui/material';
import ProctoringService from '../../../services/ProctoringService';

// ─── Configuration ───────────────────────────────────────────────────────────
const BLAZEFACE_INTERVAL = 1500;
const COCOSSD_INTERVAL = 1500;
const INTRUSION_INTERVAL = 500;
const SERVER_IDENTITY_INTERVAL = 4000;
const SERVER_INITIAL_DELAY = 6000;
const BASELINE_REFRESH_INTERVAL = 30000;
const WARNING_DISPLAY_DURATION = 5000;
const DETECTION_DISPLAY_DURATION = 3000;
const MAX_FACE_WARNINGS = 3;
const WARNING_COOLDOWN = 8000;           // was 5000 — longer cooldown between warnings

// Delay BlazeFace start until baseline is captured + buffer
// This prevents "no face" warnings during camera warmup
const BLAZEFACE_INITIAL_DELAY = 5500;    // NEW: ~4s baseline + 1.5s buffer

// BlazeFace must detect "no face" this many consecutive times before warning
const BLAZEFACE_CONSECUTIVE_THRESHOLD = 2;  // NEW: prevents single-frame glitches

// Per-source cooldown — each detection source has its own cooldown
const PER_SOURCE_COOLDOWN = 6000;         // NEW: independent per-source cooldown

const ProctoringMonitor = ({
  videoRef,
  isActive,
  onTerminate,
  onWarningCountChange,
  studentCode,
  apiService,
  isSessionComplete,
  proctoringService: preloadedService,
}) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelError, setModelError] = useState(null);

  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningSeverity, setWarningSeverity] = useState('warning');
  const [faceWarnings, setFaceWarnings] = useState(0);

  const [showDetection, setShowDetection] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('');
  const [detectionSource, setDetectionSource] = useState('');

  const proctoringServiceRef = useRef(null);
  const blazefaceIntervalRef = useRef(null);
  const blazefaceDelayRef = useRef(null);
  const cocossdIntervalRef = useRef(null);
  const intrusionIntervalRef = useRef(null);
  const baselineRefreshRef = useRef(null);
  const serverIntervalRef = useRef(null);
  const serverDelayRef = useRef(null);
  const cocossdDelayRef = useRef(null);
  const intrusionDelayRef = useRef(null);
  const warningTimerRef = useRef(null);
  const detectionTimerRef = useRef(null);

  const faceWarningsRef = useRef(0);
  const lastWarningTimeRef = useRef(0);

  // Per-source cooldown tracking
  const lastWarningTimeBySourceRef = useRef({});

  // BlazeFace consecutive no-face counter
  const blazefaceNoFaceCountRef = useRef(0);

  const isRunningBlazefaceRef = useRef(false);
  const isRunningCocossdRef = useRef(false);
  const isRunningIntrusionRef = useRef(false);
  const isRunningServerRef = useRef(false);

  const isActiveRef = useRef(false);
  const isSessionCompleteRef = useRef(false);

  const onTerminateRef = useRef(onTerminate);
  const onWarningCountChangeRef = useRef(onWarningCountChange);
  const studentCodeRef = useRef(studentCode);
  const apiServiceRef = useRef(apiService);

  const runBlazefaceCheckRef = useRef(null);
  const runCocossdCheckRef = useRef(null);
  const runIntrusionCheckRef = useRef(null);
  const runServerIdentityCheckRef = useRef(null);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isSessionCompleteRef.current = isSessionComplete; }, [isSessionComplete]);
  useEffect(() => { onTerminateRef.current = onTerminate; }, [onTerminate]);
  useEffect(() => { onWarningCountChangeRef.current = onWarningCountChange; }, [onWarningCountChange]);
  useEffect(() => { studentCodeRef.current = studentCode; }, [studentCode]);
  useEffect(() => { apiServiceRef.current = apiService; }, [apiService]);

  const isVideoReady = useCallback(() => {
    const video = videoRef?.current;
    if (!video) return false;
    if (video.readyState < 2) return false;
    if (!video.videoWidth || !video.videoHeight) return false;
    return true;
  }, [videoRef]);

  const showWarningBanner = useCallback((message, severity = 'warning') => {
    setWarningMessage(message);
    setWarningSeverity(severity);
    setShowWarning(true);
    setShowDetection(true);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(false);
      setShowDetection(false);
    }, WARNING_DISPLAY_DURATION);
  }, []);

  const showDetectionAlert = useCallback((message, source) => {
    setDetectionMessage(message);
    setDetectionSource(source);
    setShowDetection(true);
    if (detectionTimerRef.current) clearTimeout(detectionTimerRef.current);
    detectionTimerRef.current = setTimeout(() => {
      if (!warningTimerRef.current) setShowDetection(false);
    }, DETECTION_DISPLAY_DURATION);
  }, []);

  const incrementWarning = useCallback((message, violationType, sourceLayer) => {
    if (faceWarningsRef.current >= MAX_FACE_WARNINGS) return;
    if (!isActiveRef.current || isSessionCompleteRef.current) return;

    const now = Date.now();

    // Global cooldown check
    const timeSinceLastWarning = now - lastWarningTimeRef.current;

    // Per-source cooldown check
    const lastSourceTime = lastWarningTimeBySourceRef.current[sourceLayer] || 0;
    const timeSinceSourceWarning = now - lastSourceTime;

    showDetectionAlert(message, sourceLayer);

    // Check global cooldown
    if (timeSinceLastWarning < WARNING_COOLDOWN) {
      const remaining = Math.round((WARNING_COOLDOWN - timeSinceLastWarning) / 1000);
      console.log(`⏳ Global cooldown: ${violationType} from ${sourceLayer} (locked for ${remaining}s)`);
      return;
    }

    // Check per-source cooldown
    if (timeSinceSourceWarning < PER_SOURCE_COOLDOWN) {
      const remaining = Math.round((PER_SOURCE_COOLDOWN - timeSinceSourceWarning) / 1000);
      console.log(`⏳ Source cooldown: ${violationType} from ${sourceLayer} (locked for ${remaining}s)`);
      return;
    }

    const newCount = faceWarningsRef.current + 1;
    faceWarningsRef.current = newCount;
    lastWarningTimeRef.current = now;
    lastWarningTimeBySourceRef.current[sourceLayer] = now;
    setFaceWarnings(newCount);

    const severity = newCount >= MAX_FACE_WARNINGS - 1 ? 'error' : 'warning';
    showWarningBanner(`⚠️ Warning ${newCount}/${MAX_FACE_WARNINGS}: ${message}`, severity);
    console.log(`⚠️ WARNING ${newCount}/${MAX_FACE_WARNINGS}: ${message} [${violationType}] (${sourceLayer})`);

    if (onWarningCountChangeRef.current) onWarningCountChangeRef.current(newCount, violationType);

    if (newCount >= MAX_FACE_WARNINGS) {
      console.log('🛑 Max warnings reached — terminating session');
      stopMonitoring();
      if (onTerminateRef.current) onTerminateRef.current(`Security violation: ${message}`);
    }
  }, [showWarningBanner, showDetectionAlert]);

  // ═══ LAYER 1: BlazeFace (with consecutive threshold) ═══
  const runBlazefaceCheck = useCallback(async () => {
    if (!isActiveRef.current || isSessionCompleteRef.current) return;
    if (isRunningBlazefaceRef.current) return;
    if (!proctoringServiceRef.current?.isLoaded) return;
    if (!isVideoReady()) return;

    isRunningBlazefaceRef.current = true;
    try {
      const r = await proctoringServiceRef.current.detectFaces(videoRef.current);
      if (!isActiveRef.current || isSessionCompleteRef.current) return;

      if (r.faceCount === 0) {
        blazefaceNoFaceCountRef.current++;
        console.log(`🔍 BlazeFace: No face (consecutive: ${blazefaceNoFaceCountRef.current}/${BLAZEFACE_CONSECUTIVE_THRESHOLD})`);

        // Only warn after consecutive threshold is met
        if (blazefaceNoFaceCountRef.current >= BLAZEFACE_CONSECUTIVE_THRESHOLD) {
          console.log('🚨 BlazeFace: No face confirmed');
          incrementWarning('No face visible', 'no_face', 'BlazeFace');
          blazefaceNoFaceCountRef.current = 0; // Reset after warning
        }
      } else if (r.faceCount > 1) {
        blazefaceNoFaceCountRef.current = 0; // Reset no-face counter
        console.log(`🚨 BlazeFace: ${r.faceCount} faces`);
        incrementWarning('Multiple faces detected', 'multiple_faces', 'BlazeFace');
      } else {
        // Exactly 1 face — all good
        blazefaceNoFaceCountRef.current = 0;
      }
    } catch (e) { console.error('❌ BlazeFace error:', e); }
    finally { isRunningBlazefaceRef.current = false; }
  }, [videoRef, incrementWarning, isVideoReady]);

  // ═══ LAYER 2: COCO-SSD (backup) ═══
  const runCocossdCheck = useCallback(async () => {
    if (!isActiveRef.current || isSessionCompleteRef.current) return;
    if (isRunningCocossdRef.current) return;
    if (!proctoringServiceRef.current?.isLoaded) return;
    if (!isVideoReady()) return;

    isRunningCocossdRef.current = true;
    try {
      const r = await proctoringServiceRef.current.detectObjects(videoRef.current);
      if (!isActiveRef.current || isSessionCompleteRef.current) return;
      if (r.prohibited.length > 0) {
        const obj = r.prohibited[0];
        const conf = Math.round((obj.score || 0) * 100);
        console.log(`🚨 COCO-SSD: ${obj.label} (conf: ${conf}%)`);
        incrementWarning(obj.label, 'prohibited_object', 'COCO-SSD');
      }
    } catch (e) { console.error('❌ COCO-SSD error:', e); }
    finally { isRunningCocossdRef.current = false; }
  }, [videoRef, incrementWarning, isVideoReady]);

  // ═══ LAYER 3: Frame Change Intrusion ⭐ ═══
  const runIntrusionCheck = useCallback(() => {
    if (!isActiveRef.current || isSessionCompleteRef.current) return;
    if (isRunningIntrusionRef.current) return;
    if (!proctoringServiceRef.current) return;
    if (!isVideoReady()) return;

    isRunningIntrusionRef.current = true;
    try {
      const r = proctoringServiceRef.current.detectIntrusion(videoRef.current);
      if (!isActiveRef.current || isSessionCompleteRef.current) return;
      if (r.detected && r.regions.length > 0) {
        const region = r.regions[0];
        console.log(`🚨 Intrusion: ${region.label} (${region.changePercent}% in "${region.name}")`);
        incrementWarning(region.label, 'intrusion_detected', 'FrameChange');
      }
    } catch (e) { console.error('❌ Intrusion error:', e); }
    finally { isRunningIntrusionRef.current = false; }
  }, [videoRef, incrementWarning, isVideoReady]);

  // ═══ LAYER 4: Server InsightFace ═══
  const runServerIdentityCheck = useCallback(async () => {
    if (!isActiveRef.current || isSessionCompleteRef.current) return;
    if (isRunningServerRef.current) return;
    if (!isVideoReady()) return;
    const code = studentCodeRef.current;
    const api = apiServiceRef.current;
    if (!code || !api) return;

    isRunningServerRef.current = true;
    try {
      const img = proctoringServiceRef.current
        ? proctoringServiceRef.current.captureFrame(videoRef.current, 0.7)
        : captureFrameFallback(videoRef.current);
      if (!img || !isActiveRef.current || isSessionCompleteRef.current) return;

      const r = await api.verifyFaceIdentity(code, img);
      if (!isActiveRef.current || isSessionCompleteRef.current) return;

      if (!r.verified) {
        const et = r.error_type || 'unknown';
        let msg = r.error || 'Identity verification failed';
        switch (et) {
          case 'face_mismatch': msg = 'Face mismatch'; break;
          case 'no_face': msg = 'No face visible'; break;
          case 'multiple_faces': msg = 'Multiple faces detected'; break;
          case 'face_turned': msg = 'Face turned away'; break;
          case 'poor_quality': msg = 'Poor image quality'; break;
          case 'no_registration': msg = 'Face not registered'; break;
          default: break;
        }
        console.log(`🚨 Server: ${et} (similarity: ${r.similarity})`);
        incrementWarning(msg, et, 'InsightFace');
      } else {
        console.log(`✅ Identity verified (similarity: ${r.similarity})`);
      }
    } catch (e) { console.error('❌ Server error:', e); }
    finally { isRunningServerRef.current = false; }
  }, [videoRef, incrementWarning, isVideoReady]);

  useEffect(() => { runBlazefaceCheckRef.current = runBlazefaceCheck; }, [runBlazefaceCheck]);
  useEffect(() => { runCocossdCheckRef.current = runCocossdCheck; }, [runCocossdCheck]);
  useEffect(() => { runIntrusionCheckRef.current = runIntrusionCheck; }, [runIntrusionCheck]);
  useEffect(() => { runServerIdentityCheckRef.current = runServerIdentityCheck; }, [runServerIdentityCheck]);

  // ─── Model Loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (preloadedService) {
      proctoringServiceRef.current = preloadedService;
      if (preloadedService.isLoaded) {
        console.log('⚡ ProctoringMonitor: using PRE-LOADED models (instant start)');
        setModelsLoaded(true);
        setModelsLoading(false);
      } else {
        console.log('⏳ ProctoringMonitor: pre-loaded service provided, waiting for models...');
        setModelsLoading(true);
        const poll = setInterval(() => {
          if (preloadedService.isLoaded) {
            console.log('✅ ProctoringMonitor: pre-loaded models now ready');
            setModelsLoaded(true);
            setModelsLoading(false);
            clearInterval(poll);
          }
        }, 200);
        return () => clearInterval(poll);
      }
      return;
    }

    console.log('📦 ProctoringMonitor: loading models internally (no pre-loaded service)');
    proctoringServiceRef.current = new ProctoringService();
    const load = async () => {
      setModelsLoading(true);
      const ok = await proctoringServiceRef.current.loadModels();
      setModelsLoaded(ok);
      setModelsLoading(false);
      if (!ok) {
        setModelError(proctoringServiceRef.current.loadError);
        console.warn('⚠️ Models failed — server-only mode');
      } else {
        console.log('✅ Proctoring models ready');
      }
    };
    load();
    return () => {
      if (proctoringServiceRef.current) {
        proctoringServiceRef.current.cleanup();
        proctoringServiceRef.current = null;
      }
    };
  }, [preloadedService]);

  // ─── Stop/Start Monitoring ──────────────────────────────────────────────────
  const stopMonitoring = useCallback(() => {
    console.log('⏹️ ProctoringMonitor: stopping');
    [blazefaceIntervalRef, cocossdIntervalRef, intrusionIntervalRef, baselineRefreshRef, serverIntervalRef]
      .forEach(r => { if (r.current) { clearInterval(r.current); r.current = null; } });
    [blazefaceDelayRef, cocossdDelayRef, intrusionDelayRef, serverDelayRef, warningTimerRef, detectionTimerRef]
      .forEach(r => { if (r.current) { clearTimeout(r.current); r.current = null; } });
    isRunningBlazefaceRef.current = false;
    isRunningCocossdRef.current = false;
    isRunningIntrusionRef.current = false;
    isRunningServerRef.current = false;
    blazefaceNoFaceCountRef.current = 0;
  }, []);

  const startMonitoring = useCallback((clientReady) => {
    console.log('🔄 ProctoringMonitor v9: INTRUSION DETECTION (tuned)');
    console.log(`   Client models: ${clientReady}`);
    console.log(`   BlazeFace: ${BLAZEFACE_INTERVAL}ms (delay: ${BLAZEFACE_INITIAL_DELAY}ms, consec: ${BLAZEFACE_CONSECUTIVE_THRESHOLD}) | COCO-SSD: ${COCOSSD_INTERVAL}ms | ⭐FrameChange: ${INTRUSION_INTERVAL}ms | InsightFace: ${SERVER_IDENTITY_INTERVAL}ms`);
    console.log(`   Cooldown: global=${WARNING_COOLDOWN}ms, per-source=${PER_SOURCE_COOLDOWN}ms`);
    console.log(`   🛑 ${MAX_FACE_WARNINGS} warnings = terminated`);

    stopMonitoring();

    if (clientReady) {
      // ⭐ Layer 1: BlazeFace — DELAYED START
      // Wait for baseline capture to complete before starting face checks
      // This prevents "no face detected" during camera warmup
      blazefaceDelayRef.current = setTimeout(() => {
        console.log('🟢 BlazeFace monitoring started (after baseline delay)');
        // Run first check
        if (runBlazefaceCheckRef.current) runBlazefaceCheckRef.current();
        blazefaceIntervalRef.current = setInterval(() => {
          if (runBlazefaceCheckRef.current) runBlazefaceCheckRef.current();
        }, BLAZEFACE_INTERVAL);
      }, BLAZEFACE_INITIAL_DELAY);

      // Layer 2: COCO-SSD (backup) — delayed slightly
      cocossdDelayRef.current = setTimeout(() => {
        if (runCocossdCheckRef.current) runCocossdCheckRef.current();
        cocossdIntervalRef.current = setInterval(() => {
          if (runCocossdCheckRef.current) runCocossdCheckRef.current();
        }, COCOSSD_INTERVAL);
      }, 750);

      // ⭐ Layer 3: Frame Change Intrusion — start baseline capture immediately
      if (proctoringServiceRef.current) {
        proctoringServiceRef.current.startBaselineCapture();
      }
      // Start intrusion checks after a short delay (baseline needs ~4s to build)
      intrusionDelayRef.current = setTimeout(() => {
        console.log('🟢 Intrusion detection monitoring started');
        intrusionIntervalRef.current = setInterval(() => {
          if (runIntrusionCheckRef.current) runIntrusionCheckRef.current();
        }, INTRUSION_INTERVAL);
      }, 500);

      // Baseline refresh every 30s — only when scene is clean and face is present
      baselineRefreshRef.current = setInterval(() => {
        if (proctoringServiceRef.current && isActiveRef.current && videoRef?.current) {
          const r = proctoringServiceRef.current.detectIntrusion(videoRef.current);
          if (r && !r.detected && r.baselineReady) {
            // Only refresh if face was recently detected (scene is normal)
            if (proctoringServiceRef.current._isFaceRecentlyDetected()) {
              proctoringServiceRef.current.refreshBaseline(videoRef.current);
            }
          }
        }
      }, BASELINE_REFRESH_INTERVAL);
    } else {
      console.warn('⚠️ Client models not loaded — server-only mode');
    }

    // Layer 4: Server identity — delayed start
    serverDelayRef.current = setTimeout(() => {
      if (runServerIdentityCheckRef.current) runServerIdentityCheckRef.current();
      serverIntervalRef.current = setInterval(() => {
        if (runServerIdentityCheckRef.current) runServerIdentityCheckRef.current();
      }, SERVER_IDENTITY_INTERVAL);
    }, SERVER_INITIAL_DELAY);
  }, [stopMonitoring, videoRef]);

  useEffect(() => {
    if (isActive && !isSessionComplete) startMonitoring(modelsLoaded);
    else stopMonitoring();
    return () => stopMonitoring();
  }, [isActive, isSessionComplete, modelsLoaded, startMonitoring, stopMonitoring]);

  const captureFrameFallback = (video) => {
    if (!video || video.readyState < 2 || !video.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = 320; c.height = 240;
    c.getContext('2d').drawImage(video, 0, 0, 320, 240);
    return c.toDataURL('image/jpeg', 0.7);
  };

  return (
    <>
      {modelsLoading && (
        <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10001, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.7)', px: 2, py: 0.5, borderRadius: 2 }}>
          <CircularProgress size={14} sx={{ color: '#fff' }} />
          <Typography variant="caption" sx={{ color: '#fff' }}>Loading proctoring models...</Typography>
        </Box>
      )}
      {modelError && !modelsLoaded && (
        <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10001, bgcolor: 'rgba(255,152,0,0.9)', px: 2, py: 0.5, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: '#fff' }}>⚠️ Server-only proctoring mode</Typography>
        </Box>
      )}

      <Box sx={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10002, width: '90%', maxWidth: 500,
        opacity: (showDetection || showWarning) ? 1 : 0,
        visibility: (showDetection || showWarning) ? 'visible' : 'hidden',
        transition: 'opacity 0.15s ease-out',
        pointerEvents: (showDetection || showWarning) ? 'auto' : 'none',
      }}>
        {showWarning ? (
          <Alert severity={warningSeverity} sx={{
            borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: warningSeverity === 'error' ? '2px solid #f44336' : '2px solid #ff9800',
            animation: warningSeverity === 'error' ? 'warningPulse 0.4s ease-in-out 3' : 'none',
            '@keyframes warningPulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.03)' } },
          }} onClose={() => { setShowWarning(false); setShowDetection(false); }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{warningMessage}</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Warnings:</Typography>
              {[...Array(MAX_FACE_WARNINGS)].map((_, i) => (
                <Box key={i} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: i < faceWarningsRef.current ? '#f44336' : 'rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.1)' }} />
              ))}
              <Typography variant="caption" sx={{ ml: 0.5 }}>({faceWarningsRef.current}/{MAX_FACE_WARNINGS})</Typography>
            </Box>
            {faceWarningsRef.current >= MAX_FACE_WARNINGS - 1 && (
              <Typography variant="caption" color="error" sx={{ fontWeight: 'bold', display: 'block', mt: 0.5 }}>⚠️ Next violation will terminate the session!</Typography>
            )}
          </Alert>
        ) : showDetection ? (
          <Alert severity="warning" sx={{ borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', border: '1px solid #ed6c02' }} onClose={() => setShowDetection(false)}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>🔍 {detectionMessage}</Typography>
            <Typography variant="caption" color="text.secondary">Detected by {detectionSource} • Warnings: {faceWarningsRef.current}/{MAX_FACE_WARNINGS}</Typography>
          </Alert>
        ) : null}
      </Box>

      {faceWarningsRef.current > 0 && !showDetection && !showWarning && (
        <Box sx={{
          position: 'absolute', top: 12, right: 12, zIndex: 10001,
          display: 'flex', alignItems: 'center', gap: 0.5,
          bgcolor: faceWarningsRef.current >= 2 ? 'rgba(244,67,54,0.9)' : 'rgba(255,152,0,0.9)',
          px: 1.5, py: 0.5, borderRadius: 2,
        }}>
          {[...Array(MAX_FACE_WARNINGS)].map((_, i) => (
            <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i < faceWarningsRef.current ? '#fff' : 'rgba(255,255,255,0.3)' }} />
          ))}
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold', ml: 0.5 }}>{faceWarningsRef.current}/{MAX_FACE_WARNINGS}</Typography>
        </Box>
      )}
    </>
  );
};

export default ProctoringMonitor;