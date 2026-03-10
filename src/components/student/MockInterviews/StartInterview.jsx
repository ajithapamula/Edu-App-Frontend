import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  Mic,
  VolumeUp,
  Stop,
  Videocam,
  VideocamOff,
  Cameraswitch,
  Warning,
  MicOff,
  Refresh,
  Timer,
  Settings,
  Lightbulb,
  StopCircle,
  Headset,
  CheckCircle,
} from "@mui/icons-material";

import {
  createInterviewSession,
  testAPIConnection,
  createInterviewWebSocket,
  sendWebSocketMessage,
  closeWebSocket,
  getWebSocketState,
  processAudioForWebSocket,
} from "../../../services/API/index2";

// ============================================================================
// CONFIGURATION - UPDATED TIMING
// ============================================================================
const AUDIO_CONFIG = {
  SILENCE_THRESHOLD: 0.015,              // 0.04→0.015: Catches soft/low voice
  VOICE_DETECTION_SENSITIVITY: 0.75,     // 0.6→0.75: More sensitive to quiet speech
  SILENCE_DURATION: 8000,                // 5000→8000: 8s silence allows thinking pauses
  MAX_RECORDING_TIME: 600000,
  MIN_SPEECH_TIME: 300,                  // 500→300: Faster speech onset detection
  AI_PAUSE_DELAY: 3500,
  NO_VOICE_TIMEOUT: 45000,
  KEEPALIVE_INTERVAL: 25000,
  AUDIO_LEVEL_UPDATE_INTERVAL: 80,
  PLAYBACK_VOLUME: 0.9,
  AI_SPEECH_RATE: 1.0,
};

const WEBSOCKET_CONFIG = {
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 2000,
  CONNECTION_TIMEOUT: 15000,
  PING_INTERVAL: 30000,
};

// ============================================================================
// ROUND CONFIGURATION - UPDATED TIMING
// Communication: 10 min, Technical: 25 min, HR: 10 min
// ============================================================================
const ROUND_CONFIG = {
  introduction: {
    duration: 60,
    label: "Introduction",
    icon: "👋",
    description: "Welcome and interview overview",
  },
  communication: {
    duration: 300,
    label: "Communication",
    icon: "🗣️",
    description: "Clarity, articulation, and confidence",
  },
  technical: {
    duration: 1500,
    label: "Technical",
    icon: "💻",
    description: "Problem-solving and conceptual understanding",
  },
  hr: {
    duration: 600,
    label: "HR/Behavioral",
    icon: "🤝",
    description: "Leadership, ethics, and professionalism",
  },
};

const MAIN_ROUNDS = ["communication", "technical", "hr"];

// ============================================================================
// VOICE ACTIVITY DETECTION (VAD) CONFIGURATION
// ============================================================================
const VAD_CONFIG = {
  VOICE_FREQ_LOW: 85,
  VOICE_FREQ_HIGH: 3500,
  VOICE_ENERGY_THRESHOLD: 0.045,          // KEY: High enough to reject noise, low enough for soft voice
  SPECTRAL_FLATNESS_THRESHOLD: 0.32,      // KEY: Tighter — noise is spectrally flat (>0.4), voice is not (<0.3)
  SPECTRAL_CENTROID_MAX_HZ: 3200,
  CONSECUTIVE_VOICE_FRAMES: 4,            // KEY: Need 4 consecutive voice frames — noise won't sustain this pattern
  CONSECUTIVE_SILENCE_FRAMES: 60,         // 30→60: ~3s before declaring voice stopped — brief pauses between sentences stay "active"
  NOISE_FLOOR_LEARNING_FRAMES: 25,        // 15→25: Longer calibration = better noise baseline
  NOISE_FLOOR_ADAPTATION_RATE: 0.005,     // 0.01→0.005: Slower — doesn't absorb speech into noise floor
  NOISE_FLOOR_MARGIN: 2.5,               // KEY: Voice must be 2.5x above noise floor (rejects ambient noise)
  ENERGY_VARIANCE_MIN: 0.002,             // KEY: Noise has low variance, voice has high — this rejects steady noise
  ENERGY_VARIANCE_WINDOW: 20,
  POST_AI_GRACE_FRAMES: 40,
  POST_AI_CONFIDENCE_THRESHOLD: 0.45,
      POST_AI_NOISE_FLOOR_SCALE: 0.55,
  POST_AI_DEAF_PERIOD_MS: 1500,
  FLATNESS_HARD_REJECT: 0.42,  // KEY: Absolute hard reject for high flatness — this kills noise that passes energy threshold
};

// ============================================================================
// SILENCE DETECTION CONFIGURATION
// ============================================================================
const SILENCE_CONFIG = {
  SILENCE_DURATION_BY_ROUND: {
    introduction: 3000,
    communication: 3000,
    technical: 3000,
    hr: 3000,
  },
  SILENCE_DURATION_MS: 3000,

 MIN_SPEECH_DURATION_BY_ROUND: {
    introduction: 1000,
    communication: 1000,
    technical: 1000,
    hr: 1000,
  },
  MIN_SPEECH_DURATION_MS: 1000,

  MIN_VOICE_FRAMES_BY_ROUND: {
    introduction: 40,
    communication: 40,
    technical: 40,
    hr: 40,
  },

  SMOOTHING_WINDOW: 100,
  SILENCE_THRESHOLD_ABSOLUTE: 0.015,
};

// ============================================================================
// AI AVATAR COMPONENT
// ============================================================================
const AIAvatar = ({ isPlaying, isListening, isWaiting, size = 56 }) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(0);
 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = size * 2;
    const h = size * 2;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = w * 0.3;

    const draw = () => {
      phaseRef.current += 0.04;
      const t = phaseRef.current;
      ctx.clearRect(0, 0, w, h);

      const glowColor = isPlaying
        ? "rgba(99, 102, 241, 0.15)"
        : isListening
          ? "rgba(34, 197, 94, 0.15)"
          : isWaiting
            ? "rgba(34, 197, 94, 0.1)"
            : "rgba(100, 116, 139, 0.1)";
      const glowRadius =
        baseRadius +
        (isPlaying
          ? 12 + Math.sin(t * 2) * 8
          : isListening
            ? 8 + Math.sin(t * 1.5) * 4
            : 6);
      const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, glowRadius + 20);
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius + 20, 0, Math.PI * 2);
      ctx.fill();

      if (isPlaying) {
        for (let i = 0; i < 3; i++) {
          const wavePhase = (t * 1.5 + i * 2.1) % (Math.PI * 2);
          const waveRadius = baseRadius + 10 + (wavePhase / (Math.PI * 2)) * 30;
          const waveAlpha = Math.max(0, 0.4 - (wavePhase / (Math.PI * 2)) * 0.4);
          ctx.strokeStyle = `rgba(99, 102, 241, ${waveAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const mainGrad = ctx.createRadialGradient(cx - baseRadius * 0.3, cy - baseRadius * 0.3, 0, cx, cy, baseRadius);
      if (isPlaying) {
        mainGrad.addColorStop(0, "#818cf8");
        mainGrad.addColorStop(0.5, "#6366f1");
        mainGrad.addColorStop(1, "#4f46e5");
      } else if (isListening) {
        mainGrad.addColorStop(0, "#4ade80");
        mainGrad.addColorStop(0.5, "#22c55e");
        mainGrad.addColorStop(1, "#16a34a");
      } else if (isWaiting) {
        mainGrad.addColorStop(0, "#86efac");
        mainGrad.addColorStop(0.5, "#4ade80");
        mainGrad.addColorStop(1, "#22c55e");
      } else {
        mainGrad.addColorStop(0, "#94a3b8");
        mainGrad.addColorStop(0.5, "#64748b");
        mainGrad.addColorStop(1, "#475569");
      }
      ctx.fillStyle = mainGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      const highlightGrad = ctx.createRadialGradient(cx - baseRadius * 0.25, cy - baseRadius * 0.3, 0, cx, cy, baseRadius * 0.8);
      highlightGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
      highlightGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      const eyeY = cy - baseRadius * 0.12;
      const eyeSpacing = baseRadius * 0.28;
      const eyeRadius = baseRadius * 0.08;
      const blinkCycle = Math.sin(t * 0.5);
      const eyeScaleY = blinkCycle < -0.92 ? 0.1 : 1;

      ctx.fillStyle = "#fff";
      ctx.save();
      ctx.translate(cx - eyeSpacing, eyeY);
      ctx.scale(1, eyeScaleY);
      ctx.beginPath();
      ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx + eyeSpacing, eyeY);
      ctx.scale(1, eyeScaleY);
      ctx.beginPath();
      ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const pupilOffset = Math.sin(t * 0.3) * 1.5;
      const pupilRadius = eyeRadius * 0.5;
      ctx.fillStyle = "#1e1b4b";
      if (eyeScaleY > 0.5) {
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + pupilOffset, eyeY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing + pupilOffset, eyeY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      const mouthY = cy + baseRadius * 0.22;
      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      if (isPlaying) {
        const mouthOpen = Math.abs(Math.sin(t * 4)) * baseRadius * 0.15 + baseRadius * 0.03;
        const mouthWidth = baseRadius * 0.25;
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, mouthWidth, mouthOpen, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#4338ca";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.stroke();
      } else if (isListening || isWaiting) {
        const mouthWidth = baseRadius * 0.12 + Math.sin(t * 1.5) * baseRadius * 0.03;
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, mouthWidth, baseRadius * 0.06, 0, 0, Math.PI * 2);
        ctx.fillStyle = isListening ? "#15803d" : "#166534";
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(cx, mouthY - baseRadius * 0.05, baseRadius * 0.18, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isListening, isWaiting, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size * 2, height: size * 2, display: "block", margin: "0 auto" }}
    />
  );
};

// ============================================================================
// VOICE ACTIVITY DETECTOR CLASS
// ============================================================================
class VoiceActivityDetector {
  constructor(analyserNode, sampleRate) {
    this.analyser = analyserNode;
    this.sampleRate = sampleRate;
    this.fftSize = analyserNode.fftSize;
    this.binCount = analyserNode.frequencyBinCount;
    this.binResolution = sampleRate / this.fftSize;

    this.voiceLowBin = Math.max(1, Math.floor(VAD_CONFIG.VOICE_FREQ_LOW / this.binResolution));
    this.voiceHighBin = Math.min(this.binCount - 1, Math.ceil(VAD_CONFIG.VOICE_FREQ_HIGH / this.binResolution));

    this.frequencyData = new Uint8Array(this.binCount);
    this.timeData = new Uint8Array(this.fftSize);

    this.noiseFloor = new Float32Array(this.binCount).fill(0);
    this.noiseFloorInitialized = false;
    this.frameCount = 0;

    this.consecutiveVoiceFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.isVoiceActive = false;

    this.voiceEnergyHistory = [];
    this.maxHistoryLength = 10;

    this.recentEnergyValues = [];
    this.energyVarianceWindow = VAD_CONFIG.ENERGY_VARIANCE_WINDOW || 15;

    this.postAIGraceRemaining = 0;
    this.inPostAIGrace = false;
    this.roundBaselineNoiseFloor = null;

    console.log(
      `[VAD] Initialized: sampleRate=${sampleRate}, fftSize=${this.fftSize}, ` +
        `binResolution=${this.binResolution.toFixed(1)}Hz, ` +
        `voiceBins=${this.voiceLowBin}-${this.voiceHighBin} ` +
        `(${(this.voiceLowBin * this.binResolution).toFixed(0)}Hz-${(this.voiceHighBin * this.binResolution).toFixed(0)}Hz)`,
    );
  }

  analyze() {
    if (!this.analyser) {
      return { isVoice: false, voiceEnergy: 0, noiseEnergy: 0, confidence: 0, rawLevel: 0 };
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.frameCount++;

    if (this.postAIGraceRemaining > 0) {
      this.postAIGraceRemaining--;
      if (this.postAIGraceRemaining === 0) {
        this.inPostAIGrace = false;
        console.log("[VAD] Post-AI grace period ended, normal detection resumed");
      }
    }

    let voiceBandSum = 0;
    let voiceBandCount = 0;
    let voiceBandMax = 0;
    for (let i = this.voiceLowBin; i <= this.voiceHighBin; i++) {
      const val = this.frequencyData[i] / 255;
      voiceBandSum += val;
      voiceBandCount++;
      if (val > voiceBandMax) voiceBandMax = val;
    }
    const voiceBandAvg = voiceBandCount > 0 ? voiceBandSum / voiceBandCount : 0;

    let nonVoiceSum = 0;
    let nonVoiceCount = 0;
    for (let i = 0; i < this.binCount; i++) {
      if (i < this.voiceLowBin || i > this.voiceHighBin) {
        nonVoiceSum += this.frequencyData[i] / 255;
        nonVoiceCount++;
      }
    }
    const nonVoiceAvg = nonVoiceCount > 0 ? nonVoiceSum / nonVoiceCount : 0;

    let totalSum = 0;
    for (let i = 0; i < this.binCount; i++) {
      totalSum += this.frequencyData[i] / 255;
    }
    const rawLevel = totalSum / this.binCount;

    if (this.frameCount <= VAD_CONFIG.NOISE_FLOOR_LEARNING_FRAMES) {
      for (let i = this.voiceLowBin; i <= this.voiceHighBin; i++) {
        const val = this.frequencyData[i] / 255;
        this.noiseFloor[i] = this.noiseFloor[i] + (val - this.noiseFloor[i]) / this.frameCount;
      }
    if (this.frameCount === VAD_CONFIG.NOISE_FLOOR_LEARNING_FRAMES) {
        this.noiseFloorInitialized = true;
        const avgNoise = this.noiseFloor.slice(this.voiceLowBin, this.voiceHighBin + 1).reduce((a, b) => a + b, 0) / voiceBandCount;
        console.log(`[VAD] Noise floor learned: avg=${avgNoise.toFixed(4)} over ${VAD_CONFIG.NOISE_FLOOR_LEARNING_FRAMES} frames`);
        if (!this.roundBaselineNoiseFloor) {
          this.roundBaselineNoiseFloor = new Float32Array(this.noiseFloor);
          console.log(`[VAD] Round baseline noise floor SAVED (avg=${avgNoise.toFixed(4)})`);
        }
      }

      if (!this.noiseFloorInitialized) {
        const absoluteVoice = voiceBandAvg > 0.15 && voiceBandMax > 0.30;
        if (absoluteVoice) {
          this.consecutiveVoiceFrames++;
          this.consecutiveSilenceFrames = 0;
          if (this.consecutiveVoiceFrames >= VAD_CONFIG.CONSECUTIVE_VOICE_FRAMES) {
            this.isVoiceActive = true;
            console.log(`[VAD] Voice detected during learning phase (absolute threshold, avg=${voiceBandAvg.toFixed(3)}, max=${voiceBandMax.toFixed(3)})`);
          }
        } else {
          this.consecutiveSilenceFrames++;
          this.consecutiveVoiceFrames = 0;
        }
        return {
          isVoice: this.isVoiceActive, voiceEnergy: voiceBandAvg, noiseEnergy: nonVoiceAvg,
          confidence: absoluteVoice ? 0.6 : 0, rawLevel: this.isVoiceActive ? voiceBandAvg : 0, inGracePeriod: this.inPostAIGrace,
        };
      }
    }

    if (!this.isVoiceActive) {
      for (let i = this.voiceLowBin; i <= this.voiceHighBin; i++) {
        const val = this.frequencyData[i] / 255;
        this.noiseFloor[i] = this.noiseFloor[i] * (1 - VAD_CONFIG.NOISE_FLOOR_ADAPTATION_RATE) + val * VAD_CONFIG.NOISE_FLOOR_ADAPTATION_RATE;
      }
    }

    const effectiveMargin = this.inPostAIGrace ? 1.5 : VAD_CONFIG.NOISE_FLOOR_MARGIN;
    let voiceAboveNoiseSum = 0;
    let voiceAboveNoiseCount = 0;
    for (let i = this.voiceLowBin; i <= this.voiceHighBin; i++) {
      const val = this.frequencyData[i] / 255;
      const noiseLevel = this.noiseFloor[i] * effectiveMargin;
      if (val > noiseLevel) {
        voiceAboveNoiseSum += val - this.noiseFloor[i];
        voiceAboveNoiseCount++;
      }
    }
    const voiceAboveNoise = voiceBandCount > 0 ? voiceAboveNoiseSum / voiceBandCount : 0;

    let logSum = 0;
    let linSum = 0;
    let validBins = 0;
    for (let i = this.voiceLowBin; i <= this.voiceHighBin; i++) {
      const val = Math.max(this.frequencyData[i] / 255, 0.0001);
      logSum += Math.log(val);
      linSum += val;
      validBins++;
    }
    const geometricMean = Math.exp(logSum / validBins);
    const arithmeticMean = linSum / validBins;
    const spectralFlatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 1;

    let weightedFreqSum = 0;
    let magnitudeSum = 0;
    for (let i = this.voiceLowBin; i <= this.voiceHighBin; i++) {
      const mag = this.frequencyData[i] / 255;
      const freq = i * this.binResolution;
      weightedFreqSum += freq * mag;
      magnitudeSum += mag;
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedFreqSum / magnitudeSum : 0;

    const vnr = nonVoiceAvg > 0.001 ? voiceBandAvg / nonVoiceAvg : voiceBandAvg * 100;

    this.recentEnergyValues.push(voiceBandAvg);
    if (this.recentEnergyValues.length > this.energyVarianceWindow) this.recentEnergyValues.shift();
    let energyVariance = 0;
    if (this.recentEnergyValues.length >= 5) {
      const mean = this.recentEnergyValues.reduce((a, b) => a + b, 0) / this.recentEnergyValues.length;
      energyVariance = this.recentEnergyValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / this.recentEnergyValues.length;
    }
    const variancePass = energyVariance > (VAD_CONFIG.ENERGY_VARIANCE_MIN || 0.003);

    const effectiveEnergyThreshold = this.inPostAIGrace ? VAD_CONFIG.VOICE_ENERGY_THRESHOLD * 0.5 : VAD_CONFIG.VOICE_ENERGY_THRESHOLD;
    const energyPass = voiceAboveNoise > effectiveEnergyThreshold;
    const flatnessPass = spectralFlatness < VAD_CONFIG.SPECTRAL_FLATNESS_THRESHOLD;
    const centroidPass = spectralCentroid > 0 && spectralCentroid < VAD_CONFIG.SPECTRAL_CENTROID_MAX_HZ;
    const vnrPass = vnr > 2.0;

    let confidence = 0;
    if (energyPass) confidence += 0.25;
    if (flatnessPass) confidence += 0.15;
    if (centroidPass) confidence += 0.1;
    if (vnrPass) confidence += 0.2;

    if (this.inPostAIGrace) {
      if (voiceBandAvg > 0.08 && voiceBandMax > 0.15) confidence += 0.3;
    } else {
      if (variancePass) confidence += 0.3;
    }

    // ===== FIX: ENERGY GATE — zero voice energy = cannot be voice =====
    // Without this, ambient noise (fan/AC) scores 0.75 on spectral features
    // alone (flatness+centroid+vnr+variance), causing constant false positives.
    if (!energyPass && !this.inPostAIGrace) {
      confidence = Math.min(confidence, 0.35);
    }

    // ===== NOISE DOMINANCE CHECK =====
    // If non-voice bands have MORE energy than voice band, it's environmental
// ===== NOISE DOMINANCE CHECK =====
    // If non-voice bands have MORE energy than voice band, it's environmental
    // noise (fan hum <85Hz, electronic hiss >3500Hz), not human speech.
    // Human voice concentrates energy IN the voice band (VNR > 2).
    if (!this.inPostAIGrace && nonVoiceAvg > 0.01) {
      if (vnr < 1.2) {
        // Noise dominates — hard cap
        confidence = Math.min(confidence, 0.25);
      } else if (vnr < 1.8) {
        // Noise is close to voice level — soft penalty
        confidence *= 0.7;
      }
    }

    // ===== FLATNESS HARD GATE — THE NOISE KILLER =====
    // From your logs:  NOISE = flatness 0.65-0.99,  VOICE = flatness 0.03-0.30
    // Without this, noise scores 0.65+ confidence and triggers "Voice resumed"
    // every few seconds, resetting the silence timer forever.
      const flatnessReject = VAD_CONFIG.FLATNESS_HARD_REJECT || 0.55;
    if (!this.inPostAIGrace && spectralFlatness > flatnessReject) {
      confidence = Math.min(confidence, 0.15);
    }

    this.voiceEnergyHistory.push(confidence);
    if (this.voiceEnergyHistory.length > this.maxHistoryLength) this.voiceEnergyHistory.shift();
    const smoothedConfidence = this.voiceEnergyHistory.reduce((a, b) => a + b, 0) / this.voiceEnergyHistory.length;

    const effectiveConfidenceThreshold = this.inPostAIGrace ? (VAD_CONFIG.POST_AI_CONFIDENCE_THRESHOLD || 0.3) : 0.5;
    const voiceDetected = smoothedConfidence >= effectiveConfidenceThreshold;
    if (voiceDetected) {
      this.consecutiveVoiceFrames++;
      this.consecutiveSilenceFrames = 0;
    } else {
      this.consecutiveSilenceFrames++;
      this.consecutiveVoiceFrames = 0;
    }

    const effectiveConsecutiveFrames = this.inPostAIGrace
      ? Math.max(3, Math.floor(VAD_CONFIG.CONSECUTIVE_VOICE_FRAMES / 2))
      : VAD_CONFIG.CONSECUTIVE_VOICE_FRAMES;

    if (!this.isVoiceActive && this.consecutiveVoiceFrames >= effectiveConsecutiveFrames) {
      this.isVoiceActive = true;
      console.log(`[VAD] Voice STARTED (confidence=${smoothedConfidence.toFixed(2)}, threshold=${effectiveConfidenceThreshold}, energy=${voiceAboveNoise.toFixed(3)}, flatness=${spectralFlatness.toFixed(2)}, centroid=${spectralCentroid.toFixed(0)}Hz, grace=${this.inPostAIGrace})`);
    } else if (this.isVoiceActive && this.consecutiveSilenceFrames >= VAD_CONFIG.CONSECUTIVE_SILENCE_FRAMES) {
      this.isVoiceActive = false;
      console.log(`[VAD] Voice STOPPED (confidence=${smoothedConfidence.toFixed(2)}, silence frames=${this.consecutiveSilenceFrames})`);
    }

    return {
      isVoice: this.isVoiceActive, voiceEnergy: voiceAboveNoise, noiseEnergy: nonVoiceAvg,
      confidence: smoothedConfidence, rawLevel: this.isVoiceActive ? voiceBandAvg : 0,
      spectralFlatness, spectralCentroid, vnr, energyVariance, variancePass, inGracePeriod: this.inPostAIGrace,
    };
  }

  reset() {
    this.consecutiveVoiceFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.isVoiceActive = false;
    this.voiceEnergyHistory = [];
    this.recentEnergyValues = [];
  }

  resetNoiseFloor() {
    this.noiseFloor.fill(0);
    this.noiseFloorInitialized = false;
    this.frameCount = 0;
    this.postAIGraceRemaining = 0;
    this.inPostAIGrace = false;
    this.roundBaselineNoiseFloor = null;
    this.reset();
  }

softResetAfterAI() {
    if (this.roundBaselineNoiseFloor) {
      this.noiseFloor.set(this.roundBaselineNoiseFloor);
      console.log("[VAD] Restored round baseline noise floor (golden copy)");
    } else {
      const MIN_NOISE_FLOOR = 0.02;
      for (let i = this.voiceLowBin; i <= this.voiceHighBin; i++) {
        this.noiseFloor[i] = Math.max(this.noiseFloor[i] * 0.55, MIN_NOISE_FLOOR);
      }
      console.log("[VAD] No baseline saved — fallback to 55% scale");
    }
    this.frameCount = Math.max(0, VAD_CONFIG.NOISE_FLOOR_LEARNING_FRAMES - 8);
    this.noiseFloorInitialized = true;
    this.consecutiveVoiceFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.isVoiceActive = false;
    this.voiceEnergyHistory = [];
    this.recentEnergyValues = [];
    this.postAIGraceRemaining = VAD_CONFIG.POST_AI_GRACE_FRAMES || 40;
    this.inPostAIGrace = true;
    const avgFloor = this.noiseFloor.slice(this.voiceLowBin, this.voiceHighBin + 1).reduce((a, b) => a + b, 0) / Math.max(1, this.voiceHighBin - this.voiceLowBin + 1);
    console.log(`[VAD] Soft reset after AI speech — avgFloor=${avgFloor.toFixed(4)}, grace: ${this.postAIGraceRemaining} frames`);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const StartInterview = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const initialTestId = location.state?.testId || urlParams.get("testId");
  const initialStudentName = location.state?.studentName || urlParams.get("studentName") || "Candidate";

  // Core states
  const [testId, setTestId] = useState(initialTestId);
  const [studentName, setStudentName] = useState(initialStudentName);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
   const lastHumanVoiceTimeRef = useRef(null);
  // Connection states
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [systemReady, setSystemReady] = useState(false);

  // Interview states
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentStage, setCurrentStage] = useState("introduction");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(ROUND_CONFIG.introduction.duration);
  const [currentDifficulty, setCurrentDifficulty] = useState("medium");
  const [introductionCompleted, setIntroductionCompleted] = useState(false);

  // Audio states
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [noVoiceTimer, setNoVoiceTimer] = useState(0);
  const [showHeadphoneWarning, setShowHeadphoneWarning] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [aiSpeechProgress, setAiSpeechProgress] = useState(0);
  const [waitingForVoice, setWaitingForVoice] = useState(false);

  const [voiceConfidence, setVoiceConfidence] = useState(0);
  const [isWaitingForCheckinResponse, setIsWaitingForCheckinResponse] = useState(false);

  const [availableMicrophones, setAvailableMicrophones] = useState([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState("");

  // Camera states
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);

  // UI states
  const [isEndingInterview, setIsEndingInterview] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showRoundTransition, setShowRoundTransition] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");

  // ===== BIOMETRIC PROCTORING STATES =====
  const [proctorWarnings, setProctorWarnings] = useState([]);  // {type, message, timestamp}
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationMessage, setTerminationMessage] = useState("");
  const proctorIntervalRef = useRef(null);
  // Refs
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const noVoiceTimeoutRef = useRef(null);
  const audioChunksRef = useRef([]);
  const animationFrameRef = useRef(null);
  const silenceDetectionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const videoStreamRef = useRef(null);
  const audioQueueRef = useRef([]);
  const currentAudioRef = useRef(null);
  const gainNodeRef = useRef(null);
  const isPlayingAudioRef = useRef(false);
  const didInitRef = useRef(false);
  const awaitingNextQuestionRef = useRef(false);
 const awaitingServerAnswerRef = useRef(false);
  const maxRecordingTimeoutRef = useRef(null);

  const audioSourceNodeRef = useRef(null);
  const selectedMicrophoneRef = useRef("");

  // Voice Activity Detector ref
  const vadRef = useRef(null);

  // ===== FIX A (NEW): AI-playing watchdog ref =====
  // Detects when isAIPlaying is stuck true but no audio is actually playing.
  // This prevents the deadlock where handleSilencePrompt sets isAIPlaying=true
  // but no TTS audio ever arrives.
  const aiPlayingWatchdogRef = useRef(null);

  // Question tracking refs
  const localQuestionCountRef = useRef({ communication: 0, technical: 0, hr: 0 });
  const roundQuestionCountRef = useRef({ communication: 0, technical: 0, hr: 0 });
  const lastQuestionTextRef = useRef("");
  const lastBackendQuestionNumberRef = useRef({ communication: 0, technical: 0, hr: 0 });

  // State sync refs
  const interviewStartedRef = useRef(false);
  const isConnectedRef = useRef(false);
  const waitingForVoiceRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isAIPlayingRef = useRef(false);
  const currentStageRef = useRef("introduction");

  useEffect(() => {
    interviewStartedRef.current = interviewStarted;
    isConnectedRef.current = isConnected;
    waitingForVoiceRef.current = waitingForVoice;
    isRecordingRef.current = isRecording;
    isAIPlayingRef.current = isAIPlaying;
    currentStageRef.current = currentStage;
  }, [interviewStarted, isConnected, waitingForVoice, isRecording, isAIPlaying, currentStage]);

  useEffect(() => {
    selectedMicrophoneRef.current = selectedMicrophone;
  }, [selectedMicrophone]);

  // Timer countdown
  useEffect(() => {
    if (!interviewStarted || !isConnected) return;
    const timerInterval = setInterval(() => {
      setTimeRemaining((prev) => prev <= 0 ? (clearInterval(timerInterval), 0) : prev - 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [interviewStarted, isConnected, currentStage]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (!window.location.search.includes("skip_headphone_check")) {
      setShowHeadphoneWarning(true);
      return;
    }
    initializeCompleteSystem();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;
    const handleDeviceChange = async () => {
      console.log("[Audio Devices] Device change detected, re-enumerating...");
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === "audioinput");
        setAvailableMicrophones(mics);
        const currentMicId = selectedMicrophoneRef.current;
        if (currentMicId && !mics.find((m) => m.deviceId === currentMicId)) {
          console.log("[Audio Devices] Current mic disconnected, switching to default...");
          const newMicId = mics.length > 0 ? mics[0].deviceId : "";
          setSelectedMicrophone(newMicId);
          if (!isRecordingRef.current && !isAIPlayingRef.current) {
            await setupEnhancedAudioSystem(newMicId);
          }
        }
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setAvailableCameras(videoDevices);
      } catch (err) {
        console.warn("[Audio Devices] Error:", err);
      }
    };
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
  }, []);

  // Helper functions
  const waitForAudioReady = async (retries = 15, delay = 120) => {
    for (let i = 0; i < retries; i++) {
      const ctx = audioContextRef.current;
      const ready = analyserRef.current && streamRef.current?.active && ctx &&
        (ctx.state === "running" || (await ctx.resume(), ctx.state === "running"));
      if (ready) return true;
      await new Promise((r) => setTimeout(r, delay));
    }
    return false;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isCheckInQuestion = (text) => {
    if (!text) return false;
    const checkInIndicators = [
      "want to", "anything else", "ready to", "should we",
      "can you", "would you like", "is there more", "move on",
      "elaborate", "add more", "tell me more", "that's all",
    ];
    return checkInIndicators.some(indicator => text.toLowerCase().includes(indicator));
  };

  const getCurrentRoundIndex = () => {
    const index = MAIN_ROUNDS.indexOf(currentStage);
    return index >= 0 ? index : -1;
  };

  const getMicrophoneDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];
      let devices = await navigator.mediaDevices.enumerateDevices();
      let audioDevices = devices.filter((d) => d.kind === "audioinput");
      setAvailableMicrophones(audioDevices);
      if (audioDevices.length > 0 && !selectedMicrophoneRef.current) {
        const preferred = selectPreferredMicrophone(audioDevices);
        setSelectedMicrophone(preferred.deviceId);
      }
      return audioDevices;
    } catch (error) {
      console.warn("[Audio Devices] Error:", error);
      return [];
    }
  };

  const selectPreferredMicrophone = (devices) => {
    if (!devices || devices.length === 0) return { deviceId: "", label: "default" };
    const priorityKeywords = [
      { keywords: ["bluetooth", "bt ", "airpod", "buds", "jbl", "sony", "bose", "beats"], priority: 4 },
      { keywords: ["usb", "external"], priority: 3 },
      { keywords: ["headset", "headphone", "earphone", "earbuds", "wired", "hands-free", "handsfree"], priority: 2 },
      { keywords: ["default", "communications"], priority: 1 },
    ];
    let bestDevice = devices[0];
    let bestPriority = 0;
    for (const device of devices) {
      const label = (device.label || "").toLowerCase();
      for (const { keywords, priority } of priorityKeywords) {
        if (keywords.some((kw) => label.includes(kw)) && priority > bestPriority) {
          bestDevice = device;
          bestPriority = priority;
        }
      }
    }
    return bestDevice;
  };

  // System initialization
  const initializeCompleteSystem = async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      await checkBackendConnection();
      await handleSessionCreation();
      await setupMediaSystems();
      await initializeWebSocketConnection();
      setSystemReady(true);
    } catch (error) {
      setConnectionError(`System initialization failed: ${error.message}`);
      setIsConnecting(false);
    }
  };

  const checkBackendConnection = async () => {
    const connectionTest = await testAPIConnection();
    if (connectionTest.status !== "success") throw new Error(connectionTest.message || "Backend connection failed");
  };

  const handleSessionCreation = async () => {
    if (currentSessionId && testId) return;
    if (currentSessionId && !testId) return;
    const sessionData = await createInterviewSession();
    if (!sessionData.sessionId || !sessionData.testId) throw new Error("Invalid session data");
    setCurrentSessionId(sessionData.sessionId);
    setTestId(sessionData.testId);
    setStudentName(sessionData.studentName || "Candidate");
    window.history.replaceState(
      { testId: sessionData.testId, studentName: sessionData.studentName },
      "",
      `/student/mock-interviews/session/${sessionData.sessionId}`,
    );
  };

  const setupMediaSystems = async () => {
    try { await getCameraDevices(); } catch (e) { setCameraError("Camera unavailable"); }
    await getMicrophoneDevices();
    await setupEnhancedAudioSystem();
  };

  // =========================================================================
  // Audio system setup
  // =========================================================================
  const setupEnhancedAudioSystem = async (micDeviceId = null) => {
    try {
      setAudioInitialized(false);

      if (audioSourceNodeRef.current) {
        try { audioSourceNodeRef.current.disconnect(); } catch (_) {}
        audioSourceNodeRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      vadRef.current = null;
      await new Promise((resolve) => setTimeout(resolve, 150));

      const targetMicId = micDeviceId || selectedMicrophoneRef.current || "";

      const buildAudioConstraints = (deviceId) => {
        const constraints = {
          echoCancellation: true,              // ideal→true: FORCE echo cancellation (prevents AI voice feedback)
          noiseSuppression: true,              // ideal→true: FORCE noise suppression (kills background noise at browser level)
          autoGainControl: true,               // ideal→true: FORCE auto gain (boosts soft voice automatically)
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },        // 44100→48000: Better quality capture
          latency: { ideal: 0.01 },            // Low latency for responsive detection
        };
        if (deviceId) constraints.deviceId = { exact: deviceId };
        return constraints;
      };

      let stream = null;
      const attempts = [
        () => navigator.mediaDevices.getUserMedia({ audio: buildAudioConstraints(targetMicId), video: false }),
        () => navigator.mediaDevices.getUserMedia({ audio: targetMicId ? { deviceId: { exact: targetMicId } } : true, video: false }),
        () => navigator.mediaDevices.getUserMedia({ audio: buildAudioConstraints(null), video: false }),
        () => navigator.mediaDevices.getUserMedia({ audio: true, video: false }),
      ];

      for (let i = 0; i < attempts.length; i++) {
        try {
          stream = await attempts[i]();
          if (stream && stream.getAudioTracks().length > 0) {
            console.log("[Audio Setup] Success on attempt", i + 1, "- Track:", stream.getAudioTracks()[0].label);
            break;
          }
        } catch (err) {
          console.warn("[Audio Setup] Attempt", i + 1, "failed:", err.name);
          stream = null;
          if (err.name === "NotAllowedError") throw new Error("Microphone permission denied.");
        }
      }

      if (!stream || stream.getAudioTracks().length === 0) throw new Error("Could not access any microphone.");
      streamRef.current = stream;

      const streamSampleRate = stream.getAudioTracks()[0].getSettings().sampleRate;
      const contextOptions = { latencyHint: "interactive" };
      if (streamSampleRate && streamSampleRate >= 8000 && streamSampleRate <= 96000) {
        contextOptions.sampleRate = streamSampleRate;
      }

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
      if (audioContextRef.current.state === "suspended") await audioContextRef.current.resume();

      const actualSampleRate = audioContextRef.current.sampleRate;
      console.log("[Audio Setup] AudioContext sampleRate:", actualSampleRate);

      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.setValueAtTime(AUDIO_CONFIG.PLAYBACK_VOLUME, audioContextRef.current.currentTime);
      gainNodeRef.current.connect(audioContextRef.current.destination);

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = actualSampleRate <= 16000 ? 1024 : 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      audioSourceNodeRef.current = source;

      vadRef.current = new VoiceActivityDetector(analyserRef.current, actualSampleRate);
      console.log("[Audio Setup] Voice Activity Detector initialized");

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === "audioinput");
        setAvailableMicrophones(mics);
        const activeDeviceId = stream.getAudioTracks()[0].getSettings().deviceId;
        if (activeDeviceId) setSelectedMicrophone(activeDeviceId);
      } catch (_) {}

      setAudioInitialized(true);
      console.log("[Audio Setup] Complete with VAD");
    } catch (error) {
      setAudioInitialized(false);
      console.error("[Audio Setup] Failed:", error);
      throw new Error(`Audio setup failed: ${error.message}`);
    }
  };

  // WebSocket
  const initializeWebSocketConnection = async () => {
    if (!currentSessionId) throw new Error("No session ID");
    const websocket = createInterviewWebSocket(currentSessionId, {
      onOpen: handleWebSocketOpen,
      onMessage: handleWebSocketMessage,
      onError: handleWebSocketError,
      onClose: handleWebSocketClose,
    });
    wsRef.current = websocket;
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    pingIntervalRef.current = setInterval(() => {
      try {
        if (getWebSocketState(currentSessionId) === "open")
          sendWebSocketMessage(currentSessionId, { type: "ping" });
      } catch (_) {}
    }, WEBSOCKET_CONFIG.PING_INTERVAL);
  };

  const handleWebSocketOpen = () => {
    setIsConnected(true);
    setIsConnecting(false);
    setConnectionError(null);
    setReconnectAttempts(0);
    setInterviewStarted(true);
    try {
      const participantId = localStorage.getItem("participant_id") || sessionStorage.getItem("participant_id") || null;
      const token = localStorage.getItem("token") || sessionStorage.getItem("token") || null;
      if (currentSessionId)
        sendWebSocketMessage(currentSessionId, {
          type: "init", session_id: currentSessionId, test_id: testId || null,
          participant_id: participantId, token,
        });
    } catch (e) {
      console.warn("Init message failed:", e);
    }
  };

  const handleWebSocketClose = (event) => {
    setIsConnected(false);
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts < WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS) {
      setReconnectAttempts((prev) => prev + 1);
      reconnectTimeoutRef.current = setTimeout(() => {
        initializeWebSocketConnection().catch((error) =>
          setConnectionError(`Reconnection failed: ${error.message}`),
        );
      }, WEBSOCKET_CONFIG.RECONNECT_DELAY);
    } else {
      setConnectionError("Connection lost. Please refresh.");
    }
  };

  const handleWebSocketMessage = (data) => {
    try {
      switch (data.type) {
        case "error":
          setConnectionError(data.text);
          break;
        case "fatal_error":
          setConnectionError(`Fatal Error: ${data.text || data.message}`);
          setInterviewStarted(false);
          break;
        case "ai_response":
          handleAIResponse(data);
          break;
        case "audio_chunk":
          if (data.audio) playAudioChunk(data.audio);
          break;
        case "audio_end":
          handleAudioStreamEnd();
          break;
        case "round_transition":
          handleRoundTransition(data);
          break;
        case "silence_prompt":
          handleSilencePrompt(data);
          break;
        case "status":
          handleStatusUpdate(data);
          break;
        case "interview_complete":
          handleInterviewComplete(data);
          break;
       case "init_ack":
          if (data.stage) setCurrentStage(data.stage);
          break;
        case "pong":
          break;

        // ===== BIOMETRIC PROCTORING MESSAGES =====
        case "verification_warning":
          handleProctorWarning(data);
          break;
        case "session_terminated":
          handleProctorTermination(data);
          break;
        case "proctoring_ok":
          // Silent — no UI action needed on clean frame
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("WS message error:", error);
    }
  };

  const handleWebSocketError = (error) => {
    setConnectionError(`Connection error: ${error.message}`);
  };
// =========================================================================
  // BIOMETRIC: Proctoring warning handler
  // =========================================================================
  const handleProctorWarning = (data) => {
    const violation = data.violation || 'unknown';
    const warningCount = data.warning_count || 0;
    const message = data.message || 'Proctoring violation detected';

    console.warn(`[Proctoring] ⚠️ WARNING: ${violation} (${warningCount}) — ${message}`);

    // Add to warnings list (keep last 5)
    setProctorWarnings(prev => {
      const newWarnings = [...prev, {
        type: violation,
        message: message,
        warningCount: warningCount,
        timestamp: Date.now(),
      }];
      return newWarnings.slice(-5);
    });

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setProctorWarnings(prev => prev.filter(w => Date.now() - w.timestamp < 6000));
    }, 6500);
  };

  // =========================================================================
  // BIOMETRIC: Session termination handler
  // =========================================================================
  const handleProctorTermination = (data) => {
    const reason = data.reason || 'violation';
    const message = data.message || 'Session terminated due to proctoring violation';

    console.error(`[Proctoring] 🛑 SESSION TERMINATED: ${reason} — ${message}`);

    // Stop everything
    stopListening();
    stopProctoringFrames();
    setInterviewStarted(false);
    setTerminationReason(reason);
    setTerminationMessage(message);
    setShowTerminationDialog(true);

    // Close WebSocket after short delay
    setTimeout(() => {
      if (currentSessionId) closeWebSocket(currentSessionId);
    }, 1000);
  };
  // =========================================================================
  // AI RESPONSE HANDLER — with safety watchdog
  // =========================================================================
  const handleAIResponse = (data) => {
    stopListening();
    setWaitingForVoice(false);
    waitingForVoiceRef.current = false;
    awaitingNextQuestionRef.current = false;
    awaitingServerAnswerRef.current = false;

    // ===== FIX A: Clear any existing watchdog =====
    if (aiPlayingWatchdogRef.current) {
      clearTimeout(aiPlayingWatchdogRef.current);
      aiPlayingWatchdogRef.current = null;
    }

    setCurrentMessage(data.text);
    const newStage = data.stage || "introduction";
    const previousStage = currentStageRef.current;
    setCurrentStage(newStage);

    if (newStage === "communication" && !introductionCompleted) setIntroductionCompleted(true);

    // ===== NEW: Detect if this is a check-in question =====
    const isCheckin = isCheckInQuestion(data.text);
    setIsWaitingForCheckinResponse(isCheckin);
    console.log("[AI Response] Check-in detected:", isCheckin);

    if (MAIN_ROUNDS.includes(newStage)) {
      const backendSaysRepeat = data.is_repeat === true || data.is_clarification === true || data.is_new_question === false;
      const currentText = (data.text || "").trim();
      const previousText = lastQuestionTextRef.current.trim();
      const textIsSame = currentText.length > 0 && previousText.length > 0 &&
        (currentText === previousText ||
          (currentText.length > 50 && previousText.length > 50 &&
            currentText.substring(0, Math.floor(currentText.length * 0.8)) ===
              previousText.substring(0, Math.floor(previousText.length * 0.8))));
      const isRepeat = backendSaysRepeat || textIsSame;

      if (previousStage !== newStage) {
        localQuestionCountRef.current[newStage] = 1;
        lastBackendQuestionNumberRef.current[newStage] = data.question_number || 1;
        lastQuestionTextRef.current = currentText;
        setQuestionNumber(1);
        // ===== DEFENSE-IN-DEPTH: Reset VAD on stage change =====
        // Primary reset comes from handleRoundTransition (backend sends round_transition).
        // This fallback ensures voice detection recovers even if that message is missed.
        if (vadRef.current) {
          vadRef.current.resetNoiseFloor();
          console.log("[AI Response] Stage changed", previousStage, "->", newStage, "— VAD noise floor reset");
        }
      } else if (isRepeat) {
        // keep current
      } else {
        const newLocalQ = (localQuestionCountRef.current[newStage] || 0) + 1;
        localQuestionCountRef.current[newStage] = newLocalQ;
        lastBackendQuestionNumberRef.current[newStage] = data.question_number || newLocalQ;
        lastQuestionTextRef.current = currentText;
        setQuestionNumber(newLocalQ);
      }
    } else {
      lastQuestionTextRef.current = (data.text || "").trim();
    }

    setIsAIPlaying(true);
    isAIPlayingRef.current = true;
    setAiSpeechProgress(0);

    if (data.time_remaining_seconds !== undefined && data.time_remaining_seconds > 0) {
      setTimeRemaining(data.time_remaining_seconds);
    } else if (ROUND_CONFIG[newStage] && previousStage !== newStage) {
      setTimeRemaining(ROUND_CONFIG[newStage].duration);
    }
    if (data.difficulty) setCurrentDifficulty(data.difficulty);

    // ===== FIX A: Safety watchdog — if no audio arrives within 10s, force reset =====
    // This prevents deadlock if ai_response text arrives but TTS audio never follows.
    aiPlayingWatchdogRef.current = setTimeout(() => {
      if (isAIPlayingRef.current && !isPlayingAudioRef.current && audioQueueRef.current.length === 0) {
        console.warn("[AI Response Watchdog] No audio received within 10s — force-resetting AI playing state");
        setIsAIPlaying(false);
        isAIPlayingRef.current = false;
        setAiSpeechProgress(100);
        setTimeout(() => startAutoVoiceDetection(), 1000);
      }
    }, 10000);
  };

  // =========================================================================
  // ROUND TRANSITION — with VAD reset for clean start
  // =========================================================================
  const handleRoundTransition = (data) => {
    awaitingServerAnswerRef.current = false;

    // ===== FIX C: Clear watchdog on round transition =====
    if (aiPlayingWatchdogRef.current) {
      clearTimeout(aiPlayingWatchdogRef.current);
      aiPlayingWatchdogRef.current = null;
    }

    const toStage = data.to_stage || "communication";
    const toConfig = ROUND_CONFIG[toStage] || ROUND_CONFIG.communication;
    setTransitionMessage(data.text || `Moving to ${toConfig.label} round...`);
    setShowRoundTransition(true);
    setCurrentStage(toStage);
    if (data.from_stage === "introduction") setIntroductionCompleted(true);
    setTimeRemaining(toConfig.duration);
    localQuestionCountRef.current[toStage] = 0;
    lastBackendQuestionNumberRef.current[toStage] = 0;
    lastQuestionTextRef.current = "";
    setQuestionNumber(0);

    // ===== FIX C: Reset VAD noise floor for clean start in new round =====
    if (vadRef.current) {
      vadRef.current.resetNoiseFloor();
      console.log("[Round Transition] VAD noise floor reset for new round:", toStage);
    }

    // ===== FIX C: Force-clear AI playing state so voice detection can restart =====
    // The first question of the new round will come as ai_response and set it again.
    setIsAIPlaying(false);
    isAIPlayingRef.current = false;

    setTimeout(() => setShowRoundTransition(false), 5000);
  };

  // =========================================================================
  // SILENCE PROMPT HANDLER — CRITICAL FIX
  //
  // BUG: Previously set isAIPlaying=true blindly. Silence prompts may be
  // text-only with NO TTS audio. This caused isAIPlaying to stay true
  // forever, preventing voice detection from ever starting → DEADLOCK.
  //
  // FIX: Don't set isAIPlaying=true. Instead, set a short watchdog.
  // If TTS audio chunks arrive within 3s, they'll naturally set isAIPlaying.
  // If not, we restart voice detection.
  // =========================================================================
  const handleSilencePrompt = (data) => {
    awaitingServerAnswerRef.current = false;
    setCurrentMessage(data.text || "Take your time.");

    // ===== FIX A (CRITICAL): Do NOT set isAIPlaying=true blindly =====
    // Old code: setIsAIPlaying(true);  ← THIS CAUSED THE DEADLOCK
    //
    // Instead, wait briefly. If audio_chunk messages arrive, playAudioChunk
    // will handle AI playing state. If no audio arrives, restart listening.

    // Clear any existing watchdog
    if (aiPlayingWatchdogRef.current) {
      clearTimeout(aiPlayingWatchdogRef.current);
      aiPlayingWatchdogRef.current = null;
    }

    aiPlayingWatchdogRef.current = setTimeout(() => {
      // If no audio started playing within 3 seconds, this was a text-only silence prompt
      if (!isPlayingAudioRef.current && audioQueueRef.current.length === 0 && !isAIPlayingRef.current) {
        console.log("[Silence Prompt] No TTS audio received — restarting voice detection");
        setTimeout(() => startAutoVoiceDetection(), 500);
      }
    }, 3000);
  };

  const handleStatusUpdate = (data) => {
    if (data.stage) setCurrentStage(data.stage);
    if (data.time_remaining_seconds !== undefined) setTimeRemaining(data.time_remaining_seconds);
    if (data.difficulty) setCurrentDifficulty(data.difficulty);
  };

  const handleAudioStreamEnd = () => {
    // ===== FIX A: Clear watchdog — audio DID arrive, so normal flow =====
    if (aiPlayingWatchdogRef.current) {
      clearTimeout(aiPlayingWatchdogRef.current);
      aiPlayingWatchdogRef.current = null;
    }
    setTimeout(() => waitForAudioComplete(), 200);
  };

  const handleInterviewComplete = (data) => {
    awaitingServerAnswerRef.current = false;
    if (aiPlayingWatchdogRef.current) {
      clearTimeout(aiPlayingWatchdogRef.current);
      aiPlayingWatchdogRef.current = null;
    }
    setInterviewStarted(false);
    stopListening();
    if (cameraEnabled) stopCamera();
    setTimeout(
      () => navigate(`/student/mock-interviews/results/${testId}`, { state: { evaluation: data } }),
      1500,
    );
  };

  const waitForAudioComplete = () => {
    if (audioQueueRef.current.length === 0 && !isPlayingAudioRef.current) {
      setIsAIPlaying(false);
      isAIPlayingRef.current = false;
      setAiSpeechProgress(100);
      setTimeout(() => startAutoVoiceDetection(), AUDIO_CONFIG.AI_PAUSE_DELAY);
    } else {
      setTimeout(waitForAudioComplete, 200);
    }
  };

  // =========================================================================
  // VOICE DETECTION — Uses VAD (frequency-based)
  // =========================================================================
  const startAutoVoiceDetection = async () => {
    try {
      if (awaitingServerAnswerRef.current) {
        console.log("[Voice Detection] Awaiting server response — deferring voice detection");
        setTimeout(startAutoVoiceDetection, 1000);
        return;
      }

      if (isRecordingRef.current || isAIPlayingRef.current || isPlayingAudioRef.current || audioQueueRef.current.length > 0) {
        setTimeout(startAutoVoiceDetection, 500);
        return;
      }

      if (!streamRef.current?.active) {
        console.log("[Voice Detection] Stream inactive, reinitializing...");
        try { await setupEnhancedAudioSystem(); } catch (err) {
          console.error("[Voice Detection] Reinit failed:", err);
          return;
        }
      }

      if (!(await waitForAudioReady())) {
        await setupEnhancedAudioSystem();
        if (!(await waitForAudioReady())) return;
      }

      if (noVoiceTimeoutRef.current) {
        clearTimeout(noVoiceTimeoutRef.current);
        noVoiceTimeoutRef.current = null;
      }
       
      if (vadRef.current) {
        vadRef.current.softResetAfterAI();
      }

      // ===== FIX: Deaf period — let TTS speaker echo fully decay before listening =====
      const deafPeriodMs = VAD_CONFIG.POST_AI_DEAF_PERIOD_MS || 1500;
      console.log(`[Voice Detection] Deaf period: ${deafPeriodMs}ms (letting TTS echo decay)`);
      await new Promise((r) => setTimeout(r, deafPeriodMs));

      // Re-check state after deaf period (AI may have started speaking again)
      if (isRecordingRef.current || isAIPlayingRef.current || awaitingServerAnswerRef.current) {
        console.log("[Voice Detection] State changed during deaf period — aborting");
        return;
      }

      await startEnhancedVoiceMonitoring();
      setWaitingForVoice(true);
      waitingForVoiceRef.current = true;
      setNoVoiceTimer(0);

      if (AUDIO_CONFIG.NO_VOICE_TIMEOUT) {
        noVoiceTimeoutRef.current = setTimeout(() => {
          if (waitingForVoiceRef.current && !isRecordingRef.current) {
            console.log("[Interview] No voice timeout — requesting next question");
            setWaitingForVoice(false);
            waitingForVoiceRef.current = false;
            clearVoiceMonitor();
            if (currentSessionId && getWebSocketState(currentSessionId) === "open") {
              sendWebSocketMessage(currentSessionId, { type: "audio_data", audio: "" });
            }
          }
        }, AUDIO_CONFIG.NO_VOICE_TIMEOUT);
      }
    } catch (error) {
      console.error("Auto voice detection failed:", error);
      setWaitingForVoice(false);
    }
  };

  const clearVoiceMonitor = () => {
    if (animationFrameRef.current) {
      clearInterval(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // =========================================================================
  // ENHANCED VOICE MONITORING — Uses VAD
  // =========================================================================
  const startEnhancedVoiceMonitoring = async () => {
    if (!(await waitForAudioReady())) return;
    setWaitingForVoice(true);
    waitingForVoiceRef.current = true;
let consecutiveVoiceDetections = 0;
    const DETECTION_THRESHOLD = 6;             // 4→6: More consecutive detections needed — prevents ghost triggers from residual noise
    const MIN_RAW_LEVEL_FOR_VOICE = 0.015;     // Detects soft/low volume speech  // 0.04→0.015: Detects soft/low volume speech
    if (animationFrameRef.current) {
      clearInterval(animationFrameRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const monitorVoice = () => {
      if (!waitingForVoiceRef.current) {
        clearVoiceMonitor();
        return;
      }
      if (isRecordingRef.current || isAIPlayingRef.current) return;

      try {
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          console.warn("[Voice Monitor] AudioContext suspended — resuming...");
          audioContextRef.current.resume().catch((err) => console.error("[Voice Monitor] Resume failed:", err));
          return;
        }

        if (vadRef.current) {
          const result = vadRef.current.analyze();
          setAudioLevel(result.isVoice ? result.rawLevel : 0);
          setVoiceConfidence(result.confidence);

          if (result.isVoice && result.rawLevel >= MIN_RAW_LEVEL_FOR_VOICE) {
            consecutiveVoiceDetections++;
            if (consecutiveVoiceDetections >= DETECTION_THRESHOLD) {
              if (noVoiceTimeoutRef.current) {
                clearTimeout(noVoiceTimeoutRef.current);
                noVoiceTimeoutRef.current = null;
              }
              console.log(
                "[Voice Monitor] Human voice confirmed (confidence=" + result.confidence.toFixed(2) +
                ", grace=" + result.inGracePeriod + "), starting recording",
              );
              setWaitingForVoice(false);
              waitingForVoiceRef.current = false;
              clearVoiceMonitor();
              setTimeout(startEnhancedRecording, 50);
              return;
            }
          } else {
            consecutiveVoiceDetections = Math.max(0, consecutiveVoiceDetections - 1);
          }
        } else {
          if (!analyserRef.current) {
            clearVoiceMonitor();
            return;
          }
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const avgVolume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(avgVolume / 255);
        }
      } catch (error) {
        console.error("Voice monitoring error:", error);
        setWaitingForVoice(false);
        waitingForVoiceRef.current = false;
        clearVoiceMonitor();
      }
    };

    animationFrameRef.current = setInterval(monitorVoice, 50);
  };

  // =========================================================================
  // RECORDING
  // =========================================================================
 const startEnhancedRecording = async () => {
  try {
    if (isRecordingRef.current) return;

    if (!streamRef.current?.active) {
      console.log("[Recording] Stream inactive, reinitializing...");
      await setupEnhancedAudioSystem();
      if (!streamRef.current?.active) return;
    }

    audioChunksRef.current = [];
    lastHumanVoiceTimeRef.current = Date.now(); // Initialize human voice timer

    let mimeType = "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mimeType = "audio/webm;codecs=opus";
    else if (MediaRecorder.isTypeSupported("audio/webm")) mimeType = "audio/webm";
    else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) mimeType = "audio/ogg;codecs=opus";
    else if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";

    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType, audioBitsPerSecond: 128000 });
    
    // ===== VOICE GATE: Filter chunks before storing =====
    mediaRecorder.ondataavailable = (event) => {
      if (!event.data || event.data.size === 0) return;

      // GATE 1: AI speaking? Block ALL audio
      if (isAIPlayingRef.current) {
        console.log("[Voice Gate] AI speaking - chunk DISCARDED");
        return;
      }

      // GATE 2: Check if this chunk contains human voice
      if (vadRef.current) {
        const vadResult = vadRef.current.analyze();
        
        if (!vadResult.isVoice) {
          // NOT human voice - discard chunk, don't update voice timer
          console.log("[Voice Gate] Non-voice audio DISCARDED (confidence=" + vadResult.confidence.toFixed(2) + ")");
          return;
        }
        
        // IS human voice - keep chunk and update timer
        console.log("[Voice Gate] Human voice ACCEPTED (confidence=" + vadResult.confidence.toFixed(2) + ")");
        lastHumanVoiceTimeRef.current = Date.now();
      }

      // Only human voice chunks reach here
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = handleRecordingComplete;
    mediaRecorder.onerror = (e) => {
      console.error("[Recording] Error:", e);
      setIsRecording(false);
      setIsListening(false);
    };
    mediaRecorder.start(200); // Capture chunks every 200ms for gate analysis
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    isRecordingRef.current = true;
    setIsListening(true);
    setWaitingForVoice(false);
    waitingForVoiceRef.current = false;

    setTimeout(startEnhancedSilenceDetection, 100);
    if (maxRecordingTimeoutRef.current) {
      clearTimeout(maxRecordingTimeoutRef.current);
    }
    maxRecordingTimeoutRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === "recording") stopRecording();
    }, AUDIO_CONFIG.MAX_RECORDING_TIME);
  } catch (error) {
    console.error("Recording failed:", error);
    setIsRecording(false);
    setIsListening(false);
  }
};

  // =========================================================================
  // SILENCE DETECTION — Uses VAD for human-voice silence only
  // =========================================================================
 const startEnhancedSilenceDetection = () => {
  if (!analyserRef.current) return;

  let speechDetected = false;
  let speechStartTime = null;
  let recentVoiceStates = [];
  const SMOOTHING_WINDOW = 60;
  let cumulativeVoiceFrames = 0;

  const currentRound = currentStageRef.current || "communication";
  const SILENCE_DURATION_MS = SILENCE_CONFIG.SILENCE_DURATION_BY_ROUND[currentRound] || SILENCE_CONFIG.SILENCE_DURATION_MS;
  const MIN_SPEECH_DURATION_MS = SILENCE_CONFIG.MIN_SPEECH_DURATION_BY_ROUND[currentRound] || SILENCE_CONFIG.MIN_SPEECH_DURATION_MS;
  const MIN_VOICE_FRAMES = SILENCE_CONFIG.MIN_VOICE_FRAMES_BY_ROUND[currentRound] || 40;

  console.log("[Silence Detection] Round: " + currentRound + " | silenceDuration=" + SILENCE_DURATION_MS + "ms | minSpeech=" + MIN_SPEECH_DURATION_MS + "ms | minVoiceFrames=" + MIN_VOICE_FRAMES);

  let noiseFloorFrozen = false;
  let savedNoiseFloor = null;

  // ===== NEW: FAST threshold for immediate silence timer reset =====
  const FAST_AUDIO_THRESHOLD = 0.02; // Lower than VAD - catches voice BEFORE confirmation

  const detectSilenceAndSpeech = () => {
    if (!isRecordingRef.current || mediaRecorderRef.current?.state !== "recording") return;
    try {
      // ===== GATE: AI speaking? Ignore frame =====
      if (isAIPlayingRef.current) {
        silenceDetectionRef.current = requestAnimationFrame(detectSilenceAndSpeech);
        return;
      }

      let isVoiceNow = false;
      let displayLevel = 0;
      let rawAudioLevel = 0; // NEW: Separate raw level for fast detection

      if (vadRef.current) {
        if (speechDetected && !noiseFloorFrozen && vadRef.current.noiseFloor) {
          savedNoiseFloor = new Float32Array(vadRef.current.noiseFloor);
          noiseFloorFrozen = true;
          console.log("[Silence Detection] Noise floor FROZEN for duration of recording");
        }

        if (noiseFloorFrozen && savedNoiseFloor && vadRef.current.noiseFloor) {
          vadRef.current.noiseFloor.set(savedNoiseFloor);
        }

        const result = vadRef.current.analyze();
        isVoiceNow = result.isVoice;
        displayLevel = result.isVoice ? result.rawLevel : 0;
        rawAudioLevel = result.voiceEnergy || 0; // Get raw energy BEFORE confirmation
        setVoiceConfidence(result.confidence);

        // ===== CRITICAL FIX: IMMEDIATE reset on ANY audio above threshold =====
        // This prevents 200ms VAD confirmation delay from causing false silence
        if (rawAudioLevel > FAST_AUDIO_THRESHOLD) {
          lastHumanVoiceTimeRef.current = Date.now();
        }
      } else {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const avgVolume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        rawAudioLevel = avgVolume / 255;
        displayLevel = rawAudioLevel;
        isVoiceNow = rawAudioLevel > SILENCE_CONFIG.SILENCE_THRESHOLD_ABSOLUTE * 2;
        
        // IMMEDIATE reset on raw audio
        if (rawAudioLevel > FAST_AUDIO_THRESHOLD) {
          lastHumanVoiceTimeRef.current = Date.now();
        }
      }

      setAudioLevel(displayLevel);

      recentVoiceStates.push(isVoiceNow ? 1 : 0);
      if (recentVoiceStates.length > SMOOTHING_WINDOW) recentVoiceStates.shift();

      const voiceRatio = recentVoiceStates.reduce((a, b) => a + b, 0) / recentVoiceStates.length;

      if (isVoiceNow) cumulativeVoiceFrames++;

      if (!speechDetected && recentVoiceStates.length >= 15 && voiceRatio > 0.3) {
        speechDetected = true;
        speechStartTime = Date.now();
        lastHumanVoiceTimeRef.current = Date.now();
        console.log("[Silence Detection] Human speech started (voiceRatio=" + voiceRatio.toFixed(2) + ", voiceFrames=" + cumulativeVoiceFrames + ", round=" + currentRound + ")");
      }

      if (speechDetected && Date.now() - speechStartTime > 300000) {
        console.log("[Silence Detection] Max recording time");
        stopRecording();
        return;
      }

      if (speechDetected && cumulativeVoiceFrames >= MIN_VOICE_FRAMES && Date.now() - speechStartTime >= MIN_SPEECH_DURATION_MS) {
        const silenceSinceHumanVoice = lastHumanVoiceTimeRef.current 
          ? Date.now() - lastHumanVoiceTimeRef.current 
          : 0;
        
        setSilenceTimer(silenceSinceHumanVoice);

        if (silenceSinceHumanVoice >= SILENCE_DURATION_MS) {
          console.log("[Silence Detection] " + SILENCE_DURATION_MS / 1000 + "s since LAST HUMAN VOICE - stopping (round=" + currentRound + ")");
          stopRecording();
          return;
        }

        // Debug log
        if (rawAudioLevel > FAST_AUDIO_THRESHOLD && silenceSinceHumanVoice < 1000) {
          console.log("[Silence Detection] Audio activity (rawLevel=" + rawAudioLevel.toFixed(3) + ", silenceSince=" + (silenceSinceHumanVoice / 1000).toFixed(1) + "s)");
        }
      }

      silenceDetectionRef.current = requestAnimationFrame(detectSilenceAndSpeech);
    } catch (error) {
      console.error("Silence detection error:", error);
    }
  };

  if (silenceDetectionRef.current) cancelAnimationFrame(silenceDetectionRef.current);
  silenceDetectionRef.current = requestAnimationFrame(detectSilenceAndSpeech);
};

 const stopRecording = () => {
    try {
      if (maxRecordingTimeoutRef.current) {
        clearTimeout(maxRecordingTimeoutRef.current);
        maxRecordingTimeoutRef.current = null;
      }
      if (animationFrameRef.current) {
        clearInterval(animationFrameRef.current);
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (silenceDetectionRef.current) {
        cancelAnimationFrame(silenceDetectionRef.current);
        silenceDetectionRef.current = null;
      }
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsListening(false);
      setWaitingForVoice(false);
      waitingForVoiceRef.current = false;
      setSilenceTimer(0);
      setAudioLevel(0);
      setNoVoiceTimer(0);
      setVoiceConfidence(0);
    } catch (error) {
      console.error("Stop recording error:", error);
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setWaitingForVoice(false);
    waitingForVoiceRef.current = false;
    setNoVoiceTimer(0);
    setAudioLevel(0);
    setVoiceConfidence(0);
    if (noVoiceTimeoutRef.current) {
      clearTimeout(noVoiceTimeoutRef.current);
      noVoiceTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      clearInterval(animationFrameRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceDetectionRef.current) {
      cancelAnimationFrame(silenceDetectionRef.current);
      silenceDetectionRef.current = null;
    }
    stopRecording();
  };

  const handleRecordingComplete = async () => {
    try {
      if (audioChunksRef.current.length === 0) return;
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm",
      });
      if (audioBlob.size < 100) return;
      const audioMessage = await processAudioForWebSocket(audioBlob);
      setIsWaitingForCheckinResponse(false); // Clear check-in state after user responds
      if (currentSessionId && getWebSocketState(currentSessionId) === "open") {
        sendWebSocketMessage(currentSessionId, audioMessage);
        awaitingServerAnswerRef.current = true;
        setTimeout(() => {
          if (awaitingServerAnswerRef.current && getWebSocketState(currentSessionId) === "open")
            sendWebSocketMessage(currentSessionId, { type: "next_question" });
        }, 8000);
        setTimeout(() => {
          if (awaitingServerAnswerRef.current) {
            console.warn("[Recording] Safety timeout: force-clearing server answer lock after 30s");
            awaitingServerAnswerRef.current = false;
          }
        }, 15000);
      } else {
        setConnectionError("Connection lost. Please refresh.");
      }
    } catch (error) {
      console.error("Audio processing failed:", error);
      setConnectionError(`Audio processing failed: ${error.message}`);
    }
  };

  // =========================================================================
  // AUDIO PLAYBACK — with watchdog clearing
  // =========================================================================
  const playAudioChunk = async (hexAudio) => {
    try {
      if (!hexAudio || !audioContextRef.current || !gainNodeRef.current) return;

      // ===== FIX A: Audio IS arriving — clear the no-audio watchdog =====
      if (aiPlayingWatchdogRef.current) {
        clearTimeout(aiPlayingWatchdogRef.current);
        aiPlayingWatchdogRef.current = null;
      }

      // ===== FIX A: Ensure isAIPlaying is true when audio chunks arrive =====
      // This handles the case where silence_prompt no longer sets isAIPlaying,
      // but TTS audio DOES arrive — we set it here instead.
      if (!isAIPlayingRef.current) {
        setIsAIPlaying(true);
        isAIPlayingRef.current = true;
      }

      const audioData = new Uint8Array(
        hexAudio.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
      );
      if (audioData.length === 0) return;
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.buffer.slice());
      audioQueueRef.current.push(audioBuffer);
      if (!isPlayingAudioRef.current) playNextInQueue();
    } catch (error) {
      console.error("Audio chunk error:", error);
    }
  };

  const playNextInQueue = () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current || !gainNodeRef.current) {
      isPlayingAudioRef.current = false;
      return;
    }
    const buffer = audioQueueRef.current.shift();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = AUDIO_CONFIG.AI_SPEECH_RATE;
    source.connect(gainNodeRef.current);
    currentAudioRef.current = source;
    isPlayingAudioRef.current = true;
    source.onended = () => {
      currentAudioRef.current = null;
      isPlayingAudioRef.current = false;
      setAiSpeechProgress((prev) => Math.min(prev + 15, 95));
      if (audioQueueRef.current.length > 0) playNextInQueue();
      else setAiSpeechProgress(100);
    };
    source.start();
  };
// =========================================================================
  // BIOMETRIC: Send camera frame for proctoring (phone + head turn detection)
  // Called every 5 seconds during the interview via setInterval
  // =========================================================================
  const sendProctoringFrame = useCallback(() => {
    try {
      // Only send if connected, interview active, and camera is running
      if (!isConnectedRef.current || !interviewStartedRef.current) return;
      if (!videoStreamRef.current || !videoStreamRef.current.active) return;
      if (!currentSessionId || getWebSocketState(currentSessionId) !== 'open') return;

      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

      // Capture frame from video element
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 640);  // cap resolution for speed
      canvas.height = Math.min(video.videoHeight, 480);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.6).split('base64,')[1];

      if (frameBase64 && frameBase64.length > 100) {
        sendWebSocketMessage(currentSessionId, {
          type: 'face_frame',
          image: frameBase64,
        });
      }
    } catch (err) {
      console.warn('[Proctoring] Frame capture error:', err.message);
    }
  }, [currentSessionId]);

  // =========================================================================
  // BIOMETRIC: Start/stop proctoring interval
  // =========================================================================
  const startProctoringFrames = useCallback(() => {
    if (proctorIntervalRef.current) return; // already running
    console.log('[Proctoring] Starting camera frame monitoring (every 5s)');
    proctorIntervalRef.current = setInterval(sendProctoringFrame, 5000);
  }, [sendProctoringFrame]);

  const stopProctoringFrames = useCallback(() => {
    if (proctorIntervalRef.current) {
      clearInterval(proctorIntervalRef.current);
      proctorIntervalRef.current = null;
      console.log('[Proctoring] Stopped camera frame monitoring');
    }
  }, []);
  // Camera functions
  const getCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Media devices not supported");
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = devices.filter((device) => device.kind === "videoinput");
      if (videoDevices.length > 0 && !videoDevices[0].label) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        tempStream.getTracks().forEach((track) => track.stop());
        await new Promise((resolve) => setTimeout(resolve, 100));
        devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter((device) => device.kind === "videoinput");
      }
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCamera) setSelectedCamera(videoDevices[0].deviceId);
      return videoDevices;
    } catch (error) {
      setCameraError(`Camera access failed: ${error.message}`);
      setCameraPermissionDenied(true);
      return [];
    }
  };

  const startCamera = async (deviceId = null) => {
    setCameraInitializing(true);
    setCameraError(null);
    try {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
        setVideoStream(null);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      const constraints = {
        video: {
          width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" }),
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!stream.getVideoTracks()[0]) throw new Error("No video track");
      videoStreamRef.current = stream;
      setVideoStream(stream);
      setCameraEnabled(true);
      setCameraPermissionDenied(false);
    } catch (error) {
      setCameraError(error.message);
      setCameraEnabled(false);
      if (error.name === "NotAllowedError") setCameraPermissionDenied(true);
    } finally {
      setCameraInitializing(false);
    }
  };

  const stopCamera = () => {
    try {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
        videoRef.current.load();
      }
      setVideoStream(null);
      setCameraEnabled(false);
      setCameraInitializing(false);
      setCameraError(null);
    } catch (error) {
      console.error("Camera stop error:", error);
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((camera) => camera.deviceId === selectedCamera);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setSelectedCamera(availableCameras[nextIndex].deviceId);
    await startCamera(availableCameras[nextIndex].deviceId);
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoStream) return;
    const setupVideo = async () => {
      try {
        if (videoElement.srcObject) {
          videoElement.srcObject = null;
          videoElement.pause();
          videoElement.load();
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        videoElement.srcObject = videoStream;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.autoplay = true;
        await new Promise((resolve) => {
          if (videoElement.readyState >= 1) resolve();
          else videoElement.addEventListener("loadedmetadata", resolve, { once: true });
        });
        await videoElement.play();
      } catch (error) {
        console.error("Video setup error:", error);
      }
    };
    setupVideo();
  }, [videoStream]);

  useEffect(() => {
    if (interviewStarted && !cameraEnabled && !cameraInitializing) {
      if (availableCameras.length === 0) getCameraDevices().then(() => startCamera());
      else startCamera();
    }
  }, [interviewStarted, cameraEnabled, cameraInitializing]);

  // ===== BIOMETRIC: Start proctoring frames when camera is active =====
  useEffect(() => {
    if (interviewStarted && cameraEnabled && isConnected) {
      startProctoringFrames();
    }
    return () => stopProctoringFrames();
  }, [interviewStarted, cameraEnabled, isConnected, startProctoringFrames, stopProctoringFrames]);
  const handleEndInterviewClick = () => setShowEndConfirmation(true);

  const confirmEndInterview = async () => {
    setShowEndConfirmation(false);
    setIsEndingInterview(true);
    try { await stopInterview(); } catch (error) {
      console.error("Error ending interview:", error);
    } finally {
      setIsEndingInterview(false);
    }
  };

  const stopInterview = async () => {
    try {
      setInterviewStarted(false);
      setIsConnecting(false);
      setIsConnected(false);
      stopListening();
      if (cameraEnabled) stopCamera();
      if (currentSessionId && getWebSocketState(currentSessionId) === "open") {
        sendWebSocketMessage(currentSessionId, { type: "manual_stop", reason: "user_initiated", timestamp: Date.now() });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      cleanup();
      closeWebSocket(currentSessionId);
      setTimeout(
        () => navigate("/student/mock-interviews", { state: { message: "Interview ended by user", type: "info" } }),
        1000,
      );
    } catch (error) {
      console.error("Stop error:", error);
      setTimeout(() => navigate("/student/mock-interviews"), 1000);
    }
  };

  // ===== FIX A: Cleanup includes watchdog ref =====
  const cleanup = useCallback(() => {
    stopListening();
    stopCamera();
    stopProctoringFrames();
    // Clear watchdog
if (aiPlayingWatchdogRef.current) {
      clearTimeout(aiPlayingWatchdogRef.current);
      aiPlayingWatchdogRef.current = null;
    }
    if (maxRecordingTimeoutRef.current) {
      clearTimeout(maxRecordingTimeoutRef.current);
      maxRecordingTimeoutRef.current = null;
    }
    [reconnectTimeoutRef, silenceTimeoutRef, noVoiceTimeoutRef, pingIntervalRef].forEach((ref) => {
      if (ref.current) {
        clearInterval(ref.current);
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
    if (animationFrameRef.current) {
      clearInterval(animationFrameRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceDetectionRef.current) {
      cancelAnimationFrame(silenceDetectionRef.current);
      silenceDetectionRef.current = null;
    }
    if (audioSourceNodeRef.current) {
      try { audioSourceNodeRef.current.disconnect(); } catch (_) {}
      audioSourceNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    vadRef.current = null;
  }, []);

  const handleHeadphoneConfirm = () => {
    setShowHeadphoneWarning(false);
    initializeCompleteSystem();
  };
  const handleHeadphoneSkip = () => {
    setShowHeadphoneWarning(false);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("skip_headphone_check", "true");
    window.history.replaceState({}, "", newUrl);
    initializeCompleteSystem();
  };

  const currentRoundIndex = getCurrentRoundIndex();
  const stageConfig = ROUND_CONFIG[currentStage] || ROUND_CONFIG.introduction;
  const isIntroductionPhase = currentStage === "introduction";

  const getSystemStatus = () => {
    if (isAIPlaying) return { text: "AI SPEAKING", color: "#6366f1" };
    if (isRecording) return { text: "RECORDING", color: "#ef4444" };
    if (waitingForVoice) return { text: "LISTENING", color: "#22c55e" };
    return { text: "STANDBY", color: "#64748b" };
  };
  const systemStatus = getSystemStatus();

  // ============================================================================
  // RENDER - Headphone Warning
  // ============================================================================
  if (showHeadphoneWarning) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Dialog open={true} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", p: 2 } }}>
          <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
            <Box sx={{ width: 72, height: 72, borderRadius: "16px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Headset sx={{ fontSize: 36, color: "#fff" }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>Headphones Recommended</Typography>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3, borderRadius: "10px" }}>
              <Typography variant="body2">For the best experience, use headphones to prevent audio feedback during your interview.</Typography>
            </Alert>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} color="success.main" gutterBottom>✓ Recommended</Typography>
              <Typography variant="body2" color="text.secondary">Wired headphones with microphone, earbuds, or over-ear headphones</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="error.main" gutterBottom>✕ Not Recommended</Typography>
              <Typography variant="body2" color="text.secondary">Laptop speakers, external speakers without headphones</Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2, flexDirection: "column" }}>
            <Button variant="contained" fullWidth size="large" onClick={handleHeadphoneConfirm}
              sx={{ borderRadius: "10px", py: 1.5, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", textTransform: "none", fontWeight: 600 }}>
              I Have Headphones Ready
            </Button>
            <Button variant="text" fullWidth onClick={handleHeadphoneSkip} sx={{ textTransform: "none", color: "#64748b" }}>
              Continue Without Headphones
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ============================================================================
  // RENDER - Connecting
  // ============================================================================
  if (isConnecting) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 64px)", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center", p: 4 }}>
          <CircularProgress size={56} sx={{ mb: 3, color: "#6366f1" }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {reconnectAttempts > 0 ? `Reconnecting... (${reconnectAttempts}/${WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS})` : "Initializing Interview System"}
          </Typography>
          <Typography variant="body2" color="text.secondary">Setting up audio, camera, and AI connection...</Typography>
        </Box>
      </Box>
    );
  }

  // ============================================================================
  // RENDER - Error
  // ============================================================================
  if (connectionError) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 64px)", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center", p: 4, maxWidth: 480 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "16px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Warning sx={{ fontSize: 36, color: "#dc2626" }} />
          </Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>Connection Error</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>{connectionError}</Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="outlined" onClick={() => navigate("/student/mock-interviews")} sx={{ borderRadius: "10px", textTransform: "none" }}>
              Back to Dashboard
            </Button>
            <Button variant="contained" onClick={() => window.location.reload()} startIcon={<Refresh />}
              sx={{ borderRadius: "10px", textTransform: "none", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
              Retry
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // ============================================================================
  // RENDER - Main Interview Interface
  // ============================================================================
  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)", background: "#f8fafc", p: 3, display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes recording-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      {/* Top Bar */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: "16px", p: "16px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {MAIN_ROUNDS.map((roundKey, index) => {
            const config = ROUND_CONFIG[roundKey];
            const isActive = currentStage === roundKey;
            const isCompleted = currentRoundIndex > index;
            return (
              <React.Fragment key={roundKey}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "12px",
                  background: isActive ? "#6366f1" : isCompleted ? "#22c55e" : "#f1f5f9",
                  color: isActive || isCompleted ? "#fff" : "#64748b", transition: "all 0.3s ease" }}>
                  <Typography variant="caption" fontWeight={600}>{config.label}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>{Math.floor(config.duration / 60)} min</Typography>
                </Box>
                {index < MAIN_ROUNDS.length - 1 && (
                  <Box sx={{ width: "40px", height: "2px", background: isCompleted ? "#22c55e" : "#e2e8f0" }} />
                )}
              </React.Fragment>
            );
          })}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Chip icon={<Timer sx={{ fontSize: 16 }} />} label={`Time: ${formatTime(timeRemaining)}`} size="small"
            sx={{ background: "#dbeafe", color: "#1d4ed8", fontWeight: 600, "& .MuiChip-icon": { color: "#1d4ed8" } }} />
        </Box>
      </Box>

      {/* Main Content - 50/50 Split */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flex: 1 }}>
        {/* Left Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Video Panel */}
          <Box sx={{ background: "#1e293b", borderRadius: "16px", overflow: "hidden", position: "relative", flex: 1, minHeight: "320px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <Box sx={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", background: "rgba(0,0,0,0.6)", borderRadius: "8px", color: "#fff", fontSize: "12px",
              fontWeight: 600, backdropFilter: "blur(10px)", zIndex: 10 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: systemStatus.color, animation: isRecording ? "pulse 1s infinite" : "none" }} />
              {systemStatus.text}
            </Box>
            {cameraEnabled && videoStream ? (
              <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                {cameraInitializing ? <CircularProgress sx={{ color: "#fff" }} /> : <Videocam sx={{ fontSize: 72, opacity: 0.3, color: "#fff" }} />}
              </Box>
            )}
            <Box sx={{ position: "absolute", bottom: "12px", left: "12px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              borderRadius: "10px", padding: "10px 14px", color: "#fff", zIndex: 10 }}>
              <Typography variant="caption" fontWeight={600} sx={{ opacity: 0.85, display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {isIntroductionPhase ? "Introduction Round" : `${stageConfig.label} Round`}
              </Typography>
              <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "13px" }}>
                Q{questionNumber || 1}: Interactive Assessment
              </Typography>
            </Box>
          </Box>

          {/* Action Area — WITH AI AVATAR */}
          <Box sx={{ background: "#fff", borderRadius: "16px", p: 3, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <AIAvatar isPlaying={isAIPlaying} isListening={isRecording} isWaiting={waitingForVoice} size={48} />
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: "18px", mt: 1 }}>
              {isAIPlaying 
                ? "AI Speaking..." 
                : isRecording 
                  ? (isWaitingForCheckinResponse ? "Listening for your decision..." : "Recording Your Response")
                  : waitingForVoice 
                    ? "Listening for your voice..." 
                    : "Initializing..."}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isAIPlaying 
                ? "Please listen to the question carefully" 
                : isRecording 
                  ? (isWaitingForCheckinResponse 
                      ? "Say 'next' or 'that's all' to continue, or keep talking to add more"
                      : "Speak clearly — pauses in speech are auto-detected")
                  : waitingForVoice 
                    ? "Start speaking when ready — system is listening" 
                    : "Setting up interview system"}
            </Typography>

            {(isRecording || waitingForVoice) && (
              <Box sx={{ maxWidth: 300, mx: "auto", mb: 2 }}>
                <LinearProgress variant="determinate" value={Math.min(audioLevel * 100, 100)}
                  sx={{ height: 6, borderRadius: 3, backgroundColor: "#e2e8f0",
                    "& .MuiLinearProgress-bar": { borderRadius: 3,
                      background: voiceConfidence > 0.5 ? "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)" : "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)" } }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Voice Level: {Math.round(audioLevel * 100)}%</Typography>
                  <Typography variant="caption" sx={{ color: voiceConfidence > 0.5 ? "#16a34a" : "#64748b", fontWeight: voiceConfidence > 0.5 ? 600 : 400 }}>
                    {voiceConfidence > 0.5 ? "🟢 Voice Detected" : "⚪ No Voice"}
                  </Typography>
                </Box>
              </Box>
            )}

            {isRecording && silenceTimer > 0 && (
              <Box sx={{ maxWidth: 300, mx: "auto", mb: 2 }}>
                <LinearProgress variant="determinate" value={(silenceTimer / (SILENCE_CONFIG.SILENCE_DURATION_BY_ROUND[currentStage] || SILENCE_CONFIG.SILENCE_DURATION_MS)) * 100}
                  sx={{ height: 4, borderRadius: 2, backgroundColor: "#fef3c7",
                    "& .MuiLinearProgress-bar": { borderRadius: 2, background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" } }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  Silence detected: {(silenceTimer / 1000).toFixed(1)}s / {((SILENCE_CONFIG.SILENCE_DURATION_BY_ROUND[currentStage] || SILENCE_CONFIG.SILENCE_DURATION_MS) / 1000).toFixed(1)}s
                </Typography>
              </Box>
            )}

            <Button onClick={handleEndInterviewClick} disabled={isEndingInterview} startIcon={<StopCircle sx={{ fontSize: 18 }} />}
              sx={{ padding: "10px 20px", background: "transparent", border: "2px solid #fca5a5", borderRadius: "10px",
                color: "#dc2626", fontWeight: 600, fontSize: "13px", textTransform: "none",
                "&:hover": { background: "#fef2f2", borderColor: "#f87171" } }}>
              Terminate Session
            </Button>
          </Box>
        </Box>

        {/* Right Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Session Diagnostics */}
          <Box sx={{ background: "#fff", borderRadius: "16px", p: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: 2, fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
              <Settings sx={{ fontSize: 18, color: "#6366f1" }} /> Session Diagnostics
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Box sx={{ p: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", mb: "4px" }}>Audio Engine</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: audioInitialized ? "#22c55e" : "#f59e0b" }}>{audioInitialized ? "Ready" : "Calibrating..."}</Typography>
              </Box>
              <Box sx={{ p: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", mb: "4px" }}>Network Socket</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: isConnected ? "#22c55e" : "#f59e0b" }}>{isConnected ? "Connected" : "Connecting..."}</Typography>
              </Box>
              <Box sx={{ p: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", mb: "4px" }}>Voice Detection</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: voiceConfidence > 0.5 ? "#22c55e" : "#1e293b" }}>
                  {voiceConfidence > 0.5 ? "🟢 Active" : `Level: ${Math.round(audioLevel * 100)}%`}
                </Typography>
              </Box>
              <Box sx={{ p: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", mb: "4px" }}>Difficulty</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%",
                    background: currentDifficulty === "hard" ? "#ef4444" : currentDifficulty === "easy" ? "#22c55e" : "#f59e0b" }} />
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{currentDifficulty.toUpperCase()}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Conversation Tip / Check-in Hint */}
          {isWaitingForCheckinResponse ? (
            <Box sx={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", borderRadius: "12px", p: 2,
              display: "flex", gap: "12px", alignItems: "flex-start", border: "1px solid #fbbf24" }}>
              <Box sx={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f59e0b",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                <Lightbulb sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ fontSize: "14px", color: "#92400e" }}>
                  💡 Your Turn to Decide
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.5, fontSize: "13px", color: "#78350f" }}>
                  Say <strong>"next"</strong>, <strong>"that's all"</strong>, or <strong>"move on"</strong> when you're ready to continue.
                  Or keep talking if you want to add more!
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", borderRadius: "12px", p: 2,
              display: "flex", gap: "12px", alignItems: "flex-start", border: "1px solid #bfdbfe" }}>
              <Box sx={{ width: "36px", height: "36px", borderRadius: "10px", background: "#3b82f6",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                <Lightbulb sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ fontSize: "14px" }}>Conversation Tip</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: "13px" }}>
                  Try to maintain consistent eye contact with the camera. It demonstrates confidence and engagement.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Interview System Status */}
          <Box sx={{ background: "#fff", borderRadius: "16px", p: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: 2, fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
              <Box component="span" sx={{ fontSize: "18px" }}>✨</Box> Interview System Status
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: 2, flexWrap: "wrap" }}>
              <Chip icon={<Timer sx={{ fontSize: 16 }} />} label={`Time: ${formatTime(timeRemaining)}`} size="small"
                sx={{ background: "#1e40af", color: "#fff", fontWeight: 600, "& .MuiChip-icon": { color: "#fff" } }} />
              <Chip label={`Phase: ${stageConfig.label}`} size="small" sx={{ background: "#16a34a", color: "#fff", fontWeight: 600 }} />
              <Chip icon={<CheckCircle sx={{ fontSize: 16 }} />} label={isConnected ? "WebSocket: Connected" : "WebSocket: Disconnected"} size="small"
                sx={{ background: "#f1f5f9", color: isConnected ? "#475569" : "#dc2626", fontWeight: 600,
                  "& .MuiChip-icon": { color: isConnected ? "#16a34a" : "#dc2626" } }} />
            </Box>
            <Box sx={{ background: "#f0fdf4", borderRadius: "12px", p: "16px", border: "1px solid #bbf7d0" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "12px", fontWeight: 700, fontSize: "14px", color: "#166534" }}>
                <CheckCircle sx={{ fontSize: 20, color: "#16a34a" }} /> Natural Conversation Flow:
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", pl: "28px" }}>
                <Typography sx={{ fontSize: "13px", color: "#15803d" }}>
                  <Box component="span" sx={{ mr: 1 }}>🎯</Box>
                  <Box component="span" sx={{ fontWeight: 600 }}>Waiting:</Box> Start speaking when ready, system listens patiently
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#15803d" }}>
                  <Box component="span" sx={{ mr: 1 }}>🗣️</Box>
                  <Box component="span" sx={{ fontWeight: 600 }}>Speaking:</Box> Talk as long as you need
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#15803d" }}>
                  <Box component="span" sx={{ mr: 1 }}>⏹️</Box>
                  {/* <Box component="span" sx={{ fontWeight: 600 }}>Finished:</Box> {currentStage === "technical" ? "12" : currentStage === "hr" ? "8" : "5"} seconds of voice silence → Next question
                   */}
                   <Box component="span" sx={{ fontWeight: 600 }}>Finished:</Box> 4 seconds of voice silence → Next question
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Round Transition Dialog */}
      <Dialog open={showRoundTransition} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", p: 2 } }}>
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h2" gutterBottom>{stageConfig.icon}</Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom>{transitionMessage}</Typography>
          <Typography variant="body1" color="text.secondary">{stageConfig.description}</Typography>
          <CircularProgress sx={{ mt: 3, color: "#6366f1" }} />
        </DialogContent>
      </Dialog>
      {/* ===== BIOMETRIC: Proctoring Warning Toasts ===== */}
      {proctorWarnings.length > 0 && (
        <Box sx={{
          position: 'fixed', top: 80, right: 20, zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: '8px',
          maxWidth: 380,
        }}>
          {proctorWarnings.map((warning, idx) => (
            <Alert
              key={`${warning.timestamp}-${idx}`}
              severity="warning"
              variant="filled"
              sx={{
                borderRadius: '12px',
                animation: 'slideInRight 0.3s ease-out',
                boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
                '& .MuiAlert-message': { fontWeight: 600, fontSize: '13px' },
              }}
              icon={
                warning.type === 'phone' ? <span style={{ fontSize: 20 }}>📱</span>
                : warning.type === 'head_turn' ? <span style={{ fontSize: 20 }}>👀</span>
                : warning.type === 'voice' ? <span style={{ fontSize: 20 }}>🎤</span>
                : <Warning sx={{ fontSize: 20 }} />
              }
            >
              {warning.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* ===== BIOMETRIC: Session Termination Dialog ===== */}
      <Dialog
        open={showTerminationDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 2 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '16px',
            background: '#fef2f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <StopCircle sx={{ fontSize: 40, color: '#dc2626' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="error">
            Interview Terminated
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ borderRadius: '10px', mb: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              {terminationMessage}
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {terminationReason === 'phone_detected'
              ? 'Your session was terminated because a phone was repeatedly detected in your camera frame.'
              : terminationReason === 'head_turn'
              ? 'Your session was terminated because you were repeatedly looking away from the screen.'
              : terminationReason === 'voice_mismatch'
              ? 'Your session was terminated because the voice detected did not match your registered voice profile.'
              : 'Your session was terminated due to repeated proctoring violations.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/student/mock-interviews', {
              state: { message: 'Interview terminated due to proctoring violation', type: 'error' }
            })}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              px: 4,
            }}
          >
            Back to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
      {/* End Interview Confirmation */}
      <Dialog open={showEndConfirmation} onClose={() => setShowEndConfirmation(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 2 } }}>
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "16px", background: "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Warning sx={{ fontSize: 36, color: "#dc2626" }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>End Interview?</Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: "10px" }}>
            <Typography variant="body2">This action cannot be undone. Your progress will be saved and you'll be redirected to results.</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button variant="outlined" onClick={() => setShowEndConfirmation(false)} sx={{ borderRadius: "10px", textTransform: "none", flex: 1 }}>
            Continue Interview
          </Button>
          <Button variant="contained" color="error" onClick={confirmEndInterview} startIcon={<Stop />}
            sx={{ borderRadius: "10px", textTransform: "none", flex: 1 }}>
            End Interview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StartInterview;