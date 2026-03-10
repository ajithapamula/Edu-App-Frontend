import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Fade,
  Slide,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Star,
  Analytics,
  TrendingUp,
  ThumbUp,
  ThumbDown,
  Lightbulb,
  EmojiEvents,
  Visibility,
} from '@mui/icons-material';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

const cardSx = {
  borderRadius: '16px',
  bgcolor: '#fff',
  border: '1px solid rgba(41,128,185,0.08)',
  boxShadow:
    '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
};

/* ——— Large Score Ring (SVG) ——— */
const LargeScoreRing = ({ score }) => {
  const getColor = (s) => {
    if (s >= 80) return '#0d9488';
    if (s >= 70) return '#2980b9';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };
  const color = getColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: 130, height: 130, mx: 'auto', mb: 1.5 }}>
      <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(41,128,185,0.08)" strokeWidth="8" />
        <circle cx="65" cy="65" r="54" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1, fontFamily: fontStack }}>
          {Math.round(score)}
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          out of 100
        </Typography>
      </Box>
    </Box>
  );
};

/* ——— Criteria Progress Bar ——— */
const CriteriaBar = ({ label, weight, score, applicable = true }) => {
  const getBarColor = (s) => {
    if (s >= 80) return '#0d9488';
    if (s >= 70) return '#2980b9';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (!applicable) {
    return (
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>{label}</Typography>
            <Chip label={weight} size="small" sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, borderRadius: '4px', bgcolor: 'rgba(41,128,185,0.06)', color: '#64748b' }} />
          </Box>
          <Chip label="N/A" size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, borderRadius: '5px', bgcolor: 'rgba(148,163,184,0.10)', color: '#94a3b8' }} />
        </Box>
        <LinearProgress variant="determinate" value={0}
          sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(148,163,184,0.10)', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#cbd5e1' } }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>{label}</Typography>
          <Chip label={weight} size="small" sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, borderRadius: '4px', bgcolor: 'rgba(41,128,185,0.06)', color: '#64748b' }} />
        </Box>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: getBarColor(score), fontFamily: fontStack }}>
          {Math.round(score)}%
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={score}
        sx={{
          height: 8, borderRadius: 4, bgcolor: 'rgba(41,128,185,0.08)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4, transition: 'width 1s ease-out',
            background: score >= 80 ? 'linear-gradient(90deg, #0d9488, #5eead4)'
              : score >= 70 ? 'linear-gradient(90deg, #2980b9, #3498c8)'
              : score >= 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(90deg, #ef4444, #f97316)',
          },
        }}
      />
    </Box>
  );
};

/* ——— Feedback Section ——— */
const FeedbackBox = ({ icon, title, content, bgColor, borderColor, iconColor }) => {
  if (!content) return null;

  const renderContent = () => {
    // Try parsing as JSON array
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.map((item, i) => (
            <Box key={i} display="flex" gap={1} mb={i < parsed.length - 1 ? 1 : 0}>
              <Box sx={{ width: 6, height: 6, minWidth: 6, borderRadius: '50%', bgcolor: iconColor, mt: 0.8, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, fontFamily: fontStack }}>{item}</Typography>
            </Box>
          ));
        }
      } catch { /* not JSON */ }
      // Plain text
      return (
        <Typography sx={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.7, fontFamily: fontStack, whiteSpace: 'pre-line' }}>
          {content}
        </Typography>
      );
    }
    if (Array.isArray(content)) {
      return content.map((item, i) => (
        <Box key={i} display="flex" gap={1} mb={i < content.length - 1 ? 1 : 0}>
          <Box sx={{ width: 6, height: 6, minWidth: 6, borderRadius: '50%', bgcolor: iconColor, mt: 0.8, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, fontFamily: fontStack }}>{item}</Typography>
        </Box>
      ));
    }
    return null;
  };

  return (
    <Box sx={{ p: 2.5, borderRadius: '14px', bgcolor: bgColor, border: `1px solid ${borderColor}` }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        {React.cloneElement(icon, { sx: { fontSize: 20, color: iconColor } })}
        <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>{title}</Typography>
      </Box>
      {renderContent()}
    </Box>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                             */
/* Data is passed via React Router state from list page       */
/* Backend keys are snake_case — see backend response shape   */
/* ═══════════════════════════════════════════════════════════ */
const ViewTaskEvaluation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Data passed from TaskEvaluationsPage via navigate(..., { state })
  // Already in snake_case matching backend response
  const evaluation = location.state?.evaluation;
  const studentName = location.state?.studentName;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  // If no data in state (e.g. user refreshed the page), redirect back
  if (!evaluation) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Analytics sx={{ fontSize: 52, color: '#cbd5e1', mb: 1.5 }} />
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5, fontFamily: fontStack }}>
          Evaluation Data Not Available
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mb: 2.5, fontFamily: fontStack }}>
          Please navigate from the Task Evaluations list to view results.
        </Typography>
        <Button variant="contained" startIcon={<ArrowBack />}
          onClick={() => navigate('/student/task-evaluations')}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', fontFamily: fontStack }}>
          Back to Evaluations
        </Button>
      </Box>
    );
  }

  /* criteria_scores keys from backend are PascalCase inside the object:
   * Task_Name, Objective, Tools_Software, Steps_Performed,
   * Code_Commands (with .applicable), Explanation, Conclusion
   */
  const criteria = evaluation.criteria_scores || {};

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* ═══ Gradient Header ═══ */}
      <Fade in timeout={600}>
        <Box sx={{
          p: 2.5, mb: 3, borderRadius: '16px',
          background: evaluation.passed
            ? 'linear-gradient(135deg, #0d6b61 0%, #0d9488 50%, #2980b9 100%)'
            : 'linear-gradient(135deg, #991b1b 0%, #ef4444 50%, #f97316 100%)',
          boxShadow: '0 4px 20px rgba(26,82,118,0.18)',
          position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
            <Box display="flex" alignItems="center">
              <IconButton
                onClick={() => navigate('/student/task-evaluations')}
                sx={{
                  mr: 2, width: 42, height: 42, borderRadius: '11px',
                  bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.20)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                }}
              >
                <ArrowBack sx={{ fontSize: 22 }} />
              </IconButton>
              <Box>
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', fontFamily: fontStack }}>
                  Evaluation Results
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', fontFamily: fontStack }}>
                  {evaluation.task_name || 'Task Evaluation'}
                </Typography>
              </Box>
            </Box>
            <Button variant="contained"
              onClick={() => navigate('/student/task-evaluations')}
              sx={{
                textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', borderRadius: '10px',
                bgcolor: 'rgba(255,255,255,0.92)', color: evaluation.passed ? '#0d6b61' : '#991b1b',
                '&:hover': { bgcolor: '#fff' },
              }}
            >
              Back to List
            </Button>
          </Box>
        </Box>
      </Fade>

      <Grid container spacing={2.5}>
        {/* ═══ LEFT COLUMN ═══ */}
        <Grid item xs={12} md={8}>
          <Slide in direction="up" timeout={600}>
            <Box display="flex" flexDirection="column" gap={2.5}>
              {/* Criteria Breakdown */}
              <Card sx={cardSx}>
                <Box sx={{ height: '3px', background: 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)' }} />
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                    <TrendingUp sx={{ color: '#2980b9', fontSize: 22 }} />
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                      Criteria Breakdown
                    </Typography>
                  </Box>

                  <CriteriaBar label="Task Name" weight={criteria.Task_Name?.weight || '5%'} score={criteria.Task_Name?.score || 0} />
                  <CriteriaBar label="Objective" weight={criteria.Objective?.weight || '5%'} score={criteria.Objective?.score || 0} />
                  <CriteriaBar label="Tools & Software" weight={criteria.Tools_Software?.weight || '5%'} score={criteria.Tools_Software?.score || 0} />
                  <CriteriaBar label="Steps Performed" weight={criteria.Steps_Performed?.weight || '50%'} score={criteria.Steps_Performed?.score || 0} />
                  <CriteriaBar label="Code / Commands" weight={criteria.Code_Commands?.weight || '20%'} score={criteria.Code_Commands?.score || 0}
                    applicable={criteria.Code_Commands?.applicable !== false}
                  />
                  <CriteriaBar label="Explanation" weight={criteria.Explanation?.weight || '10%'} score={criteria.Explanation?.score || 0} />
                  <CriteriaBar label="Conclusion" weight={criteria.Conclusion?.weight || '5%'} score={criteria.Conclusion?.score || 0} />
                </CardContent>
              </Card>

              {/* Strengths & Weaknesses — side by side */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FeedbackBox
                    icon={<ThumbUp />} title="Strengths" content={evaluation.strengths}
                    bgColor="rgba(13,148,136,0.04)" borderColor="rgba(13,148,136,0.12)" iconColor="#0d9488"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FeedbackBox
                    icon={<ThumbDown />} title="Weaknesses" content={evaluation.weaknesses}
                    bgColor="rgba(245,158,11,0.04)" borderColor="rgba(245,158,11,0.12)" iconColor="#f59e0b"
                  />
                </Grid>
              </Grid>

              {/* Recommendations */}
              <FeedbackBox
                icon={<Lightbulb />} title="Recommendations" content={evaluation.recommendations}
                bgColor="rgba(41,128,185,0.04)" borderColor="rgba(41,128,185,0.10)" iconColor="#2980b9"
              />
            </Box>
          </Slide>
        </Grid>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={2.5} sx={{ position: 'sticky', top: 80 }}>
            {/* Overall Score Card */}
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.10em', textTransform: 'uppercase', mb: 2 }}>
                  Overall Score
                </Typography>

                <LargeScoreRing score={evaluation.overall_score} />

                {/* Pass/Fail Badge */}
                <Chip
                  icon={evaluation.passed
                    ? <CheckCircle sx={{ fontSize: '16px !important' }} />
                    : <Cancel sx={{ fontSize: '16px !important' }} />
                  }
                  label={evaluation.passed ? 'PASSED' : 'FAILED'}
                  sx={{
                    height: 30, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em', borderRadius: '8px',
                    bgcolor: evaluation.passed ? 'rgba(13,148,136,0.12)' : 'rgba(239,68,68,0.12)',
                    color: evaluation.passed ? '#0d9488' : '#ef4444',
                    '& .MuiChip-icon': { color: evaluation.passed ? '#0d9488' : '#ef4444' },
                    mb: 1.5,
                  }}
                />

                {/* Rating */}
                {evaluation.rating && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <EmojiEvents sx={{ fontSize: 16, color: '#f59e0b' }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack, textTransform: 'capitalize' }}>
                      {evaluation.rating}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', mb: 2, fontFamily: fontStack }}>
                  Details
                </Typography>

                {[
                  { label: 'Student', value: studentName || 'N/A' },
                  { label: 'Task', value: evaluation.task_name || 'N/A' },
                  { label: 'Submitted', value: formatDate(evaluation.submitted_date) },
                  { label: 'Status', value: evaluation.evaluation_status || 'N/A' },
                ].map((item) => (
                  <Box key={item.label} mb={1.5}>
                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.2 }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ViewTaskEvaluation;