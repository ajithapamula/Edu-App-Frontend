import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, createStudentFormData } from '../../services/API/index';

// ============================================================
// CONSTANTS
// ============================================================
const COUNTRY_CODES = [
  { value: '+91', label: '+91 (India)', flag: '🇮🇳' },
  { value: '+1', label: '+1 (US)', flag: '🇺🇸' },
  { value: '+44', label: '+44 (UK)', flag: '🇬🇧' },
  { value: '+86', label: '+86 (China)', flag: '🇨🇳' },
  { value: '+49', label: '+49 (Germany)', flag: '🇩🇪' },
  { value: '+33', label: '+33 (France)', flag: '🇫🇷' },
  { value: '+81', label: '+81 (Japan)', flag: '🇯🇵' },
  { value: '+7', label: '+7 (Russia)', flag: '🇷🇺' },
  { value: '+39', label: '+39 (Italy)', flag: '🇮🇹' },
  { value: '+34', label: '+34 (Spain)', flag: '🇪🇸' },
];

const PHONE_VALIDATION_RULES = {
  '+1': { length: [10], regex: /^[2-9]\d{2}[2-9]\d{6}$/, error: 'US number must be 10 digits. Area code cannot start with 0 or 1. Example: 2025551234' },
  '+91': { length: [10], regex: /^[6-9]\d{9}$/, error: 'Indian mobile must be 10 digits starting with 6, 7, 8, or 9. Example: 9876543210' },
  '+44': { length: [10], regex: /^7\d{9}$/, error: 'UK mobile must be 10 digits starting with 7. Example: 7911123456' },
  '+86': { length: [11], regex: /^1[3-9]\d{9}$/, error: 'Chinese mobile must be 11 digits starting with 13-19. Example: 13812345678' },
  '+49': { length: [10, 11], regex: /^1[567]\d{8,9}$/, error: 'German mobile must be 10-11 digits starting with 15, 16, or 17. Example: 15112345678' },
  '+33': { length: [9], regex: /^[67]\d{8}$/, error: 'French mobile must be 9 digits starting with 6 or 7. Example: 612345678' },
  '+81': { length: [10], regex: /^[789]0\d{8}$/, error: 'Japanese mobile must be 10 digits starting with 70, 80, or 90. Example: 9012345678' },
  '+7': { length: [10], regex: /^9\d{9}$/, error: 'Russian mobile must be 10 digits starting with 9. Example: 9123456789' },
  '+39': { length: [10], regex: /^3\d{9}$/, error: 'Italian mobile must be 10 digits starting with 3. Example: 3123456789' },
  '+34': { length: [9], regex: /^[67]\d{8}$/, error: 'Spanish mobile must be 9 digits starting with 6 or 7. Example: 612345678' },
};

const VALID_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'yahoo.in', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me',
  'zoho.com', 'zohomail.com', 'aol.com', 'mail.com', 'gmx.com', 'gmx.net',
  'rediffmail.com', 'rediff.com', 'sify.com', 'yandex.com', 'tutanota.com', 'fastmail.com',
];

const EDUCATIONAL_PATTERNS = ['.ac.in', '.edu', '.edu.in', '.ac.uk', '.edu.au'];

// ============================================================
// VALIDATION HELPERS
// ============================================================
function validateEmailDomain(email) {
  if (!email) return 'Email is required';
  email = email.trim().toLowerCase();
  if (/[,\s<>()[\]\\;:]/.test(email)) return 'Email contains invalid characters';
  const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
  if (!basicRegex.test(email)) return 'Invalid email format. Please use format: name@gmail.com';
  const parts = email.split('@');
  if (parts.length !== 2) return 'Invalid email format';
  const localPart = parts[0];
  const domain = parts[1];
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) return 'Invalid email format';
  if (VALID_EMAIL_DOMAINS.includes(domain)) return '';
  for (const pattern of EDUCATIONAL_PATTERNS) {
    if (domain.endsWith(pattern)) return '';
  }
  if (domain.includes('gmail')) return `Invalid email domain '${domain}'. Did you mean gmail.com?`;
  if (domain.includes('yahoo')) return `Invalid email domain '${domain}'. Did you mean yahoo.com?`;
  if (domain.includes('hotmail')) return `Invalid email domain '${domain}'. Did you mean hotmail.com?`;
  if (domain.includes('outlook')) return `Invalid email domain '${domain}'. Did you mean outlook.com?`;
  return `Email domain '${domain}' is not supported. Please use Gmail, Yahoo, Outlook, educational (.ac.in, .edu), or other major providers.`;
}

function validatePhoneNumber(phone, countryCode) {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  if (!countryCode) {
    if (digitsOnly.length < 8) return 'Phone number must be at least 8 digits';
    if (digitsOnly.length > 15) return 'Phone number must not exceed 15 digits';
    return '';
  }
  const rules = PHONE_VALIDATION_RULES[countryCode];
  if (!rules) {
    if (digitsOnly.length < 8) return 'Phone number must be at least 8 digits';
    if (digitsOnly.length > 15) return 'Phone number must not exceed 15 digits';
    return '';
  }
  const minLen = Math.min(...rules.length);
  const maxLen = Math.max(...rules.length);
  if (digitsOnly.length < minLen) return `Phone number too short. ${rules.error}`;
  if (digitsOnly.length > maxLen) return `Phone number too long. ${rules.error}`;
  if (!rules.regex.test(digitsOnly)) return `Invalid phone format. ${rules.error}`;
  return '';
}

// ============================================================
// GLOBAL SCROLLBAR HIDER HOOK
// Injects a <style> into document.head to hide native scrollbar
// across all elements. Cleans up on unmount.
// ============================================================
const useHideScrollbar = () => {
  useEffect(() => {
    const styleId = 'student-reg-hide-scrollbar';
    // Don't inject twice
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Hide scrollbar for Chrome, Safari, Edge, Opera */
      *::-webkit-scrollbar {
        width: 0px !important;
        height: 0px !important;
        display: none !important;
        background: transparent !important;
      }
      *::-webkit-scrollbar-thumb {
        background: transparent !important;
        display: none !important;
      }
      *::-webkit-scrollbar-track {
        background: transparent !important;
        display: none !important;
      }
      /* Hide scrollbar for Firefox */
      * {
        scrollbar-width: none !important;
      }
      /* Hide scrollbar for IE/Edge legacy */
      * {
        -ms-overflow-style: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) {
        document.head.removeChild(existing);
      }
    };
  }, []);
};

// ============================================================
// SNACKBAR COMPONENT
// ============================================================
const Snackbar = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isError = type === 'error';
  return (
    <div style={{
      position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, minWidth: '320px', maxWidth: '560px', width: 'auto',
      padding: '14px 20px 14px 16px', borderRadius: '14px',
      background: isError ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
      color: '#fff', fontWeight: 600, fontSize: '13.5px', fontFamily: 'inherit',
      boxShadow: isError ? '0 12px 40px rgba(220,38,38,0.35)' : '0 12px 40px rgba(22,163,74,0.35)',
      display: 'flex', alignItems: 'center', gap: '10px',
      animation: 'snackSlideIn 0.35s ease-out',
      backdropFilter: 'blur(12px)',
    }}>
      <span style={{ fontSize: '18px' }}>{isError ? '⚠️' : '✅'}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
        cursor: 'pointer', fontSize: '14px', fontWeight: 800, borderRadius: '8px',
        width: '26px', height: '26px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit',
      }}>✕</button>
    </div>
  );
};

// ============================================================
// SCROLL DOWN ARROW INDICATOR COMPONENT
// ============================================================
const ScrollDownArrow = ({ targetRef }) => {
  const [showArrow, setShowArrow] = useState(false);

  const checkScroll = useCallback(() => {
    const container = targetRef?.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollable = scrollHeight > clientHeight + 10;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 40;
    setShowArrow(isScrollable && !isNearBottom);
  }, [targetRef]);

  useEffect(() => {
    const container = targetRef?.current;
    if (!container) return;

    checkScroll();
    const initTimer = setTimeout(checkScroll, 300);
    const secondTimer = setTimeout(checkScroll, 800);

    container.addEventListener('scroll', checkScroll, { passive: true });

    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(checkScroll);
    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      clearTimeout(initTimer);
      clearTimeout(secondTimer);
      container.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [targetRef, checkScroll]);

  const handleClick = () => {
    const container = targetRef?.current;
    if (container) {
      container.scrollBy({ top: 200, behavior: 'smooth' });
    }
  };

  if (!showArrow) return null;

  return (
    <div
      onClick={handleClick}
      title="Scroll down for more"
      style={{
        position: 'sticky',
        bottom: '0px',
        zIndex: 50,
        cursor: 'pointer',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.9)',
        border: '1.5px solid rgba(14,165,233,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        animation: 'bounceArrow 2s ease-in-out infinite',
        backdropFilter: 'blur(8px)',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '-36px',
        pointerEvents: 'auto',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
};

// ============================================================
// FIND SCROLLABLE PARENT UTILITY
// ============================================================
const findScrollableParent = (element) => {
  if (!element) return null;
  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
};

// ============================================================
// EYE ICON SVG COMPONENTS
// ============================================================
const EyeOpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ============================================================
// PHONE INPUT WITH COUNTRY CODE COMPONENT
// ============================================================
const PhoneField = ({ label, name, countryCodeName, countryCodeValue, phoneValue, onChange, required = false }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ flex: 1, minWidth: 0, marginBottom: '4px' }}>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', marginLeft: '2px', color: focused ? '#0ea5e9' : '#9ca3af', transition: 'color 0.2s' }}>
        {label} {required && '*'}
      </label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <select
          name={countryCodeName}
          value={countryCodeValue}
          onChange={onChange}
          style={{
            width: '110px', minWidth: '110px', flex: 'none',
            padding: '11px 4px 11px 8px', border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '12px', outline: 'none', transition: 'all 0.3s',
            color: '#111827', fontWeight: 600, fontSize: '12px', fontFamily: 'inherit',
            backgroundColor: focused ? '#fff' : 'rgba(255,255,255,0.5)',
            borderColor: focused ? '#0ea5e9' : 'rgba(255,255,255,0.5)',
            boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.1)' : 'none',
            cursor: 'pointer', appearance: 'auto',
          }}
        >
          {COUNTRY_CODES.map((cc) => (
            <option key={cc.value} value={cc.value}>{cc.flag} {cc.value}</option>
          ))}
        </select>
        <input
          type="tel"
          name={name}
          placeholder={getPhonePlaceholder(countryCodeValue)}
          value={phoneValue}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, width: '100%', padding: '11px 16px',
            border: '1px solid rgba(255,255,255,0.5)', borderRadius: '12px',
            outline: 'none', transition: 'all 0.3s', color: '#111827',
            fontWeight: 600, fontSize: '13.5px', fontFamily: 'inherit',
            backgroundColor: focused ? '#fff' : 'rgba(255,255,255,0.5)',
            borderColor: focused ? '#0ea5e9' : 'rgba(255,255,255,0.5)',
            boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.1)' : 'none',
          }}
        />
      </div>
      <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px', marginLeft: '2px' }}>
        {getPhoneHint(countryCodeValue)}
      </div>
    </div>
  );
};

function getPhonePlaceholder(code) {
  const map = {
    '+91': '9876543210', '+1': '2025551234', '+44': '7911123456',
    '+86': '13812345678', '+49': '15112345678', '+33': '612345678',
    '+81': '9012345678', '+7': '9123456789', '+39': '3123456789', '+34': '612345678',
  };
  return map[code] || 'Phone number';
}

function getPhoneHint(code) {
  const rules = PHONE_VALIDATION_RULES[code];
  if (!rules) return 'Enter phone number (digits only)';
  return rules.error.split('. ')[0];
}

const StudentRegisterForm = ({ embedded = false }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const scrollCardRef = useRef(null);
  const formRootRef = useRef(null);
  const parentScrollRef = useRef(null);

  // Activate global scrollbar hiding
  useHideScrollbar();

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);
  const [emailFieldError, setEmailFieldError] = useState('');

  // Organizations
  const [organizations, setOrganizations] = useState([]);
  const [orgLoading, setOrgLoading] = useState(true);

  // Courses (dependent on selected organization)
  const [courses, setCourses] = useState([]);
  const [courseLoading, setCourseLoading] = useState(false);

  // Basic Info (Student_Code removed — Admin/Super_Admin assigns later)
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    Email: '',
    Country_Code: '+91',
    Mobile_Number: '',
    Alt_Country_Code: '+91',
    Alternate_Number: '',
    Password: '',
    ConfirmPassword: '',
    Org_ID: '',
    Course: '',
    Gender: '',
    Dob: '',
    Address: '',
    State: '',
    Pincode: '',
    Country: 'India',
    Qualification: '',
    Passout_Year: '',
    University_School: ''
  });

  // Government ID
  const [govtId, setGovtId] = useState({
    Govt_Id_Type: 'Aadhar',
    Govt_Id_Number: ''
  });

  // Photo States
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  // Voice States
  const [voiceSentence, setVoiceSentence] = useState('');
  const [voiceBase64, setVoiceBase64] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [loadingSentence, setLoadingSentence] = useState(false);
  const [micError, setMicError] = useState('');

  // Resume States
  const [resumeBase64, setResumeBase64] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeFileSize, setResumeFileSize] = useState(0);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeError, setResumeError] = useState('');

  // Stepper steps — added Resume Upload step
  const steps = [
    'Basic Information',
    'Government ID',
    'Photo Capture',
    'Voice Recording',
    'Resume Upload',
    'Review & Submit'
  ];

  // ============================================================
  // GENERATE PASSOUT YEAR OPTIONS
  // ============================================================
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const futureLimit = currentYear + 10;
    const years = [];
    for (let year = futureLimit; year >= 1900; year--) {
      years.push({ value: String(year), label: String(year) });
    }
    return years;
  };

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => { setMounted(true); }, []);

  // ── Fetch organizations for dropdown ──
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await apiRequest('/api/student/organizations', { method: 'GET' });
        setOrganizations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
        setOrganizations([]);
      } finally {
        setOrgLoading(false);
      }
    };
    fetchOrganizations();
  }, []);

  // ── Fetch courses when organization changes ──
  useEffect(() => {
    if (!formData.Org_ID) {
      setCourses([]);
      setFormData(prev => ({ ...prev, Course: '' }));
      return;
    }
    const fetchCourses = async () => {
      setCourseLoading(true);
      try {
        const data = await apiRequest(`/api/student/courses?org_id=${formData.Org_ID}`, { method: 'GET' });
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setCourses([]);
      } finally {
        setCourseLoading(false);
      }
    };
    // Reset course selection when org changes
    setFormData(prev => ({ ...prev, Course: '' }));
    fetchCourses();
  }, [formData.Org_ID]);

  // Find and store scrollable parent for embedded mode
  useEffect(() => {
    if (embedded && formRootRef.current) {
      const scrollParent = findScrollableParent(formRootRef.current);
      if (scrollParent) {
        parentScrollRef.current = scrollParent;
      }
    }
  }, [embedded]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (activeStep === 3 && !voiceSentence) {
      loadVoiceSentence();
    }
  }, [activeStep]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopVoiceRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollCardRef.current) {
      scrollCardRef.current.scrollTop = 0;
    }
    // Scroll parent container to top in embedded mode
    if (parentScrollRef.current) {
      parentScrollRef.current.scrollTop = 0;
    }
  }, [activeStep]);

  // ============================================================
  // LOAD VOICE SENTENCE FROM BACKEND
  // ============================================================
  const loadVoiceSentence = async () => {
    setLoadingSentence(true);
    setError('');
    try {
      const response = await apiRequest('/api/student/voice-sentence', {
        method: 'GET'
      });

      if (response.Sentence) {
        setVoiceSentence(response.Sentence);
      } else {
        throw new Error('No sentence received from server');
      }
    } catch (err) {
      console.error('Error loading voice sentence:', err);
      setError('Failed to load voice sentence. Click refresh to try again.');
      setVoiceSentence('I am committed to pursuing excellence in my academic journey and believe that dedication and perseverance are the foundations of achieving meaningful success in any professional endeavor.');
    } finally {
      setLoadingSentence(false);
    }
  };

  // ============================================================
  // PHOTO CAPTURE FUNCTIONS - FIXED VERSION
  // ============================================================
  const startCamera = async () => {
    setCameraError('');
    setCameraReady(false);
    
    try {
      console.log('📷 Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('📷 Camera stream obtained');
      streamRef.current = stream;
      setCameraActive(true);
      
      setTimeout(() => {
        const video = videoRef.current;
        if (video && stream) {
          video.srcObject = stream;
          
          video.play()
            .then(() => {
              console.log('📷 Video playing!');
              setCameraReady(true);
            })
            .catch(err => {
              console.log('📷 Auto-play blocked, trying with user interaction:', err);
              setCameraReady(true);
            });
          
          setTimeout(() => {
            if (streamRef.current && !cameraReady) {
              console.log('📷 Forcing camera ready (timeout fallback)');
              setCameraReady(true);
            }
          }, 1500);
        }
      }, 100);
      
      setError('');
      
    } catch (err) {
      console.error('📷 Camera error:', err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera permission and refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is being used by another application.');
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  };

  const capturePhoto = () => {
    console.log('📷 Attempting to capture photo...');
    console.log('📷 Video ref:', videoRef.current);
    console.log('📷 Canvas ref:', canvasRef.current);
    console.log('📷 Camera ready:', cameraReady);
    
    if (!videoRef.current || !canvasRef.current) {
      setCameraError('Camera not initialized properly');
      return;
    }
    
    if (!cameraReady) {
      setCameraError('Please wait for camera to be ready');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    console.log('📷 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    console.log('📷 Video ready state:', video.readyState);
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Camera not ready yet. Please wait a moment and try again.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    console.log('📷 Captured image data length:', imageData.length);
    
    if (imageData.length < 1000) {
      setCameraError('Failed to capture image. Please try again.');
      return;
    }
    
    setPhotoBase64(imageData);
    setPhotoPreview(imageData);
    setPhotoTaken(true);
    stopCamera();
    
    console.log('📷 Photo captured successfully!');
  };

  const retakePhoto = () => {
    setPhotoBase64(null);
    setPhotoPreview(null);
    setPhotoTaken(false);
    setCameraError('');
    setCameraReady(false);
  };

  const stopCamera = () => {
    console.log('📷 Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('📷 Stopped track:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoBase64(event.target.result);
        setPhotoPreview(event.target.result);
        setPhotoTaken(true);
        setError('');
      };
      reader.onerror = () => {
        setError('Failed to read the image file');
      };
      reader.readAsDataURL(file);
    }
  };

  // ============================================================
  // VOICE RECORDING FUNCTIONS
  // ============================================================
  const startVoiceRecording = async () => {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      audioStreamRef.current = stream;
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        if (audioBlob.size > 10 * 1024 * 1024) {
          setError('Recording too large. Please record a shorter clip.');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          setVoiceBase64(event.target.result);
          setVoiceRecorded(true);
        };
        reader.onerror = () => {
          setError('Failed to process the recording');
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setError('');
    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError') {
        setMicError('Microphone access denied. Please allow microphone permission in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setMicError('No microphone found. Please connect a microphone and try again.');
      } else {
        setMicError('Unable to access microphone. Please check permissions.');
      }
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVoiceRecording = () => {
    setVoiceBase64(null);
    setVoiceRecorded(false);
    setRecordingTime(0);
    setMicError('');
  };

  // ============================================================
  // RESUME UPLOAD FUNCTIONS
  // ============================================================
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    setResumeError('');

    if (!file) return;

    // Validate file type — backend only accepts PDF
    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are allowed. Please upload a valid PDF resume.');
      e.target.value = '';
      return;
    }

    // Validate file size — backend max is 10MB
    if (file.size > 10 * 1024 * 1024) {
      setResumeError('Resume size must be less than 10MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setResumeBase64(base64Data);
      setResumeFileName(file.name);
      setResumeFileSize(file.size);
      setResumeUploaded(true);
      setResumeError('');
      console.log('📄 Resume uploaded successfully:', file.name, `(${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.onerror = () => {
      setResumeError('Failed to read the resume file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const removeResume = () => {
    setResumeBase64(null);
    setResumeFileName('');
    setResumeFileSize(0);
    setResumeUploaded(false);
    setResumeError('');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    if (bytes < 1024) return bytes + ' Bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Only allow digits for phone number fields
    if (name === 'Mobile_Number' || name === 'Alternate_Number') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'Email') {
        if (value.trim()) {
          setEmailFieldError(validateEmailDomain(value));
        } else {
          setEmailFieldError('');
        }
      }
    }

    if (error) setError('');
  };

  const handleGovtIdChange = (e) => {
    const { name, value } = e.target;
    setGovtId(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // ============================================================
  // VALIDATION FUNCTIONS
  // ============================================================
  const validateStep = (step) => {
    setError('');

    if (step === 0) {
      // Student_Code validation removed — Admin/Super_Admin assigns later
      if (!formData.First_Name?.trim()) { setError('First Name is required'); return false; }
      if (!formData.Last_Name?.trim()) { setError('Last Name is required'); return false; }

      // ── Email validation ──
      const emailError = validateEmailDomain(formData.Email);
      if (emailError) { setError(emailError); return false; }

      // ── Mobile Number validation ──
      const mobileError = validatePhoneNumber(formData.Mobile_Number, formData.Country_Code);
      if (mobileError) { setError(`Mobile Number: ${mobileError}`); return false; }

      // ── Alternate Number validation ──
      const altError = validatePhoneNumber(formData.Alternate_Number, formData.Alt_Country_Code);
      if (altError) { setError(`Alternate Number: ${altError}`); return false; }

      if (!formData.Password || formData.Password.length < 8) { setError('Password must be at least 8 characters'); return false; }
      if (formData.Password !== formData.ConfirmPassword) { setError('Passwords do not match'); return false; }
      if (!/[A-Z]/.test(formData.Password)) { setError('Password must contain at least one uppercase letter'); return false; }
      if (!/[a-z]/.test(formData.Password)) { setError('Password must contain at least one lowercase letter'); return false; }
      if (!/\d/.test(formData.Password)) { setError('Password must contain at least one number'); return false; }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.Password)) { setError('Password must contain at least one special character'); return false; }
      if (!formData.Org_ID) { setError('Please select an organization'); return false; }
      if (!formData.Course) { setError('Please select a course'); return false; }
      if (!formData.Gender) { setError('Gender is required'); return false; }
      if (!formData.Dob) { setError('Date of Birth is required'); return false; }
      if (!formData.Address?.trim()) { setError('Address is required'); return false; }
      if (!formData.State?.trim()) { setError('State is required'); return false; }
      if (!formData.Pincode?.trim()) { setError('Pincode is required'); return false; }
      if (!formData.Country?.trim()) { setError('Country is required'); return false; }
      if (!formData.Qualification?.trim()) { setError('Qualification is required'); return false; }
      if (!formData.University_School?.trim()) { setError('University/School is required'); return false; }
      if (!formData.Passout_Year) { setError('Passout Year is required'); return false; }
      const currentYear = new Date().getFullYear();
      if (parseInt(formData.Passout_Year) < 1900 || parseInt(formData.Passout_Year) > currentYear + 10) {
        setError(`Passout Year must be between 1900 and ${currentYear + 10}`); return false;
      }
      return true;
    }

    if (step === 1) {
      if (!govtId.Govt_Id_Number?.trim()) { setError('Government ID number is required'); return false; }
      const patterns = {
        'Aadhar': /^\d{12}$/,
        'PAN': /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        'Passport': /^[A-Za-z0-9]{6,9}$/,
        'License': /^[A-Z]{2}-?\d{2}-?\d{4}-?\d{7}$/
      };
      const pattern = patterns[govtId.Govt_Id_Type];
      if (pattern && !pattern.test(govtId.Govt_Id_Number)) {
        const formatHints = {
          'Aadhar': '12 digits (e.g., 123456789012)',
          'PAN': 'Format: ABCDE1234F',
          'Passport': '6-9 alphanumeric characters',
          'License': 'Format: XX-00-0000-0000000'
        };
        setError(`Invalid ${govtId.Govt_Id_Type} format. Expected: ${formatHints[govtId.Govt_Id_Type]}`);
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!photoBase64) { setError('Photo is required. Please capture or upload a photo.'); return false; }
      return true;
    }

    if (step === 3) {
      if (!voiceBase64) { setError('Voice recording is required. Please record your voice.'); return false; }
      return true;
    }

    // Step 4 — Resume Upload (optional, no validation blocking)
    if (step === 4) {
        if (!resumeBase64) { setError('Resume is required. Please upload your resume in PDF format.'); return false; }
      return true;
    }

    return true;
  };

  // ============================================================
  // SUBMIT REGISTRATION
  // ============================================================
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Send only digits for phone (no dashes/spaces)
      const mobileDigits = formData.Mobile_Number.replace(/\D/g, '');
      const altDigits = formData.Alternate_Number.replace(/\D/g, '');

      const submissionData = {
        ...formData,
        Mobile_Number: mobileDigits,
        Alternate_Number: altDigits,
        ...govtId,
        status: 0,
        photo_base64: photoBase64,
        voice_base64: voiceBase64,
        voice_content_type: 'audio/webm',
        voice_sentence: voiceSentence,
        resume_base64: resumeBase64 || undefined
      };

      delete submissionData.ConfirmPassword;

      const formDataToSend = createStudentFormData(submissionData);

      const response = await apiRequest('/api/student/register', {
        method: 'POST',
        body: formDataToSend
      });

      console.log('Registration response:', response);
      
      setSuccess(`Registration successful! Welcome ${response.Name || formData.First_Name}. Redirecting to login...`);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // STEP NAVIGATION
  // ============================================================
  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        if (activeStep === 2 && cameraActive) {
          stopCamera();
        }
        setActiveStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    setCameraReady(false);
    
    if (isRecording) {
      stopVoiceRecording();
    }
    
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================================
  // STEP CONTENT RENDERERS
  // ============================================================

  const renderStep0 = () => (
    <div style={st.stepContent}>
      <div style={st.stepTitle}>
        <span style={st.stepIcon}>📋</span>
        Basic Information
      </div>
      <div style={st.stepDesc}>Fill in your personal and academic details</div>

      {/* Organization Dropdown */}
      <div style={st.row}>
        <div style={{ flex: 1, minWidth: 0, marginBottom: '4px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', marginLeft: '2px', color: '#9ca3af', transition: 'color 0.2s' }}>
            Organization *
          </label>
          <select
            name="Org_ID"
            value={formData.Org_ID}
            onChange={handleInputChange}
            required
            style={{
              width: '100%', padding: '11px 16px', border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '12px', outline: 'none', transition: 'all 0.3s', color: '#111827',
              fontWeight: 600, fontSize: '13.5px', fontFamily: 'inherit', cursor: 'pointer', appearance: 'auto',
              backgroundColor: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.5)',
            }}
          >
            <option value="">
              {orgLoading ? 'Loading organizations...' : '-- Select Organization --'}
            </option>
            {organizations.map((org) => (
              <option key={org.Org_ID} value={org.Org_ID}>
                {org.Organization_Name}
              </option>
            ))}
          </select>
          {!orgLoading && organizations.length === 0 && (
            <div style={{ fontSize: '9px', color: '#dc2626', marginTop: '2px', marginLeft: '2px' }}>
              No active organizations found. Please contact admin.
            </div>
          )}
        </div>

        {/* Course Dropdown - dependent on selected Organization */}
        <div style={{ flex: 1, minWidth: 0, marginBottom: '4px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', marginLeft: '2px', color: '#9ca3af', transition: 'color 0.2s' }}>
            Course *
          </label>
          <select
            name="Course"
            value={formData.Course}
            onChange={handleInputChange}
            required
            disabled={!formData.Org_ID}
            style={{
              width: '100%', padding: '11px 16px', border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '12px', outline: 'none', transition: 'all 0.3s', color: '#111827',
              fontWeight: 600, fontSize: '13.5px', fontFamily: 'inherit', cursor: formData.Org_ID ? 'pointer' : 'not-allowed', appearance: 'auto',
              backgroundColor: !formData.Org_ID ? 'rgba(200,200,200,0.3)' : 'rgba(255,255,255,0.5)',
              borderColor: 'rgba(255,255,255,0.5)',
              opacity: !formData.Org_ID ? 0.6 : 1,
            }}
          >
            <option value="">
              {!formData.Org_ID ? '-- Select Organization first --' : courseLoading ? 'Loading courses...' : '-- Select Course --'}
            </option>
            {courses.map((course) => (
              <option key={course.Course_ID} value={course.Course_Name}>
                {course.Course_Name}
              </option>
            ))}
          </select>
          {formData.Org_ID && !courseLoading && courses.length === 0 && (
            <div style={{ fontSize: '9px', color: '#f59e0b', marginTop: '2px', marginLeft: '2px' }}>
              No active courses found for this organization.
            </div>
          )}
        </div>
      </div>

      {/* Student_Code field removed — Admin/Super_Admin assigns later */}
      <div style={st.row}>
        <GlassInput label="First Name" name="First_Name" value={formData.First_Name} onChange={handleInputChange} required />
        <GlassInput label="Last Name" name="Last_Name" value={formData.Last_Name} onChange={handleInputChange} required />
      </div>
      <GlassInput label="Email" name="Email" type="email" value={formData.Email} onChange={handleInputChange} required hint={emailFieldError || "Gmail, Yahoo, Outlook, or educational domains"} hintColor={emailFieldError ? '#dc2626' : undefined} />
      <div style={st.row}>
        <PhoneField
          label="Mobile Number"
          name="Mobile_Number"
          countryCodeName="Country_Code"
          countryCodeValue={formData.Country_Code}
          phoneValue={formData.Mobile_Number}
          onChange={handleInputChange}
          required
        />
        <PhoneField
          label="Alternate Number"
          name="Alternate_Number"
          countryCodeName="Alt_Country_Code"
          countryCodeValue={formData.Alt_Country_Code}
          phoneValue={formData.Alternate_Number}
          onChange={handleInputChange}
          required
        />
      </div>
      <GlassInput label="Address" name="Address" value={formData.Address} onChange={handleInputChange} required multiline />
      <div style={st.row}>
        <GlassInput label="State" name="State" value={formData.State} onChange={handleInputChange} required />
        <GlassInput label="Pincode" name="Pincode" value={formData.Pincode} onChange={handleInputChange} required />
      </div>
      <div style={st.row}>
        <GlassInput label="Country" name="Country" value={formData.Country} onChange={handleInputChange} required />
        <GlassSelect label="Gender" name="Gender" value={formData.Gender} onChange={handleInputChange} required options={[
          { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }
        ]} />
      </div>
      <div style={st.row}>
        <GlassInput label="Date of Birth" name="Dob" type="date" value={formData.Dob} onChange={handleInputChange} required />
        <GlassInput label="Qualification" name="Qualification" value={formData.Qualification} onChange={handleInputChange} required />
      </div>
      <div style={st.row}>
        <GlassInput label="University/School" name="University_School" value={formData.University_School} onChange={handleInputChange} required />
        <GlassSelect label="Passout Year" name="Passout_Year" value={formData.Passout_Year} onChange={handleInputChange} required options={generateYearOptions()} />
      </div>
      <div style={st.row}>
        <GlassInput label="Password" name="Password" type="password" value={formData.Password} onChange={handleInputChange} required hint="Min 8: upper, lower, number, special" isPassword />
        <GlassInput label="Confirm Password" name="ConfirmPassword" type="password" value={formData.ConfirmPassword} onChange={handleInputChange} required isPassword />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div style={st.stepContent}>
      <div style={st.stepTitle}>
        <span style={st.stepIcon}>🪪</span>
        Government Identification
      </div>
      <div style={st.stepDesc}>Provide a valid government-issued ID for verification</div>
      <div style={{ ...st.row, marginTop: '20px' }}>
        <GlassSelect label="ID Type" name="Govt_Id_Type" value={govtId.Govt_Id_Type} onChange={handleGovtIdChange} required options={[
          { value: 'Aadhar', label: 'Aadhar Card' }, { value: 'PAN', label: 'PAN Card' },
          { value: 'Passport', label: 'Passport' }, { value: 'License', label: 'Driving License' }
        ]} />
        <GlassInput label="ID Number" name="Govt_Id_Number" value={govtId.Govt_Id_Number} onChange={handleGovtIdChange} required
          hint={govtId.Govt_Id_Type === 'Aadhar' ? '12 digits (e.g., 123456789012)' : govtId.Govt_Id_Type === 'PAN' ? 'Format: ABCDE1234F' : govtId.Govt_Id_Type === 'Passport' ? '6-9 alphanumeric characters' : 'Format: XX-00-0000-0000000'}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={st.stepContent}>
      <div style={st.stepTitle}>
        <span style={st.stepIcon}>📸</span>
        Photo Capture
      </div>
      <div style={st.stepDesc}>Take a clear photo of your face or upload an existing photo for identity verification</div>

      {cameraError && (
        <Snackbar message={cameraError} type="error" onClose={() => setCameraError('')} />
      )}

      {!photoTaken ? (
        !cameraActive ? (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <div style={st.emptyCapture}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div style={{ color: '#6b7280', fontWeight: 600, marginTop: '12px' }}>No photo captured yet</div>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>Click "Open Camera" or upload a photo</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
              <button onClick={startCamera} style={st.btnPrimary}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                Open Camera
              </button>
              
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '10px' }}>Supported: JPG, PNG (Max 5MB)</div>
          </div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            <div style={st.videoContainer}>
              <video ref={videoRef} autoPlay playsInline muted style={st.videoElement} />
              <div style={{ ...st.cameraBadge, background: cameraReady ? '#22c55e' : '#f59e0b' }}>
                {cameraReady ? '● Camera Ready' : '○ Loading...'}
              </div>
              <div style={st.faceGuide} />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center', margin: '10px 0' }}>
              Position your face within the circle and ensure good lighting
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={capturePhoto} style={{ ...st.btnPrimary, flex: 1, background: 'linear-gradient(to right, #16a34a, #22c55e)' }}>
                📸 Capture Photo
              </button>
              <button onClick={stopCamera} style={{ ...st.btnOutline, flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        )
      ) : (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <div style={st.photoPreviewWrap}>
            <img src={photoPreview} alt="Captured" style={st.photoPreviewImg} />
            <div style={st.photoCheckBadge}>✓</div>
          </div>
          <div style={st.successInline}>✓ Photo captured successfully!</div>
          <button onClick={retakePhoto} style={st.btnOutline}>
            ↻ Retake Photo
          </button>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div style={st.stepContent}>
      <div style={st.stepTitle}>
        <span style={st.stepIcon}>🎤</span>
        Voice Recording
      </div>
      <div style={st.stepDesc}>Read the sentence below clearly for voice verification. You have 30 seconds.</div>

      {micError && (
        <Snackbar message={micError} type="error" onClose={() => setMicError('')} />
      )}

      {loadingSentence ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={st.spinnerLg} />
        </div>
      ) : (
        <div>
          <div style={st.sentenceBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>Please read this sentence:</span>
              <button onClick={loadVoiceSentence} disabled={isRecording} style={st.refreshBtn}>↻</button>
            </div>
            <div style={{ fontStyle: 'italic', lineHeight: 1.8, color: '#1e3a8a', fontWeight: 500, fontSize: '14px' }}>
              "{voiceSentence}"
            </div>
          </div>

          {!voiceRecorded ? (
            <div>
              {isRecording && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={st.recordDot} />
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>Recording... {formatTime(recordingTime)}</span>
                  </div>
                  <div style={st.progressBarBg}>
                    <div style={{ ...st.progressBarFill, width: `${(recordingTime / 30) * 100}%` }} />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Max 30 seconds</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {!isRecording ? (
                  <button onClick={startVoiceRecording} style={{ ...st.btnPrimary, background: 'linear-gradient(to right, #dc2626, #ef4444)', minWidth: '200px' }}>
                    🎙️ Start Recording
                  </button>
                ) : (
                  <button onClick={stopVoiceRecording} style={{ ...st.btnPrimary, background: 'linear-gradient(to right, #374151, #6b7280)', minWidth: '200px' }}>
                    ⏹ Stop Recording
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={st.successInline}>✓ Voice recorded successfully!</div>
              {voiceBase64 && (
                <div style={st.audioPreview}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Preview your recording:</div>
                  <audio controls style={{ width: '100%' }} src={voiceBase64} />
                </div>
              )}
              <button onClick={retakeVoiceRecording} style={st.btnOutline}>
                ↻ Retake Recording
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ============================================================
  // STEP 4 — RESUME UPLOAD (NEW)
  // ============================================================
  const renderStep4 = () => (
    <div style={st.stepContent}>
      <div style={st.stepTitle}>
        <span style={st.stepIcon}>📄</span>
        Resume Upload
      </div>
   <div style={st.stepDesc}>Upload your resume in PDF format (required)</div>

      {resumeError && (
        <Snackbar message={resumeError} type="error" onClose={() => setResumeError('')} />
      )}

      {!resumeUploaded ? (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <div style={st.emptyCapture}>
            {/* PDF Icon */}
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div style={{ color: '#6b7280', fontWeight: 600, marginTop: '12px' }}>No resume uploaded yet</div>
            <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>Upload your resume in PDF format</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
            <label style={st.btnPrimary}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Resume (PDF)
              <input hidden type="file" accept="application/pdf,.pdf" onChange={handleResumeUpload} />
            </label>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '10px' }}>Supported: PDF only (Max 10MB)</div>
          
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          {/* Resume uploaded preview card */}
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(255,255,255,0.6)', borderRadius: '20px', padding: '28px 36px',
            border: '1px solid rgba(22,163,74,0.25)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            {/* PDF icon with check */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div style={{
                position: 'absolute', bottom: '-4px', right: '-4px',
                background: '#22c55e', color: 'white', width: '22px', height: '22px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '12px', border: '2px solid white',
              }}>✓</div>
            </div>

            <div style={{ fontWeight: 700, color: '#111827', fontSize: '14px', marginBottom: '4px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {resumeFileName}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {formatFileSize(resumeFileSize)} · PDF
            </div>
          </div>

          <div style={st.successInline}>✓ Resume uploaded successfully!</div>
          <button onClick={removeResume} style={st.btnOutline}>
            ↻ Remove & Re-upload
          </button>
        </div>
      )}
    </div>
  );

  // ============================================================
  // STEP 5 — REVIEW & SUBMIT (was Step 4)
  // ============================================================
  const renderStep5 = () => (
    <div style={st.stepContent}>
      <div style={st.stepTitle}>
        <span style={st.stepIcon}>✅</span>
        Review Your Information
      </div>
      <div style={st.stepDesc}>Please verify all information before submitting</div>

      <div style={st.reviewCard}>
        <div style={st.reviewCardTitle}>Personal Information</div>
        <div style={st.reviewGrid}>
          {/* Student_Code removed from review — Admin/Super_Admin assigns later */}
          <div><span style={st.reviewLabel}>Name</span><span style={st.reviewValue}>{formData.First_Name} {formData.Last_Name}</span></div>
          <div><span style={st.reviewLabel}>Email</span><span style={st.reviewValue}>{formData.Email}</span></div>
          <div><span style={st.reviewLabel}>Mobile</span><span style={st.reviewValue}>{formData.Country_Code} {formData.Mobile_Number}</span></div>
          <div><span style={st.reviewLabel}>Organization</span><span style={st.reviewValue}>{organizations.find(o => String(o.Org_ID) === String(formData.Org_ID))?.Organization_Name || formData.Org_ID}</span></div>
          <div><span style={st.reviewLabel}>Course</span><span style={st.reviewValue}>{formData.Course}</span></div>
          <div><span style={st.reviewLabel}>Gender</span><span style={st.reviewValue}>{formData.Gender}</span></div>
          <div><span style={st.reviewLabel}>DOB</span><span style={st.reviewValue}>{formData.Dob}</span></div>
          <div><span style={st.reviewLabel}>Qualification</span><span style={st.reviewValue}>{formData.Qualification}</span></div>
          <div><span style={st.reviewLabel}>University</span><span style={st.reviewValue}>{formData.University_School}</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
        <div style={st.reviewSuccessCard}>
          <span style={{ fontSize: '20px' }}>📸</span>
          <div><div style={{ fontWeight: 700, color: '#16a34a', fontSize: '13px' }}>Photo Captured</div><div style={{ fontSize: '11px', color: '#6b7280' }}>Ready for submission</div></div>
        </div>
        <div style={st.reviewSuccessCard}>
          <span style={{ fontSize: '20px' }}>🎤</span>
          <div><div style={{ fontWeight: 700, color: '#16a34a', fontSize: '13px' }}>Voice Recorded</div><div style={{ fontSize: '11px', color: '#6b7280' }}>Ready for submission</div></div>
        </div>
        <div style={st.reviewSuccessCard}>
  <span style={{ fontSize: '20px' }}>📄</span>
  <div>
    <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '13px' }}>Resume Uploaded</div>
    <div style={{ fontSize: '11px', color: '#6b7280' }}>{resumeFileName}</div>
  </div>
</div>
      </div>
    </div>
  );

  const renderStepContent = (step) => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  const formContent = (
    <div ref={formRootRef} style={{ fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif" }}>
      {/* SNACKBAR for errors & success */}
      <Snackbar message={error} type="error" onClose={() => setError('')} />
      <Snackbar message={success} type="success" onClose={() => setSuccess('')} />

      {/* STEPPER */}
      <div style={st.stepper}>
        {steps.map((label, index) => (
          <div key={label} style={st.stepItem}>
            <div style={{
              ...st.stepCircle,
              background: index < activeStep ? 'linear-gradient(135deg, #16a34a, #22c55e)' :
                index === activeStep ? 'linear-gradient(135deg, #1e3a8a, #0ea5e9)' : 'rgba(0,0,0,0.08)',
              color: index <= activeStep ? '#fff' : '#9ca3af',
              boxShadow: index === activeStep ? '0 4px 12px rgba(14,165,233,0.4)' : 'none',
            }}>
              {index < activeStep ? '✓' : index + 1}
            </div>
            <div style={{
              ...st.stepLabel,
              color: index <= activeStep ? '#111827' : '#9ca3af',
              fontWeight: index === activeStep ? 700 : 500,
            }}>
              {label}
            </div>
            {index < steps.length - 1 && (
              <div style={{
                ...st.stepLine,
                background: index < activeStep ? '#22c55e' : 'rgba(0,0,0,0.08)',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* STEP CONTENT — flows naturally, no inner scroll */}
      <div style={st.stepContentArea}>
        {renderStepContent(activeStep)}
      </div>

      {/* DIVIDER */}
      <div style={st.divider} />

      {/* NAVIGATION */}
      <div style={st.navRow}>
        <button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          style={{ ...st.btnOutline, opacity: activeStep === 0 ? 0.4 : 1, cursor: activeStep === 0 ? 'not-allowed' : 'pointer' }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={loading || success}
          style={{ ...st.btnPrimary, opacity: (loading || success) ? 0.6 : 1 }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={st.spinnerSm} />
              {activeStep === steps.length - 1 ? 'Submitting...' : 'Processing...'}
            </span>
          ) : (
            activeStep === steps.length - 1 ? 'Submit Registration' :
            'Next →'
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes snackSlideIn { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes bounceArrow {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #c0c4cc; }
      `}</style>
    </div>
  );

  // ============================================================
  // EMBEDDED vs STANDALONE
  // ============================================================
  if (embedded) return formContent;

  // STANDALONE MODE
  return (
    <div style={st.pageWrapper}>
      <div style={st.bgLayer}>
        <div style={st.bgOverlay} />
        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000" alt="Workspace" style={{ ...st.bgImage, transform: mounted ? 'scale(1.1)' : 'scale(1)' }} />
      </div>
      <div style={{ ...st.mainStandalone, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(40px)' }}>
        <div ref={scrollCardRef} style={st.standaloneCard}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#111827', margin: 0 }}>Student Registration</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Complete all steps to create your account</p>
          </div>
          {formContent}
          {/* SCROLL DOWN ARROW INDICATOR */}
          <ScrollDownArrow targetRef={scrollCardRef} />
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes snackSlideIn { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes bounceArrow {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: hidden; }
        input::placeholder, textarea::placeholder { color: #c0c4cc; }
      `}</style>
    </div>
  );
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

const GlassInput = ({ label, name, value, onChange, type = 'text', required = false, hint = '', multiline = false, isPassword = false, hintColor = '' }) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Determine the actual input type for password fields
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const baseStyle = {
    width: '100%', padding: multiline ? '11px 16px' : isPassword ? '11px 40px 11px 16px' : '11px 16px', border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: '12px', outline: 'none', transition: 'all 0.3s', color: '#111827', fontWeight: 600,
    fontSize: '13.5px', fontFamily: 'inherit', resize: multiline ? 'vertical' : 'none',
    backgroundColor: focused ? '#fff' : 'rgba(255,255,255,0.5)',
    borderColor: focused ? '#0ea5e9' : 'rgba(255,255,255,0.5)',
    boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.1)' : 'none',
  };

  const eyeButtonStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: showPassword ? '#0ea5e9' : '#9ca3af',
    transition: 'color 0.2s',
  };

  return (
    <div style={{ flex: 1, minWidth: 0, marginBottom: '4px' }}>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', marginLeft: '2px', color: focused ? '#0ea5e9' : '#9ca3af', transition: 'color 0.2s' }}>
        {label} {required && '*'}
      </label>
      {multiline ? (
        <textarea name={name} value={value} onChange={onChange} required={required} rows={2}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={baseStyle} />
      ) : (
        <div style={{ position: 'relative' }}>
          <input type={inputType} name={name} value={value} onChange={onChange} required={required}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={baseStyle} />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              style={eyeButtonStyle}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
            </button>
          )}
        </div>
      )}
      {hint && <div style={{ fontSize: '10px', color: hintColor || '#9ca3af', marginTop: '2px', marginLeft: '2px' }}>{hint}</div>}
    </div>
  );
};

const GlassSelect = ({ label, name, value, onChange, options, required = false }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ flex: 1, minWidth: 0, marginBottom: '4px' }}>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', marginLeft: '2px', color: focused ? '#0ea5e9' : '#9ca3af', transition: 'color 0.2s' }}>
        {label} {required && '*'}
      </label>
      <select name={name} value={value} onChange={onChange} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '11px 16px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '12px',
          outline: 'none', transition: 'all 0.3s', color: '#111827', fontWeight: 600, fontSize: '13.5px',
          fontFamily: 'inherit', cursor: 'pointer', appearance: 'auto',
          backgroundColor: focused ? '#fff' : 'rgba(255,255,255,0.5)',
          borderColor: focused ? '#0ea5e9' : 'rgba(255,255,255,0.5)',
          boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.1)' : 'none',
        }}
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================

const st = {
  // PAGE
  pageWrapper: { position: 'relative', height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif" },
  bgLayer: { position: 'absolute', inset: 0, zIndex: 0 },
  bgOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top right,rgba(30,58,138,0.95),rgba(14,165,233,0.80),rgba(13,148,136,0.90))', zIndex: 10, mixBlendMode: 'multiply' },
  bgImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 25s ease-out' },
  mainStandalone: { position: 'relative', zIndex: 20, width: '100%', maxWidth: '900px', margin: '0 auto', padding: '16px', transition: 'all 1s ease-out', height: '100vh', display: 'flex', alignItems: 'center' },
  standaloneCard: { position: 'relative', width: '100%', maxHeight: '96vh', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(48px)', border: '1px solid rgba(255,255,255,0.40)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', borderRadius: '28px', padding: '28px 36px', overflow: 'auto' },

  // STEPPER
  stepper: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '0', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1, minWidth: '70px' },
  stepCircle: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, transition: 'all 0.3s', flexShrink: 0 },
  stepLabel: { fontSize: '9px', marginTop: '5px', textAlign: 'center', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  stepLine: { position: 'absolute', top: '16px', left: 'calc(50% + 20px)', width: 'calc(100% - 40px)', height: '2px', transition: 'background 0.3s' },

  // STEP CONTENT
  stepContentArea: { minHeight: '200px' },
  stepContent: {},
  stepTitle: { fontSize: '18px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  stepIcon: { fontSize: '20px' },
  stepDesc: { fontSize: '13px', color: '#6b7280', marginBottom: '14px' },
  row: { display: 'flex', gap: '14px', marginBottom: '2px' },

  // INLINE SUCCESS (for photo/voice capture confirmations)
  successInline: { background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', color: '#16a34a', padding: '10px 14px', borderRadius: '12px', margin: '12px 0', fontSize: '13px', fontWeight: 600 },

  // BUTTONS
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '14px', border: 'none', background: 'linear-gradient(to right,#1e3a8a,#0ea5e9)', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 6px 20px rgba(14,165,233,0.3)', fontFamily: 'inherit' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '14px', border: '2px solid rgba(14,165,233,0.3)', background: 'rgba(255,255,255,0.5)', color: '#0369a1', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit' },

  // PHOTO
  emptyCapture: { border: '2px dashed rgba(0,0,0,0.12)', borderRadius: '20px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', background: 'rgba(255,255,255,0.3)' },
  videoContainer: { position: 'relative', overflow: 'hidden', borderRadius: '16px', background: '#000', marginBottom: '10px' },
  videoElement: { width: '100%', height: '300px', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' },
  cameraBadge: { position: 'absolute', top: '10px', left: '10px', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 },
  faceGuide: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '3px dashed rgba(255,255,255,0.5)', borderRadius: '50%', width: '160px', height: '160px', pointerEvents: 'none' },
  photoPreviewWrap: { position: 'relative', display: 'inline-block', borderRadius: '16px', overflow: 'hidden', maxWidth: '100%' },
  photoPreviewImg: { maxWidth: '100%', maxHeight: '280px', display: 'block', transform: 'scaleX(-1)' },
  photoCheckBadge: { position: 'absolute', top: '10px', right: '10px', background: '#22c55e', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px' },

  // VOICE
  sentenceBox: { background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: '16px', padding: '16px', margin: '16px 0' },
  refreshBtn: { background: 'none', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  recordDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' },
  progressBarBg: { height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: '3px', background: 'linear-gradient(to right, #dc2626, #ef4444)', transition: 'width 0.5s' },
  audioPreview: { background: 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '12px', margin: '12px 0' },

  // REVIEW
  reviewCard: { background: 'rgba(255,255,255,0.5)', borderRadius: '16px', padding: '16px', marginTop: '12px', border: '1px solid rgba(0,0,0,0.05)' },
  reviewCardTitle: { fontSize: '13px', fontWeight: 800, color: '#0369a1', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  reviewGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  reviewLabel: { display: 'block', fontSize: '10px', color: '#9ca3af', fontWeight: 600, marginBottom: '2px' },
  reviewValue: { display: 'block', fontSize: '13px', color: '#111827', fontWeight: 600 },
  reviewSuccessCard: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '14px', padding: '14px', minWidth: '140px' },

  // NAV
  divider: { height: '1px', background: 'rgba(0,0,0,0.06)', margin: '14px 0' },
  navRow: { display: 'flex', justifyContent: 'space-between' },

  // SPINNERS
  spinnerSm: { display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  spinnerLg: { width: '32px', height: '32px', border: '3px solid rgba(14,165,233,0.2)', borderTop: '3px solid #0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};

export default StudentRegisterForm;