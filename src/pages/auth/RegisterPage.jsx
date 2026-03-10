import React, { useState, useEffect, useRef, useCallback } from 'react';
import TrainerRegisterForm from '../../components/auth/TrainerRegisterForm';
import StudentRegisterForm from '../../components/auth/Studentregisterform';
import MentorRegisterForm from '../../components/auth/MentorRegisterForm';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [mounted, setMounted] = useState(false);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);
  // ============================================================
  // SCROLL DETECTION — show/hide down arrow
  // ============================================================
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 40;
    setShowScrollArrow(hasMore);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll, selectedRole]);

  // Reset scroll when switching roles
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setTimeout(checkScroll, 100);
  }, [selectedRole, checkScroll]);

  const handleScrollDown = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: 250, behavior: 'smooth' });
    }
  };

  // Tab config for 3 roles
  const tabs = [
    { key: 'student', label: 'Student' },
    { key: 'trainer', label: 'Trainer' },
    { key: 'mentor', label: 'Mentor' },
  ];
  const activeIndex = tabs.findIndex(t => t.key === selectedRole);

  return (
    <div style={s.pageWrapper}>
      {/* IMMERSIVE BACKGROUND */}
      <div style={s.bgLayer}>
        <div style={s.bgOverlay} />
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000"
          alt="Collaboration Workspace"
          style={{ ...s.bgImage, transform: mounted ? 'scale(1.1)' : 'scale(1)' }}
        />
      </div>

      {/* FLOATING DECORATIVE ELEMENTS */}
      <div style={s.floatingContainer}>
        <div style={s.floatingCircle1}>
          {selectedRole === 'student' ? <CheckCircleSVG /> : selectedRole === 'mentor' ? <MentorSVG /> : <ShieldSVG />}
        </div>
        <div style={s.floatingCircle2}>
          {selectedRole === 'student' ? <BookSVG /> : <UserSVG />}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div style={{
        ...s.mainContainer,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(48px)',
      }}>
        {/* LEFT: BRAND PANEL */}
        <div style={s.brandPanel}>
          <div style={s.brandContent}>
            <div style={s.iconBadge}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h2 style={s.brandTitle}>
              Start Your <br />
              <span style={s.brandTitleAccent}>Expert Journey.</span>
            </h2>
            <p style={s.brandDescription}>
              Join thousands of professionals and students. iMentora provides the tools you need to excel in your next interview.
            </p>
          </div>
        </div>

        {/* RIGHT: GLASS CARD */}
        <div style={s.formCard}>
          {/* TAB SWITCHER — 3 tabs */}
          <div style={s.tabContainer}>
            <div style={s.tabWrapper}>
              <div style={{
                ...s.tabSlider,
                width: `calc(${100 / tabs.length}% - ${10 / tabs.length}px)`,
                transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * (10 / tabs.length)}px))`,
              }} />
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedRole(tab.key)}
                  style={{
                    ...s.tabButton,
                    color: selectedRole === tab.key ? '#111827' : '#6b7280',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TITLE */}
          <div style={s.formHeader}>
            <h1 style={s.formTitle}>
              {selectedRole === 'student'
                ? 'Student Registration'
                : selectedRole === 'trainer'
                ? 'Trainer Registration'
                : 'Mentor Registration'}
            </h1>
            <p style={s.formSubtitle}>Fill in the details to create your profile</p>
          </div>

          {/* SINGLE SCROLLABLE FORM BODY */}
          <div ref={scrollRef} style={s.formBody}>
            {selectedRole === 'student' ? (
              <StudentRegisterForm embedded />
            ) : selectedRole === 'trainer' ? (
              <TrainerRegisterForm embedded />
            ) : (
              <MentorRegisterForm embedded />
            )}
          </div>

          {/* SCROLL DOWN ARROW */}
          {showScrollArrow && (
            <div style={s.scrollArrowWrap}>
              <button onClick={handleScrollDown} style={s.scrollArrowBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}

          {/* LOGIN LINK */}
          <div style={s.loginLink}>
            <p style={s.loginText}>
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} style={s.loginButton}>
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounceArrow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; overflow: hidden; }
      `}</style>
    </div>
  );
};

/* ========== SVG ICONS ========== */

const CheckCircleSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const ShieldSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const BookSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);
const UserSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const MentorSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

/* ========== STYLES ========== */

const s = {
  pageWrapper: {
    position: 'relative', height: '100vh', width: '100vw', display: 'flex',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif",
  },
  bgLayer: { position: 'absolute', inset: 0, zIndex: 0 },
  bgOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top right, rgba(30,58,138,0.95), rgba(14,165,233,0.80), rgba(13,148,136,0.90))',
    zIndex: 10, mixBlendMode: 'multiply',
  },
  bgImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 25s ease-out' },
  floatingContainer: { position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' },
  floatingCircle1: {
    position: 'absolute', top: '8%', left: '6%', width: '60px', height: '60px',
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(48px)', borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCircle2: {
    position: 'absolute', top: '10%', right: '4%', width: '70px', height: '70px',
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(48px)', borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainer: {
    position: 'relative', zIndex: 20, width: '100%', maxWidth: '1280px', margin: '0 auto',
    display: 'flex', flexDirection: 'row', padding: '16px', transition: 'all 1s ease-out',
    alignItems: 'center', height: '100vh',
  },
  brandPanel: {
    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
    paddingRight: '48px', color: 'white',
  },
  brandContent: { display: 'flex', flexDirection: 'column', gap: '18px' },
  iconBadge: {
    background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.20)', padding: '10px', borderRadius: '14px',
    width: 'fit-content',
  },
  brandTitle: { fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.04em', margin: 0 },
  brandTitleAccent: {
    background: 'linear-gradient(to right, #bfdbfe, #99f6e4)', WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  brandDescription: {
    fontSize: 'clamp(0.9rem, 1.1vw, 1.1rem)', color: 'rgba(255,255,255,0.80)', fontWeight: 500,
    lineHeight: 1.6, maxWidth: '400px', margin: 0,
  },

  /* GLASS FORM CARD */
  formCard: {
    width: '680px', minWidth: '680px', maxHeight: '94vh',
    background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(48px)',
    border: '1px solid rgba(255,255,255,0.40)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    borderRadius: '32px', padding: '28px 36px',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    position: 'relative',
  },

  /* TAB SWITCHER — updated for 3 tabs */
  tabContainer: { display: 'flex', justifyContent: 'center', marginBottom: '16px', flexShrink: 0 },
  tabWrapper: {
    position: 'relative', background: 'rgba(0,0,0,0.05)', padding: '5px',
    borderRadius: '14px', display: 'flex', width: '100%', maxWidth: '420px',
  },
  tabSlider: {
    position: 'absolute', top: '5px', bottom: '5px',
    background: '#ffffff', borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease-out',
    left: '5px',
  },
  tabButton: {
    flex: 1, padding: '8px 0', fontSize: '13px', fontWeight: 700,
    background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
    zIndex: 10, transition: 'color 0.2s', fontFamily: 'inherit',
  },

  /* FORM HEADER */
  formHeader: { textAlign: 'center', marginBottom: '12px', flexShrink: 0 },
  formTitle: { fontSize: '1.6rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.025em', margin: 0 },
  formSubtitle: { color: '#6b7280', fontSize: '11px', fontWeight: 500, marginTop: '2px' },

  /* SINGLE SCROLLABLE FORM BODY — the ONLY scroll container */
  formBody: {
    flex: 1, overflow: 'auto', minHeight: 0,
    paddingRight: '6px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(0,0,0,0.08) transparent',
  },

  /* SCROLL DOWN ARROW */
  scrollArrowWrap: {
    display: 'flex', justifyContent: 'center', paddingTop: '8px', flexShrink: 0,
  },
  scrollArrowBtn: {
    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
    background: 'linear-gradient(135deg, #1e3a8a, #0ea5e9)', color: 'white',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
    animation: 'bounceArrow 1.5s ease-in-out infinite',
    transition: 'all 0.2s',
  },

  /* LOGIN LINK */
  loginLink: { marginTop: '10px', textAlign: 'center', flexShrink: 0 },
  loginText: { fontSize: '13px', fontWeight: 700, color: '#6b7280', margin: 0 },
  loginButton: {
    background: 'none', border: 'none', color: '#0ea5e9', fontWeight: 900,
    cursor: 'pointer', textDecoration: 'none', fontSize: '13px', padding: 0,
    fontFamily: 'inherit',
  },
};

export default RegisterPage;