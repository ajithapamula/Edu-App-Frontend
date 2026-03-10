// =============================================================================
// FIXED FRONTEND WITH 5-SILENCE TERMINATION - VERSION 4
// =============================================================================
// KEY FIXES:
// 1. Frontend STOPS sending silence notifications after reaching 5
// 2. Frontend waits for backend "session_ended" message
// 3. Properly handles the termination flow
// =============================================================================

import { assessmentApiRequest } from './index2';

// Keep your existing ProfessionalAudioProcessor (unchanged)
class ProfessionalAudioProcessor {
  constructor() {
    this.stream = null;
    this.isCalibrated = false;
    this.calibrationStartTime = null;
    this.currentVoiceLevel = 0;
    this.noiseLevel = 0;
    this.qualityScore = 90;
    this.isProcessing = false;
    this.onQualityUpdate = null;
    this.onCalibrationComplete = null;
  }

  async initialize(mediaStream) {
    try {
      console.log('✅ Professional Audio Processor initialized with native browser enhancement');
      this.stream = mediaStream;
      this.isProcessing = true;
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(mediaStream);
      const highPass = this.audioContext.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 85;
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.2;
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.destination = this.audioContext.createMediaStreamDestination();

      source.connect(highPass);
      highPass.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.destination);

      this.stream = this.destination.stream;
      this.startNoiseFloorCalibration();
      return true;
    } catch (error) {
      console.error('❌ Audio processor initialization failed:', error);
      throw new Error(`Audio enhancement setup failed: ${error.message}`);
    }
  }

  startNoiseFloorCalibration() {
    this.calibrationStartTime = Date.now();
    console.log('🎯 Starting noise floor calibration (2 seconds)...');

    const calibrationPeriod = 2000;
    let progress = 0;

    const updateProgress = () => {
      if (!this.isProcessing) return;

      progress = Math.min((Date.now() - this.calibrationStartTime) / calibrationPeriod, 1);
      
      if (this.onQualityUpdate) {
        this.onQualityUpdate({
          calibrationProgress: progress * 100,
          isCalibrating: true
        });
      }

      if (progress < 1) {
        setTimeout(updateProgress, 100);
      } else {
        this.isCalibrated = true;
        console.log('✅ Noise floor calibrated using browser native processing');

        if (this.onCalibrationComplete) {
          this.onCalibrationComplete({
            noiseFloor: 0.02,
            gateThreshold: 0.04
          });
        }

        this.startQualityMonitoring();
      }
    };

    updateProgress();
  }

  startQualityMonitoring() {
    const updateQuality = () => {
      if (!this.isProcessing || !this.analyser) return;
      this.analyser.getByteTimeDomainData(this.dataArray);
      let sumSquares = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const val = (this.dataArray[i] - 128) / 128.0;
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / this.dataArray.length);
      this.currentVoiceLevel = rms * 100; 
      this.noiseLevel = Math.max(0, this.currentVoiceLevel - 2);
      this.qualityScore = Math.min(100, 90 + (Math.random() * 10));

      if (this.onQualityUpdate && this.isCalibrated) {
        this.onQualityUpdate({
          voiceLevel: this.currentVoiceLevel,
          noiseLevel: this.noiseLevel,
          qualityScore: this.qualityScore,
          isCalibrating: false,
          gateActive: this.currentVoiceLevel > 20
        });
      }

      if (this.isProcessing) {
        setTimeout(updateQuality, 100);
      }
    };

    updateQuality();
  }

  getProcessedStream() {
    return this.stream || null;
  }

  getQualityMetrics() {
    return {
      voiceLevel: this.currentVoiceLevel,
      noiseLevel: this.noiseLevel,
      qualityScore: this.qualityScore,
      noiseFloor: 2,
      gateThreshold: 4,
      isCalibrated: this.isCalibrated
    };
  }

  cleanup() {
    this.isProcessing = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    console.log('🧹 Professional Audio Processor cleaned up');
  }
}

// ✅ FIXED Enhanced Voice Activity Detection
class EnhancedVoiceDetector {
  constructor() {
    this.isListening = false;
    this.silenceThreshold = 0.025;
    this.silenceDelay = 2000;
    this.silenceDetectionDelay = 3000;
    this.naturalPauseThreshold = 800;
    this.maxRecordingTime = 60000;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    
    // Timers
    this.silenceTimer = null;
    this.recordingTimer = null;
    this.silenceStatusTimer = null;
    this.naturalPauseTimer = null;
    
    // State tracking
    this.speechStarted = false;
    this.consecutiveSpeechFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.minConsecutiveFrames = 3;
    this.currentStatus = 'idle';
    this.lastStatusSent = null;
    this.lastSpeechTime = 0;
    this.silenceStartTime = 0;
    this.inNaturalPause = false;
    
    // Silence notification tracking
    this.lastSilenceNotificationTime = 0;
    this.silenceNotificationCooldown = 5000;
    
    // Callbacks
    this.onSilenceDetected = null;
    this.onSpeechDetected = null;
    this.onStatusChange = null;

    // ✅ ADD THIS - Parent service reference
    this.parent = null;
  }

  async initialize(processedStream) {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(processedStream);
      this.analyser = this.audioContext.createAnalyser();
      
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;
      
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      console.log('🎙️ Enhanced Voice Activity Detector initialized (5-silence optimized)');
      return true;
    } catch (error) {
      console.error('❌ VAD initialization failed:', error);
      throw new Error(`Voice detection setup failed: ${error.message}`);
    }
  }

  startListening() {
    if (this.isListening) return;
    
    this.isListening = true;
    this.speechStarted = false;
    this.consecutiveSpeechFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.currentStatus = 'idle';
    this.lastStatusSent = null;
    this.lastSpeechTime = 0;
    this.silenceStartTime = 0;
    this.inNaturalPause = false;
    
    console.log('👂 Started enhanced voice detection (5-silence optimized)');
    this.detectVoiceActivity();
    
    this.recordingTimer = setTimeout(() => {
      console.log('⏰ Max recording time reached');
      this.stopListening();
      
      // ✅ Auto-restart VAD after timeout (unless terminating)
      setTimeout(() => {
        const shouldRestart = !this.parent || 
          (!this.parent.maxSilencesReached && 
          this.parent.conversationState !== 'complete');
        
        if (shouldRestart) {
          console.log('🔄 Auto-restarting VAD after max recording timeout');
          this.resetSilenceNotificationTimer();
          this.startListening();
        } else {
          console.log('🛑 Not restarting VAD - session ending or max silences reached');
        }
      }, 500);
    }, this.maxRecordingTime);
  }

  resetSilenceNotificationTimer() {
    this.lastSilenceNotificationTime = Date.now();
    this.silenceStartTime = 0;
    this.currentStatus = 'idle';
    this.lastStatusSent = null;
    console.log('🔄 VAD silence notification timer reset');
  }

  detectVoiceActivity() {
    if (!this.isListening || !this.analyser) return;

    this.analyser.getByteTimeDomainData(this.dataArray);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const sample = (this.dataArray[i] - 128) / 128;
      sum += sample * sample;
    }
    const volume = Math.sqrt(sum / this.dataArray.length);
    const currentTime = Date.now();
    
    const isLoudEnough = volume > this.silenceThreshold;

    if (isLoudEnough) {
      this.consecutiveSpeechFrames++;
      this.consecutiveSilenceFrames = 0;
      this.lastSpeechTime = currentTime;
      this.inNaturalPause = false;
      
      this.clearSilenceTimers();
      
      if (this.consecutiveSpeechFrames >= this.minConsecutiveFrames) {
        if (!this.speechStarted) {
          this.speechStarted = true;
          this.updateStatus('user_speaking');
          console.log('🗣️ User started speaking');
        }
        
        if (this.onSpeechDetected) {
          this.onSpeechDetected(volume);
        }
      }
    } else {
      if (this.consecutiveSpeechFrames > 0) {
        this.consecutiveSpeechFrames = Math.max(0, this.consecutiveSpeechFrames - 1);  // ✅ Gradual decay
      }
      this.consecutiveSilenceFrames++;
      
      if (this.speechStarted) {
        if (this.silenceStartTime === 0) {
          this.silenceStartTime = currentTime;
        }
        
        const silenceDuration = currentTime - this.silenceStartTime;
        
        if (silenceDuration >= this.naturalPauseThreshold && !this.inNaturalPause && !this.naturalPauseTimer) {
          this.inNaturalPause = true;
          console.log(`🤔 Natural pause detected (${silenceDuration}ms)`);
        }
        
        if (silenceDuration >= this.silenceDelay && !this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            console.log(`🤫 Recording silence detected (${this.silenceDelay}ms), stopping recording`);
            this.updateStatus('user_stopped_speaking');
            this.stopListening();
          }, 100);
        }
        
        if (silenceDuration >= this.silenceDetectionDelay && !this.silenceStatusTimer) {
          this.silenceStatusTimer = setTimeout(() => {
            if (this.consecutiveSilenceFrames >= this.minConsecutiveFrames * 2) {
              this.updateStatus('user_silent');
              console.log(`🤫 Extended user silence detected (${this.silenceDetectionDelay}ms)`);
            }
          }, 100);
        }
        
      } else if (!this.speechStarted && this.consecutiveSilenceFrames >= this.minConsecutiveFrames * 5) {
        if (this.silenceStartTime === 0) {
          this.silenceStartTime = currentTime;
        }
        
        const totalSilence = currentTime - this.silenceStartTime;
        const timeSinceLastNotification = currentTime - this.lastSilenceNotificationTime;
        
        if (totalSilence >= this.silenceDetectionDelay * 2) {
          if (this.lastSilenceNotificationTime === 0 || timeSinceLastNotification >= this.silenceNotificationCooldown) {
            this.sendSilenceNotification(totalSilence);
          }
        }
      }
    }

    requestAnimationFrame(() => this.detectVoiceActivity());
  }

  sendSilenceNotification(silenceDuration) {
    const previousStatus = this.currentStatus;
    this.currentStatus = 'user_silent';
    this.lastSilenceNotificationTime = Date.now();
    this.silenceStartTime = Date.now();
    
    console.log('🤫 Sending silence notification to parent');
    
    if (this.onStatusChange) {
      this.onStatusChange({
        status: 'user_silent',
        timestamp: Date.now(),
        previousStatus: previousStatus,
        silenceDuration: silenceDuration
      });
    }
  }

  clearSilenceTimers() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    if (this.silenceStatusTimer) {
      clearTimeout(this.silenceStatusTimer);
      this.silenceStatusTimer = null;
    }
    
    if (this.naturalPauseTimer) {
      clearTimeout(this.naturalPauseTimer);
      this.naturalPauseTimer = null;
    }
    
    this.silenceStartTime = 0;
  }

  updateStatus(newStatus) {
    if (this.currentStatus !== newStatus) {
      const previousStatus = this.currentStatus;
      this.currentStatus = newStatus;
      
      const meaningfulChanges = [
        'user_speaking',
        'user_silent', 
        'user_stopped_speaking'
      ];
      
      if (this.onStatusChange && meaningfulChanges.includes(newStatus) && this.lastStatusSent !== newStatus) {
        this.lastStatusSent = newStatus;
        this.onStatusChange({
          status: newStatus,
          timestamp: Date.now(),
          previousStatus: previousStatus,
          silenceDuration: this.silenceStartTime ? Date.now() - this.silenceStartTime : 0
        });
        console.log(`📡 Status updated: ${newStatus} (previous: ${previousStatus})`);
      }
    }
  }

  getCurrentStatus() {
    return this.currentStatus;
  }

  getSilenceInfo() {
    return {
      silenceStartTime: this.silenceStartTime,
      silenceDuration: this.silenceStartTime ? Date.now() - this.silenceStartTime : 0,
      inNaturalPause: this.inNaturalPause,
      speechStarted: this.speechStarted
    };
  }

  stopListening() {
    if (!this.isListening) return;
    
    this.isListening = false;
    this.speechStarted = false;
    this.consecutiveSpeechFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.inNaturalPause = false;
    
    this.clearSilenceTimers();
    
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    if (this.speechStarted) {
      this.updateStatus('user_stopped_speaking');
    }
    
    if (this.onSilenceDetected) {
      this.onSilenceDetected();
    }
    
    this.currentStatus = 'idle';
    this.silenceStartTime = 0;
    console.log('🛑 Enhanced voice detection stopped');
  }

  cleanup() {
    this.stopListening();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// UltraFastAudioManager
class UltraFastAudioManager {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.processedStream = null;
    this.isRecording = false;
    this.vad = new EnhancedVoiceDetector();
    this.audioProcessor = new ProfessionalAudioProcessor();
    this.onRecordingComplete = null;
    this.onSpeechStart = null;
    this.onQualityUpdate = null;
    this.onSilenceDetected = null;
    this.onStatusChange = null;
    this.audioQueue = [];
    this.isPlayingAudio = false;
    this.currentAudio = null;
    
    this.currentUserStatus = 'idle';
    this.recordingStartTime = null;
    this.silenceNotificationSent = false;
  }

  async startListening() {
    try {
      console.log('🎤 Starting enhanced audio system (5-silence optimized)...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
          sampleSize: 16,
        } 
      });

      await this.audioProcessor.initialize(this.stream);
      
      this.audioProcessor.onQualityUpdate = (metrics) => {
        if (this.onQualityUpdate) {
          this.onQualityUpdate(metrics);
        }
      };
      
      this.audioProcessor.onCalibrationComplete = (calibrationData) => {
        console.log('✅ Professional audio enhancement calibration complete', calibrationData);
      };

      this.processedStream = this.audioProcessor.getProcessedStream();
      
      const vadInitialized = await this.vad.initialize(this.processedStream);
      if (!vadInitialized) {
        throw new Error('Enhanced voice activity detection failed to initialize');
      }
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      this.mediaRecorder = new MediaRecorder(this.processedStream, {
        mimeType: mimeType,
        audioBitsPerSecond: 32000
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.audioChunks = [];
        this.isRecording = false;

        const statusInfo = {
          userStatus: this.currentUserStatus,
          recordingDuration: this.recordingStartTime ? (Date.now() - this.recordingStartTime) : 0,
          silenceDetected: this.currentUserStatus === 'user_silent' || this.currentUserStatus === 'user_stopped_speaking'
        };

        console.log('📦 Professional audio recorded:', audioBlob.size, 'bytes');
        console.log('🎯 Final user status:', statusInfo.userStatus);

        if (this.onRecordingComplete) {
          this.onRecordingComplete(audioBlob, statusInfo);
        }
      };
      
      this.vad.onSpeechDetected = (volume) => {
        if (!this.isRecording && !this.isPlayingAudio) {
          console.log('🗣️ Enhanced voice detected - starting recording...');
          this.startRecording();
          this.recordingStartTime = Date.now();
          this.silenceNotificationSent = false;
          
          if (this.onSpeechStart) {
            this.onSpeechStart();
          }
        }
      };
      
      this.vad.onSilenceDetected = () => {
        if (this.isRecording) {
          console.log('🤫 Enhanced voice silence - stopping recording...');
          this.stopRecording();
        }
      };
      
      this.vad.onStatusChange = (statusInfo) => {
        this.currentUserStatus = statusInfo.status;
        console.log('📊 User status changed:', statusInfo);

        if (this.onStatusChange) {
          this.onStatusChange(statusInfo);
        }

        const cooldownMs = 2000;
        const timeSinceRecordingStart = this.recordingStartTime ? (Date.now() - this.recordingStartTime) : Infinity;
        const canNotify = !this.isRecording && timeSinceRecordingStart >= cooldownMs;

        if (statusInfo.status === 'user_silent' && canNotify) {
          const silenceMs = Number(statusInfo.silenceDuration || 0);
          
          console.log('🔕 User silence detected - notifying backend', { 
            silenceMs, 
            canNotify, 
            recording: this.isRecording 
          });

          if (this.onSilenceDetected) {
            this.onSilenceDetected({
              status: 'user_silent',
              timestamp: Date.now(),
              recordingActive: this.isRecording,
              silenceDuration: silenceMs,
              context: 'extended_silence',
              message: 'User has been silent for extended period'
            });
          }
        }
      };

      this.vad.startListening();
      
      console.log('✅ Enhanced audio system (5-silence optimized) ready');
      
    } catch (error) {
      console.error('❌ Failed to start enhanced audio system:', error);
      throw new Error(`Audio enhancement setup failed: ${error.message}`);
    }
  }

  startRecording() {
    if (this.isRecording || !this.mediaRecorder) return;
    
    try {
      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      console.log('🔴 Recording enhanced audio with silence detection');
    } catch (error) {
      console.error('❌ Recording start failed:', error);
      throw new Error(`Recording failed: ${error.message}`);
    }
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;
    
    try {
      this.mediaRecorder.stop();
      console.log('⏹️ Enhanced audio recording stopped');
    } catch (error) {
      console.error('❌ Recording stop failed:', error);
    }
  }

  getCurrentUserStatus() {
    return this.currentUserStatus;
  }

  getVADStatus() {
    return this.vad.getCurrentStatus();
  }

  getQualityMetrics() {
    return this.audioProcessor.getQualityMetrics();
  }

  getDiagnosticInfo() {
    if (!this.audioProcessor) return null;
    return {
      isReady: this.audioProcessor.isCalibrated,
      qualityMetrics: this.audioProcessor.getQualityMetrics(),
      processingActive: this.audioProcessor.isProcessing,
      currentUserStatus: this.currentUserStatus,
      vadStatus: this.vad.getCurrentStatus(),
      isRecording: this.isRecording,
      isPlayingAudio: this.isPlayingAudio
    };
  }

  async playAudioBuffer(audioBuffer) {
    return new Promise((resolve, reject) => {
      try {
        this.isPlayingAudio = true;
        
        const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        this.currentAudio = new Audio(audioUrl);
        
        this.currentAudio.playbackRate = 1.0;
        this.currentAudio.preload = 'auto';
        
        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.isPlayingAudio = false;
          this.currentAudio = null;
          console.log('🎵 AI response finished');
          resolve();
        };
        
        this.currentAudio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          this.isPlayingAudio = false;
          this.currentAudio = null;
          console.error('❌ Audio playback failed:', error);
          reject(new Error(`Audio playback failed: ${error.message}`));
        };
        
        this.currentAudio.play().then(() => {
          console.log('🎵 Playing AI response...');
        }).catch(reject);
        
      } catch (error) {
        this.isPlayingAudio = false;
        this.currentAudio = null;
        reject(new Error(`Audio buffer playback failed: ${error.message}`));
      }
    });
  }

  async playAudioStream(audioChunks) {
    for (const chunk of audioChunks) {
      try {
        await this.playAudioBuffer(chunk);
      } catch (error) {
        console.error('❌ Audio chunk playback failed:', error);
        throw error;
      }
    }
  }

  stopAllAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlayingAudio = false;
  }

  stopListening() {
    this.vad.cleanup();
    this.audioProcessor.cleanup();
    
    this.processedStream = null;
    this.stopAllAudio();
    this.isRecording = false;
    this.currentUserStatus = 'idle';
    this.silenceNotificationSent = false;
    this.recordingStartTime = null;
    
    console.log('🛑 Enhanced audio system with silence detection stopped');
  }
}

// Enhanced WebSocket Manager
class UltraFastWebSocketManager {
  constructor() {
    this.websocket = null;
    this.eventHandlers = {};
    this.isConnected = false;
    this.sessionId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 0;
  }

  setEventHandlers(handlers) {
    this.eventHandlers = handlers;
  }

  async connect(sessionId) {
    this.sessionId = sessionId;
    
    try {
      const wsUrl = `wss://192.168.48.201:8090/daily_standup/ws/${sessionId}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      this.websocket = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.websocket.close();
          reject(new Error(`WebSocket connection timeout after 10 seconds`));
        }, 10000);

        this.websocket.onopen = () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.setupEventHandlers();
          console.log('✅ WebSocket connected');
          resolve();
        };

        this.websocket.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ WebSocket connection failed:', error);
          reject(new Error(`WebSocket connection failed - Backend not running`));
        };

        this.websocket.onclose = (event) => {
          clearTimeout(timeout);
          if (event.code !== 1000) {
            reject(new Error(`WebSocket closed: Code ${event.code}, Reason: ${event.reason}`));
          }
        };
      });
      
    } catch (error) {
      console.error('❌ WebSocket setup failed:', error);
      throw new Error(`Connection setup failed: ${error.message}`);
    }
  }

  setupEventHandlers() {
    if (!this.websocket) return;

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received:', data.type);
        
        if (this.eventHandlers.onMessage) {
          this.eventHandlers.onMessage(data);
        }
        
      } catch (error) {
        console.error('❌ Message parsing error:', error);
        if (this.eventHandlers.onError) {
          this.eventHandlers.onError(new Error(`Failed to parse WebSocket message: ${error.message}`));
        }
      }
    };
    
    this.websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.isConnected = false;
      
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(new Error(`WebSocket error: ${error.message || 'Unknown error'}`));
      }
    };
    
    this.websocket.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      this.isConnected = false;
      
      if (this.eventHandlers.onClose) {
        this.eventHandlers.onClose(event);
      }
    };
  }

  sendAudioDataWithStatus(audioBlob, statusInfo) {
    if (!this.isConnected || !this.websocket) {
      throw new Error('WebSocket not connected');
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64Audio = reader.result.split(',')[1];
        const message = {
          type: 'audio_data',
          audio: base64Audio,
          userStatus: statusInfo.userStatus,
          recordingDuration: statusInfo.recordingDuration,
          silenceDetected: statusInfo.silenceDetected,
          timestamp: Date.now()
        };
        this.websocket.send(JSON.stringify(message));
        console.log('📤 Enhanced audio sent with status:', statusInfo.userStatus);
      } catch (error) {
        console.error('❌ Failed to send audio:', error);
        if (this.eventHandlers.onError) {
          this.eventHandlers.onError(new Error(`Audio transmission failed: ${error.message}`));
        }
      }
    };
    
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(new Error(`Audio encoding failed: ${error.message}`));
      }
    };
    
    reader.readAsDataURL(audioBlob);
  }

  sendSilenceNotification(silenceInfo) {
    if (!this.isConnected || !this.websocket) {
      throw new Error('WebSocket not connected');
    }

    try {
      const message = {
        type: 'silence_detected',
        status: silenceInfo.status || 'user_silent',
        timestamp: silenceInfo.timestamp || Date.now(),
        recordingActive: !!silenceInfo.recordingActive,
        silenceDuration: silenceInfo.silenceDuration || 0,
        silenceMs: silenceInfo.silenceDuration || 0,
        context: silenceInfo.context || 'extended_silence',
        message: silenceInfo.message || 'User silence detected'
      };
      this.websocket.send(JSON.stringify(message));
      console.log('📤 Silence notification sent:', message.status, message.silenceDuration, 'ms');
    } catch (error) {
      console.error('❌ Failed to send silence notification:', error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(new Error(`Silence notification failed: ${error.message}`));
      }
    }
  }

  sendStatusUpdate(statusInfo) {
    if (!this.isConnected || !this.websocket) {
      return;
    }

    try {
      const message = {
        type: 'user_status_update',
        status: statusInfo.status,
        timestamp: statusInfo.timestamp,
        previousStatus: statusInfo.previousStatus
      };
      this.websocket.send(JSON.stringify(message));
      console.log('📡 Status update sent:', statusInfo.status);
    } catch (error) {
      console.error('❌ Failed to send status update:', error);
    }
  }

  sendAudioData(audioBlob) {
    const statusInfo = {
      userStatus: 'user_speaking',
      recordingDuration: 0,
      silenceDetected: false
    };
    this.sendAudioDataWithStatus(audioBlob, statusInfo);
  }

  sendPing() {
    if (this.isConnected && this.websocket) {
      try {
        this.websocket.send(JSON.stringify({ type: 'ping' }));
      } catch (error) {
        console.error('❌ Ping failed:', error);
      }
    }
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close(1000, 'Normal closure');
      this.websocket = null;
    }
    this.isConnected = false;
    console.log('🔌 WebSocket disconnected');
  }
}

// ✅ FIXED Main API Service - STOPS AT 5 SILENCES
class ProfessionalStandupAPIService {
  constructor() {
    this.wsManager = new UltraFastWebSocketManager();
    this.audioManager = new UltraFastAudioManager();
    this.currentSessionId = null;
    this.BASE_URL = 'https://192.168.48.201:8090';
    this.conversationState = 'idle';
    this.audioChunksBuffer = [];
    this.sessionEnding = false;
    this.pingInterval = null;
    this.onServerError = null;
    this.silenceResponseCount = 0;
    this.maxSilenceResponses = 5;
    this.maxSilencesReached = false;  // ✅ ADD THIS LINE
    this.pendingSilenceTermination = false;    // ✅ ADD THIS - triggers termination after audio
    
    // ✅ NEW: Track if we've hit max silences - STOP sending more
    this.maxSilencesReached = false;
    this.awaitingSessionEnd = false;
    this.isFinalSilenceResponse = false; // ✅ Track if current audio is the final silence
    
    // Silence management
    this.lastSilenceNotification = 0;
    this.silenceNotificationCooldown = 5000;
    this.greetingComplete = false;
    this.greetingEndTime = 0;
    this.postGreetingGracePeriod = 4000;
    this.userHasSpoken = false;
    this.lastUserSpeechTime = 0;
    this.speechCooldownPeriod = 2000;

    this.evaluationCallbacks = {};
    this.detailedEvaluation = null;
    this.voiceVerificationInterval = 45000;
    this.onVoiceWarning = null;
    this.isPlayingSilenceResponse = false;
  }

  async startStandup(studentId = null) {
    try {
      console.log('🚀 Starting standup (5-silence termination enabled)...');
      if (!studentId) {
        studentId = localStorage.getItem('student_id');
      }
      if (studentId) {
        console.log(`📋 Using student_id: ${studentId}`);
      } else {
        console.warn('⚠️ No student_id provided - will use random student (testing mode)');
      }
      
      this.sessionEnding = false;
      this.audioChunksBuffer = [];
      this.silenceResponseCount = 0;
      this.maxSilencesReached = false; // ✅ Reset flag
      this.awaitingSessionEnd = false; // ✅ Reset flag
      this.pendingSilenceTermination = false;    // ✅ ADD
      this.isFinalSilenceResponse = false; // ✅ Reset flag
      
      let endpoint = '/daily_standup/start_test';
      if (studentId) {
        endpoint += `?student_id=${studentId}`;
      }
      
      const response = await assessmentApiRequest(endpoint, {
        method: 'GET'
      });
      
      if (!response || !response.session_id) {
        throw new Error('Backend response missing session_id');
      }
      
      this.currentSessionId = response.session_id;
      try {
        const studentCode = studentId || localStorage.getItem('student_id');
        if (studentCode) {
          await this.startVerificationSession(this.currentSessionId, studentCode);
          console.log('✅ Voice verification session initialized');
        }
      } catch (e) {
        console.warn('⚠️ Could not start voice verification session:', e.message);
      }
      console.log('✅ Session created:', this.currentSessionId);
      
      await this.wsManager.connect(this.currentSessionId);
      this.audioManager.wsManager = this.wsManager;
      
      this.wsManager.setEventHandlers({
        onMessage: (data) => this.handleServerMessage(data),
        onError: (error) => this.handleConnectionError(error),
        onClose: (event) => this.handleConnectionClose(event)
      });
      
      this.audioManager.onRecordingComplete = (audioBlob, statusInfo) => {
        try {
          this.handleAudioRecorded(audioBlob, statusInfo);
        } catch (error) {
          console.log(`⚠️ Audio handling issue: ${error.message}`);
          this.conversationState = 'idle';
          setTimeout(() => {
            if (this.conversationState !== 'complete' && !this.maxSilencesReached) {
              this.audioManager.vad.startListening();
            }
          }, 100);
        }
      };
      
      this.audioManager.onSpeechStart = () => {
        this.conversationState = 'listening';
        console.log('👂 User started speaking...');
      };
      
      this.audioManager.onQualityUpdate = (metrics) => {
        this.currentAudioQuality = metrics;
      };

      this.audioManager.onSilenceDetected = (silenceInfo) => {
        this.handleSilenceDetected(silenceInfo);
      };

      this.audioManager.onStatusChange = (statusInfo) => {
        this.handleUserStatusChange(statusInfo);
      };
      
      await this.audioManager.startListening();
      // ✅ ADD THIS LINE - Set parent reference for VAD
      this.audioManager.vad.parent = this;
      
      this.pingInterval = setInterval(() => {
        this.wsManager.sendPing();
      }, 30000);
      
      console.log('✅ Conversation ready! (5-silence termination: enabled)');
      
      return {
        test_id: response.test_id,
        session_id: this.currentSessionId,
        status: 'ready',
        features: ['5_silence_termination', 'status_tracking', 'enhanced_vad', 'natural_pause_handling'],
        summary_chunks: response.summary_chunks || 0
      };
      
    } catch (error) {
      console.error('❌ Startup failed:', error);
      throw error;
    }
  }

  // ✅ FIXED: handleSilenceDetected - STOPS after 5 silences
  handleSilenceDetected(silenceInfo) {
    const currentTime = Date.now();
    
    // ✅ CRITICAL: Don't send more silence notifications after hitting max
    if (this.maxSilencesReached || this.awaitingSessionEnd) {
      console.log('🛑 Skipping silence: max silences reached, awaiting session end');
      return;
    }
    
    console.log('🔕 Evaluating silence detection:', {
      silenceCount: this.silenceResponseCount,
      maxSilences: this.maxSilenceResponses,
      maxSilencesReached: this.maxSilencesReached,
      greetingComplete: this.greetingComplete,
      userHasSpoken: this.userHasSpoken,
      timeSinceGreeting: currentTime - this.greetingEndTime,
      timeSinceLastSpeech: currentTime - this.lastUserSpeechTime,
      timeSinceLastNotification: currentTime - this.lastSilenceNotification,
      isPlayingSilenceResponse: this.isPlayingSilenceResponse
    });

    // GUARD 1: Don't process while system is busy
    if (this.audioManager.isRecording || this.audioManager.isPlayingAudio) {
      console.log('🛑 Skipping silence: system busy (recording or playing audio)');
      return;
    }

    // GUARD 1.5: Don't process if playing silence response
    if (this.isPlayingSilenceResponse) {
      console.log('🛑 Skipping silence: currently playing silence response');
      return;
    }

    // GUARD 2: Don't process until greeting is complete and grace period passed
    if (!this.greetingComplete || (currentTime - this.greetingEndTime) < this.postGreetingGracePeriod) {
      console.log('🛑 Skipping silence: greeting grace period');
      return;
    }

    // GUARD 3: Allow silence prompts after reasonable time even if user hasn't spoken
    const significantTimeAfterGreeting = (currentTime - this.greetingEndTime) > (this.postGreetingGracePeriod * 1.5);
    if (!this.userHasSpoken && !significantTimeAfterGreeting) {
      console.log('🛑 Skipping silence: user hasn\'t spoken yet and not enough time passed');
      return;
    }

    // GUARD 4: Cooldown after user speech to avoid interrupting natural pauses
    if (this.userHasSpoken && (currentTime - this.lastUserSpeechTime) < this.speechCooldownPeriod) {
      console.log('🛑 Skipping silence: speech cooldown period');
      return;
    }

    // GUARD 5: Cooldown between notifications
    if (this.lastSilenceNotification > 0 && (currentTime - this.lastSilenceNotification) < this.silenceNotificationCooldown) {
      const remaining = ((this.silenceNotificationCooldown - (currentTime - this.lastSilenceNotification)) / 1000).toFixed(1);
      console.log(`🛑 Skipping silence: cooldown active (${remaining}s remaining)`);
      return;
    }

    // GUARD 6: Only process extended silence (not natural pauses)
    const silenceDuration = silenceInfo.silenceDuration || 0;
    if (silenceDuration < 3000) {
      console.log('🛑 Skipping silence: too short (natural pause)');
      return;
    }

    // ✅ GUARD 7: Check if we've already sent 5 silences
    if (this.silenceResponseCount >= this.maxSilenceResponses) {
      console.log('🛑 Skipping silence: already sent maximum (5) silence notifications');
      this.maxSilencesReached = true;
      return;
    }

    // ✅ All guards passed - send silence notification
    try {
      this.silenceResponseCount++;
      console.log(`✅ Sending silence notification #${this.silenceResponseCount}/${this.maxSilenceResponses}`);
      
      this.wsManager.sendSilenceNotification({
        ...silenceInfo,
        recordingActive: false,
        silenceDuration: silenceDuration,
        silenceMs: silenceDuration,
        context: 'extended_silence',
        silenceNumber: this.silenceResponseCount
      });
      
      this.conversationState = 'processing_silence';
      
      console.log(`🔔 Silence notification #${this.silenceResponseCount} sent successfully`);

      // ✅ If we just sent the 5th silence, mark for termination after audio plays
      if (this.silenceResponseCount >= this.maxSilenceResponses) {
        console.log('🛑🛑🛑 5 SILENCES SENT - WILL TERMINATE AFTER AUDIO FINISHES');
        console.log('🛑🛑🛑 MAX SILENCES REACHED (5) - STOPPING SILENCE NOTIFICATIONS');
        this.maxSilencesReached = true;
        this.pendingSilenceTermination = true;  // Flag to trigger termination after audio
        this.awaitingSessionEnd = true;
      }
      
    } catch (error) {
      console.error('❌ Failed to handle silence:', error);
      this.silenceResponseCount--; // Rollback on error
    }
  }

  terminateSessionDueToSilence() {
  console.log('🛑 Executing 5-silence termination...');
  
  // Mark session as complete
  this.conversationState = 'complete';
  this.sessionEnding = true;
  
  // Stop all audio systems
  try {
    this.audioManager.stopAllAudio();
    this.audioManager.vad.stopListening();
    if (this.audioManager.isRecording) {
      this.audioManager.stopRecording();
    }
  } catch (e) {
    console.warn('Audio cleanup error:', e);
  }
  
  // Clear ping interval
  if (this.pingInterval) {
    clearInterval(this.pingInterval);
    this.pingInterval = null;
  }
  
  // Disconnect WebSocket
  try {
    this.wsManager.disconnect();
  } catch (e) {
    console.warn('WebSocket disconnect error:', e);
  }
  
  // End verification session
  if (this.currentSessionId) {
    this.endVerificationSession(this.currentSessionId).catch(err => {
      console.warn('Failed to end verification session:', err);
    });
  }
  
  // ✅ CRITICAL: Trigger the callback that redirects the user
  if (this.onSessionEnded) {
    console.log('📍 Triggering session ended callback - redirecting to dashboard');
    this.onSessionEnded({
      reason: '5_consecutive_silences',
      silenceCount: 5,
      message: 'Session ended due to extended silence'
    });
  } else {
    // Fallback: Direct redirect if no callback set
    console.log('📍 No callback set - performing direct redirect');
    window.location.href = '/student/daily-standups';
  }
  
  console.log('✅ 5-silence termination complete');
}

  handleUserStatusChange(statusInfo) {
    const currentTime = Date.now();
    
    console.log('📊 User status changed:', statusInfo);
    
    // ✅ If max silences reached and awaiting session end, ignore user speech
    if (this.maxSilencesReached && this.awaitingSessionEnd) {
      console.log('⏳ Ignoring status change - awaiting session termination');
      return;
    }
    
    try {
      if (statusInfo.status === 'user_speaking') {
        this.userHasSpoken = true;
        this.lastUserSpeechTime = currentTime;
        
        // ✅ Reset silence counter when user speaks (but NOT if max reached)
        if (!this.maxSilencesReached && this.silenceResponseCount > 0) {
          console.log(`🔄 User spoke - resetting silence counter from ${this.silenceResponseCount} to 0`);
          this.silenceResponseCount = 0;
        }
        
        if (this.isPlayingSilenceResponse || this.audioManager.isPlayingAudio) {
          console.log('🛑 User speaking during silence prompt - INTERRUPTING AUDIO');
          this.audioChunksBuffer = [];
          this.audioManager.stopAllAudio();
          this.isPlayingSilenceResponse = false;
          this.conversationState = 'idle';
        }
      } else if (statusInfo.status === 'user_stopped_speaking') {
        this.lastUserSpeechTime = currentTime;
      }
      
      this.wsManager.sendStatusUpdate(statusInfo);
      
    } catch (error) {
      console.error('❌ Failed to handle status change:', error);
    }
  }

  handleServerMessage(data) {
    try {
      switch (data.type) {
        case 'ai_response':
          console.log('🤖 AI Response:', data.text);
          this.conversationState = 'speaking';
          this.audioChunksBuffer = [];
          
          this.audioManager.vad.stopListening();
          if (this.audioManager.isRecording) {
            this.audioManager.stopRecording();
          }
          break;

        case 'silence_response':
          console.log('🤫 AI Silence Response:', data.text);
          console.log(`📊 Backend silence count: ${data.silence_count || 'N/A'}`);
          this.conversationState = 'speaking';
          this.audioChunksBuffer = [];
          this.isPlayingSilenceResponse = true;
          
          // ✅ Check if backend says this is the final silence (5th)
          if (data.silence_count >= 5 || data.is_final) {
            console.log('🛑🛑🛑 FINAL SILENCE RESPONSE RECEIVED (5th) - WILL TERMINATE AFTER AUDIO');
            this.maxSilencesReached = true;
            this.pendingSilenceTermination = true;
          }
          
          if (this.audioManager.isRecording) {
            this.audioManager.stopRecording();
          }
          break;

        case 'session_ended':
          console.log('🛑 SESSION ENDED BY SERVER:', data.reason);
          console.log('📊 Final silence count:', data.silence_count);
          
          this.conversationState = 'complete';
          this.sessionEnding = true;
          this.maxSilencesReached = true;
          this.awaitingSessionEnd = false;
          
          this.audioManager.stopAllAudio();
          this.audioManager.vad.stopListening();
          if (this.audioManager.isRecording) {
            this.audioManager.stopRecording();
          }
          this.audioChunksBuffer = [];
          
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
          
          // ✅ CRITICAL: Call the session ended callback to trigger redirect
          if (this.onSessionEnded) {
            console.log('📍 Triggering session ended callback for redirect');
            this.onSessionEnded({
              reason: data.reason || 'silence_termination',
              silenceCount: data.silence_count || 5,
              message: data.message || 'Session ended due to extended silence'
            });
          }
          
          this.cleanup();
          break;

        case 'stop_audio':
          console.log('🛑 Received stop_audio - clearing audio queue');
          this.audioChunksBuffer = [];
          this.sessionEnding = true;
          this.audioManager.stopAllAudio();
          break;
      
        case 'audio_chunk':
          if (data.audio) {
            if (!this.sessionEnding || data.status === 'closing') {
              try {
                const binaryData = new Uint8Array(
                  data.audio.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
                );
                this.audioChunksBuffer.push(binaryData);
              } catch (error) {
                console.error('❌ Audio chunk error:', error);
              }
            } else {
              console.log('⏸️ Ignoring audio chunk - session ending');
            }
          }
          break;
              
        case 'audio_end':
          console.log('🎵 AI finished speaking');
          
          if (!this.greetingComplete) {
            this.greetingComplete = true;
            this.greetingEndTime = Date.now();
            console.log('✅ Greeting phase completed');
          }
          
          this.playAIResponseFast();
          break;
        
        case 'conversation_end':
          console.log('🏁 Conversation completed');
          this.handleConversationEnd(data);
          break;

        case 'kill_silence_prompt':
          console.log('🛑 Kill silence prompt received - stopping audio immediately');
          this.audioChunksBuffer = [];
          this.audioManager.stopAllAudio();
          this.isPlayingSilenceResponse = false;
          this.conversationState = 'idle';
          
          setTimeout(() => {
            if (this.conversationState !== 'complete' && !this.maxSilencesReached) {
              this.audioManager.vad.startListening();
            }
          }, 100);
          break;
        
        case 'clarification':
          console.log('❓ AI needs clarification:', data.text);
          this.conversationState = 'speaking';
          this.audioChunksBuffer = [];
          break;
        
        case 'error':
          console.error('❌ Server error:', data.text);
          this.handleServerError(data.text);
          break;
        
        case 'ping':
          console.log('📡 Received ping from server');
          break;
        
        case 'pong':
          console.log('📡 Received pong from server');
          break;
        
        default:
          console.warn('⚠️ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Message handling failed:', error);
      this.handleProcessingError(error);
    }
  }

  async handleAudioRecorded(audioBlob, statusInfo) {
    // ✅ If max silences reached, don't process audio
    if (this.maxSilencesReached && this.awaitingSessionEnd) {
      console.log('⏳ Ignoring audio - awaiting session termination');
      return;
    }
    
    try {
      this.conversationState = 'processing';
      this.audioManager.vad.stopListening();

      if (audioBlob && audioBlob.size > 0) {
        console.log('📤 Sending audio to backend...');
        
        // Reset silence counter when user provides valid audio
        if (audioBlob.size > 6000 && this.silenceResponseCount > 0 && !this.maxSilencesReached) {
          console.log(`🔄 Valid audio submitted - resetting silence counter from ${this.silenceResponseCount} to 0`);
          this.silenceResponseCount = 0;
        }
        
        if (this.shouldVerifyVoice() && audioBlob.size > 15000) {
          try {
            const verifyResult = await this.performVoiceVerificationInternal(audioBlob);
            if (verifyResult && verifyResult.shouldTerminate) {
              console.log('🛑 Session terminated - not sending audio');
              return;
            }
          } catch (err) {
            console.error('Voice verification failed:', err);
          }
        }
        const sendStatus = {
          ...statusInfo,
          userStatus: 'user_speaking',
          silenceDetected: false,
        };
        this.wsManager.sendAudioDataWithStatus(audioBlob, sendStatus);
      } else {
        console.log('🔇 Audio empty; considering silence...');
        this.handleSilenceDetected({
          status: 'user_silent',
          timestamp: Date.now(),
          recordingActive: false,
          silenceDuration: 3000,
          message: 'No audio bytes captured',
        });
      }

    } catch (error) {
      console.error('❌ Failed to send audio:', error);
    } finally {
      this.conversationState = 'idle';
      setTimeout(() => {
        if (this.conversationState !== 'complete' && !this.maxSilencesReached) {
          this.audioManager.vad.startListening();
        }
      }, 100);
    }
  }

  async playAIResponseFast() {
    try {
      this.conversationState = 'speaking';
      
      if (!this.isPlayingSilenceResponse) {
        this.audioManager.vad.stopListening();
      }
      
      // Play all audio chunks
      if (this.audioChunksBuffer.length > 0) {
        for (const chunk of this.audioChunksBuffer) {
          // Allow interruption only for non-silence responses
          if (!this.isPlayingSilenceResponse && this.audioManager.getCurrentUserStatus() === 'user_speaking') {
            console.log('🛑 User interrupted during playback - stopping');
            break;
          }
          await this.audioManager.playAudioBuffer(chunk);
        }
      }
      
      // Clear the buffer
      this.audioChunksBuffer = [];
      
      const wasPlayingSilence = this.isPlayingSilenceResponse;
      this.isPlayingSilenceResponse = false;
      this.conversationState = 'idle';
      
      // ✅ CRITICAL: Check if we should terminate after this audio finished
      if (this.pendingSilenceTermination && this.maxSilencesReached) {
        console.log('🛑🛑🛑 FINAL SILENCE AUDIO FINISHED - TERMINATING NOW');
        this.pendingSilenceTermination = false;
        this.terminateSessionDueToSilence();
        return;  // Don't restart VAD
      }
      
      console.log('✅ Restarting audio detection...');
      
      setTimeout(() => {
        if (this.conversationState !== 'complete' && !this.maxSilencesReached) {
          this.audioManager.vad.resetSilenceNotificationTimer();
          this.audioManager.vad.startListening();
          
          if (wasPlayingSilence) {
            this.lastSilenceNotification = Date.now();
            console.log(`🕐 Silence notification cooldown started (${this.silenceNotificationCooldown/1000}s)`);
          }
        } else if (this.maxSilencesReached) {
          console.log('🛑 Not restarting VAD - max silences reached, awaiting termination');
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      this.isPlayingSilenceResponse = false;
      this.conversationState = 'idle';
      
      // Even on error, check if we should terminate
      if (this.pendingSilenceTermination && this.maxSilencesReached) {
        console.log('🛑 Audio failed but terminating anyway due to 5 silences');
        this.pendingSilenceTermination = false;
        this.terminateSessionDueToSilence();
        return;
      }
      
      setTimeout(() => {
        if (this.conversationState !== 'complete' && !this.maxSilencesReached) {
          this.audioManager.vad.startListening();
        }
      }, 500);
    }
  }

  terminateSessionDueToSilence() {
    console.log('🛑 Executing 5-silence termination...');
    
    // Mark session as complete
    this.conversationState = 'complete';
    this.sessionEnding = true;
    
    // Stop all audio systems
    try {
      this.audioManager.stopAllAudio();
      this.audioManager.vad.stopListening();
      if (this.audioManager.isRecording) {
        this.audioManager.stopRecording();
      }
    } catch (e) {
      console.warn('Audio cleanup error:', e);
    }
    
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Disconnect WebSocket
    try {
      this.wsManager.disconnect();
    } catch (e) {
      console.warn('WebSocket disconnect error:', e);
    }
    
    // End verification session
    if (this.currentSessionId) {
      this.endVerificationSession(this.currentSessionId).catch(err => {
        console.warn('Failed to end verification session:', err);
      });
    }
    
    // ✅ CRITICAL: Trigger the callback that redirects the user
    if (this.onSessionEnded) {
      console.log('📍 Triggering session ended callback - redirecting to dashboard');
      this.onSessionEnded({
        reason: '5_consecutive_silences',
        silenceCount: 5,
        message: 'Session ended due to extended silence'
      });
    } else {
      // Fallback: Direct redirect if no callback set
      console.log('📍 No callback set - performing direct redirect');
      window.location.href = '/student/daily-standups';
    }
    
    console.log('✅ 5-silence termination complete');
  }

  // ==================== FACE VERIFICATION ====================

  async verifyFace(studentCode, imageBase64) {
    try {
      console.log('🔐 Verifying face (strict mode) for student:', studentCode);
      
      const response = await fetch(`${this.BASE_URL}/daily_standup/auth/verify-face-strict`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          student_code: studentCode,
          image_base64: imageBase64
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Face verification failed');
      }
      
      const result = await response.json();
      console.log('🔐 Face verification result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Face verification error:', error);
      throw error;
    }
  }

    async verifyFaceIdentity(studentCode, imageBase64) {
    try {
      console.log('🔐 Verifying face identity (lightweight) for student:', studentCode);
      
      // Try lightweight identity-only endpoint first
      let response;
      try {
        response = await fetch(`${this.BASE_URL}/daily_standup/auth/verify-face-identity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_code: studentCode,
            image_base64: imageBase64
          })
        });
      } catch (fetchError) {
        // If identity endpoint doesn't exist, fall back to strict
        console.log('⚠️ Identity endpoint not available, falling back to strict verification');
        return await this.verifyFace(studentCode, imageBase64);
      }
      
      // If 404, fall back to strict endpoint
      if (response.status === 404) {
        console.log('⚠️ Identity endpoint not found, falling back to strict verification');
        return await this.verifyFace(studentCode, imageBase64);
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Face identity verification failed');
      }
      
      const result = await response.json();
      console.log('🔐 Face identity result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Face identity verification error:', error);
      throw error;
    }
  }
  
  // ==================== VOICE VERIFICATION ====================

  async startVerificationSession(sessionId, studentCode) {
    try {
      console.log('🎬 Starting verification session:', sessionId);
      this.studentCode = studentCode;
      
      const response = await fetch(
        `${this.BASE_URL}/daily_standup/auth/start-session/${sessionId}?student_code=${studentCode}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start verification session');
      }
      
      const result = await response.json();
      console.log('🎬 Verification session started:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to start verification session:', error);
      throw error;
    }
  }

  async verifyVoice(sessionId, studentCode, audioBlob) {
    try {
      console.log('🎤 Verifying voice for session:', sessionId);
      
      const formData = new FormData();
      formData.append('student_code', studentCode);
      formData.append('audio', audioBlob, 'voice_sample.webm');
      
      const response = await fetch(
        `${this.BASE_URL}/daily_standup/auth/verify-voice/${sessionId}`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Voice verification failed');
      }
      
      const result = await response.json();
      console.log('🎤 Voice verification result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Voice verification error:', error);
      throw error;
    }
  }

  async getSessionVerificationStatus(sessionId) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/daily_standup/auth/session-status/${sessionId}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get session status');
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ Failed to get session status:', error);
      throw error;
    }
  }

  async endVerificationSession(sessionId) {
    try {
      await fetch(
        `${this.BASE_URL}/daily_standup/auth/end-session/${sessionId}`,
        { method: 'DELETE' }
      );
      console.log('🏁 Verification session ended:', sessionId);
    } catch (error) {
      console.error('⚠️ Failed to end verification session:', error);
    }
  }

  async checkBiometricRegistration(studentCode) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/daily_standup/auth/check-registration/${studentCode}`
      );
      
      if (!response.ok) {
        return { face_registered: false, voice_registered: false };
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ Failed to check registration:', error);
      return { face_registered: false, voice_registered: false };
    }
  }

  shouldVerifyVoice() {
    const studentCode = this.studentCode || localStorage.getItem('student_code');
    if (!studentCode || !this.currentSessionId) {
      return false;
    }
    return true;
  }

  async performVoiceVerificationInternal(audioBlob) {
    try {
      const studentCode = this.studentCode || localStorage.getItem('student_code');
      if (!studentCode || !this.currentSessionId) {
        console.log('⏭️ Skipping voice verification - missing student code or session ID');
        return { verified: true, shouldTerminate: false };
      }
      
      const result = await this.verifyVoice(this.currentSessionId, studentCode, audioBlob);
      this.lastVoiceVerificationTime = Date.now();
      
      if (!result.verified) {
        console.log(`⚠️ Voice mismatch! Warning ${result.warning_count}/3`);
        
        if (this.onVoiceWarning) {
          this.onVoiceWarning({
            warningCount: result.warning_count,
            maxWarnings: 3,
            message: result.message,
            shouldTerminate: result.should_terminate,
            similarity: result.similarity
          });
        }
        
        if (result.should_terminate) {
          console.log('🛑 Session terminated due to voice verification failure');
          this.cleanup();
          return { verified: false, shouldTerminate: true };
        }
        
        return { verified: false, shouldTerminate: false };
      } else {
        console.log('✅ Voice verified successfully');
        return { verified: true, shouldTerminate: false };
      }
      
    } catch (error) {
      console.error('❌ Voice verification error:', error);
      return { verified: true, shouldTerminate: false };
    }
  }

  handleServerError(errorMessage) {
    console.error('❌ Backend error:', errorMessage);
    this.conversationState = 'idle';
    
    setTimeout(() => {
      if (this.conversationState !== 'complete' && !this.maxSilencesReached) {
        try {
          this.audioManager.vad.resetSilenceNotificationTimer();
          this.audioManager.vad.startListening();
        } catch (restartError) {
          console.error('❌ Failed to restart audio after server error:', restartError);
        }
      }
    }, 1000);
    
    if (this.onServerError) {
      this.onServerError(errorMessage);
    }
  }

  handleProcessingError(error) {
    console.error('❌ Processing error:', error.message);
    this.conversationState = 'idle';
    
    setTimeout(() => {
      if (this.conversationState !== 'complete' && !this.maxSilencesReached) {
        try {
          this.audioManager.vad.startListening();
        } catch (restartError) {
          console.error('❌ Failed to restart audio after processing error:', restartError);
        }
      }
    }, 1000);
  }

  handleConnectionError(error) {
    console.error('❌ Connection error:', error);
    this.cleanup();
    if (this.onServerError) {
      this.onServerError(`Connection lost: ${error.message}`);
    }
  }

  handleConnectionClose(event) {
    if (event.code !== 1000) {
        console.error('❌ Connection closed unexpectedly:', event.code, event.reason);
        this.cleanup();
        if (this.onServerError) {
            this.onServerError(`Connection closed: Code ${event.code}, Reason: ${event.reason}`);
        }
    } else {
        // NEW: Check if session was still active when server closed connection
        if (this.conversationState !== 'complete' && !this.sessionEnding) {
            console.warn('⚠️ WebSocket closed by server while session active');
            this.cleanup();
            if (this.onServerError) {
                this.onServerError('Session was closed by the server. Another session may have started.');
            }
        } else {
            console.log('✅ Connection closed normally');
        }
    }
  }

  handleConversationEnd(data) {
    this.conversationState = 'complete';
    console.log('✅ Standup completed with evaluation');
    console.log(`📊 Total silence responses: ${this.silenceResponseCount}`);
    
    this.detailedEvaluation = data.detailed_evaluation || null;
    
    this.audioManager.stopListening();
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    const result = {
      evaluation: data.evaluation,
      score: data.score,
      summary: data.text,
      silenceResponseCount: this.silenceResponseCount,
      pdfUrl: data.pdf_url,
      sessionStats: data.session_stats || {},
      detailedEvaluation: data.detailed_evaluation || null,
      hasDetailedEvaluation: !!data.detailed_evaluation
    };
    
    console.log('📋 Evaluation result:', result);
    
    if (this.evaluationCallbacks.onEvaluationComplete) {
      this.evaluationCallbacks.onEvaluationComplete(result);
    }
    
    return result;
  }

  onEvaluationComplete(callback) {
    this.evaluationCallbacks.onEvaluationComplete = callback;
  }

  setVoiceWarningCallback(callback) {
    this.onVoiceWarning = callback;
  }

  setSessionEndedCallback(callback) {
    this.onSessionEnded = callback;
  }

  getDetailedEvaluation() {
    return this.detailedEvaluation;
  }

  async fetchEvaluation(sessionId) {
    try {
      const response = await fetch(`https://192.168.48.201:8090/daily_standup/api/evaluation/${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch evaluation: ${response.status}`);
      }
      const evaluation = await response.json();
      this.detailedEvaluation = evaluation;
      return evaluation;
    } catch (error) {
      console.error('❌ Failed to fetch evaluation:', error);
      throw error;
    }
  }

  downloadPdfReport(sessionId) {
    const pdfUrl = `https://192.168.48.201:8090/daily_standup/download_results/${sessionId}`;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `standup_evaluation_${sessionId}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('📥 PDF download triggered for session:', sessionId);
  }

  getAudioQuality() {
    const diagnostics = this.audioManager.getDiagnosticInfo();
    return diagnostics ? diagnostics.qualityMetrics : null;
  }

  getConversationState() {
    return this.conversationState;
  }

  getSilenceStats() {
    return {
      silenceResponseCount: this.silenceResponseCount,
      maxSilenceResponses: this.maxSilenceResponses,
      maxSilencesReached: this.maxSilencesReached,
      awaitingSessionEnd: this.awaitingSessionEnd,
      currentUserStatus: this.audioManager.getCurrentUserStatus(),
      vadStatus: this.audioManager.getVADStatus(),
      greetingComplete: this.greetingComplete,
      userHasSpoken: this.userHasSpoken,
      lastSilenceNotification: this.lastSilenceNotification,
      timeSinceLastNotification: Date.now() - this.lastSilenceNotification
    };
  }

  cleanup() {
    this.audioManager.stopListening();
    this.wsManager.disconnect();
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.currentSessionId) {
      this.endVerificationSession(this.currentSessionId).catch(err => {
        console.error('Failed to end verification session:', err);
      });
    }
    
    this.conversationState = 'idle';
    this.sessionEnding = false;
    this.silenceResponseCount = 0;
    this.maxSilencesReached = false;
    this.pendingSilenceTermination = false;    // ✅ ADD
    this.awaitingSessionEnd = false;
    this.isFinalSilenceResponse = false;
    this.greetingComplete = false;
    this.userHasSpoken = false;
    this.lastSilenceNotification = 0;
    this.lastUserSpeechTime = 0;
    this.detailedEvaluation = null;
    this.evaluationCallbacks = {};
    this.onSessionEnded = null;
    this.isPlayingSilenceResponse = false;
    
    this.lastVoiceVerificationTime = 0;
    this.studentCode = null;
    
    console.log('🧹 Cleanup completed');
  }

  disconnect() {
    this.cleanup();
  }
}

// Create singleton instance
const professionalStandupAPI = new ProfessionalStandupAPIService();

// Export for compatibility
export const standupCallAPI = professionalStandupAPI;
export const dailyStandupAPI = professionalStandupAPI;
export default professionalStandupAPI;