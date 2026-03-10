// src/components/student/MockTest/CodeEditor.jsx
// ═══════════════════════════════════════════════════════════════════
// Professional Code Editor — Light & Dark Theme
// Split fullscreen: Question (left) + Editor (right)
// Simple text-based SVG language icons, MUI icons throughout — zero emojis
// ═══════════════════════════════════════════════════════════════════

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  PlayArrow as RunIcon,
  RestartAlt as ResetIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Terminal as TerminalIcon,
  Science as ScienceIcon,
  Keyboard as KeyboardIcon,
  Timer as TimerIcon,
  AlarmOff as AlarmOffIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import {
  LANGUAGES,
  executeCode,
  runTestCases,
} from "../../../services/API/compilerService";
import { mockTestAPI } from "../../../services/API/studentmocktest";

// ═══════════════════════════════════════════════════════════════════
// LANGUAGE ICONS — Simple text-based SVGs (React-safe, no complex paths)
// ═══════════════════════════════════════════════════════════════════

const LanguageIcon = ({ id, size = 18, style }) => {
  const s = size;
  const icons = {
    python: (
      <svg width={s} height={s} viewBox="0 0 100 100" style={style}>
        <rect width="100" height="100" rx="16" fill="#3776AB" />
        <text
          x="50"
          y="42"
          textAnchor="middle"
          fontFamily="Arial,sans-serif"
          fontWeight="bold"
          fontSize="32"
          fill="#FFD43B"
        >
          Py
        </text>
        <text
          x="50"
          y="78"
          textAnchor="middle"
          fontFamily="Arial,sans-serif"
          fontWeight="bold"
          fontSize="26"
          fill="#fff"
        >
          3
        </text>
      </svg>
    ),
    javascript: (
      <svg width={s} height={s} viewBox="0 0 100 100" style={style}>
        <rect width="100" height="100" rx="16" fill="#F7DF1E" />
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fontFamily="Arial,sans-serif"
          fontWeight="bold"
          fontSize="46"
          fill="#000"
        >
          JS
        </text>
      </svg>
    ),
    java: (
      <svg width={s} height={s} viewBox="0 0 100 100" style={style}>
        <rect width="100" height="100" rx="16" fill="#E76F00" />
        <text
          x="50"
          y="46"
          textAnchor="middle"
          fontFamily="Arial,sans-serif"
          fontWeight="bold"
          fontSize="16"
          fill="#fff"
        >
          JAVA
        </text>
        <circle cx="38" cy="70" r="8" fill="#5382A1" />
        <circle cx="62" cy="70" r="8" fill="#5382A1" />
      </svg>
    ),
    cpp: (
      <svg width={s} height={s} viewBox="0 0 100 100" style={style}>
        <rect width="100" height="100" rx="16" fill="#00599C" />
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fontFamily="Arial,sans-serif"
          fontWeight="bold"
          fontSize="36"
          fill="#fff"
        >
          C++
        </text>
      </svg>
    ),
    c: (
      <svg width={s} height={s} viewBox="0 0 100 100" style={style}>
        <rect width="100" height="100" rx="16" fill="#A8B9CC" />
        <text
          x="50"
          y="70"
          textAnchor="middle"
          fontFamily="Arial,sans-serif"
          fontWeight="bold"
          fontSize="52"
          fill="#fff"
        ></text>
      </svg>
    ),
    typescript: (
      <svg width={s} height={s} viewBox="0 0 100 100" style={style}>
        <rect width="100" height="100" rx="16" fill="#3178C6" />
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fontFamily="Arial,sans-serif"
          fontWeight="bold"
          fontSize="46"
          fill="#fff"
        >
          TS
        </text>
      </svg>
    ),
go: (
  <svg width={s} height={s} viewBox="0 0 100 100" style={style}>
    <rect width="100" height="100" rx="16" fill="#00ACD7" />
    <text
      x="50"
      y="68"
      textAnchor="middle"
      fontFamily="Arial,sans-serif"
      fontWeight="bold"
      fontSize="46"
      fill="#fff"
    >
      Go
    </text>
  </svg>
),


  };

  const fallback = (
    <svg width={s} height={s} viewBox="0 0 100 100" style={style}>
      <rect width="100" height="100" rx="16" fill="#64748b" />
      <text
        x="50"
        y="66"
        textAnchor="middle"
        fontFamily="Arial,sans-serif"
        fontWeight="bold"
        fontSize="36"
        fill="#fff"
      >
        &lt;/&gt;
      </text>
    </svg>
  );

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: s,
        height: s,
        flexShrink: 0,
      }}
    >
      {icons[id] || fallback}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════
// THEME SYSTEM
// ═══════════════════════════════════════════════════════════════════

const themes = {
  dark: {
    id: "dark",
    bg: "#0f1117",
    bgEditor: "#151820",
    bgToolbar: "#12141c",
    bgPanel: "#0f1117",
    bgInput: "#1a1d28",
    bgHover: "rgba(99,130,255,0.06)",
    bgSelected: "rgba(99,130,255,0.10)",
    bgSuccess: "rgba(52,211,153,0.06)",
    bgSuccessBd: "rgba(52,211,153,0.18)",
    bgError: "rgba(248,113,113,0.06)",
    bgErrorBd: "rgba(248,113,113,0.18)",
    bgWarning: "rgba(251,191,36,0.06)",
    bgWarningBd: "rgba(251,191,36,0.18)",
    border: "#1e2030",
    borderHover: "#2a2e42",
    borderFocus: "#6382ff",
    text: "#e2e8f0",
    textCode: "#c8ceda",
    textMuted: "#5a6180",
    textDim: "#363c54",
    textLabel: "#8891b0",
    lineNum: "#3a4060",
    lineNumBorder: "#1e2030",
    accent: "#6382ff",
    accentSoft: "rgba(99,130,255,0.12)",
    green: "#34d399",
    greenSoft: "rgba(52,211,153,0.12)",
    greenDark: "#065f46",
    red: "#f87171",
    redSoft: "rgba(248,113,113,0.12)",
    redDark: "#7f1d1d",
    yellow: "#fbbf24",
    yellowSoft: "rgba(251,191,36,0.12)",
    peach: "#fb923c",
    peachSoft: "rgba(251,146,60,0.12)",
    runBg: "linear-gradient(135deg, #059669, #047857)",
    runBgHover: "linear-gradient(135deg, #10b981, #059669)",
    runShadow: "0 2px 12px rgba(5,150,105,0.35)",
    testBg: "rgba(251,191,36,0.10)",
    testBorder: "rgba(251,191,36,0.25)",
    testColor: "#fbbf24",
    scrollThumb: "rgba(99,130,255,0.15)",
    scrollTrack: "transparent",
    caret: "#6382ff",
    qBg: "#1a1a2e",
    qBorderRight: "#2a2e42",
    qText: "#eff1f6",
    qTextSecondary: "#b4bcd0",
    qTextMuted: "#5a6180",
    qHeading: "#ffffff",
    qStrong: "#ffffff",
    qLink: "#6382ff",
    qLinkHover: "#8ba3ff",
    qCodeBg: "rgba(255,255,255,0.06)",
    qCodeText: "#ff7b72",
    qCodeBorder: "rgba(255,255,255,0.08)",
    qPreBg: "#12141c",
    qPreBorder: "#2a2e42",
    qPreText: "#c8ceda",
    qExampleBg: "transparent",
    qExampleBorder: "#2a2e42",
    qExampleLabel: "#eff1f6",
    qConstraintBg: "rgba(255,255,255,0.03)",
    qConstraintBd: "#2a2e42",
    qEasyBg: "rgba(0,184,148,0.12)",
    qEasyColor: "#00b894",
    qMediumBg: "rgba(253,203,110,0.12)",
    qMediumColor: "#fdcb6e",
    qHardBg: "rgba(255,118,117,0.12)",
    qHardColor: "#ff7675",
    qSeparator: "#2a2e42",
    qScrollThumb: "rgba(255,255,255,0.08)",
    fsBg: "#12141c",
    fsShadow: "0 1px 4px rgba(0,0,0,0.3)",
    fsBadge: "#059669",
    fsTypeBg: "rgba(99,130,255,0.10)",
    fsTypeColor: "#6382ff",
    fsTitle: "#8891b0",
    fsHint: "#1a1d28",
    fsHintText: "#5a6180",
    fsHintBorder: "#1e2030",
    divider: "#1e2030",
    dividerHover: "#6382ff",
  },
  light: {
    id: "light",
    bg: "#ffffff",
    bgEditor: "#fafbfd",
    bgToolbar: "#ffffff",
    bgPanel: "#ffffff",
    bgInput: "#f1f4f9",
    bgHover: "rgba(37,99,235,0.04)",
    bgSelected: "rgba(37,99,235,0.08)",
    bgSuccess: "rgba(22,163,74,0.05)",
    bgSuccessBd: "rgba(22,163,74,0.18)",
    bgError: "rgba(220,38,38,0.05)",
    bgErrorBd: "rgba(220,38,38,0.18)",
    bgWarning: "rgba(202,138,4,0.05)",
    bgWarningBd: "rgba(202,138,4,0.18)",
    border: "#e8ecf2",
    borderHover: "#d1d9e6",
    borderFocus: "#2563eb",
    text: "#1e293b",
    textCode: "#334155",
    textMuted: "#94a3b8",
    textDim: "#cbd5e1",
    textLabel: "#64748b",
    lineNum: "#c1c9d6",
    lineNumBorder: "#e8ecf2",
    accent: "#2563eb",
    accentSoft: "rgba(37,99,235,0.08)",
    green: "#16a34a",
    greenSoft: "rgba(22,163,74,0.08)",
    greenDark: "#166534",
    red: "#dc2626",
    redSoft: "rgba(220,38,38,0.08)",
    redDark: "#991b1b",
    yellow: "#ca8a04",
    yellowSoft: "rgba(202,138,4,0.08)",
    peach: "#ea580c",
    peachSoft: "rgba(234,88,12,0.08)",
    runBg: "linear-gradient(135deg, #16a34a, #15803d)",
    runBgHover: "linear-gradient(135deg, #22c55e, #16a34a)",
    runShadow: "0 2px 12px rgba(22,163,74,0.25)",
    testBg: "rgba(202,138,4,0.08)",
    testBorder: "rgba(202,138,4,0.25)",
    testColor: "#a16207",
    scrollThumb: "rgba(37,99,235,0.12)",
    scrollTrack: "transparent",
    caret: "#2563eb",
    qBg: "#ffffff",
    qBorderRight: "#e8ecf2",
    qText: "#262626",
    qTextSecondary: "#525252",
    qTextMuted: "#94a3b8",
    qHeading: "#0a0a0a",
    qStrong: "#0a0a0a",
    qLink: "#2563eb",
    qLinkHover: "#1d4ed8",
    qCodeBg: "#f0f0f0",
    qCodeText: "#262626",
    qCodeBorder: "transparent",
    qPreBg: "#f7f7f8",
    qPreBorder: "#e5e5e5",
    qPreText: "#262626",
    qExampleBg: "transparent",
    qExampleBorder: "#e5e5e5",
    qExampleLabel: "#0a0a0a",
    qConstraintBg: "#f7f7f8",
    qConstraintBd: "#e5e5e5",
    qEasyBg: "rgba(0,184,148,0.10)",
    qEasyColor: "#00a884",
    qMediumBg: "rgba(255,177,66,0.12)",
    qMediumColor: "#d97706",
    qHardBg: "rgba(239,68,68,0.10)",
    qHardColor: "#dc2626",
    qSeparator: "#e5e5e5",
    qScrollThumb: "rgba(0,0,0,0.08)",
    fsBg: "#ffffff",
    fsShadow: "0 1px 4px rgba(0,0,0,0.06)",
    fsBadge: "#0d9488",
    fsTypeBg: "#eff6ff",
    fsTypeColor: "#2563eb",
    fsTitle: "#64748b",
    fsHint: "#f1f5f9",
    fsHintText: "#64748b",
    fsHintBorder: "#e2e8f0",
    divider: "#e8ecf2",
    dividerHover: "#2563eb",
  },
};

// ═══════════════════════════════════════════════════════════════════
// LINE NUMBERS
// ═══════════════════════════════════════════════════════════════════

const LineNumbers = ({ count, fontSize, theme }) => (
  <Box
    sx={{
      pt: "16px",
      pb: "16px",
      pr: "14px",
      pl: "12px",
      minWidth: 48,
      textAlign: "right",
      color: theme.lineNum,
      fontSize: fontSize - 1,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      lineHeight: "1.7",
      userSelect: "none",
      borderRight: `1px solid ${theme.lineNumBorder}`,
      flexShrink: 0,
    }}
  >
    {Array.from({ length: count }, (_, i) => (
      <div key={i}>{i + 1}</div>
    ))}
  </Box>
);

// ═══════════════════════════════════════════════════════════════════
// RESIZABLE DIVIDER
// ═══════════════════════════════════════════════════════════════════

const ResizableDivider = ({ onDrag, theme }) => {
  const [active, setActive] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setActive(true);
    const startX = e.clientX;
    const move = (ev) => onDrag(ev.clientX - startX);
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setActive(false);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        width: 5,
        cursor: "col-resize",
        flexShrink: 0,
        bgcolor: active ? theme.dividerHover : theme.divider,
        transition: "background 0.2s ease",
        "&:hover": { bgcolor: theme.dividerHover },
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 3,
          height: 40,
          borderRadius: 2,
          bgcolor: active ? "#fff" : theme.textDim,
          transition: "all 0.2s ease",
          opacity: 0.5,
        },
        "&:hover::after": { opacity: 1, bgcolor: "#fff" },
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════
// THEME TOGGLE BUTTON
// ═══════════════════════════════════════════════════════════════════

const PORTAL_Z = 10001;

const ThemeToggle = ({ isDark, onToggle, theme }) => (
  <Tooltip
    title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
    arrow
    PopperProps={{ sx: { zIndex: PORTAL_Z } }}
  >
    <IconButton
      size="small"
      onClick={onToggle}
      sx={{
        color: theme.textMuted,
        p: "4px",
        borderRadius: "8px",
        bgcolor: theme.bgInput,
        border: `1px solid ${theme.border}`,
        transition: "all 0.25s ease",
        "&:hover": {
          bgcolor: theme.accentSoft,
          borderColor: theme.accent,
          color: theme.accent,
          transform: "rotate(15deg)",
        },
      }}
    >
      {isDark ? (
        <LightModeIcon sx={{ fontSize: 16 }} />
      ) : (
        <DarkModeIcon sx={{ fontSize: 16 }} />
      )}
    </IconButton>
  </Tooltip>
);

// ═══════════════════════════════════════════════════════════════════
// ERROR PARSER — Extracts friendly error info from stderr
// ═══════════════════════════════════════════════════════════════════

const parseErrorSummary = (
  stderr,
  isCompileError,
  isRuntimeError,
  isTimeout,
) => {
  if (!stderr && !isTimeout) return null;

  if (isTimeout) {
    return {
      type: "TimeoutError",
      message: "Your code took too long to execute. Check for infinite loops.",
      line: null,
    };
  }

  const errorStr = (stderr || "").trim();
  if (!errorStr) return null;

  // Python errors: "File "main.py", line 5, in <module>\n    ...\nNameError: ..."
  const pyMatch = errorStr.match(
    /File\s+"[^"]*",\s+line\s+(\d+)[\s\S]*?(\w+Error):\s*(.+)/,
  );
  if (pyMatch) {
    return {
      type: pyMatch[2],
      message: pyMatch[3].trim(),
      line: parseInt(pyMatch[1]),
    };
  }

  // Python SyntaxError: "File "main.py", line 3\n    ...\nSyntaxError: ..."
  const pySyntax = errorStr.match(/line\s+(\d+)[\s\S]*?(SyntaxError):\s*(.+)/);
  if (pySyntax) {
    return {
      type: pySyntax[2],
      message: pySyntax[3].trim(),
      line: parseInt(pySyntax[1]),
    };
  }

  // Python error without line number: "ValueError: invalid literal..."
  const pySimple = errorStr.match(/(\w+Error):\s*(.+)/);
  if (pySimple) {
    // Try to find a line number somewhere
    const lineMatch = errorStr.match(/line\s+(\d+)/);
    return {
      type: pySimple[1],
      message: pySimple[2].trim().substring(0, 120),
      line: lineMatch ? parseInt(lineMatch[1]) : null,
    };
  }

  // JavaScript/Node errors: "main.js:5\n    ...\nReferenceError: x is not defined"
  const jsMatch = errorStr.match(
    /(?:main\.js|[\w.]+\.js):(\d+)[\s\S]*?(\w+Error):\s*(.+)/,
  );
  if (jsMatch) {
    return {
      type: jsMatch[2],
      message: jsMatch[3].trim(),
      line: parseInt(jsMatch[1]),
    };
  }

  // C/C++ compile errors: "main.cpp:5:10: error: ..."
  const cppMatch = errorStr.match(/main\.(?:cpp|c):(\d+):\d+:\s*error:\s*(.+)/);
  if (cppMatch) {
    return {
      type: "CompilationError",
      message: cppMatch[2].trim().substring(0, 120),
      line: parseInt(cppMatch[1]),
    };
  }

  // Java errors: "Main.java:5: error: ..."
  const javaMatch = errorStr.match(/\w+\.java:(\d+):\s*error:\s*(.+)/);
  if (javaMatch) {
    return {
      type: "CompilationError",
      message: javaMatch[2].trim().substring(0, 120),
      line: parseInt(javaMatch[1]),
    };
  }

  // Java runtime: "Exception in thread "main" java.lang.NullPointerException"
  const javaRuntime = errorStr.match(/(?:java\.lang\.)(\w+)(?::\s*(.+))?/);
  if (javaRuntime) {
    const lineMatch = errorStr.match(/(?:Main\.java):(\d+)/);
    return {
      type: javaRuntime[1],
      message: javaRuntime[2]?.trim() || javaRuntime[1],
      line: lineMatch ? parseInt(lineMatch[1]) : null,
    };
  }

  // Generic: just show first meaningful line (truncated)
  if (isCompileError) {
    return {
      type: "CompilationError",
      message: errorStr.split("\n")[0].substring(0, 120),
      line: null,
    };
  }

  if (isRuntimeError) {
    return {
      type: "RuntimeError",
      message: errorStr.split("\n")[0].substring(0, 120),
      line: null,
    };
  }

  return {
    type: "Error",
    message: errorStr.split("\n")[0].substring(0, 120),
    line: null,
  };
};

// ═══════════════════════════════════════════════════════════════════
// SYNTAX HIGHLIGHTER  — regex-based, runs entirely in the browser
// ═══════════════════════════════════════════════════════════════════

const HIGHLIGHT_RULES = {
  // order matters — first match wins
  comment_block: {
    pattern: /\/\*[\s\S]*?\*\//g,
    color: "#546E7A",
    italic: true,
  },
  comment_line: { pattern: /\/\/[^\n]*/g, color: "#546E7A", italic: true },
  string_bt: { pattern: /`(?:[^`\\]|\\.)*`/g, color: "#F78C6C" },
  string_dq: { pattern: /"(?:[^"\\]|\\.)*"/g, color: "#F78C6C" },
  string_sq: { pattern: /'(?:[^'\\]|\\.)*'/g, color: "#F78C6C" },
  number: { pattern: /\b0x[\da-fA-F]+\b|\b\d+(?:\.\d+)?\b/g, color: "#C3E88D" },
  keyword: {
    pattern:
      /\b(abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|true|false|try|void|volatile|while|def|del|elif|except|exec|from|global|lambda|nonlocal|pass|print|raise|with|yield|async|await|let|const|var|function|typeof|instanceof|in|of|export|default|type|interface|namespace|module|declare|readonly|override|sealed|record|permits)\b/g,
    color: "#C792EA",
    bold: true,
  },
  identifier: { pattern: /\b[A-Za-z_$][A-Za-z0-9_$]*\b/g, color: "#82AAFF" },
};

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightCode(code) {
  if (!code) return "";

  // Build a flat list of [start, end, color, italic, bold] spans
  const spans = [];

  for (const rule of Object.values(HIGHLIGHT_RULES)) {
    rule.pattern.lastIndex = 0;
    let m;
    while ((m = rule.pattern.exec(code)) !== null) {
      spans.push({
        start: m.index,
        end: m.index + m[0].length,
        color: rule.color,
        italic: !!rule.italic,
        bold: !!rule.bold,
      });
    }
  }

  // Sort by start; on tie prefer longer match (comments/strings before keywords)
  spans.sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start),
  );

  // Remove overlaps — keep first (highest priority = earliest sorted)
  const merged = [];
  let cursor = 0;
  for (const sp of spans) {
    if (sp.start < cursor) continue; // overlaps previous — skip
    merged.push(sp);
    cursor = sp.end;
  }

  // Build HTML
  let html = "";
  let pos = 0;
  for (const sp of merged) {
    if (sp.start > pos) html += escapeHtml(code.slice(pos, sp.start));
    const style = [
      `color:${sp.color}`,
      sp.italic ? "font-style:italic" : "",
      sp.bold ? "font-weight:700" : "",
    ]
      .filter(Boolean)
      .join(";");
    html += `<span style="${style}">${escapeHtml(code.slice(sp.start, sp.end))}</span>`;
    pos = sp.end;
  }
  if (pos < code.length) html += escapeHtml(code.slice(pos));

  // Trailing newline trick — keeps last line visible
  return html + "\n";
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const CodeEditor = ({
  value,
  startFullscreen = false,
  onChange,
  questionNumber,
  questionHtml,
  questionTitle,
  placeholder,
  testId,
  timeLeft,
  onPrevious,
  onSkip,
  onNext,
  canGoPrevious,
  isLastQuestion,
  hasAnswer,
  isSubmitting,
  isTimeExpired,
  isAnswered,
}) => {
  const [language, setLanguage] = useState("python");
  const [fontSize, setFontSize] = useState(14);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [activeTab, setActiveTab] = useState("output");
  const [customInput, setCustomInput] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [backendTestCases, setBackendTestCases] = useState([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [themeMode, setThemeMode] = useState("light");

  const [splitPercent, setSplitPercent] = useState(32);
  const [isFullscreen, setIsFullscreen] = useState(startFullscreen);

 

  // Auto-enter native browser fullscreen when coding section starts
  useEffect(() => {
    if (startFullscreen) {
      const enterNativeFullscreen = async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch (err) {
          console.warn("Native fullscreen failed:", err);
        }
      };
      const timer = setTimeout(enterNativeFullscreen, 300);
      return () => clearTimeout(timer);
    }
  }, [startFullscreen]);

  const textareaRef = useRef(null);
  const editorContainerRef = useRef(null);
  const fullscreenRef = useRef(null);
  const defaultDisplayRef = useRef("");
  const userClearedRef = useRef(false);

  const highlightRef = useRef(null);
  const T = themes[themeMode];
  const isDark = themeMode === "dark";
  const langConfig = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];
  const lineCount = (value || "").split("\n").length;

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const toggleFullscreen = () => {
  setIsFullscreen(prev => {
    const entering = !prev;
    if (entering) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.warn("Fullscreen failed:", err);
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.warn("Exit fullscreen failed:", err);
        });
      }
    }
    return entering;
  });
};

  useEffect(() => {
    if (!isFullscreen) return;
    const esc = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", esc, true);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc, true);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const handleSplitDrag = useCallback((deltaX) => {
    if (!fullscreenRef.current) return;
    const w = fullscreenRef.current.offsetWidth;
    setSplitPercent((prev) =>
      Math.min(55, Math.max(20, prev + (deltaX / w) * 100)),
    );
  }, []);

  const prevQuestionRef = useRef(null);
useEffect(() => {
  if (testId && questionNumber) {
    // Build a unique key for this question
    const qKey = `${testId}-${questionNumber}`;
    const isNewQuestion = prevQuestionRef.current !== qKey;
    prevQuestionRef.current = qKey;
    if (isNewQuestion) {
      setOutput(null);
      setTestResults(null);
      setBackendTestCases([]);
      setHiddenCount(0);
      setActiveTab("output");
      setCustomInput("");

      // ✅ Set boilerplate if editor is empty for this new question
      const config = LANGUAGES.find((l) => l.id === language);
      if (!value || value.trim() === "") {
        onChange(config?.defaultCode || "");
      }
    }
    mockTestAPI
      .getTestCases(testId, questionNumber)
      .then((data) => {
        if (data?.test_cases?.length > 0) {
          setBackendTestCases(data.test_cases);
          setHiddenCount(data.total_hidden || 0);
        }
      })
      .catch((err) => console.warn("Could not fetch test cases:", err));
  }
}, [testId, questionNumber]);

  // Also reset if question content changes (safety net)
  const prevQuestionHtmlRef = useRef(null);

  useEffect(() => {
    if (
      questionHtml &&
      prevQuestionHtmlRef.current !== null &&
      prevQuestionHtmlRef.current !== questionHtml
    ) {
      setOutput(null);
      setTestResults(null);
      setCustomInput("");
      setActiveTab("output");
      if (textareaRef.current) textareaRef.current.scrollTop = 0;
      if (highlightRef.current) highlightRef.current.scrollTop = 0;
    }
    prevQuestionHtmlRef.current = questionHtml;
  }, [questionHtml]);

  // Sync highlight-div scroll to textarea scroll
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    const newConfig = LANGUAGES.find((l) => l.id === newLang);
    const curConfig = LANGUAGES.find((l) => l.id === language);
    setLanguage(newLang);
    defaultDisplayRef.current = newConfig?.defaultCode || "";
    if (!value || value.trim() === "" || value === curConfig?.defaultCode) {
      onChange(newConfig?.defaultCode || "");
    }
    setOutput(null);
    setTestResults(null);
  };

  const handleRunCode = useCallback(async () => {
    if (!value || value.trim() === "" || running) return;

    setRunning(true);
    setActiveTab("output");
    setOutput(null);

    try {
      let stdinInput = customInput || "";
      let autoInputNote = "";
      let expectedOutput = null;

      // Auto-use first visible test case input
      if (backendTestCases.length > 0) {
        const firstVisible = backendTestCases.find((tc) => !tc.is_hidden);
        if (firstVisible) {
          if (!stdinInput.trim() && firstVisible.input) {
            stdinInput = firstVisible.input.trim();
            autoInputNote = `Auto-used Test Case ${firstVisible.id || 1} input`;
          }
          if (firstVisible.expected_output) {
            expectedOutput = firstVisible.expected_output.trim();
          }
        }
      }

      const result = await executeCode(language, value, stdinInput);

      if (autoInputNote) result.autoInputNote = autoInputNote;

      // ✅ Compare actual output vs expected output
      if (expectedOutput !== null && result.stdout !== undefined) {
        const actualTrimmed = (result.stdout || "").trim();
        const expectedTrimmed = expectedOutput.trim();
        result.expectedOutput = expectedTrimmed;
        result.outputMatches = actualTrimmed === expectedTrimmed;
      }

      setOutput(result);
    } catch (err) {
      setOutput({
        success: false,
        stdout: "",
        stderr: err.message,
        executionTime: "N/A",
        exitCode: -1,
        isNetworkError: true,
      });
    } finally {
      setRunning(false);
    }
  }, [value, language, customInput, running, backendTestCases]);

  const handleRunTests = useCallback(async () => {
    if (!value || value.trim() === "" || running) return;
    setRunning(true);
    setActiveTab("testcases");
    setTestResults(null);
    try {
      if (backendTestCases.length > 0) {
        const results = await mockTestAPI.runCodeTests(
          language,
          value,
          backendTestCases,
          testId,
          questionNumber,
        );
        setTestResults({
          results: results.results.map((r) => ({
            id: r.id,
            label: r.label,
            input: r.input,
            expected: r.expected_output,
            actualOutput: r.actual_output,
            passed: r.passed,
            executionTime: `${r.execution_time_ms}ms`,
            error: r.stderr || null,
            isCompileError: r.is_compile_error,
            isRuntimeError: r.is_runtime_error,
            isTimeout: r.is_timeout,
          })),
          totalPassed: results.total_passed,
          totalFailed: results.total_failed,
          totalCases: results.total_cases,
          allPassed: results.all_passed,
          scorePercentage: results.score_percentage,
          overallResult: results.overall_result,
          hiddenCount: hiddenCount,
        });
      } else {
        const tests = [
          { id: 1, label: "Run with no input", input: "", expected: "" },
          {
            id: 2,
            label: "Run with custom input",
            input: customInput,
            expected: "",
          },
        ];
        const results = await runTestCases(language, value, tests);
        setTestResults({
          ...results,
          results: results.results.map((r) => ({
            ...r,
            passed: !r.error && !r.isCompileError && !r.isTimeout,
          })),
        });
      }
    } catch (err) {
      setTestResults({
        results: [],
        totalPassed: 0,
        totalFailed: 0,
        totalCases: 0,
        error: err.message,
      });
    } finally {
      setRunning(false);
    }
  }, [value, language, customInput, running, backendTestCases, hiddenCount]);

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = e.target.selectionStart,
        end = e.target.selectionEnd;
      onChange(value.substring(0, s) + "    " + value.substring(end));
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = s + 4;
        }
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunCode();
    }
    if (e.key === "F11") {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleReset = () => {
    onChange(langConfig.defaultCode || "");
    setOutput(null);
    setTestResults(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // TOOLBAR
  // ═══════════════════════════════════════════════════════════════

  const renderToolbar = () => (
    <Box
      sx={{
        bgcolor: T.bgToolbar,
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
        transition: "all 0.3s ease",
      }}
    >
      {/* ── Scrolling language hint ── */}
      <Box
        sx={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          borderBottom: `1px solid ${T.border}`,
          bgcolor: isDark ? "rgba(99,130,255,0.04)" : "rgba(37,99,235,0.03)",
          height: 24,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "inline-block",
            animation: "marqueeScroll 10s linear infinite",
            fontSize: 11,
            fontWeight: 500,
            color: T.textMuted,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.3px",
            "@keyframes marqueeScroll": {
              "0%": { transform: "translateX(100%)" },
              "100%": { transform: "translateX(-100%)" },
            },
          }}
        >
          <Box
            component="span"
            sx={{ color: isDark ? "#818cf8" : T.accent, fontWeight: 700 }}
          >
            ✦ &nbsp; Please
          </Box>
          &nbsp;
          <Box
            component="span"
            sx={{ color: isDark ? "#818cf8" : T.accent, fontWeight: 700 }}
          >
            select your preferred language
          </Box>
          &nbsp;
          <Box
            component="span"
            sx={{ color: isDark ? "#818cf8" : T.accent, fontWeight: 700 }}
          >
            from the drop-down
          </Box>
          &nbsp;&nbsp;
          <Box
            component="span"
            sx={{ color: isDark ? "#818cf8" : T.accent, fontWeight: 700 }}
          >
            ✦ &nbsp; Please
          </Box>
          &nbsp;
          <Box
            component="span"
            sx={{ color: isDark ? "#818cf8" : T.accent, fontWeight: 700 }}
          >
            select your preferred language
          </Box>
          &nbsp;
          <Box
            component="span"
            sx={{ color: isDark ? "#818cf8" : T.accent, fontWeight: 700 }}
          >
            from the drop-down
          </Box>
          &nbsp; ✦
        </Box>
      </Box>

      <Box
        sx={{
          height: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "14px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? "#a0aec0" : T.textMuted,
              whiteSpace: "nowrap",
            }}
          >
            Select Language
          </Typography>
          <Select
            value={language}
            onChange={handleLanguageChange}
            size="small"
            renderValue={(selected) => {
              const lang = LANGUAGES.find((l) => l.id === selected);
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <LanguageIcon id={selected} size={16} />
                  <span>{lang?.label || selected}</span>
                </Box>
              );
            }}
            sx={{
              bgcolor: T.bgInput,
              color: T.text,
              borderRadius: "8px",
              fontSize: 13,
              fontWeight: 600,
              minWidth: 148,
              height: 32,
              transition: "all 0.2s ease",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: T.border,
                transition: "border-color 0.2s",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: T.accent,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: T.accent,
                borderWidth: "1.5px",
              },
              "& .MuiSelect-icon": { color: T.textMuted },
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                py: "4px",
              },
            }}
            MenuProps={{
              sx: { zIndex: PORTAL_Z },
              container: isFullscreen ? () => fullscreenRef.current : undefined,
              PaperProps: {
                sx: {
                  bgcolor: T.bg,
                  border: `1px solid ${T.borderHover}`,
                  borderRadius: "10px",
                  boxShadow: isDark
                    ? "0 12px 40px rgba(0,0,0,0.5)"
                    : "0 12px 40px rgba(0,0,0,0.12)",
                  mt: 0.5,
                  "& .MuiMenuItem-root": {
                    color: T.text,
                    fontSize: 13,
                    gap: 1,
                    borderRadius: "6px",
                    mx: 0.5,
                    my: 0.2,
                    transition: "all 0.15s ease",
                    "&:hover": { bgcolor: T.bgHover },
                    "&.Mui-selected": {
                      bgcolor: T.bgSelected,
                      color: T.accent,
                    },
                  },
                },
              },
            }}
          >
            {LANGUAGES.map((l) => (
              <MenuItem
                key={l.id}
                value={l.id}
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mr: 0.8,
                    flexShrink: 0,
                  }}
                >
                  <LanguageIcon id={l.id} size={18} />
                </Box>
                {l.label}
                <Typography
                  component="span"
                  sx={{ ml: "auto", fontSize: 11, opacity: 0.4, pl: 2 }}
                >
                  {l.ext}
                </Typography>
              </MenuItem>
            ))}
          </Select>

          <Box sx={{ width: 1, height: 22, bgcolor: T.border, mx: 0.2 }} />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: T.bgInput,
              borderRadius: "8px",
              border: `1px solid ${T.border}`,
              px: 0.3,
              height: 30,
            }}
          >
            <IconButton
              size="small"
              onClick={() => setFontSize((f) => Math.max(11, f - 1))}
              sx={{
                color: T.textMuted,
                p: "2px",
                fontSize: 14,
                "&:hover": { color: T.accent },
              }}
            >
              —
            </IconButton>
            <Typography
              sx={{
                color: T.textLabel,
                fontSize: 11,
                fontWeight: 600,
                minWidth: 32,
                textAlign: "center",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {fontSize}px
            </Typography>
            <IconButton
              size="small"
              onClick={() => setFontSize((f) => Math.min(22, f + 1))}
              sx={{
                color: T.textMuted,
                p: "2px",
                fontSize: 14,
                "&:hover": { color: T.accent },
              }}
            >
              +
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          {!isFullscreen && (
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} theme={T} />
          )}

          <Tooltip
            title="Reset Code"
            arrow
            PopperProps={{ sx: { zIndex: PORTAL_Z } }}
          >
            <IconButton
              size="small"
              onClick={handleReset}
              sx={{
                color: T.textMuted,
                p: "4px",
                "&:hover": { color: T.red, bgcolor: T.redSoft },
              }}
            >
              <ResetIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={copied ? "Copied!" : "Copy Code"}
            arrow
            PopperProps={{ sx: { zIndex: PORTAL_Z } }}
          >
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{
                color: copied ? T.green : T.textMuted,
                p: "4px",
                "&:hover": { color: T.accent, bgcolor: T.accentSoft },
              }}
            >
              {copied ? (
                <CheckIcon sx={{ fontSize: 17 }} />
              ) : (
                <CopyIcon sx={{ fontSize: 17 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* <Tooltip
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen (F11)"}
            arrow
            PopperProps={{ sx: { zIndex: PORTAL_Z } }}
          >
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{
                color: isFullscreen ? T.accent : T.textMuted,
                p: "4px",
                "&:hover": { color: T.accent, bgcolor: T.accentSoft },
              }}
            >
              {isFullscreen ? (
                <FullscreenExitIcon sx={{ fontSize: 18 }} />
              ) : (
                <FullscreenIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip> */}

          <Box sx={{ width: 1, height: 22, bgcolor: T.border, mx: 0.3 }} />

          <Button
            size="small"
            onClick={handleRunTests}
            disabled={running || !value?.trim()}
            startIcon={<ScienceIcon sx={{ fontSize: "15px !important" }} />}
            sx={{
              color: T.testColor,
              bgcolor: T.testBg,
              border: `1px solid ${T.testBorder}`,
              borderRadius: "8px",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "none",
              px: 1.5,
              height: 30,
              minWidth: "auto",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              "&:hover": { bgcolor: T.yellowSoft, borderColor: T.yellow },
              "&.Mui-disabled": { opacity: 0.3 },
              "& .MuiButton-startIcon": { mr: 0.5 },
            }}
          >
            Run Tests
          </Button>

          <Button
            size="small"
            onClick={handleRunCode}
            disabled={running || !value?.trim()}
            startIcon={
              running ? (
                <CircularProgress size={13} sx={{ color: "#fff" }} />
              ) : (
                <RunIcon sx={{ fontSize: "16px !important" }} />
              )
            }
            sx={{
              color: "#fff",
              background: running ? T.greenDark : T.runBg,
              border: "none",
              borderRadius: "8px",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "none",
              px: 2,
              height: 30,
              minWidth: 88,
              whiteSpace: "nowrap",
              boxShadow: T.runShadow,
              display: "flex",
              alignItems: "center",
              transition: "all 0.2s ease",
              "&:hover": {
                background: T.runBgHover,
                boxShadow: "0 4px 16px rgba(22,163,74,0.4)",
              },
              "&.Mui-disabled": {
                opacity: 0.3,
                background: T.bgInput,
                color: T.textMuted,
                boxShadow: "none",
              },
              "& .MuiButton-startIcon": { mr: 0.5 },
            }}
          >
            {running ? "Running…" : "Run Code"}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════
  // CODE AREA
  // ═══════════════════════════════════════════════════════════════

  const renderCodeArea = (expand = false) => (
    <Box
      sx={{
        flex: expand ? 1 : "unset",
        bgcolor: T.bgEditor,
        display: "flex",
        overflow: "auto",
        position: "relative",
        minHeight: expand ? 0 : 320,
        maxHeight: expand ? "unset" : 450,
        transition: "background 0.3s ease",
        "&::-webkit-scrollbar": { width: 6, height: 6 },
        "&::-webkit-scrollbar-track": { bgcolor: T.scrollTrack },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: T.scrollThumb,
          borderRadius: 3,
        },
      }}
    >
      <LineNumbers
        count={Math.max(lineCount, 15)}
        fontSize={fontSize}
        theme={T}
      />
      <Box
        sx={{
          flex: 1,
          position: "relative",
          "& textarea::selection": {
            color: "transparent",
            background: isDark
              ? "rgba(40,80,160,0.88)"
              : "rgba(37,99,235,0.40)",
          },
          "& textarea::-moz-selection": {
            color: "transparent",
            background: isDark
              ? "rgba(40,80,160,0.88)"
              : "rgba(37,99,235,0.40)",
          },
        }}
      >
        {/* ── Syntax highlight overlay ── */}
        <Box
          ref={highlightRef}
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 0,
            // visibility: hasSelection ? "hidden" : "visible",
            mixBlendMode: "normal",
            overflow: "hidden",
            whiteSpace: "pre",
            overflowWrap: "normal",
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontSize,
            lineHeight: "1.7",
            padding: "16px 16px 16px 14px",
            tabSize: 4,
            color: T.textCode,
            wordBreak: "normal",
            userSelect: "none",
          }}
          dangerouslySetInnerHTML={{
            __html: highlightCode(value || ""),
          }}
        />

        <textarea
          ref={textareaRef}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          onSelect={syncScroll}
          onMouseDown={syncScroll}
          onKeyUp={syncScroll}
          onBlur={syncScroll}
          spellCheck={false}
          placeholder=""
          style={{
            width: "100%",
            height: "100%",
            minHeight: expand ? "100%" : 320,
            resize: "none",
            background: "transparent",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            position: "relative",
            zIndex: 1,

            border: "none",
            outline: "none",
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontSize,
            lineHeight: "1.7",
            padding: "16px 16px 16px 14px",
            tabSize: 4,
            whiteSpace: "pre",
            overflowWrap: "normal",
            overflowX: "auto",
            caretColor: T.caret,
            transition: "color 0.3s ease",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            right: 14,
            fontSize: 11,
            color: T.textDim,
            display: "flex",
            gap: 1.5,
            pointerEvents: "none",
          }}
        >
          <Box
            component="span"
            sx={{
              bgcolor: T.bgInput,
              px: 1,
              py: 0.3,
              borderRadius: "4px",
              border: `1px solid ${T.border}`,
            }}
          >
            Ctrl+Enter → Run
          </Box>
          <Box
            component="span"
            sx={{
              bgcolor: T.bgInput,
              px: 1,
              py: 0.3,
              borderRadius: "4px",
              border: `1px solid ${T.border}`,
            }}
          >
            Tab → Indent
          </Box>
          {isFullscreen && (
            <Box
              component="span"
              sx={{
                bgcolor: T.yellowSoft,
                px: 1,
                py: 0.3,
                borderRadius: "4px",
                border: `1px solid ${T.yellow}30`,
                color: T.yellow,
              }}
            >
              Esc → Exit
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════
  // OUTPUT PANEL
  // ═══════════════════════════════════════════════════════════════

  const tabItems = [
    {
      key: "testcases",
      label: "Tests",
      icon: <ScienceIcon sx={{ fontSize: 15 }} />,
    },
    {
      key: "input",
      label: "Input",
      icon: <KeyboardIcon sx={{ fontSize: 15 }} />,
    },
    {
      key: "output",
      label: "Output",
      icon: <TerminalIcon sx={{ fontSize: 15 }} />,
    },
  ];

  const renderOutputPanel = (tall = false) => (
    <Box
      sx={{
        height: tall ? 220 : 200,
        bgcolor: T.bgPanel,
        borderTop: `2px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "all 0.3s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${T.border}`,
          px: "12px",
        }}
      >
        {tabItems.map((tab) => (
          <Button
            key={tab.key}
            size="small"
            onClick={() => setActiveTab(tab.key)}
            startIcon={tab.icon}
            sx={{
              color: activeTab === tab.key ? T.accent : T.textMuted,
              borderBottom:
                activeTab === tab.key
                  ? `2px solid ${T.accent}`
                  : "2px solid transparent",
              borderRadius: 0,
              fontSize: 12.5,
              fontWeight: 600,
              textTransform: "none",
              px: 2,
              py: 1,
              minWidth: "auto",
              transition: "all 0.2s ease",
              "&:hover": { bgcolor: T.bgHover, color: T.accent },
              "& .MuiButton-startIcon": { mr: 0.5 },
            }}
          >
            {tab.label}
          </Button>
        ))}

        {output && (
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              gap: 1.5,
              pr: 1,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.4,
                fontSize: 11,
                color: T.textMuted,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <TimerIcon sx={{ fontSize: 13 }} />
              {output.executionTime}
            </Box>
            <Box
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: output.exitCode === 0 ? T.green : T.red,
                bgcolor: output.exitCode === 0 ? T.greenSoft : T.redSoft,
                px: 1,
                py: 0.2,
                borderRadius: "4px",
              }}
            >
              Exit: {output.exitCode}
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: "14px",
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: T.scrollThumb,
            borderRadius: 3,
          },
        }}
      >
        {activeTab === "output" && (
          <>
            {running ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  color: T.accent,
                }}
              >
                <CircularProgress size={14} sx={{ color: T.accent }} />
                <Typography sx={{ fontSize: 13 }}>
                  Compiling and executing…
                </Typography>
              </Box>
            ) : output ? (
              <Box>
                {output.isCompileError &&
                  (() => {
                    const errInfo = parseErrorSummary(
                      output.stderr,
                      true,
                      false,
                      false,
                    );
                    return (
                      <Box
                        sx={{
                          mb: 1,
                          p: 1.5,
                          borderRadius: "8px",
                          bgcolor: T.bgError,
                          border: `1px solid ${T.bgErrorBd}`,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: errInfo ? 0.8 : 0,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: T.red,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Compilation Error
                          </Typography>
                        </Box>
                        {errInfo && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                px: 0.8,
                                py: 0.2,
                                borderRadius: "4px",
                                bgcolor: T.red,
                                color: "#fff",
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {errInfo.type}
                            </Typography>
                            {errInfo.line && (
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  px: 0.8,
                                  py: 0.2,
                                  borderRadius: "4px",
                                  bgcolor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.05)",
                                  color: T.textLabel,
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}
                              >
                                Line {errInfo.line}
                              </Typography>
                            )}
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: T.textLabel,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {errInfo.message}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}

                {output.isRuntimeError &&
                  !output.isCompileError &&
                  (() => {
                    const errInfo = parseErrorSummary(
                      output.stderr,
                      false,
                      true,
                      false,
                    );
                    return (
                      <Box
                        sx={{
                          mb: 1,
                          p: 1.5,
                          borderRadius: "8px",
                          bgcolor: T.peachSoft,
                          border: `1px solid rgba(251,146,60,0.2)`,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: errInfo ? 0.8 : 0,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: T.peach,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Runtime Error
                          </Typography>
                        </Box>
                        {errInfo && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                px: 0.8,
                                py: 0.2,
                                borderRadius: "4px",
                                bgcolor: T.peach,
                                color: "#fff",
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {errInfo.type}
                            </Typography>
                            {errInfo.line && (
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  px: 0.8,
                                  py: 0.2,
                                  borderRadius: "4px",
                                  bgcolor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.05)",
                                  color: T.textLabel,
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}
                              >
                                Line {errInfo.line}
                              </Typography>
                            )}
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: T.textLabel,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {errInfo.message}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}

                {output.isTimeout && (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      bgcolor: T.bgWarning,
                      border: `1px solid ${T.bgWarningBd}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <AlarmOffIcon sx={{ fontSize: 16, color: T.yellow }} />
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: T.yellow,
                        textTransform: "uppercase",
                      }}
                    >
                      Time Limit Exceeded
                    </Typography>
                  </Box>
                )}

                {output.isNetworkError && (
                  <Alert
                    severity="warning"
                    sx={{
                      borderRadius: "8px",
                      fontSize: 12,
                      bgcolor: T.bgWarning,
                      color: T.yellow,
                      border: `1px solid ${T.bgWarningBd}`,
                      "& .MuiAlert-icon": { color: T.yellow },
                    }}
                  >
                    {output.stderr}
                  </Alert>
                )}

                {output.autoInputNote && (
                  <Box
                    sx={{
                      mb: 1,
                      py: 0.5,
                      px: 1.2,
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      bgcolor: isDark
                        ? "rgba(6,182,212,0.08)"
                        : "rgba(6,182,212,0.1)",
                      border: `1px solid ${isDark ? "rgba(6,182,212,0.2)" : "rgba(6,182,212,0.3)"}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: T.accent,
                        fontStyle: "italic",
                      }}
                    >
                      &#x2139; {output.autoInputNote}
                    </Typography>
                  </Box>
                )}

                {output.stdout && (
                  <pre
                    style={{
                      color: T.text,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      margin: 0,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {output.stdout}
                  </pre>
                )}

                {output.success && output.stdout?.trim() && (
                  <>
                    {/* Expected vs Actual comparison */}
                    {output.expectedOutput !== undefined && (
                      <Box
                        sx={{
                          mt: 1,
                          p: "10px 14px",
                          borderRadius: "8px",
                          bgcolor: output.outputMatches
                            ? T.bgSuccess
                            : T.bgError,
                          border: `1px solid ${output.outputMatches ? T.bgSuccessBd : T.bgErrorBd}`,
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.8,
                        }}
                      >
                        {/* Expected row */}
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "flex-start",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: T.textMuted,
                              minWidth: 70,
                              flexShrink: 0,
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                            }}
                          >
                            Expected
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontFamily: "'JetBrains Mono', monospace",
                              color: T.green,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              bgcolor: isDark
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(0,0,0,0.03)",
                              px: 1,
                              py: 0.3,
                              borderRadius: "4px",
                              flex: 1,
                            }}
                          >
                            {output.expectedOutput}
                          </Typography>
                        </Box>
                        {/* Actual row */}
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "flex-start",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: output.outputMatches ? T.green : T.red,
                              minWidth: 70,
                              flexShrink: 0,
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                            }}
                          >
                            Your Output
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontFamily: "'JetBrains Mono', monospace",
                              color: output.outputMatches ? T.green : T.red,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              bgcolor: output.outputMatches
                                ? isDark
                                  ? "rgba(52,211,153,0.06)"
                                  : "rgba(22,163,74,0.05)"
                                : isDark
                                  ? "rgba(248,113,113,0.06)"
                                  : "rgba(220,38,38,0.05)",
                              border: `1px solid ${
                                output.outputMatches
                                  ? isDark
                                    ? "rgba(52,211,153,0.12)"
                                    : "rgba(22,163,74,0.12)"
                                  : isDark
                                    ? "rgba(248,113,113,0.12)"
                                    : "rgba(220,38,38,0.12)"
                              }`,
                              px: 1,
                              py: 0.3,
                              borderRadius: "4px",
                              flex: 1,
                            }}
                          >
                            {output.stdout.trim()}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Status badge */}
                    <Box
                      sx={{
                        mt: 1.5,
                        py: 0.8,
                        px: 1.5,
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.8,
                        bgcolor:
                          output.outputMatches === false
                            ? T.bgError
                            : T.bgSuccess,
                        border: `1px solid ${output.outputMatches === false ? T.bgErrorBd : T.bgSuccessBd}`,
                      }}
                    >
                      {output.outputMatches === false ? (
                        <CloseIcon sx={{ fontSize: 14, color: T.red }} />
                      ) : (
                        <CheckIcon sx={{ fontSize: 14, color: T.green }} />
                      )}
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            output.outputMatches === false ? T.red : T.green,
                        }}
                      >
                        {output.outputMatches === false
                          ? `Wrong Answer · ${output.executionTime}`
                          : `Correct Answer · ${output.executionTime}`}
                      </Typography>
                    </Box>
                  </>
                )}
                {output.success && !output.stdout?.trim() && (
                  <Box
                    sx={{
                      mt: 1.5,
                      py: 0.8,
                      px: 1.5,
                      borderRadius: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.8,
                      bgcolor: T.bgWarning,
                      border: `1px solid ${T.bgWarningBd}`,
                    }}
                  >
                    <AlarmOffIcon sx={{ fontSize: 14, color: T.yellow }} />
                    <Typography
                      sx={{ fontSize: 12, fontWeight: 600, color: T.yellow }}
                    >
                      No output produced. Make sure your code prints a result
                      using print().
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  pt: 4,
                  gap: 1,
                }}
              >
                <TerminalIcon sx={{ color: T.textDim, fontSize: 28 }} />
                <Typography sx={{ color: T.textDim, fontSize: 13 }}>
                  Click "Run Code" or press Ctrl+Enter to execute
                </Typography>
              </Box>
            )}
          </>
        )}

        {activeTab === "testcases" && (
          <>
            {running ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  color: T.accent,
                }}
              >
                <CircularProgress size={14} sx={{ color: T.accent }} />
                <Typography sx={{ fontSize: 13 }}>
                  Running test cases…
                </Typography>
              </Box>
            ) : testResults ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {testResults.results.map((tc, i) => {
                  const errorInfo = !tc.passed
                    ? parseErrorSummary(
                        tc.error,
                        tc.isCompileError,
                        tc.isRuntimeError,
                        tc.isTimeout,
                      )
                    : null;

                  return (
                    <Box
                      key={i}
                      sx={{
                        p: "10px 14px",
                        borderRadius: "8px",
                        fontSize: 13,
                        bgcolor: tc.passed ? T.bgSuccess : T.bgError,
                        border: `1px solid ${tc.passed ? T.bgSuccessBd : T.bgErrorBd}`,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Top row: icon + label + status badge */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "7px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            bgcolor: tc.passed ? T.greenDark : T.redDark,
                            color: tc.passed ? T.green : T.red,
                          }}
                        >
                          {tc.passed ? (
                            <CheckIcon sx={{ fontSize: 15 }} />
                          ) : (
                            <CloseIcon sx={{ fontSize: 15 }} />
                          )}
                        </Box>
                        <Typography
                          sx={{
                            color: T.text,
                            flex: 1,
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {tc.label || `Test ${i + 1}`}
                        </Typography>
                        {tc.executionTime && (
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: T.textMuted,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {tc.executionTime}
                          </Typography>
                        )}
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            px: 1,
                            py: 0.3,
                            borderRadius: "5px",
                            textTransform: "uppercase",
                            flexShrink: 0,
                            bgcolor: tc.passed ? T.greenDark : T.redDark,
                            color: tc.passed ? T.green : T.red,
                          }}
                        >
                          {tc.passed ? "pass" : "fail"}
                        </Typography>
                      </Box>

                      {/* Input / Expected / Actual — always show for visibility */}
                      <Box
                        sx={{
                          mt: 1.2,
                          ml: "42px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.8,
                        }}
                      >
                        {/* Input */}
                        {tc.input && tc.input !== "[Hidden]" && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "flex-start",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: T.textMuted,
                                minWidth: 60,
                                flexShrink: 0,
                                pt: "1px",
                                textTransform: "uppercase",
                                letterSpacing: 0.4,
                              }}
                            >
                              Input
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: T.textLabel,
                                fontFamily: "'JetBrains Mono', monospace",
                                bgcolor: isDark
                                  ? "rgba(255,255,255,0.04)"
                                  : "rgba(0,0,0,0.03)",
                                px: 1,
                                py: 0.3,
                                borderRadius: "4px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                maxHeight: 60,
                                overflow: "auto",
                                flex: 1,
                              }}
                            >
                              {tc.input.length > 100
                                ? tc.input.substring(0, 100) + "..."
                                : tc.input}
                            </Typography>
                          </Box>
                        )}

                        {/* Expected Output — for passed tests too */}
                        {tc.expected && tc.expected !== "[Hidden]" && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "flex-start",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: T.textMuted,
                                minWidth: 60,
                                flexShrink: 0,
                                pt: "1px",
                                textTransform: "uppercase",
                                letterSpacing: 0.4,
                              }}
                            >
                              Expected
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: tc.passed ? T.green : T.textLabel,
                                fontFamily: "'JetBrains Mono', monospace",
                                bgcolor: isDark
                                  ? "rgba(255,255,255,0.04)"
                                  : "rgba(0,0,0,0.03)",
                                px: 1,
                                py: 0.3,
                                borderRadius: "4px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                flex: 1,
                              }}
                            >
                              {tc.expected.length > 100
                                ? tc.expected.substring(0, 100) + "..."
                                : tc.expected}
                            </Typography>
                          </Box>
                        )}

                        {/* Actual Output — show for both pass and fail */}
                        {tc.actualOutput != null &&
                          tc.actualOutput !== "[Hidden]" && (
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "flex-start",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: tc.passed ? T.green : T.red,
                                  minWidth: 60,
                                  flexShrink: 0,
                                  pt: "1px",
                                  textTransform: "uppercase",
                                  letterSpacing: 0.4,
                                }}
                              >
                                Output
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  color: tc.passed ? T.green : T.red,
                                  fontFamily: "'JetBrains Mono', monospace",
                                  bgcolor: tc.passed
                                    ? isDark
                                      ? "rgba(52,211,153,0.06)"
                                      : "rgba(22,163,74,0.05)"
                                    : isDark
                                      ? "rgba(248,113,113,0.06)"
                                      : "rgba(220,38,38,0.05)",
                                  px: 1,
                                  py: 0.3,
                                  borderRadius: "4px",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                  maxHeight: 60,
                                  overflow: "auto",
                                  flex: 1,
                                  border: `1px solid ${
                                    tc.passed
                                      ? isDark
                                        ? "rgba(52,211,153,0.12)"
                                        : "rgba(22,163,74,0.12)"
                                      : isDark
                                        ? "rgba(248,113,113,0.12)"
                                        : "rgba(220,38,38,0.12)"
                                  }`,
                                }}
                              >
                                {tc.actualOutput
                                  ? tc.actualOutput.length > 100
                                    ? tc.actualOutput.substring(0, 100) + "..."
                                    : tc.actualOutput
                                  : "(no output)"}
                              </Typography>
                            </Box>
                          )}
                      </Box>

                      {/* Error summary row — simplified error on failure */}
                      {!tc.passed && errorInfo && (
                        <Box
                          sx={{
                            mt: 1,
                            ml: "42px",
                            p: "8px 12px",
                            borderRadius: "6px",
                            bgcolor: tc.isCompileError
                              ? T.redSoft
                              : tc.isTimeout
                                ? T.yellowSoft
                                : T.peachSoft,
                            border: `1px solid ${
                              tc.isCompileError
                                ? T.bgErrorBd
                                : tc.isTimeout
                                  ? T.bgWarningBd
                                  : "rgba(251,146,60,0.2)"
                            }`,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          {/* Error type badge */}
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              px: 0.8,
                              py: 0.2,
                              borderRadius: "4px",
                              bgcolor: tc.isTimeout ? T.yellow : T.red,
                              color: "#fff",
                              fontFamily: "'JetBrains Mono', monospace",
                              letterSpacing: 0.3,
                              flexShrink: 0,
                            }}
                          >
                            {errorInfo.type}
                          </Typography>

                          {/* Line number */}
                          {errorInfo.line && (
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                px: 0.8,
                                py: 0.2,
                                borderRadius: "4px",
                                bgcolor: isDark
                                  ? "rgba(255,255,255,0.06)"
                                  : "rgba(0,0,0,0.05)",
                                color: T.textLabel,
                                fontFamily: "'JetBrains Mono', monospace",
                                flexShrink: 0,
                              }}
                            >
                              Line {errorInfo.line}
                            </Typography>
                          )}

                          {/* Error message */}
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: T.textLabel,
                              fontFamily: "'JetBrains Mono', monospace",
                              lineHeight: 1.4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {errorInfo.message}
                          </Typography>
                        </Box>
                      )}

                      {/* Wrong answer hint — no error but output mismatch */}
                      {!tc.passed &&
                        !errorInfo &&
                        !tc.isCompileError &&
                        !tc.isRuntimeError &&
                        !tc.isTimeout && (
                          <Box
                            sx={{
                              mt: 1,
                              ml: "42px",
                              p: "8px 12px",
                              borderRadius: "6px",
                              bgcolor: T.peachSoft,
                              border: `1px solid rgba(251,146,60,0.2)`,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                px: 0.8,
                                py: 0.2,
                                borderRadius: "4px",
                                bgcolor: T.peach,
                                color: "#fff",
                                fontFamily: "'JetBrains Mono', monospace",
                                flexShrink: 0,
                              }}
                            >
                              Wrong Answer
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: T.textLabel,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              Output doesn't match expected result
                            </Typography>
                          </Box>
                        )}
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  pt: 4,
                  gap: 1,
                }}
              >
                <ScienceIcon sx={{ color: T.textDim, fontSize: 28 }} />
                <Typography sx={{ color: T.textDim, fontSize: 13 }}>
                  Click "Run Tests" to execute test cases
                </Typography>
              </Box>
            )}
          </>
        )}

        {activeTab === "input" && (
          <Box>
            {/* Show test case inputs if available */}
            {false && backendTestCases.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: T.textLabel,
                    mb: 1,
                    fontWeight: 600,
                  }}
                >
                  Test Case Inputs
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}
                >
                  {backendTestCases
                    .filter((tc) => !tc.is_hidden)
                    .map((tc, i) => (
                      <Box
                        key={tc.id || i}
                        sx={{
                          p: "8px 12px",
                          borderRadius: "6px",
                          bgcolor: T.bgInput,
                          border: `1px solid ${T.border}`,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: T.textMuted,
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                            }}
                          >
                            Test Case {tc.id || i + 1}
                          </Typography>
                          <Tooltip
                            title="Use as custom input"
                            arrow
                            PopperProps={{ sx: { zIndex: PORTAL_Z } }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => setCustomInput(tc.input || "")}
                              sx={{
                                p: "2px",
                                color: T.textMuted,
                                "&:hover": { color: T.accent },
                              }}
                            >
                              <CopyIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              sx={{
                                fontSize: 10,
                                color: T.textMuted,
                                mb: 0.3,
                                fontWeight: 600,
                                textTransform: "uppercase",
                              }}
                            >
                              Input
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: T.textCode,
                                fontFamily: "'JetBrains Mono', monospace",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {(tc.input || "(empty)").length > 80
                                ? tc.input.substring(0, 80) + "..."
                                : tc.input || "(empty)"}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              sx={{
                                fontSize: 10,
                                color: T.textMuted,
                                mb: 0.3,
                                fontWeight: 600,
                                textTransform: "uppercase",
                              }}
                            >
                              Expected Output
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: T.green,
                                fontFamily: "'JetBrains Mono', monospace",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {(tc.expected_output || "").length > 80
                                ? tc.expected_output.substring(0, 80) + "..."
                                : tc.expected_output || ""}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  {hiddenCount > 0 && (
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: T.textMuted,
                        fontStyle: "italic",
                        mt: 0.3,
                      }}
                    >
                      + {hiddenCount} hidden test case
                      {hiddenCount > 1 ? "s" : ""} (used for final grading)
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <Typography
              sx={{ fontSize: 12, color: T.textLabel, mb: 1, fontWeight: 600 }}
            >
              Custom Input (stdin)
            </Typography>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={
                backendTestCases.length > 0
                  ? "Leave empty to use Test Case 1 input automatically, or enter custom input here..."
                  : "Enter your input here... This will be sent as stdin when you click Run Code."
              }
              style={{
                width: "100%",
                height: backendTestCases.length > 0 ? 70 : 100,
                resize: "vertical",
                background: T.bgInput,
                border: `1px solid ${T.borderHover}`,
                borderRadius: 8,
                color: T.text,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                padding: 12,
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = T.borderFocus)}
              onBlur={(e) => (e.target.style.borderColor = T.borderHover)}
            />
          </Box>
        )}
      </Box>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════
  // QUESTION PANEL
  // ═══════════════════════════════════════════════════════════════

  const questionContentStyles = {
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji'`,
    fontSize: 14,
    lineHeight: 1.75,
    color: T.qText,
    wordWrap: "break-word",
    overflowWrap: "break-word",

    "& h1": {
      fontSize: 22,
      fontWeight: 700,
      color: T.qHeading,
      mt: 0,
      mb: 1.5,
      lineHeight: 1.3,
    },
    "& h2": {
      fontSize: 18,
      fontWeight: 700,
      color: T.qHeading,
      mt: 3,
      mb: 1.5,
      lineHeight: 1.3,
    },
    "& h3": {
      fontSize: 15,
      fontWeight: 700,
      color: T.qHeading,
      mt: 2.5,
      mb: 1,
      lineHeight: 1.4,
    },
    "& h4": {
      fontSize: 14,
      fontWeight: 700,
      color: T.qHeading,
      mt: 2,
      mb: 1,
      lineHeight: 1.4,
    },
    "& p": { mb: 1.5, mt: 0, fontSize: 14, lineHeight: 1.75, color: T.qText },
    "& strong, & b": { color: T.qStrong, fontWeight: 700 },
    "& em, & i": { fontStyle: "italic" },
    "& a": {
      color: T.qLink,
      textDecoration: "none",
      "&:hover": { color: T.qLinkHover, textDecoration: "underline" },
    },

    "& code": {
      backgroundColor: T.qCodeBg,
      color: T.qCodeText,
      border: `1px solid ${T.qCodeBorder}`,
      padding: "1px 6px",
      borderRadius: "4px",
      fontFamily: `'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace`,
      fontSize: "0.875em",
      fontWeight: 500,
      whiteSpace: "nowrap",
    },

    "& pre": {
      backgroundColor: T.qPreBg,
      border: `1px solid ${T.qPreBorder}`,
      borderRadius: "8px",
      padding: "14px 18px",
      margin: "8px 0 16px 0",
      overflow: "auto",
      fontSize: 13,
      lineHeight: 1.65,
      color: T.qPreText,
      fontFamily: `'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace`,
      "& code": {
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
        borderRadius: 0,
        fontSize: "inherit",
        color: "inherit",
        fontWeight: "inherit",
        whiteSpace: "pre",
      },
    },

    "& ul": {
      pl: 2.5,
      mb: 1.5,
      mt: 0.5,
      color: T.qText,
      "& li": {
        mb: 0.4,
        fontSize: 14,
        lineHeight: 1.75,
        "&::marker": { color: T.qTextMuted },
      },
    },
    "& ol": {
      pl: 2.5,
      mb: 1.5,
      mt: 0.5,
      color: T.qText,
      "& li": {
        mb: 0.4,
        fontSize: 14,
        lineHeight: 1.75,
        "&::marker": { color: T.qTextSecondary, fontWeight: 600 },
      },
    },

    "& sup": { fontSize: "0.75em", verticalAlign: "super", lineHeight: 0 },
    "& sub": { fontSize: "0.75em", verticalAlign: "sub", lineHeight: 0 },
    "& hr": { border: "none", borderTop: `1px solid ${T.qSeparator}`, my: 2.5 },

    "& table": {
      width: "100%",
      borderCollapse: "collapse",
      mb: 2,
      fontSize: 13,
      "& th": {
        textAlign: "left",
        fontWeight: 600,
        color: T.qHeading,
        borderBottom: `2px solid ${T.qSeparator}`,
        p: "8px 12px",
      },
      "& td": {
        borderBottom: `1px solid ${T.qSeparator}`,
        p: "8px 12px",
        color: T.qText,
      },
      "& tr:hover td": {
        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
      },
    },

    "& blockquote": {
      borderLeft: `3px solid ${T.accent}`,
      m: 0,
      mb: 1.5,
      pl: 2,
      py: 0.5,
      color: T.qTextSecondary,
      fontStyle: "italic",
      "& p": { mb: 0.5 },
    },

    "& img": { maxWidth: "100%", height: "auto", borderRadius: "6px", my: 1 },
    "& .example, & .example-block": { mb: 2 },
    "& .constraints, & .constraint-list": {
      "& li": { mb: 0.3, "& code": { fontSize: "0.85em" } },
    },
  };

  const renderQuestionPanel = () => (
    <Box
      sx={{
        width: `${splitPercent}%`,
        display: "flex",
        flexDirection: "column",
        bgcolor: T.qBg,
        flexShrink: 0,
        overflow: "hidden",
        borderRight: `1px solid ${T.qBorderRight}`,
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: { xs: "20px", sm: "28px" },
          py: "24px",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: T.qScrollThumb,
            borderRadius: 3,
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)",
            },
          },
        }}
      >
        {(questionNumber || questionTitle) && (
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                color: T.qHeading,
                lineHeight: 1.35,
                mb: 1,
                fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
              }}
            >
              {questionNumber ? `${questionNumber}. ` : ""}
              {questionTitle || "Untitled"}
            </Typography>
            <Box
              sx={{
                width: "100%",
                height: "1px",
                bgcolor: T.qSeparator,
                mb: 2,
              }}
            />
          </Box>
        )}

        {questionHtml ? (
          <Box
            sx={questionContentStyles}
            dangerouslySetInnerHTML={{ __html: questionHtml }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              gap: 1.5,
            }}
          >
            <DescriptionIcon
              sx={{ fontSize: 32, opacity: 0.2, color: T.qTextMuted }}
            />
            <Typography sx={{ color: T.qTextMuted, fontSize: 14 }}>
              Question will appear here
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════
  // FULLSCREEN LAYOUT
  // ═══════════════════════════════════════════════════════════════

  if (isFullscreen) {
    return (
      <Box
        ref={fullscreenRef}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          bgcolor: T.bg,
          display: "flex",
          flexDirection: "column",
          transition: "background 0.3s ease",
        }}
      >
        <Box
          sx={{
            height: 48,
            bgcolor: T.fsBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            boxShadow: T.fsShadow,
            zIndex: 10,
            flexShrink: 0,
            borderBottom: `1px solid ${T.border}`,
            transition: "all 0.3s ease",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                bgcolor: T.fsBadge,
                color: "#fff",
                px: 1.5,
                py: 0.3,
                borderRadius: "20px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Q{questionNumber}
            </Box>
            <Box
              sx={{
                bgcolor: T.fsTypeBg,
                color: T.fsTypeColor,
                px: 1.5,
                py: 0.3,
                borderRadius: "20px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Coding
            </Box>
            {questionTitle && (
              <Typography sx={{ fontSize: 14, color: T.fsTitle, ml: 1 }}>
                {questionTitle}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {timeLeft != null && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                  bgcolor:
                    timeLeft <= 60
                      ? T.redSoft
                      : timeLeft <= 300
                        ? T.yellowSoft
                        : T.bgInput,
                  border: `1px solid ${
                    timeLeft <= 60
                      ? T.bgErrorBd
                      : timeLeft <= 300
                        ? T.bgWarningBd
                        : T.border
                  }`,
                  px: 1.5,
                  py: 0.4,
                  borderRadius: "20px",
                  transition: "all 0.3s ease",
                }}
              >
                <TimerIcon
                  sx={{
                    fontSize: 15,
                    color:
                      timeLeft <= 60
                        ? T.red
                        : timeLeft <= 300
                          ? T.yellow
                          : T.textLabel,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color:
                      timeLeft <= 60
                        ? T.red
                        : timeLeft <= 300
                          ? T.yellow
                          : T.text,
                    minWidth: 48,
                    textAlign: "center",
                  }}
                >
                  {(() => {
                    const t = typeof timeLeft === "number" ? timeLeft : 0;
                    const m = Math.floor(t / 60);
                    const s = t % 60;
                    return `${m}:${s.toString().padStart(2, "0")}`;
                  })()}
                </Typography>
              </Box>
            )}
            <Typography
              sx={{
                fontSize: 11,
                color: T.fsHintText,
                bgcolor: T.fsHint,
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
                border: `1px solid ${T.fsHintBorder}`,
              }}
            >
              Press Esc to exit fullscreen
            </Typography>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} theme={T} />
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{
                color: T.textMuted,
                "&:hover": { color: T.red, bgcolor: T.redSoft },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {renderQuestionPanel()}
          <ResizableDivider onDrag={handleSplitDrag} theme={T} />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {renderToolbar()}
            {renderCodeArea(true)}
            {renderOutputPanel(true)}

            {/* ✅ NAVIGATION BAR - always visible in fullscreen */}
            {(onPrevious || onSkip || onNext) && (
              <Box
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 3,
                  py: 1.5,
                  bgcolor: T.fsBg,
                  borderTop: `1px solid ${T.border}`,
                  zIndex: 10,
                }}
              >
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={onPrevious}
                  disabled={!canGoPrevious || isSubmitting}
                  sx={{
                    py: 1,
                    px: 3,
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    textTransform: "none",
                    borderRadius: "10px",
                    borderColor: T.border,
                    color: T.textMuted,
                    "&:hover": {
                      borderColor: T.accent,
                      color: T.accent,
                      bgcolor: T.accentSoft,
                    },
                    "&.Mui-disabled": {
                      borderColor: T.border,
                      color: T.textDim,
                      opacity: 0.4,
                    },
                  }}
                >
                  ← Previous
                </Button>

                <Button
                  variant="outlined"
                  size="medium"
                  onClick={onSkip}
                  disabled={isSubmitting}
                  sx={{
                    py: 1,
                    px: 3,
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    textTransform: "none",
                    borderRadius: "10px",
                    borderColor: isDark
                      ? "rgba(251,191,36,0.3)"
                      : "rgba(202,138,4,0.3)",
                    color: T.yellow,
                    "&:hover": { borderColor: T.yellow, bgcolor: T.yellowSoft },
                    "&.Mui-disabled": { opacity: 0.4 },
                  }}
                >
                  {isLastQuestion ? "Skip & Review" : "Skip"} ⏭
                </Button>

                <Button
                  variant="contained"
                  size="medium"
                  // onClick={() => onNext(value)}
                  onClick={() => {
                    if (isLastQuestion) {
                      setIsFullscreen(false);
                      setTimeout(() => onNext(value), 150);
                    } else {
                      onNext(value);
                    }
                  }}
                  disabled={isSubmitting || !hasAnswer || isTimeExpired}
                  sx={{
                    py: 1,
                    px: 4,
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "10px",

                    background: T.runBg,
                    boxShadow: T.runShadow,
                    "&:hover": { background: T.runBgHover },
                    "&.Mui-disabled": {
                      opacity: 0.4,
                      background: T.bgInput,
                      color: T.textMuted,
                      boxShadow: "none",
                    },
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : isLastQuestion
                      ? "Review & Finish"
                      : isAnswered
                        ? "Update & Next Question →"
                        : "Next Question →"}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // NORMAL LAYOUT
  // ═══════════════════════════════════════════════════════════════

  return (
    <Box
      ref={editorContainerRef}
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        border: `1px solid ${T.border}`,
        bgcolor: T.bg,
        display: "flex",
        flexDirection: "column",
        boxShadow: isDark
          ? "0 4px 24px rgba(0,0,0,0.3)"
          : "0 4px 24px rgba(0,0,0,0.06)",
        transition: "all 0.3s ease",
      }}
    >
      {renderToolbar()}
      {renderCodeArea(false)}
      {renderOutputPanel(false)}
    </Box>
  );
};

export default CodeEditor;
