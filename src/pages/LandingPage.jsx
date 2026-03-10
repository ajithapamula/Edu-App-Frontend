// src/pages/LandingPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Fade,
  Chip,
  Stack,
} from "@mui/material";
import {
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  RecordVoiceOver as VoiceIcon,
  Assessment as AssessmentIcon,
  Groups as GroupsIcon,
  VerifiedUser as VerifiedIcon,
  AutoAwesome as SparkleIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckIcon,
  MenuBook as BookIcon,
  WorkOutline as WorkIcon,
  TrendingUp as TrendingUpIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  KeyboardArrowDown as ScrollDownIcon,
} from "@mui/icons-material";

// ─── Exact Color Palette from Tailwind @theme ───
const C = {
  primary:     "#0D1B2A",
  secondary:   "#1B263B",
  accent:      "#00D2FF",
  teal:        "#00F5D4",
  blue:        "#2563a0",
  navy:        "#0b1d3a",
};

// Derived opacity helpers
const D = {
  white04:  "rgba(255,255,255,0.04)",
  white05:  "rgba(255,255,255,0.05)",
  white02:  "rgba(255,255,255,0.02)",
  white03:  "rgba(255,255,255,0.03)",
  white10:  "rgba(255,255,255,0.1)",
  white20:  "rgba(255,255,255,0.2)",
  white30:  "rgba(255,255,255,0.3)",
  white40:  "rgba(255,255,255,0.4)",
  white50:  "rgba(255,255,255,0.5)",
  white60:  "rgba(255,255,255,0.6)",
  white70:  "rgba(255,255,255,0.7)",
  white80:  "rgba(255,255,255,0.8)",
  teal10:   "rgba(0,245,212,0.10)",
  teal20:   "rgba(0,245,212,0.20)",
  teal30:   "rgba(0,245,212,0.30)",
  teal35:   "rgba(0,245,212,0.35)",
  teal05:   "rgba(0,245,212,0.05)",
  orange10: "rgba(251,146,60,0.10)",
  orange30: "rgba(251,146,60,0.30)",
};

// ─── Glass Card (exact match: .glass-card in CSS) ───
const glassCard = {
  background: D.white04,
  backdropFilter: "blur(20px)",
  border: `1px solid ${D.white10}`,
  borderRadius: "20px",
  transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "&:hover": {
    transform: "translateY(-8px)",
    border: `1px solid ${D.teal35}`,
    boxShadow: `0 20px 60px rgba(0,245,212,0.15)`,
  },
};

// ─── Animated Counter ───
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.5 }
    );
    const el = document.getElementById(`counter-${end}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, end, duration]);

  return <span id={`counter-${end}`}>{count.toLocaleString()}{suffix}</span>;
};

// ─── Feature Card ───
const FeatureCard = ({ icon, title, description, delay = 0 }) => (
  <Card elevation={0} sx={{
    ...glassCard, height: "100%",
    animation: `fadeInUp 0.8s ${delay}ms both`,
    "@keyframes fadeInUp": {
      "0%": { opacity: 0, transform: "translateY(20px)" },
      "100%": { opacity: 1, transform: "translateY(0)" },
    },
  }}>
    <CardContent sx={{ p: 4, "&:last-child": { pb: 4 } }}>
      <Box sx={{
        width: 56, height: 56, borderRadius: "16px",
        background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        mb: 3,
        boxShadow: `0 8px 32px rgba(0,210,255,0.35)`,
      }}>
        {React.cloneElement(icon, { sx: { color: C.primary, fontSize: 28 } })}
      </Box>
      <Typography sx={{ color: "#fff", fontWeight: 700, mb: 1.5, fontSize: "1.25rem", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
        {title}
      </Typography>
      <Typography sx={{ color: D.white50, lineHeight: 1.625, fontSize: "0.875rem" }}>
        {description}
      </Typography>
    </CardContent>
  </Card>
);

// ─── Step Card ───
const StepCard = ({ number, title, description }) => (
  <Box sx={{ textAlign: "center", px: 2 }}>
    <Box sx={{
      width: 80, height: 80, borderRadius: "50%",
      background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      mx: "auto", mb: 3,
      boxShadow: `0 8px 32px rgba(0,210,255,0.35)`,
      position: "relative",
      transition: "transform 0.2s",
      "&:hover": { transform: "scale(1.1)" },
      "&::after": {
        content: '""', position: "absolute", inset: -6, borderRadius: "50%",
        border: `2px solid ${D.teal20}`,
      },
    }}>
      <Typography sx={{ color: C.primary, fontWeight: 900, fontSize: "1.875rem" }}>{number}</Typography>
    </Box>
    <Typography sx={{ color: "#fff", fontWeight: 700, mb: 1.5, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>{title}</Typography>
    <Typography sx={{ color: D.white50, lineHeight: 1.625, fontSize: "0.875rem" }}>{description}</Typography>
  </Box>
);

// ─── Role Card ───
const RoleCard = ({ icon, role, features, color }) => (
  <Card elevation={0} sx={{ ...glassCard, height: "100%", overflow: "visible" }}>
    <CardContent sx={{ p: 5, "&:last-child": { pb: 5 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: "12px",
          background: D.white05, border: `1px solid ${D.white10}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
        </Box>
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>{role}</Typography>
      </Box>
      <Stack spacing={2}>
        {features.map((f, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <CheckIcon sx={{ color, fontSize: 20, flexShrink: 0, mt: "2px" }} />
            <Typography sx={{ color: D.white60, fontSize: "0.875rem", lineHeight: 1.5 }}>{f}</Typography>
          </Box>
        ))}
      </Stack>
    </CardContent>
  </Card>
);


// ═══════════════════════════════════════════
// ─── MAIN LANDING PAGE ───
// ═══════════════════════════════════════════
const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role) navigate(`/${user.role}/dashboard`, { replace: true });
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const features = [
    { icon: <PsychologyIcon />, title: "AI Mock Interviews", description: "Practice with our AI interviewer that adapts to your skill level with real-time voice interaction and intelligent follow-up questions." },
    { icon: <VoiceIcon />, title: "Daily Standups", description: "Build communication skills with AI-powered daily standup sessions. Get instant feedback on clarity, structure, and delivery." },
    { icon: <AssessmentIcon />, title: "Smart Assessments", description: "Take developer and non-developer mock tests with AI-generated questions, auto-evaluation, and detailed performance analytics." },
    { icon: <VerifiedIcon />, title: "Proctored Sessions", description: "Face verification, tab-switch detection, and real-time monitoring ensure authentic and credible assessment results." },
    { icon: <BookIcon />, title: "Course Management", description: "Organize course documents, session recordings, and training materials in one centralized, easy-to-navigate platform." },
    { icon: <TrendingUpIcon />, title: "Progress Tracking", description: "Detailed scorecards, performance trends, and actionable insights help students and trainers track growth over time." },
  ];

  const roles = [
    { icon: <SchoolIcon />, role: "Students", color: C.accent, features: ["AI-powered mock interviews & standups", "Mock tests with instant evaluation", "Task submissions & evaluations", "Course documents & session recordings", "Detailed performance analytics"] },
    { icon: <WorkIcon />, role: "Trainers", color: "#fb923c", features: ["Batch & student management", "Create sessions, tasks & assignments", "Review submissions & task results", "Monitor interview & standup scores", "Test compilation & result tracking"] },
    { icon: <GroupsIcon />, role: "Mentors", color: C.teal, features: ["Oversee batches & student progress", "View course documents & recordings", "Monitor task submissions & results", "Track mock interview performance", "Access standup & test analytics"] },
  ];

  return (
    <Box sx={{ minHeight: "100vh", background: C.navy, color: "#fff" }}>

      {/* ═══ NAVBAR ═══ */}
      <AppBar position="fixed" elevation={0} sx={{
        background: scrolled ? "rgba(11,29,58,0.80)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? `1px solid ${D.white05}` : "none",
        transition: "all 0.3s ease",
      }}>
        <Toolbar sx={{ maxWidth: 1280, width: "100%", mx: "auto", px: 3, py: scrolled ? 0.75 : 1.25, minHeight: "auto !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", flexGrow: 1 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "12px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 20px rgba(0,210,255,0.45)`,
              transition: "transform 0.2s",
              "&:hover": { transform: "scale(1.1)" },
            }}>
              <SparkleIcon sx={{ color: C.primary, fontSize: 20 }} />
            </Box>
            <Typography sx={{ color: "#fff", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "1.25rem" }}>
              iMentora
            </Typography>
          </Box>

          {!isMobile && (
            <Stack direction="row" spacing={0.5} sx={{ mr: 2 }}>
              {["Features", "How It Works", "Roles"].map((item) => (
                <Button key={item} onClick={() => scrollTo(item.toLowerCase().replace(/\s+/g, "-"))}
                  sx={{ color: D.white70, textTransform: "none", fontWeight: 500, fontSize: "0.875rem", px: 2, py: 1, borderRadius: "8px", minWidth: "auto", "&:hover": { color: "#fff", background: D.white05 } }}>
                  {item}
                </Button>
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={1.5}>
            <Button variant="text" onClick={() => navigate("/login")} startIcon={!isSmall ? <LoginIcon sx={{ fontSize: "16px !important" }} /> : null}
              sx={{ color: "#fff", textTransform: "none", fontWeight: 700, fontSize: "0.875rem", px: 2.5, py: 1.25, borderRadius: "12px", border: `1px solid ${D.white20}`, "&:hover": { background: D.white05 } }}>
              Sign In
            </Button>
            <Button variant="contained" onClick={() => navigate("/register")} startIcon={!isSmall ? <RegisterIcon sx={{ fontSize: "16px !important" }} /> : null}
              sx={{ background: `linear-gradient(to right, ${C.accent}, ${C.teal})`, color: C.primary, textTransform: "none", fontWeight: 700, fontSize: "0.875rem", px: 2.5, py: 1.25, borderRadius: "12px", boxShadow: `0 4px 20px rgba(0,210,255,0.45)`, "&:hover": { opacity: 0.9 } }}>
              Register
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>


      {/* ═══ HERO ═══ */}
      <Box sx={{
        position: "relative", minHeight: "100vh",
        display: "flex", alignItems: "center",
        pt: 16, pb: 16, px: 3,
        overflow: "hidden",
      }}>
        {/* Background Image + Overlay — REDUCED for better visibility */}
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Box component="img"
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1920"
            alt="" referrerPolicy="no-referrer"
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${C.navy}, rgba(11,29,58,0.70), rgba(11,29,58,0.20))` }} />
        </Box>

        {/* Glow Effects */}
        <Box sx={{ position: "absolute", top: "12%", left: "-8%", width: 450, height: 450, borderRadius: "50%", background: `${C.teal}1a`, filter: "blur(60px)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: "8%", right: "-6%", width: 400, height: 400, borderRadius: "50%", background: `${C.blue}1a`, filter: "blur(60px)", pointerEvents: "none" }} />

        <Box sx={{ maxWidth: 1280, mx: "auto", position: "relative", zIndex: 1, width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0, md: 6 }, flexDirection: { xs: "column", md: "row" } }}>
            {/* Left column: text content */}
            <Box sx={{ flex: { md: "0 0 58%" }, maxWidth: { xs: "100%", md: "58%" }, width: "100%" }}>
              <Fade in timeout={600}>
                <Box>
                  {/* Badge */}
                  <Chip
                    icon={<SparkleIcon sx={{ color: `${C.teal} !important`, fontSize: 16 }} />}
                    label="AI-Powered Training Platform"
                    sx={{
                      background: D.teal10, border: `1px solid ${D.teal30}`, color: C.teal,
                      fontWeight: 700, fontSize: "0.75rem", mb: 3, px: 0.5, borderRadius: "8px",
                      backdropFilter: "blur(12px)", height: "auto", py: 0.5,
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />

                  {/* Heading */}
                  <Typography variant="h1" sx={{
                    color: "#fff", fontWeight: 800,
                    fontSize: { xs: "3rem", sm: "3.5rem", md: "4.5rem" },
                    lineHeight: 1.1, letterSpacing: "-0.03em", mb: 3,
                  }}>
                    Master Your{" "}
                    <Box component="span" sx={{ background: `linear-gradient(to right, ${C.accent}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Interviews
                    </Box>
                    {" "}with AI Mentorship
                  </Typography>

                  {/* Subtext */}
                  <Typography sx={{
                    color: D.white60, fontSize: "1.125rem", lineHeight: 1.625,
                    mb: 5, maxWidth: 560,
                  }}>
                    Practice mock interviews, daily standups, and assessments with real-time AI feedback.
                    Built for students, trainers, and mentors to accelerate career readiness.
                  </Typography>

                  {/* Buttons */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 8 }}>
                    <Button variant="contained" size="large" onClick={() => navigate("/register")} endIcon={<ArrowForwardIcon />}
                      sx={{
                        background: `linear-gradient(to right, ${C.accent}, ${C.teal})`, color: C.primary,
                        textTransform: "none", fontWeight: 700, fontSize: "1.125rem",
                        px: 4, py: 2, borderRadius: "12px",
                        boxShadow: `0 4px 20px rgba(0,210,255,0.45)`,
                        "&:hover": { boxShadow: `0 6px 30px rgba(0,210,255,0.65)` },
                        "&:active": { transform: "scale(0.95)" },
                      }}>
                      Get Started Free
                    </Button>
                    <Button variant="outlined" size="large" onClick={() => navigate("/login")} startIcon={<LoginIcon />}
                      sx={{
                        color: "#fff", borderColor: D.white20,
                        textTransform: "none", fontWeight: 700, fontSize: "1.125rem",
                        px: 4, py: 2, borderRadius: "12px", backdropFilter: "blur(12px)",
                        "&:hover": { background: D.white05, borderColor: D.white20 },
                        "&:active": { transform: "scale(0.95)" },
                      }}>
                      Sign In
                    </Button>
                  </Stack>

                  {/* Stats */}
                  <Stack direction="row" spacing={{ xs: 4, md: 6 }}>
                    {[
                      { value: 500, suffix: "+", label: "Active Students" },
                      { value: 10000, suffix: "+", label: "Interviews Taken" },
                      { value: 95, suffix: "%", label: "Satisfaction Rate" },
                    ].map((s) => (
                      <Box key={s.label}>
                        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "1.875rem", md: "2.25rem" }, lineHeight: 1.2 }}>
                          <AnimatedCounter end={s.value} suffix={s.suffix} />
                        </Typography>
                        <Typography sx={{ color: D.white40, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", mt: 0.5 }}>
                          {s.label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Fade>
            </Box>

            {/* Right column: Hero Visual Card */}
            <Box sx={{ flex: { md: "0 0 42%" }, maxWidth: { xs: "100%", md: "42%" }, width: "100%", display: { xs: "none", md: "block" } }}>
              <Fade in timeout={1000}>
                <Box sx={{ position: "relative" }}>
                  <Box sx={{ ...glassCard, p: 4, "&:hover": { transform: "none" } }}>
                    {/* AI Powered badge */}
                    <Box sx={{
                      position: "absolute", top: -16, right: -16, zIndex: 20,
                      px: 2, py: 1, borderRadius: "12px",
                      background: `linear-gradient(to right, ${C.accent}, ${C.teal})`,
                      boxShadow: `0 10px 30px rgba(0,245,212,0.30)`,
                    }}>
                      <Typography sx={{ color: C.primary, fontWeight: 700, fontSize: "0.875rem" }}>AI Powered ✨</Typography>
                    </Box>

                    {/* Session card */}
                    <Box sx={{ background: D.teal05, border: `1px solid ${D.teal20}`, borderRadius: "12px", p: 2.5, mb: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: C.teal, boxShadow: `0 0 10px rgba(0,245,212,0.5)` }} />
                        <Typography sx={{ color: C.teal, fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          AI Interview Session — Live
                        </Typography>
                      </Box>
                      <Typography sx={{ color: D.white80, fontSize: "0.875rem", fontStyle: "italic", lineHeight: 1.625 }}>
                        "Tell me about a challenging project you worked on and how you overcame obstacles..."
                      </Typography>
                    </Box>

                    {/* Score grid */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
                      {[
                        { label: "Clarity", score: 92, color: C.accent },
                        { label: "Depth", score: 87, color: C.teal },
                        { label: "Confidence", score: 90, color: "#fb923c" },
                      ].map((item) => (
                        <Box key={item.label} sx={{ background: D.white03, borderRadius: "12px", p: 1.5, textAlign: "center" }}>
                          <Typography sx={{ color: item.color, fontWeight: 800, fontSize: "1.5rem", lineHeight: 1.2 }}>{item.score}</Typography>
                          <Typography sx={{ color: D.white40, fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", mt: 0.5 }}>
                            {item.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Fade>
            </Box>
          </Box>
        </Box>

        {/* Scroll arrow */}
        <Box onClick={() => scrollTo("features")} sx={{
          position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
          cursor: "pointer",
          animation: "bounceArrow 2s infinite",
          "@keyframes bounceArrow": {
            "0%,20%,50%,80%,100%": { transform: "translateX(-50%) translateY(0)" },
            "40%": { transform: "translateX(-50%) translateY(-12px)" },
            "60%": { transform: "translateX(-50%) translateY(-6px)" },
          },
        }}>
          <ScrollDownIcon sx={{ color: D.white30, fontSize: 40, transition: "color 0.2s", "&:hover": { color: "#fff" } }} />
        </Box>
      </Box>


      {/* ═══ FEATURES ═══ */}
      <Box id="features" sx={{ py: { xs: 10, md: 16 }, px: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Box component="img"
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1920"
            alt="" referrerPolicy="no-referrer"
            sx={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }}
          />
          <Box sx={{ position: "absolute", inset: 0, background: `${C.primary}99` }} />
        </Box>

        <Box sx={{ maxWidth: 1280, mx: "auto", position: "relative", zIndex: 1 }}>
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Chip label="Features" sx={{
              background: D.teal10, border: `1px solid ${D.teal30}`, color: C.teal,
              fontWeight: 700, fontSize: "0.75rem", mb: 2, borderRadius: "12px",
              textTransform: "uppercase", letterSpacing: "0.1em",
            }} />
            <Typography variant="h2" sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "2rem", md: "3rem" }, letterSpacing: "-0.03em", mb: 2 }}>
              Everything You Need to{" "}
              <Box component="span" sx={{ background: `linear-gradient(to right, ${C.accent}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Succeed
              </Box>
            </Typography>
            <Typography sx={{ color: D.white50, fontSize: "1.125rem", maxWidth: 670, mx: "auto", lineHeight: 1.7 }}>
              A comprehensive platform combining AI technology with structured training methodologies.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {features.map((f, i) => (
              <Box key={f.title} sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 12px)", md: "1 1 calc(33.333% - 16px)" } }}>
                <FeatureCard {...f} delay={i * 100} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>


      {/* ═══ HOW IT WORKS ═══ */}
      <Box id="how-it-works" sx={{ py: { xs: 10, md: 16 }, px: 3, background: D.white02 }}>
        <Box sx={{ maxWidth: 1280, mx: "auto" }}>
          <Box sx={{ textAlign: "center", mb: 10 }}>
            <Chip label="How It Works" sx={{
              background: D.orange10, border: `1px solid ${D.orange30}`, color: "#fb923c",
              fontWeight: 700, fontSize: "0.75rem", mb: 2, borderRadius: "12px",
              textTransform: "uppercase", letterSpacing: "0.1em",
            }} />
            <Typography variant="h2" sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "2rem", md: "3rem" }, letterSpacing: "-0.03em" }}>
              Start in{" "}
              <Box component="span" sx={{ color: "#fb923c" }}>3 Simple Steps</Box>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 4, md: 6 } }}>
            {[
              { number: "1", title: "Create Your Account", description: "Sign up as a student, trainer, or mentor. Set up your profile and get matched with your batch." },
              { number: "2", title: "Practice & Learn", description: "Take AI-powered mock interviews, complete daily standups, submit tasks, and access course materials." },
              { number: "3", title: "Track & Improve", description: "Review detailed scorecards, get AI feedback, track your progress, and continuously improve your skills." },
            ].map((s) => (
              <Box key={s.number} sx={{ flex: { md: "1 1 0%" }, width: { xs: "100%", md: "33.333%" } }}>
                <StepCard {...s} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>


      {/* ═══ ROLES ═══ */}
      <Box id="roles" sx={{ py: { xs: 10, md: 16 }, px: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Box component="img"
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1920"
            alt="" referrerPolicy="no-referrer"
            sx={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }}
          />
          <Box sx={{ position: "absolute", inset: 0, background: `${C.navy}b3` }} />
        </Box>

        <Box sx={{ maxWidth: 1280, mx: "auto", position: "relative", zIndex: 1 }}>
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Chip label="For Everyone" sx={{
              background: D.teal10, border: `1px solid ${D.teal30}`, color: C.teal,
              fontWeight: 700, fontSize: "0.75rem", mb: 2, borderRadius: "12px",
              textTransform: "uppercase", letterSpacing: "0.1em",
            }} />
            <Typography variant="h2" sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "2rem", md: "3rem" }, letterSpacing: "-0.03em" }}>
              Built for Every{" "}
              <Box component="span" sx={{ background: `linear-gradient(to right, ${C.accent}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Role
              </Box>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4, alignItems: "stretch" }}>
            {roles.map((r) => (
              <Box key={r.role} sx={{ flex: { md: "1 1 0%" }, width: { xs: "100%", md: "33.333%" } }}>
                <RoleCard {...r} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>


      {/* ═══ CTA ═══ */}
      <Box sx={{ py: { xs: 10, md: 16 }, px: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Box component="img"
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1920"
            alt="" referrerPolicy="no-referrer"
            sx={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }}
          />
          <Box sx={{ position: "absolute", inset: 0, background: `${C.navy}99` }} />
        </Box>

        <Box sx={{
          maxWidth: 896, mx: "auto", position: "relative", zIndex: 1,
          ...glassCard,
          borderColor: D.white20,
          p: { xs: 6, md: 10 },
          textAlign: "center",
          overflow: "hidden",
          "&:hover": { transform: "none", border: `1px solid ${D.white20}`, boxShadow: "none" },
        }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `linear-gradient(135deg, rgba(0,210,255,0.10), transparent)`, pointerEvents: "none" }} />

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: "16px",
                background: D.teal20, border: `1px solid ${D.teal30}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 40px rgba(0,245,212,0.2)`,
              }}>
                <SparkleIcon sx={{ color: C.teal, fontSize: 32 }} />
              </Box>
            </Box>

            <Typography variant="h2" sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "2rem", md: "3rem" }, letterSpacing: "-0.03em", mb: 3 }}>
              Ready to Ace Your Next Interview?
            </Typography>
            <Typography sx={{ color: D.white70, fontSize: "1.25rem", mb: 5, lineHeight: 1.625 }}>
              Join iMentora today and start building the skills and confidence you need to land your dream job.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button variant="contained" size="large" onClick={() => navigate("/register")} endIcon={<ArrowForwardIcon />}
                sx={{
                  background: `linear-gradient(to right, ${C.accent}, ${C.teal})`, color: C.primary,
                  textTransform: "none", fontWeight: 700, fontSize: "1.125rem",
                  px: 5, py: 2, borderRadius: "12px",
                  boxShadow: `0 4px 20px rgba(0,210,255,0.45)`,
                  "&:hover": { boxShadow: `0 6px 30px rgba(0,210,255,0.65)` },
                  "&:active": { transform: "scale(0.95)" },
                }}>
                Get Started Free
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate("/login")}
                sx={{
                  color: "#fff", borderColor: D.white20,
                  textTransform: "none", fontWeight: 700, fontSize: "1.125rem",
                  px: 5, py: 2, borderRadius: "12px", backdropFilter: "blur(12px)",
                  "&:hover": { background: D.white05, borderColor: D.white20 },
                  "&:active": { transform: "scale(0.95)" },
                }}>
                Sign In Instead
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>


      {/* ═══ FOOTER ═══ */}
      <Box component="footer" sx={{ py: 6, px: 3, borderTop: `1px solid ${D.white05}`, background: C.navy }}>
        <Box sx={{ maxWidth: 1280, mx: "auto", display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", justifyContent: "space-between", gap: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: "8px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <SparkleIcon sx={{ color: C.primary, fontSize: 16 }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.125rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
                iMentora
              </Typography>
              <Typography sx={{ color: D.white30, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.15em", mt: 0.5, fontWeight: 500 }}>
                AI Training Platform
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={4}>
            {["Privacy Policy", "Terms of Service", "Contact Us"].map((link) => (
              <Typography key={link} component="a" href="#"
                sx={{
                  color: D.white30, fontSize: "0.75rem", fontWeight: 500,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  textDecoration: "none", transition: "color 0.2s",
                  "&:hover": { color: "#fff" },
                }}>
                {link}
              </Typography>
            ))}
          </Stack>

          <Typography sx={{ color: D.white30, fontSize: "0.75rem", fontWeight: 500 }}>
            © {new Date().getFullYear()} iMentora. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;