// =============================================================================
// PROCTORING SERVICE v5 - Frame Change Intrusion Detection (TUNED)
// =============================================================================
// CHANGES from v4:
//   1. Raised intrusion thresholds to reduce false positives from body movement
//   2. Increased PIXEL_DIFF_THRESHOLD from 35 → 50
//   3. Increased MIN_CONSECUTIVE_DETECTIONS from 1 → 4
//   4. Raised region thresholds (bottom: 10%→22%, top: 10%→22%, sides: 8%→16%)
//   5. Added center exclusion zone to ignore normal body movement
//   6. Added face-aware suppression: if face is detected, suppress body-region alerts
//   7. Baseline now uses 8 frames (was 5) for more stable reference
//   8. Baseline delay increased to 4s (was 3s) for camera stabilization
//   9. Added adaptive threshold: regions near detected face get higher thresholds
//  10. Consecutive detection counter decays slower (prevents flicker triggers)
//
// Architecture:
//   Layer 1: BlazeFace      → face count, pose (unchanged)
//   Layer 2: COCO-SSD       → still runs for clear object detection (backup)
//   Layer 3: Frame Change   → intrusion/motion in peripheral regions (TUNED)
//   Layer 4: InsightFace    → server identity verification (unchanged)
// =============================================================================

import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// ─── Configuration ───────────────────────────────────────────────────────────
const DEBUG_COCO = false;
const DEBUG_INTRUSION = true;

// Prohibited objects from COCO-SSD (backup detection)
const PROHIBITED_OBJECTS = {
  'cell phone': { label: 'Mobile phone detected', confidence: 0.35 },
  'laptop':     { label: 'Additional laptop detected', confidence: 0.50 },
  'book':       { label: 'Book detected', confidence: 0.55 },
  'tv':         { label: 'Additional monitor detected', confidence: 0.50 },
  'remote':     { label: 'Electronic device detected', confidence: 0.45 },
};

// Pose thresholds
const POSE_THRESHOLDS = {
  YAW_TURNED_RATIO: 2.0,
  YAW_TURNED_RATIO_INV: 0.50,
  PITCH_DOWN_RATIO: 2.2,
  PITCH_UP_RATIO: 0.4,
};

// ─── Frame Change / Intrusion Detection Config (TUNED v5) ───────────────────
const INTRUSION_CONFIG = {
  // Analysis resolution (lower = faster)
  ANALYSIS_WIDTH: 160,
  ANALYSIS_HEIGHT: 120,

  // Baseline averaging — more frames = more stable baseline
  BASELINE_FRAME_COUNT: 8,        // was 5 — more frames for stability
  BASELINE_DELAY_MS: 4000,        // was 3000 — let camera fully stabilize

  // Per-pixel change threshold (0-255)
  // 50 ignores subtle lighting shifts, skin tone changes from talking/breathing
  PIXEL_DIFF_THRESHOLD: 50,       // was 35

  // Consecutive detections needed before triggering
  // 4 = must detect intrusion in 4 consecutive checks (~2s at 500ms interval)
  // This eliminates single-frame noise and brief hand gestures
  MIN_CONSECUTIVE_DETECTIONS: 4,  // was 1

  // How fast the consecutive counter decays when no detection
  // 1 = instant reset (old behavior), 0.5 = gradual decay
  DECAY_RATE: 1,

  // Regions of Interest — TUNED thresholds to avoid false positives
  // Higher thresholds = less sensitive = fewer false alarms
  REGIONS: {
    left:   { x: 0,    y: 0.15, w: 0.15, h: 0.70, threshold: 0.16, label: 'Suspicious activity on left side' },   // was w:0.20, threshold:0.08
    right:  { x: 0.85, y: 0.15, w: 0.15, h: 0.70, threshold: 0.16, label: 'Suspicious activity on right side' },  // was x:0.80, w:0.20, threshold:0.08
    bottom: { x: 0.15, y: 0.75, w: 0.70, h: 0.25, threshold: 0.22, label: 'Suspicious activity below camera' },   // was x:0.10, y:0.70, w:0.80, h:0.30, threshold:0.10
    top:    { x: 0.15, y: 0,    w: 0.70, h: 0.12, threshold: 0.22, label: 'Suspicious activity above camera' },    // was x:0.10, w:0.80, h:0.15, threshold:0.10
  },

  // Center exclusion zone — the person's body area
  // Changes here are ignored (normal body movement)
  CENTER_EXCLUSION: { x: 0.20, y: 0.10, w: 0.60, h: 0.65 },

  // If face is currently detected, boost thresholds by this multiplier
  // Rationale: if face is visible, body movement is expected
  FACE_PRESENT_THRESHOLD_BOOST: 1.5,
};

// =============================================================================

class ProctoringService {
  constructor() {
    this.blazefaceModel = null;
    this.cocoSsdModel = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.loadError = null;

    this._canvas = null;
    this._ctx = null;

    // ─── Frame Change Detection State ─────────────────────────────────
    this._baselineFrames = [];
    this._baselineAvg = null;
    this._baselineReady = false;
    this._baselineCaptureCount = 0;
    this._baselineStartTime = null;
    this._analysisCanvas = null;
    this._analysisCtx = null;
    this._consecutiveDetections = {};
    for (const key of Object.keys(INTRUSION_CONFIG.REGIONS)) {
      this._consecutiveDetections[key] = 0;
    }
    this._cocoFrameCount = 0;
    this._intrusionFrameCount = 0;

    // ─── Face-aware suppression state ─────────────────────────────────
    this._lastFaceDetected = false;
    this._lastFaceTimestamp = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  async loadModels() {
    if (this.isLoaded) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    this.loadError = null;

    try {
      await tf.ready();
      console.log(`🧠 TF.js backend: ${tf.getBackend()}`);

      const [blaze, coco] = await Promise.all([
        blazeface.load({ maxFaces: 5 }),
        cocoSsd.load({ base: 'mobilenet_v2' }),
      ]);

      this.blazefaceModel = blaze;
      this.cocoSsdModel = coco;
      this.isLoaded = true;
      this.isLoading = false;

      console.log('✅ Proctoring models loaded (BlazeFace + COCO-SSD + Frame Change v5)');
      return true;
    } catch (error) {
      this.isLoading = false;
      this.loadError = error.message;
      console.error('❌ Failed to load proctoring models:', error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO READINESS
  // ═══════════════════════════════════════════════════════════════════════════

  _isVideoReady(videoElement) {
    if (!videoElement) return false;
    if (videoElement.readyState < 2) return false;
    if (!videoElement.videoWidth || !videoElement.videoHeight) return false;
    if (videoElement.paused && videoElement.currentTime === 0) return false;
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FACE-AWARE SUPPRESSION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Call this from the monitor after BlazeFace runs to update face state.
   * When a face is detected, intrusion thresholds are boosted to avoid
   * false positives from normal body movement.
   */
  updateFaceState(faceDetected) {
    this._lastFaceDetected = faceDetected;
    if (faceDetected) {
      this._lastFaceTimestamp = Date.now();
    }
  }

  /**
   * Returns true if a face was recently detected (within last 3 seconds).
   * Used to boost intrusion thresholds when the person is clearly present.
   */
  _isFaceRecentlyDetected() {
    if (this._lastFaceDetected) return true;
    // Consider face "recently detected" for 3 seconds after last detection
    return (Date.now() - this._lastFaceTimestamp) < 3000;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 3: FRAME CHANGE / INTRUSION DETECTION  ⭐ TUNED v5
  // ═══════════════════════════════════════════════════════════════════════════

  _ensureAnalysisCanvas() {
    if (!this._analysisCanvas) {
      this._analysisCanvas = document.createElement('canvas');
      this._analysisCanvas.width = INTRUSION_CONFIG.ANALYSIS_WIDTH;
      this._analysisCanvas.height = INTRUSION_CONFIG.ANALYSIS_HEIGHT;
      this._analysisCtx = this._analysisCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  /**
   * Capture a low-res grayscale frame for fast comparison.
   */
  _captureAnalysisFrame(videoElement) {
    this._ensureAnalysisCanvas();
    const w = INTRUSION_CONFIG.ANALYSIS_WIDTH;
    const h = INTRUSION_CONFIG.ANALYSIS_HEIGHT;

    this._analysisCtx.drawImage(videoElement, 0, 0, w, h);
    const imageData = this._analysisCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const idx = i * 4;
      gray[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    }
    return gray;
  }

  /**
   * Check if a pixel coordinate falls within the center exclusion zone.
   * The center zone covers the area where the person's body naturally is,
   * so changes there are expected and should be ignored.
   */
  _isInCenterExclusion(x, y) {
    const ce = INTRUSION_CONFIG.CENTER_EXCLUSION;
    const w = INTRUSION_CONFIG.ANALYSIS_WIDTH;
    const h = INTRUSION_CONFIG.ANALYSIS_HEIGHT;

    const ceStartX = Math.floor(ce.x * w);
    const ceStartY = Math.floor(ce.y * h);
    const ceEndX = Math.floor((ce.x + ce.w) * w);
    const ceEndY = Math.floor((ce.y + ce.h) * h);

    return x >= ceStartX && x < ceEndX && y >= ceStartY && y < ceEndY;
  }

  /**
   * Call this when monitoring starts. Begins collecting baseline frames.
   */
  startBaselineCapture() {
    this._baselineFrames = [];
    this._baselineAvg = null;
    this._baselineReady = false;
    this._baselineCaptureCount = 0;
    this._baselineStartTime = Date.now();
    this._lastFaceDetected = false;
    this._lastFaceTimestamp = 0;
    for (const key of Object.keys(this._consecutiveDetections)) {
      this._consecutiveDetections[key] = 0;
    }
    console.log(`📸 Baseline capture starting (${INTRUSION_CONFIG.BASELINE_FRAME_COUNT} frames after ${INTRUSION_CONFIG.BASELINE_DELAY_MS}ms)`);
  }

  /**
   * Feed frames to baseline builder. Returns true when ready.
   */
  _updateBaseline(videoElement) {
    if (this._baselineReady) return true;
    if (Date.now() - this._baselineStartTime < INTRUSION_CONFIG.BASELINE_DELAY_MS) return false;

    const frame = this._captureAnalysisFrame(videoElement);
    this._baselineFrames.push(frame);
    this._baselineCaptureCount++;

    if (this._baselineCaptureCount >= INTRUSION_CONFIG.BASELINE_FRAME_COUNT) {
      const w = INTRUSION_CONFIG.ANALYSIS_WIDTH;
      const h = INTRUSION_CONFIG.ANALYSIS_HEIGHT;
      this._baselineAvg = new Float32Array(w * h);

      for (let i = 0; i < w * h; i++) {
        let sum = 0;
        for (const f of this._baselineFrames) sum += f[i];
        this._baselineAvg[i] = sum / this._baselineFrames.length;
      }

      this._baselineReady = true;
      this._baselineFrames = [];
      console.log('✅ Baseline captured — intrusion detection ACTIVE');
      return true;
    }
    return false;
  }

  /**
   * Compare current frame to baseline, check ROIs for significant change.
   * Returns { detected, regions: [{name, label, changePercent}], baselineReady }
   *
   * v5 improvements:
   *   - Center exclusion zone: ignores pixels in the person's body area
   *   - Face-aware threshold boost: if face detected, higher thresholds
   *   - Slower decay of consecutive counter to prevent flicker
   *   - Higher base thresholds across all regions
   */
  detectIntrusion(videoElement) {
    if (!this._isVideoReady(videoElement)) {
      return { detected: false, regions: [], baselineReady: false };
    }

    if (!this._baselineReady) {
      this._updateBaseline(videoElement);
      return { detected: false, regions: [], baselineReady: false, building: true };
    }

    const currentFrame = this._captureAnalysisFrame(videoElement);
    this._intrusionFrameCount++;

    const w = INTRUSION_CONFIG.ANALYSIS_WIDTH;
    const h = INTRUSION_CONFIG.ANALYSIS_HEIGHT;
    const triggered = [];

    // Determine if face is present → boost thresholds
    const facePresent = this._isFaceRecentlyDetected();
    const thresholdMultiplier = facePresent ? INTRUSION_CONFIG.FACE_PRESENT_THRESHOLD_BOOST : 1.0;

    for (const [name, roi] of Object.entries(INTRUSION_CONFIG.REGIONS)) {
      const startX = Math.floor(roi.x * w);
      const startY = Math.floor(roi.y * h);
      const endX = Math.floor((roi.x + roi.w) * w);
      const endY = Math.floor((roi.y + roi.h) * h);

      let changedPixels = 0;
      let totalPixels = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          // Skip pixels in center exclusion zone (person's body area)
          if (this._isInCenterExclusion(x, y)) continue;

          const idx = y * w + x;
          const diff = Math.abs(currentFrame[idx] - this._baselineAvg[idx]);
          totalPixels++;
          if (diff > INTRUSION_CONFIG.PIXEL_DIFF_THRESHOLD) {
            changedPixels++;
          }
        }
      }

      const changePercent = totalPixels > 0 ? changedPixels / totalPixels : 0;

      // Apply face-aware threshold boost
      const effectiveThreshold = roi.threshold * thresholdMultiplier;
      const isTriggered = changePercent >= effectiveThreshold;

      if (isTriggered) {
        this._consecutiveDetections[name]++;
      } else {
        // Gradual decay instead of instant reset
        this._consecutiveDetections[name] = Math.max(
          0,
          this._consecutiveDetections[name] - INTRUSION_CONFIG.DECAY_RATE
        );
      }

      const isConfirmed = this._consecutiveDetections[name] >= INTRUSION_CONFIG.MIN_CONSECUTIVE_DETECTIONS;

      if (isConfirmed) {
        triggered.push({
          name,
          label: roi.label,
          changePercent: Math.round(changePercent * 100),
        });
      }

      if (DEBUG_INTRUSION && this._intrusionFrameCount % 10 === 0 && changePercent > 0.05) {
        console.log(
          `🔍 Region "${name}": ${Math.round(changePercent * 100)}% changed ` +
          `(need: ${Math.round(effectiveThreshold * 100)}%, consec: ${this._consecutiveDetections[name]}/${INTRUSION_CONFIG.MIN_CONSECUTIVE_DETECTIONS})` +
          `${facePresent ? ' [face-boost active]' : ''}`
        );
      }
    }

    if (triggered.length > 0 && DEBUG_INTRUSION) {
      console.log(`🚨 INTRUSION: ${triggered.map(t => `${t.name}(${t.changePercent}%)`).join(', ')}`);
    }

    return { detected: triggered.length > 0, regions: triggered, baselineReady: true };
  }

  /**
   * Gradually adapt baseline to lighting changes. Call every ~30s when clean.
   */
  refreshBaseline(videoElement) {
    if (!this._isVideoReady(videoElement) || !this._baselineReady) return;

    const currentFrame = this._captureAnalysisFrame(videoElement);
    const w = INTRUSION_CONFIG.ANALYSIS_WIDTH;
    const h = INTRUSION_CONFIG.ANALYSIS_HEIGHT;

    // Blend 80% old baseline + 20% current frame
    for (let i = 0; i < w * h; i++) {
      this._baselineAvg[i] = this._baselineAvg[i] * 0.8 + currentFrame[i] * 0.2;
    }
    console.log('🔄 Baseline refreshed');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 1: BLAZEFACE — Face Detection
  // ═══════════════════════════════════════════════════════════════════════════

  async detectFaces(videoElement) {
    if (!this.blazefaceModel) return { faceCount: 0, faces: [], pose: null };
    if (!this._isVideoReady(videoElement)) return { faceCount: 0, faces: [], pose: null, videoNotReady: true };

    try {
      const predictions = await this.blazefaceModel.estimateFaces(videoElement, false);
      const result = { faceCount: predictions.length, faces: predictions, pose: null };
      if (predictions.length === 1) {
        result.pose = this._estimatePose(predictions[0].landmarks, videoElement.videoWidth);
      }

      // Update face state for intrusion detection suppression
      this.updateFaceState(predictions.length >= 1);

      return result;
    } catch (error) {
      console.error('❌ BlazeFace error:', error);
      return { faceCount: -1, faces: [], pose: null, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 2: COCO-SSD — Object Detection (backup)
  // ═══════════════════════════════════════════════════════════════════════════

  async detectObjects(videoElement) {
    if (!this.cocoSsdModel) return { all: [], prohibited: [] };
    if (!this._isVideoReady(videoElement)) return { all: [], prohibited: [], videoNotReady: true };

    try {
      const predictions = await this.cocoSsdModel.detect(videoElement);
      this._cocoFrameCount++;

      if (DEBUG_COCO && predictions.length > 0) {
        const summary = predictions.map(p => `${p.class}(${Math.round(p.score * 100)}%)`).join(', ');
        console.log(`🔎 COCO-SSD #${this._cocoFrameCount}: [${summary}]`);
      }

      const prohibited = [];
      for (const pred of predictions) {
        const rule = PROHIBITED_OBJECTS[pred.class];
        if (rule && pred.score >= rule.confidence) {
          prohibited.push({ class: pred.class, score: pred.score, label: rule.label, bbox: pred.bbox });
        }
      }
      return { all: predictions, prohibited };
    } catch (error) {
      console.error('❌ COCO-SSD error:', error);
      return { all: [], prohibited: [], error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POSE ESTIMATION
  // ═══════════════════════════════════════════════════════════════════════════

  _estimatePose(landmarks, frameWidth) {
    if (!landmarks || landmarks.length < 6) {
      return { isLookingAway: false, direction: '', yawRatio: 1, pitchRatio: 1 };
    }
    const [rightEye, leftEye, nose, mouth, rightEar, leftEar] = landmarks;

    const noseToLeftEar = this._distance(nose, leftEar);
    const noseToRightEar = this._distance(nose, rightEar);
    const yawRatio = noseToLeftEar / (noseToRightEar + 0.001);

    let isYawTurned = false, yawDirection = '';
    if (yawRatio > POSE_THRESHOLDS.YAW_TURNED_RATIO) { isYawTurned = true; yawDirection = 'Head turned right'; }
    else if (yawRatio < POSE_THRESHOLDS.YAW_TURNED_RATIO_INV) { isYawTurned = true; yawDirection = 'Head turned left'; }

    const eyeMidY = (rightEye[1] + leftEye[1]) / 2;
    const pitchRatio = (nose[1] - eyeMidY) / (mouth[1] - nose[1] + 0.001);

    let isPitchTurned = false, pitchDirection = '';
    if (pitchRatio > POSE_THRESHOLDS.PITCH_DOWN_RATIO) { isPitchTurned = true; pitchDirection = 'Looking down'; }
    else if (pitchRatio < POSE_THRESHOLDS.PITCH_UP_RATIO) { isPitchTurned = true; pitchDirection = 'Looking up'; }

    const isLookingAway = isYawTurned || isPitchTurned;
    let direction = '';
    if (isYawTurned && isPitchTurned) direction = `${yawDirection} and ${pitchDirection.toLowerCase()}`;
    else if (isYawTurned) direction = yawDirection;
    else if (isPitchTurned) direction = pitchDirection;

    return { isLookingAway, direction, yawRatio: Math.round(yawRatio * 100) / 100, pitchRatio: Math.round(pitchRatio * 100) / 100 };
  }

  _distance(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FRAME CAPTURE (for server identity)
  // ═══════════════════════════════════════════════════════════════════════════

  captureFrame(videoElement, quality = 0.7) {
    if (!this._isVideoReady(videoElement)) return null;
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      this._ctx = this._canvas.getContext('2d', { willReadFrequently: true });
    }
    this._canvas.width = 320;
    this._canvas.height = 240;
    this._ctx.drawImage(videoElement, 0, 0, 320, 240);

    const imageData = this._ctx.getImageData(0, 0, 320, 240);
    let brightness = 0;
    for (let i = 0; i < imageData.data.length; i += 16) {
      brightness += imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
    }
    brightness /= (imageData.data.length / 16) * 3;
    if (brightness < 15) return null;

    return this._canvas.toDataURL('image/jpeg', quality);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  cleanup() {
    this.blazefaceModel = null;
    this.cocoSsdModel = null;
    this.isLoaded = false;
    this._canvas = null;
    this._ctx = null;
    this._analysisCanvas = null;
    this._analysisCtx = null;
    this._baselineFrames = [];
    this._baselineAvg = null;
    this._baselineReady = false;
    this._lastFaceDetected = false;
    this._lastFaceTimestamp = 0;
    this._cocoFrameCount = 0;
    this._intrusionFrameCount = 0;
    console.log('🧹 ProctoringService cleaned up');
  }
}

export default ProctoringService;