// src/components/student/DashboardGuide/DashboardGuide.jsx
//
// Custom guided-tour component for the Student Dashboard.
// ─ Zero dependencies beyond React + MUI (already in the project).
// ─ Matches the existing blue / teal gradient design language.
// ─ Spotlight overlay with smooth cutout, positioned tooltip, keyboard nav.
//
// USAGE:
//   import DashboardGuide from './DashboardGuide/DashboardGuide';
//   <DashboardGuide run={showGuide} onFinish={() => setShowGuide(false)} />

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, IconButton, LinearProgress } from '@mui/material';
import {
  Close,
  ArrowForward,
  ArrowBack,
  Lightbulb,
  CheckCircle,
  Dashboard,
  Description,
  VideoLibrary,
  Assignment,
  People,
  PendingActions,
  Analytics,
  EmojiEvents,
  CalendarToday,
  Notifications,
  PlayArrow,
  Quiz,
} from '@mui/icons-material';

/* ────────────────────────────────────────────
   1.  STEP DEFINITIONS
   ──────────────────────────────────────────── */

const TOUR_STEPS = [
  /* 0 — Welcome (centred modal, no spotlight) */
  {
    target: null,
    title: 'Welcome to Your Dashboard! 🎓',
    content:
      'This quick tour will walk you through every section of your student dashboard so you can get the most out of iMentora. It only takes a minute!',
    icon: <Dashboard sx={{ fontSize: 22 }} />,
    placement: 'center',
  },
  /* 1 — Sidebar */
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation Sidebar',
    content:
      'Your command centre. Jump between Course Documents, Sessions, Tasks, Mock Tests, Interviews, and Daily Standups — all organised by category.',
    icon: <Dashboard sx={{ fontSize: 22 }} />,
    placement: 'right',
  },
  /* 2 — Welcome Banner / Profile */
  {
    target: '[data-tour="welcome-banner"]',
    title: 'Your Profile & Daily Focus',
    content:
      'See your personalised greeting, course progress, study-time tracker, and task rank at a glance. The "Resume" button picks up right where you left off.',
    icon: <EmojiEvents sx={{ fontSize: 22 }} />,
    placement: 'bottom',
  },
  /* 3 — Live Session Card */
  {
    target: '[data-tour="live-session"]',
    title: 'Live Sessions',
    content:
      'When a live class is about to start you\'ll see a countdown here. Click "Join Room" to enter instantly — never miss a session!',
    icon: <PlayArrow sx={{ fontSize: 22 }} />,
    placement: 'left',
  },
  /* 4 — Stat Cards */
  {
    target: '[data-tour="stat-cards"]',
    title: 'Your Progress at a Glance',
    content:
      'Track tasks completed, average grade, videos watched, and total study hours. These update in real time as you learn.',
    icon: <Analytics sx={{ fontSize: 22 }} />,
    placement: 'bottom',
  },
  /* 5 — Active Assignments */
  {
    target: '[data-tour="active-assignments"]',
    title: 'Active Assignments',
    content:
      'All your current tasks in one place — see status (Pending / Submitted / Graded), priority, due dates, and scores. Click any task to view details or submit work.',
    icon: <Assignment sx={{ fontSize: 22 }} />,
    placement: 'right',
  },
  /* 6 — Session Recordings */
  {
    target: '[data-tour="session-recordings"]',
    title: 'Session Recordings',
    content:
      'Missed a class or want to revise? Recorded sessions live here with watch-progress tracking so you can pick up where you paused.',
    icon: <VideoLibrary sx={{ fontSize: 22 }} />,
    placement: 'right',
  },
  /* 7 — Quick Tips */
  {
    target: '[data-tour="quick-tips"]',
    title: 'Quick Tips',
    content:
      'Your trainers and mentors post helpful tips and advice here. Check back often for guidance tailored to your batch.',
    icon: <Lightbulb sx={{ fontSize: 22 }} />,
    placement: 'right',
  },
  /* 8 — Upcoming Events */
  {
    target: '[data-tour="upcoming-events"]',
    title: 'Upcoming Events',
    content:
      'Live sessions, project reviews, and meetings coming up next — so you always know what\'s on your schedule.',
    icon: <CalendarToday sx={{ fontSize: 22 }} />,
    placement: 'left',
  },
  /* 9 — Announcements */
  {
    target: '[data-tour="announcements"]',
    title: 'Announcements',
    content:
      'Important updates from your trainers and mentors appear here. Unread items are marked with a blue dot so nothing slips past you.',
    icon: <Notifications sx={{ fontSize: 22 }} />,
    placement: 'left',
  },
  /* 10 — Documents */
  {
    target: '[data-tour="documents"]',
    title: 'Course Documents',
    content:
      'PDFs, guides, and reference material for your courses. Download or view them any time.',
    icon: <Description sx={{ fontSize: 22 }} />,
    placement: 'left',
  },
  /* 11 — Student Support */
  {
    target: '[data-tour="student-support"]',
    title: 'Student Support',
    content:
      'Stuck? Reach out to the Discord community or ask a question directly. Help is just one click away.',
    icon: <People sx={{ fontSize: 22 }} />,
    placement: 'left',
  },
  /* 12 — Finish */
  {
    target: null,
    title: "You're All Set! 🚀",
    content:
      "That's the full tour. You can reopen this guide any time by clicking the ❓ button in the header. Happy learning!",
    icon: <CheckCircle sx={{ fontSize: 22 }} />,
    placement: 'center',
  },
];

/* ────────────────────────────────────────────
   2.  DESIGN TOKENS (matches existing theme)
   ──────────────────────────────────────────── */
const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

const OVERLAY_BG = 'rgba(10, 31, 61, 0.62)';
const TOOLTIP_BG = '#ffffff';
const ACCENT_GRADIENT = 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)';
const ACCENT_TEAL = '#0d9488';
const SPOTLIGHT_PADDING = 12;
const SPOTLIGHT_RADIUS = 18;
const TOOLTIP_WIDTH = 370;
const TRANSITION_MS = 350;

/* ────────────────────────────────────────────
   3.  KEYFRAMES (injected once)
   ──────────────────────────────────────────── */
const _guideKf =
  document.getElementById('guide-keyframes') ||
  (() => {
    const s = document.createElement('style');
    s.id = 'guide-keyframes';
    s.textContent = `
      @keyframes guideFadeIn {
        0%   { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes guideTooltipIn {
        0%   { opacity: 0; transform: translateY(10px) scale(0.97); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes guidePulseRing {
        0%   { box-shadow: 0 0 0 0 rgba(41,128,185,0.35); }
        70%  { box-shadow: 0 0 0 10px rgba(41,128,185,0); }
        100% { box-shadow: 0 0 0 0 rgba(41,128,185,0); }
      }
    `;
    document.head.appendChild(s);
    return s;
  })();

/* ────────────────────────────────────────────
   4.  COMPONENT
   ──────────────────────────────────────────── */
const DashboardGuide = ({ run = false, onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const tooltipRef = useRef(null);
  const resizeTimer = useRef(null);

  const step = TOUR_STEPS[currentStep] || {};
  const totalSteps = TOUR_STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isCenterStep = step.placement === 'center';

  /* ── Measure target element ── */
  const measureTarget = useCallback(() => {
    if (!step.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top - SPOTLIGHT_PADDING,
        left: rect.left - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      });
      // Scroll into view if needed
      const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!inView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const r2 = el.getBoundingClientRect();
          setTargetRect({
            top: r2.top - SPOTLIGHT_PADDING,
            left: r2.left - SPOTLIGHT_PADDING,
            width: r2.width + SPOTLIGHT_PADDING * 2,
            height: r2.height + SPOTLIGHT_PADDING * 2,
          });
        }, 450);
      }
    } else {
      // Element not found — skip this step automatically
      setTargetRect(null);
    }
  }, [step.target]);

  /* ── Open / close the tour ── */
  useEffect(() => {
    if (run) {
      setCurrentStep(0);
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [run]);

  /* ── Remeasure on step change / resize / scroll ── */
  useEffect(() => {
    if (!visible) return;
    measureTarget();

    const onResize = () => {
      clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(measureTarget, 150);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [visible, currentStep, measureTarget]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleFinish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── Navigation handlers ── */
  const handleNext = () => {
    if (currentStep >= totalSteps - 1) {
      handleFinish();
      return;
    }
    setTransitioning(true);
    setTimeout(() => {
      setCurrentStep((s) => s + 1);
      setTransitioning(false);
    }, TRANSITION_MS / 2);
  };

  const handlePrev = () => {
    if (currentStep <= 0) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentStep((s) => s - 1);
      setTransitioning(false);
    }, TRANSITION_MS / 2);
  };

  const handleFinish = () => {
    setVisible(false);
    document.body.style.overflow = '';
    try {
      localStorage.setItem('student_dashboard_tour_seen', 'true');
    } catch (_) {}
    if (onFinish) onFinish();
  };

  if (!visible) return null;

  /* ── Compute tooltip position ── */
  const getTooltipStyle = () => {
    if (isCenterStep || !targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: Math.min(TOOLTIP_WIDTH, window.innerWidth - 40),
      };
    }

    const style = { position: 'fixed', width: TOOLTIP_WIDTH };
    const gap = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    switch (step.placement) {
      case 'right': {
        style.left = targetRect.left + targetRect.width + gap;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = 'translateY(-50%)';
        if (style.left + TOOLTIP_WIDTH > vw - 20) {
          style.left = targetRect.left - TOOLTIP_WIDTH - gap;
        }
        break;
      }
      case 'left': {
        style.left = targetRect.left - TOOLTIP_WIDTH - gap;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = 'translateY(-50%)';
        if (style.left < 20) {
          style.left = targetRect.left + targetRect.width + gap;
        }
        break;
      }
      case 'bottom': {
        style.top = targetRect.top + targetRect.height + gap;
        style.left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
        if (style.left < 20) style.left = 20;
        if (style.left + TOOLTIP_WIDTH > vw - 20) style.left = vw - TOOLTIP_WIDTH - 20;
        break;
      }
      case 'top': {
        style.top = targetRect.top - gap;
        style.transform = 'translateY(-100%)';
        style.left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
        if (style.left < 20) style.left = 20;
        if (style.left + TOOLTIP_WIDTH > vw - 20) style.left = vw - TOOLTIP_WIDTH - 20;
        break;
      }
      default:
        break;
    }

    // Vertical clamping
    const parsedTop = typeof style.top === 'number' ? style.top : 0;
    if (parsedTop < 20) style.top = 20;
    if (parsedTop > vh - 220) style.top = vh - 220;

    return style;
  };

  /* ── Overlay clip-path for spotlight cutout ── */
  const getClipPath = () => {
    if (!targetRect) return 'none';
    const { top, left, width, height } = targetRect;
    const r = SPOTLIGHT_RADIUS;
    return `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
      ${left + r}px ${top}px,
      ${left + width - r}px ${top}px,
      ${left + width}px ${top + r}px,
      ${left + width}px ${top + height - r}px,
      ${left + width - r}px ${top + height}px,
      ${left + r}px ${top + height}px,
      ${left}px ${top + height - r}px,
      ${left}px ${top + r}px,
      ${left + r}px ${top}px
    )`;
  };

  return (
    <>
      {/* ── OVERLAY ── */}
      <Box
        onClick={handleFinish}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: OVERLAY_BG,
          backdropFilter: 'blur(2px)',
          clipPath: targetRect ? getClipPath() : 'none',
          transition: `clip-path ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1)`,
          animation: 'guideFadeIn 0.3s ease-out both',
        }}
      />

      {/* ── SPOTLIGHT RING (animated pulse around target) ── */}
      {targetRect && (
        <Box
          sx={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: `${SPOTLIGHT_RADIUS}px`,
            border: '2px solid rgba(41,128,185,0.45)',
            zIndex: 9999,
            pointerEvents: 'none',
            animation: 'guidePulseRing 2s ease-in-out infinite',
            transition: `all ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1)`,
          }}
        />
      )}

      {/* ── TOOLTIP ── */}
      <Box
        ref={tooltipRef}
        onClick={(e) => e.stopPropagation()}
        sx={{
          ...getTooltipStyle(),
          zIndex: 10000,
          background: TOOLTIP_BG,
          borderRadius: '20px',
          boxShadow:
            '0 8px 40px rgba(10,31,61,0.18), 0 2px 12px rgba(41,128,185,0.10)',
          overflow: 'hidden',
          opacity: transitioning ? 0 : 1,
          animation: transitioning
            ? 'none'
            : 'guideTooltipIn 0.35s ease-out both',
          transition: `opacity ${TRANSITION_MS / 2}ms ease`,
        }}
      >
        {/* Progress bar at top */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 4,
            bgcolor: 'rgba(41,128,185,0.08)',
            '& .MuiLinearProgress-bar': {
              background: ACCENT_GRADIENT,
              borderRadius: 0,
              transition: 'transform 0.4s ease',
            },
          }}
        />

        {/* Header row */}
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 0,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: '12px',
              background: ACCENT_GRADIENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(41,128,185,0.25)',
            }}
          >
            {step.icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: ACCENT_TEAL,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: fontStack,
                lineHeight: 1,
                mb: 0.4,
              }}
            >
              Step {currentStep + 1} of {totalSteps}
            </Typography>
            <Typography
              sx={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#0f172a',
                fontFamily: fontStack,
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
              }}
            >
              {step.title}
            </Typography>
          </Box>
          {/* Close button */}
          <IconButton
            onClick={handleFinish}
            size="small"
            sx={{
              width: 30,
              height: 30,
              color: '#94a3b8',
              flexShrink: 0,
              '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.06)' },
            }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ px: 3, pt: 1.5, pb: 2 }}>
          <Typography
            sx={{
              fontSize: '0.88rem',
              color: '#475569',
              lineHeight: 1.65,
              fontFamily: fontStack,
            }}
          >
            {step.content}
          </Typography>
        </Box>

        {/* Footer — navigation buttons */}
        <Box
          sx={{
            px: 3,
            pb: 2.5,
            pt: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          {/* Left: Skip / Back */}
          <Box display="flex" gap={1}>
            {currentStep > 0 ? (
              <Button
                onClick={handlePrev}
                startIcon={
                  <ArrowBack sx={{ fontSize: '16px !important' }} />
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: '#64748b',
                  borderRadius: '10px',
                  px: 2,
                  py: 0.8,
                  fontFamily: fontStack,
                  '&:hover': { bgcolor: 'rgba(100,116,139,0.06)' },
                }}
              >
                Back
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: '#94a3b8',
                  borderRadius: '10px',
                  px: 2,
                  py: 0.8,
                  fontFamily: fontStack,
                  '&:hover': { bgcolor: 'rgba(148,163,184,0.08)' },
                }}
              >
                Skip Tour
              </Button>
            )}
          </Box>

          {/* Right: Next / Finish */}
          <Button
            onClick={handleNext}
            endIcon={
              currentStep < totalSteps - 1 ? (
                <ArrowForward sx={{ fontSize: '16px !important' }} />
              ) : (
                <CheckCircle sx={{ fontSize: '16px !important' }} />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: '#fff',
              background: ACCENT_GRADIENT,
              borderRadius: '10px',
              px: 2.5,
              py: 0.9,
              fontFamily: fontStack,
              boxShadow: '0 4px 12px rgba(41,128,185,0.25)',
              '&:hover': {
                boxShadow: '0 6px 18px rgba(41,128,185,0.35)',
              },
            }}
          >
            {currentStep < totalSteps - 1 ? 'Next' : 'Finish Tour'}
          </Button>
        </Box>

        {/* Keyboard hint */}
        <Box
          sx={{
            px: 3,
            pb: 1.8,
            display: 'flex',
            justifyContent: 'center',
            gap: 0.6,
          }}
        >
          {['←', '→', 'Esc'].map((k) => (
            <Box
              key={k}
              sx={{
                px: 0.8,
                py: 0.2,
                borderRadius: '4px',
                bgcolor: 'rgba(100,116,139,0.06)',
                border: '1px solid rgba(100,116,139,0.10)',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.55rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                }}
              >
                {k}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
};

export default DashboardGuide;