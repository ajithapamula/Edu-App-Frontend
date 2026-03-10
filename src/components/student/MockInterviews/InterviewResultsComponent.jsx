// InterviewResults.jsx - Professional UI with detailed evaluation
// Shows results for: Introduction -> Communication -> Technical -> HR flow
// src/components/student/MockInterviews/InterviewResults.jsx
// UI Updated: iMeetPro teal/cyan theme applied

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Card, CardContent, Grid, Chip, Button, Alert,
  CircularProgress, LinearProgress, Paper, Divider,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  ArrowBack, Download, Assessment, ChatBubbleOutline, SettingsOutlined,
  EmojiEventsOutlined, PersonOutline, FavoriteBorder, AccessTime, HelpOutline,
  CheckCircle, Handshake, Code, ExpandMore
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { interviewOperationsAPI } from '../../../services/API/studentmockinterview';

// ═══ iMeetPro Theme Tokens ═══
const T = {
  primary: '#00838f',
  primaryLight: '#26c6da',
  primaryDark: '#004d54',
  secondary: '#0d9488',
  secondaryLight: '#5eead4',
  navy: '#1a5276',
  blue: '#2980b9',
  blueLight: '#3498c8',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  surface: '#f0f4f8',
  cardBg: '#fff',
  borderLight: 'rgba(41,128,185,0.08)',
  borderMedium: 'rgba(41,128,185,0.15)',
  success: '#0d9488',
  warning: '#f59e0b',
  error: '#ef4444',
  gradientPrimary: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
  gradientTeal: 'linear-gradient(135deg, #00838f 0%, #26c6da 100%)',
  gradientSuccess: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)',
  gradientAccent: 'linear-gradient(135deg, #1a5276 0%, #0d9488 100%)',
  gradientDark: 'linear-gradient(135deg, #0f172a 0%, #1a5276 100%)',
};

const cardBase = {
  borderRadius: '18px',
  background: T.cardBg,
  border: `1px solid ${T.borderLight}`,
  boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
  overflow: 'hidden',
};

// Round configuration matching backend - iMeetPro themed
const ROUND_CONFIG = {
  communication: { duration: 10, maxQuestions: 10, label: 'Communication', color: T.blue, bgColor: `${T.blue}10` },
  technical: { duration: 25, maxQuestions: 10, label: 'Technical', color: T.primary, bgColor: `${T.primary}10` },
  hr: { duration: 10, maxQuestions: 10, label: 'HR/Behavioral', color: T.secondary, bgColor: `${T.secondary}10` }
};

// Evaluation criteria configuration - iMeetPro themed
const EVALUATION_CRITERIA_CONFIG = {
  communication_score: { label: 'Communication', weight: 25, icon: <ChatBubbleOutline sx={{ color: T.blue }} />, description: 'Clarity, articulation, and confidence in expression.', color: T.blue, bgColor: `${T.blue}10` },
  technical_score: { label: 'Technical', weight: 30, icon: <SettingsOutlined sx={{ color: T.primary }} />, description: 'Conceptual understanding and problem-solving skills.', color: T.primary, bgColor: `${T.primary}10` },
  leadership_score: { label: 'Leadership', weight: 15, icon: <EmojiEventsOutlined sx={{ color: T.navy }} />, description: 'Initiative, collaboration, and decision-making.', color: T.navy, bgColor: `${T.navy}10` },
  behaviour_score: { label: 'Behaviour', weight: 15, icon: <PersonOutline sx={{ color: T.primaryLight }} />, description: 'Professional maturity and ethical judgment.', color: T.primaryLight, bgColor: `${T.primaryLight}10` },
  confidence_score: { label: 'Confidence', weight: 15, icon: <FavoriteBorder sx={{ color: T.secondary }} />, description: 'Self-awareness and composure under pressure.', color: T.secondary, bgColor: `${T.secondary}10` }
};

// Round display configuration - iMeetPro themed
const ROUND_DISPLAY_CONFIG = {
  communication: { 
    title: 'Communication Assessment', 
    icon: <ChatBubbleOutline sx={{ color: T.blue }} />, 
    color: T.blue, 
    bgColor: `${T.blue}10`,
    questionBgColor: `${T.blue}08`
  },
  technical: { 
    title: 'Technical Assessment', 
    icon: <Code sx={{ color: T.primary }} />, 
    color: T.primary, 
    bgColor: `${T.primary}10`,
    questionBgColor: `${T.primary}08`
  },
  hr: { 
    title: 'HR/Behavioral Assessment', 
    icon: <Handshake sx={{ color: T.secondary }} />, 
    color: T.secondary, 
    bgColor: `${T.secondary}10`,
    questionBgColor: `${T.secondary}08`
  }
};

const getBackendBaseUrl = () => {
  return 'https://192.168.48.201:8090';
};

const InterviewResults = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => { fetchInterviewResults(); }, [testId, retryCount]);

  const fetchInterviewResults = async () => {
    setLoading(true);
    setError(null);
    try {
      let evaluationData = location.state?.evaluation;
      if (!evaluationData) {
        const storedData = localStorage.getItem(`interview_results_${testId}`);
        if (storedData) { 
          try { evaluationData = JSON.parse(storedData); } 
          catch (e) { console.warn('Failed to parse localStorage data:', e); } 
        }
      }
      if (!evaluationData) { 
        evaluationData = await interviewOperationsAPI.evaluateInterview(testId); 
      }
      if (!evaluationData) { throw new Error('No interview results found.'); }
      
      console.log('Raw evaluation data:', evaluationData);
      const processedResults = processEvaluationData(evaluationData);
      console.log('Processed results:', processedResults);
      
      setResults(processedResults);
      localStorage.setItem(`interview_results_${testId}`, JSON.stringify(processedResults));
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message || 'Failed to load interview results');
    } finally { setLoading(false); }
  };

  const processEvaluationData = (data) => {
    const evaluation = data.evaluation || data.text || '';
    const scores = data.scores || {};
    const analytics = data.analytics || data.interview_analytics || {};
    
    const processedScores = {};
    ['communication_score', 'technical_score', 'leadership_score', 'behaviour_score', 'confidence_score', 'weighted_overall'].forEach(key => {
      const value = scores[key];
      if (typeof value === 'number') processedScores[key] = value;
      else if (typeof value === 'string') processedScores[key] = parseFloat(value) || 0;
      else if (typeof value === 'object' && value?.score !== undefined) processedScores[key] = parseFloat(value.score) || 0;
      else processedScores[key] = 0;
    });

    const parsedRounds = parseEvaluationByRounds(evaluation);
    
    let questionsPerRound = {};
    const rawQPR = analytics.questions_per_round || analytics.questionsPerRound || data.questions_per_round || {};
    
    if (typeof rawQPR === 'object' && rawQPR !== null && Object.keys(rawQPR).length > 0) {
      Object.entries(rawQPR).forEach(([key, value]) => {
        const nKey = key.toLowerCase().replace(/[^a-z]/g, '');
        if (nKey.includes('communication')) questionsPerRound.communication = parseInt(value) || 0;
        else if (nKey.includes('technical')) questionsPerRound.technical = parseInt(value) || 0;
        else if (nKey.includes('hr') || nKey.includes('behavioral')) questionsPerRound.hr = parseInt(value) || 0;
      });
    }
    
    if (Object.keys(questionsPerRound).length === 0 || Object.values(questionsPerRound).every(v => v === 0)) {
      Object.entries(parsedRounds).forEach(([roundType, roundData]) => {
        if (roundData.questions && roundData.questions.length > 0) {
          questionsPerRound[roundType] = roundData.questions.length;
        }
      });
    }

    console.log('Questions per round:', questionsPerRound);
    console.log('Parsed rounds:', parsedRounds);
    
    return {
      evaluation,
      parsedRounds,
      scores: processedScores,
      analytics: { 
        duration_minutes: analytics.duration_minutes || analytics.durationMinutes || 0, 
        questions_per_round: questionsPerRound, 
        ...analytics 
      },
      test_id: testId, 
      student_name: analytics.student_name || analytics.studentName || 'Student'
    };
  };

  const parseEvaluationByRounds = (evaluationText) => {
    if (!evaluationText || typeof evaluationText !== 'string') {
      return { communication: { questions: [] }, technical: { questions: [] }, hr: { questions: [] } };
    }

    const rounds = {
      communication: { questions: [], rawContent: '' },
      technical: { questions: [], rawContent: '' },
      hr: { questions: [], rawContent: '' }
    };

    // ══════════════════════════════════════════════════════════════
    // FIX 1: Changed \s* to [^\n]* after header keywords
    //
    // Backend generates headers like:
    //   "TECHNICAL ROUND FEEDBACK (4 questions)"
    //   "TECHNICAL BEHAVIORAL QUESTIONS (2 questions)"
    //
    // Old regex had \s* before ={3,} which can't match "(N questions)".
    // [^\n]* matches any characters until end of line, so any suffix
    // like "(4 questions)" is tolerated.
    // ══════════════════════════════════════════════════════════════
    const roundPatterns = [
      { type: 'communication', regex: /={3,}\s*COMMUNICATION\s*ROUND\s*FEEDBACK[^\n]*\s*={3,}([\s\S]*?)(?=={3,}\s*(?:TECHNICAL|HR|BEHAVIORAL)|={3,}\s*OVERALL\s*SUMMARY|$)/i },
      { type: 'technical', regex: /={3,}\s*TECHNICAL\s*(?:ROUND\s*FEEDBACK|BEHAVIORAL\s*QUESTIONS)[^\n]*\s*={3,}([\s\S]*?)(?=={3,}\s*(?:HR\/BEHAVIORAL|HR|BEHAVIORAL)\s*(?:ROUND\s*FEEDBACK|ROUND)[^\n]*\s*={3,}|={3,}\s*OVERALL\s*SUMMARY|$)/i },
      { type: 'hr', regex: /={3,}\s*(?:HR|BEHAVIORAL|HR\/BEHAVIORAL)\s*ROUND\s*FEEDBACK[^\n]*\s*={3,}([\s\S]*?)(?=={3,}\s*OVERALL\s*SUMMARY|={3,}\s*$|$)/i }
    ];

    roundPatterns.forEach(({ type, regex }) => {
      const match = evaluationText.match(regex);
      if (match && match[1]) {
        rounds[type].rawContent = match[1].trim();
        rounds[type].questions = parseQuestionsFromRoundText(match[1]);
      }
    });

    // ══════════════════════════════════════════════════════════════
    // FIX 2: Merge TECHNICAL BEHAVIORAL QUESTIONS sub-section
    //
    // Backend generates TWO technical sections:
    //   "TECHNICAL ROUND FEEDBACK (4 questions)"
    //   "TECHNICAL BEHAVIORAL QUESTIONS (2 questions)"
    //
    // The primary regex above captures the first one. This grabs the
    // second sub-section and merges its Q&A into the technical round
    // so they appear together in the UI.
    // ══════════════════════════════════════════════════════════════
    if (rounds.technical.questions.length > 0 || rounds.technical.rawContent) {
      const behavioralMatch = evaluationText.match(
        /={3,}\s*TECHNICAL\s*BEHAVIORAL\s*QUESTIONS[^\n]*\s*={3,}([\s\S]*?)(?=={3,}\s*(?:HR\/BEHAVIORAL|HR|BEHAVIORAL)\s*(?:ROUND|QUESTIONS)[^\n]*\s*={3,}|={3,}\s*OVERALL\s*SUMMARY|$)/i
      );
      if (behavioralMatch && behavioralMatch[1]) {
        const extraQs = parseQuestionsFromRoundText(behavioralMatch[1]);
        rounds.technical.questions.push(...extraQs);
        rounds.technical.rawContent += '\n' + behavioralMatch[1].trim();
      }
    }

    // ══════════════════════════════════════════════════════════════
    // FIX 3: Per-round alt-pattern fallback (was all-or-nothing)
    //
    // Old code only tried alt patterns if ALL rounds had 0 questions:
    //   if (Object.values(rounds).every(r => r.questions.length === 0))
    //
    // Problem: communication succeeds with primary → alt patterns
    // never tried → technical stays empty even though alt would work.
    //
    // New code: tries alt pattern for EACH round that still has 0
    // questions, independently of whether other rounds succeeded.
    // ══════════════════════════════════════════════════════════════
    const altPatterns = [
      { type: 'communication', regex: /COMMUNICATION\s*(?:ROUND)?\s*FEEDBACK[^\n]*([\s\S]*?)(?=TECHNICAL\s*(?:ROUND)?\s*FEEDBACK|TECHNICAL\s*BEHAVIORAL|$)/i },
      { type: 'technical', regex: /TECHNICAL\s*(?:ROUND\s*FEEDBACK|BEHAVIORAL\s*QUESTIONS)[^\n]*([\s\S]*?)(?=(?:HR|BEHAVIORAL|HR\/BEHAVIORAL)\s*(?:ROUND)?\s*FEEDBACK|OVERALL\s*SUMMARY|$)/i },
      { type: 'hr', regex: /(?:HR|BEHAVIORAL|HR\/BEHAVIORAL)\s*(?:ROUND)?\s*FEEDBACK[^\n]*([\s\S]*?)(?=OVERALL\s*SUMMARY|$)/i }
    ];

    altPatterns.forEach(({ type, regex }) => {
      // Only try alt pattern if primary pattern found nothing for this round
      if (rounds[type].questions.length > 0) return;

      const match = evaluationText.match(regex);
      if (match && match[1]) {
        rounds[type].rawContent = match[1].trim();
        rounds[type].questions = parseQuestionsFromRoundText(match[1]);

        // For technical alt: also grab behavioral sub-section
        if (type === 'technical') {
          const behavioralAlt = evaluationText.match(
            /TECHNICAL\s*BEHAVIORAL\s*QUESTIONS[^\n]*([\s\S]*?)(?=(?:HR\/BEHAVIORAL|HR|BEHAVIORAL)\s*(?:ROUND)?\s*FEEDBACK|OVERALL\s*SUMMARY|$)/i
          );
          if (behavioralAlt && behavioralAlt[1]) {
            const extraQs = parseQuestionsFromRoundText(behavioralAlt[1]);
            rounds[type].questions.push(...extraQs);
            rounds[type].rawContent += '\n' + behavioralAlt[1].trim();
          }
        }
      }
    });

    return rounds;
  };

  const parseQuestionsFromRoundText = (roundText) => {
    if (!roundText) return [];
    
    const questions = [];
    const questionBlocks = roundText.split(/(?=Q\d+\.\s*AI\s*Question:)/i);
    
    questionBlocks.forEach(block => {
      if (!block.trim()) return;
      
      const qNumMatch = block.match(/Q(\d+)\./i);
      const questionNum = qNumMatch ? parseInt(qNumMatch[1]) : null;
      
      const aiQuestionMatch = block.match(/AI\s*Question:\s*([^\n]+)/i);
      const aiQuestion = aiQuestionMatch ? aiQuestionMatch[1].trim() : '';
      
      const userAnswerMatch = block.match(/User\s*Answer:\s*([^\n]+)/i);
      const userAnswer = userAnswerMatch ? userAnswerMatch[1].trim() : '';
      
      const feedbackMatch = block.match(/Feedback:\s*([\s\S]*?)(?=-{3,}|Q\d+\.|$)/i);
      let feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
      feedback = feedback.replace(/-{3,}\s*$/, '').trim();
      
      if (aiQuestion || feedback) {
        questions.push({ questionNum, question: aiQuestion, userAnswer, feedback });
      }
    });
    
    return questions;
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (interviewOperationsAPI.downloadResults) {
        try {
          const response = await interviewOperationsAPI.downloadResults(testId);
          if (response instanceof Blob) {
            const url = window.URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;
            link.download = `interview_results_${testId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return;
          }
        } catch (apiError) {
          console.warn('API download failed, trying direct fetch:', apiError);
        }
      }
      
      const response = await fetch(`${getBackendBaseUrl()}/weekly_interview/download_results/${testId}`, {
        method: 'GET',
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF download error:', errorText);
        throw new Error(`Download failed: ${response.status} - ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.warn('Response is not PDF, content-type:', contentType);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview_results_${testId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF download error:', error);
      alert(`PDF download failed: ${error.message}\n\nPlease check if the backend supports PDF generation.`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getTotalQuestions = () => {
    if (!results?.analytics?.questions_per_round) return 0;
    return Object.values(results.analytics.questions_per_round).reduce((sum, c) => sum + (parseInt(c) || 0), 0);
  };

  const getReliabilityIndex = () => results?.scores?.weighted_overall ? Math.round((results.scores.weighted_overall / 10) * 100) : 0;

  const getPerformanceSummary = () => {
    const score = results?.scores?.weighted_overall || 0;
    if (score >= 8) return "A very strong performance overall, characterized by high confidence and effective communication.";
    if (score >= 6) return "A solid performance with good fundamentals. Some areas show room for improvement.";
    if (score >= 4) return "An average performance with notable areas requiring development and practice.";
    return "Performance indicates significant areas for improvement across multiple dimensions.";
  };

  // Render loading state
  if (loading) return (
    <Box sx={{ minHeight: '100vh', background: T.surface }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} sx={{ color: T.primary }} />
          <Typography variant="h6" sx={{ mt: 2, color: T.text, fontWeight: 700 }}>Loading your interview results...</Typography>
        </Box>
      </Container>
    </Box>
  );

  // Render error state
  if (error) return (
    <Box sx={{ minHeight: '100vh', background: T.surface }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</Alert>
        <Box display="flex" gap={2}>
          <Button variant="contained" onClick={() => setRetryCount(p => p + 1)} sx={{ borderRadius: '14px', fontWeight: 700, textTransform: 'none', background: T.gradientPrimary, boxShadow: '0 4px 14px rgba(26,82,118,0.25)' }}>Retry</Button>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/student/mock-interviews')} sx={{ borderRadius: '14px', fontWeight: 600, textTransform: 'none', borderColor: T.borderMedium, color: T.textSecondary }}>Back</Button>
        </Box>
      </Container>
    </Box>
  );

  // Render no results state
  if (!results) return (
    <Box sx={{ minHeight: '100vh', background: T.surface }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>No results found for: {testId}</Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/student/mock-interviews')} sx={{ mt: 2, borderRadius: '14px', fontWeight: 600, textTransform: 'none', borderColor: T.borderMedium, color: T.textSecondary }}>Back</Button>
      </Container>
    </Box>
  );

  const scoreOrder = ['communication_score', 'technical_score', 'leadership_score', 'behaviour_score', 'confidence_score'];
  const roundOrder = ['communication', 'technical', 'hr'];
  const questionsPerRound = results.analytics?.questions_per_round || {};
  const totalQuestions = getTotalQuestions();

  return (
    <Box sx={{ bgcolor: T.surface, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header Navigation */}
        <Box 
          onClick={() => navigate('/student/mock-interviews')} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 3, 
            cursor: 'pointer', 
            color: T.primary, 
            '&:hover': { color: T.primaryDark } 
          }}
        >
          <ArrowBack sx={{ fontSize: 18 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            RETURN TO ASSESSMENTS
          </Typography>
        </Box>

        {/* Title Section */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '14px', 
              background: T.gradientTeal,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,131,143,0.3)',
            }}>
              <Assessment sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: T.text }}>
                Interview Performance
              </Typography>
              <Typography variant="body2" sx={{ color: T.textSecondary }}>
                Analysis for <span style={{ fontWeight: 600, color: T.text }}>{results.student_name}</span> • ID: 
                <code style={{ backgroundColor: T.surface, padding: '2px 6px', borderRadius: 6, marginLeft: 4, border: `1px solid ${T.borderMedium}`, fontSize: '0.8rem' }}>
                  {testId}
                </code>
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={downloadingPdf ? <CircularProgress size={18} sx={{ color: T.primary }} /> : <Download />} 
            onClick={handleDownloadPDF} 
            disabled={downloadingPdf}
            sx={{ 
              borderRadius: '14px', 
              borderColor: T.borderMedium, 
              color: T.textSecondary, 
              textTransform: 'none', 
              fontWeight: 600,
              '&:hover': {
                borderColor: T.primary,
                backgroundColor: `${T.primary}06`,
              }
            }}
          >
            {downloadingPdf ? 'Downloading...' : 'Download Executive Report'}
          </Button>
        </Box>

        {/* Score Cards Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Composite Evaluation Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%', 
              background: T.gradientDark, 
              borderRadius: '18px', 
              color: 'white',
              boxShadow: '0 4px 20px rgba(15,23,42,0.2)',
            }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="overline" sx={{ color: T.textMuted, letterSpacing: 1, mb: 2 }}>
                  COMPOSITE EVALUATION
                </Typography>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 300 }}>
                    {(results.scores.weighted_overall || 0).toFixed(1)}
                    <Typography component="span" variant="h5" sx={{ color: T.textMuted, ml: 0.5 }}>
                      / 10
                    </Typography>
                  </Typography>
                </Box>
                <Box sx={{ mt: 'auto' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" sx={{ color: T.textMuted }}>Reliability Index</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{getReliabilityIndex()}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getReliabilityIndex()} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3, 
                      bgcolor: 'rgba(255,255,255,0.1)', 
                      '& .MuiLinearProgress-bar': { background: T.gradientSuccess, borderRadius: 3 } 
                    }} 
                  />
                  <Typography variant="caption" sx={{ color: T.textMuted, mt: 2, display: 'block', fontStyle: 'italic' }}>
                    "{getPerformanceSummary()}"
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Individual Score Cards */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {scoreOrder.map((scoreKey) => {
                const config = EVALUATION_CRITERIA_CONFIG[scoreKey];
                const score = results.scores[scoreKey] || 0;
                return (
                  <Grid item xs={6} sm={4} key={scoreKey}>
                    <Card sx={{ ...cardBase, height: '100%' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Box sx={{ 
                            width: 32, height: 32, borderRadius: '8px', 
                            background: config.bgColor, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                          }}>
                            {config.icon}
                          </Box>
                          <Chip 
                            label={`${config.weight}%`} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.7rem', bgcolor: T.surface, color: T.textMuted, borderRadius: '6px', border: `1px solid ${T.borderLight}` }} 
                          />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: T.text, mb: 0.5 }}>
                          {config.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: T.textMuted, display: 'block', mb: 2, minHeight: 32 }}>
                          {config.description}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: T.text, mb: 1 }}>
                          {score.toFixed(1)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(score / 10) * 100} 
                          sx={{ 
                            height: 4, 
                            borderRadius: 2, 
                            bgcolor: `${config.color}15`, 
                            '& .MuiLinearProgress-bar': { bgcolor: config.color, borderRadius: 2 } 
                          }} 
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
              
              {/* Duration & Questions Card */}
              <Grid item xs={6} sm={4}>
                <Card sx={{ ...cardBase, height: '100%' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" gap={3}>
                      <Box>
                        <Box display="flex" alignItems="center" sx={{ gap: 0.5, mb: 0.5 }}>
                          <AccessTime sx={{ fontSize: 16, color: T.textSecondary }} />
                          <Typography variant="caption" sx={{ color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                            Duration
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: T.text }}>
                          {Math.round(results.analytics.duration_minutes || 45)}m
                        </Typography>
                      </Box>
                      <Box>
                        <Box display="flex" alignItems="center" sx={{ gap: 0.5, mb: 0.5 }}>
                          <HelpOutline sx={{ fontSize: 16, color: T.textSecondary }} />
                          <Typography variant="caption" sx={{ color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                            Queries
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: T.text }}>
                          {totalQuestions}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Interview Round Breakdown */}
        <Card sx={{ mb: 4, ...cardBase }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: T.text, mb: 0.5 }}>
              Interview Round Breakdown
            </Typography>
            <Typography variant="body2" sx={{ color: T.textSecondary, mb: 3 }}>
              {totalQuestions} total questions asked across all rounds
            </Typography>
            
            {/* Flow indicator */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: T.surface, borderRadius: '14px', border: `1px solid ${T.borderLight}` }}>
              <Box display="flex" alignItems="center" justifyContent="center" flexWrap="wrap" gap={1}>
                <Chip 
                  icon={<span style={{ marginLeft: 8 }}>👋</span>} 
                  label="Introduction" 
                  size="small" 
                  sx={{ bgcolor: `${T.textMuted}12`, color: T.textSecondary, borderRadius: '8px', fontWeight: 600 }} 
                />
                <Typography sx={{ color: T.borderMedium }}>›</Typography>
                {roundOrder.map((round, index) => {
                  const config = ROUND_CONFIG[round];
                  return (
                    <React.Fragment key={round}>
                      <Chip 
                        icon={<span style={{ marginLeft: 8 }}>{config.icon}</span>} 
                        label={`${config.label} (${questionsPerRound[round] || 0}Q)`} 
                        size="small" 
                        sx={{ bgcolor: config.bgColor, color: config.color, fontWeight: 600, borderRadius: '8px' }} 
                      />
                      {index < roundOrder.length - 1 && <Typography sx={{ color: T.borderMedium }}>›</Typography>}
                    </React.Fragment>
                  );
                })}
                <Typography sx={{ color: T.borderMedium }}>›</Typography>
                <Chip 
                  icon={<CheckCircle sx={{ color: T.success, fontSize: 16, ml: 0.5 }} />} 
                  label="Complete" 
                  size="small" 
                  sx={{ bgcolor: `${T.success}12`, color: T.success, fontWeight: 600, borderRadius: '8px' }} 
                />
              </Box>
            </Paper>

            {/* Round cards */}
            <Grid container spacing={3}>
              {roundOrder.map((round) => {
                const config = ROUND_CONFIG[round];
                const questionCount = questionsPerRound[round] || 0;
                return (
                  <Grid item xs={12} sm={4} key={round}>
                    <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: '14px', border: `1px solid ${T.borderLight}`, background: T.cardBg }}>
                      <Typography variant="h3" gutterBottom>{config.icon}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: config.color, mb: 0.5 }}>
                        {config.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: T.textMuted, display: 'block', mb: 2 }}>
                        {config.duration} minutes allocated
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: T.text, mb: 0.5 }}>
                        {questionCount}
                      </Typography>
                      <Typography variant="body2" sx={{ color: T.textSecondary, mb: 2 }}>
                        questions asked
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((questionCount / config.maxQuestions) * 100, 100)} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3, 
                          bgcolor: `${config.color}15`, 
                          '& .MuiLinearProgress-bar': { bgcolor: config.color, borderRadius: 3 } 
                        }} 
                      />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>

        {/* In-Depth Qualitative Analysis */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <PersonOutline sx={{ fontSize: 18, color: T.textSecondary }} />
            <Typography 
              variant="overline" 
              sx={{ 
                color: T.textMuted, 
                letterSpacing: 2, 
                fontWeight: 700, 
                fontSize: '0.7rem' 
              }}
            >
              IN-DEPTH QUALITATIVE ANALYSIS
            </Typography>
          </Box>

          {roundOrder.map((roundType, roundIndex) => {
            const config = ROUND_DISPLAY_CONFIG[roundType];
            const roundConfig = ROUND_CONFIG[roundType];
            const roundData = results.parsedRounds?.[roundType];
            const questions = roundData?.questions || [];
            const questionCount = questionsPerRound[roundType] || questions.length || 0;
            
            if (questions.length === 0 && !roundData?.rawContent) return null;

            return (
              <Accordion 
                key={roundType}
                defaultExpanded={roundIndex === 0}
                sx={{ 
                  borderRadius: '18px !important',
                  mb: 2,
                  overflow: 'hidden',
                  border: `1px solid ${T.borderLight}`,
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': {
                    margin: '0 0 16px 0',
                    boxShadow: '0 4px 20px rgba(26,82,118,0.08)',
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: T.textSecondary }} />}
                  sx={{
                    px: 3,
                    py: 1,
                    minHeight: '72px',
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0'
                    },
                    '&:hover': {
                      bgcolor: `${T.primary}04`
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box 
                        sx={{ 
                          width: 44, 
                          height: 44, 
                          borderRadius: '12px', 
                          bgcolor: config.bgColor, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        {config.icon}
                      </Box>
                      <Box>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 800, 
                            color: T.text,
                            fontSize: '1rem'
                          }}
                        >
                          {config.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: T.textMuted }}>
                          {questions.length} questions with feedback
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={`${questions.length}Q`}
                      size="small" 
                      sx={{ 
                        bgcolor: config.bgColor, 
                        color: config.color, 
                        fontWeight: 700, 
                        fontSize: '0.75rem',
                        borderRadius: '8px',
                      }} 
                    />
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails sx={{ p: 0 }}>
                  <Divider sx={{ borderColor: T.borderLight }} />
                  <Box sx={{ p: 3, bgcolor: T.cardBg }}>
                    {questions.length > 0 ? (
                      questions.map((item, index) => (
                        <Box key={index} sx={{ mb: index < questions.length - 1 ? 4 : 0 }}>
                          {/* Question Box */}
                          {item.question && (
                            <Box 
                              sx={{ 
                                borderLeft: `3px solid ${config.color}`,
                                bgcolor: config.questionBgColor || T.surface,
                                pl: 2,
                                py: 1.5,
                                mb: 2,
                                borderRadius: '0 10px 10px 0'
                              }}
                            >
                              <Typography 
                                sx={{ 
                                  color: T.textMuted, 
                                  fontWeight: 700, 
                                  textTransform: 'uppercase', 
                                  letterSpacing: 1,
                                  fontSize: '0.7rem',
                                  mb: 0.5
                                }}
                              >
                                Question {index + 1}
                              </Typography>
                              <Typography 
                                sx={{ 
                                  color: T.text, 
                                  fontWeight: 600,
                                  fontSize: '0.9rem'
                                }}
                              >
                                {item.question}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* User Answer */}
                          {item.userAnswer && !item.userAnswer.includes('[SILENT') && item.userAnswer.toLowerCase() !== 'silence' && (
                            <Box sx={{ mb: 2, pl: 2 }}>
                              <Typography 
                                sx={{ 
                                  color: T.textMuted, 
                                  fontWeight: 700, 
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                  mb: 0.5
                                }}
                              >
                                Your Response:
                              </Typography>
                              <Typography 
                                sx={{ 
                                  color: T.textSecondary, 
                                  fontStyle: 'italic',
                                  fontSize: '0.875rem',
                                  lineHeight: 1.6,
                                  pl: 1.5,
                                  borderLeft: `2px solid ${T.borderMedium}`
                                }}
                              >
                                "{item.userAnswer}"
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Feedback */}
                          {item.feedback && (
                            <Box sx={{ pl: 2 }}>
                              <Typography 
                                sx={{ 
                                  color: T.textMuted, 
                                  fontWeight: 700, 
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                  mb: 0.5
                                }}
                              >
                                Feedback:
                              </Typography>
                              <Typography 
                                sx={{ 
                                  color: T.textSecondary, 
                                  lineHeight: 1.8,
                                  fontSize: '0.9rem'
                                }}
                              >
                                {item.feedback}
                              </Typography>
                            </Box>
                          )}
                          
                          {index < questions.length - 1 && (
                            <Divider sx={{ mt: 3, borderColor: T.borderLight }} />
                          )}
                        </Box>
                      ))
                    ) : (
                      <Box>
                        {roundData?.rawContent?.replace(/={3,}/g, '').replace(/-{3,}/g, '').trim().split('\n').map((line, i) => (
                          <Typography 
                            key={i}
                            sx={{ 
                              color: T.textSecondary, 
                              lineHeight: 1.9,
                              fontSize: '0.9rem',
                              mb: 1
                            }}
                          >
                            {line || '\u00A0'}
                          </Typography>
                        )) || (
                          <Typography sx={{ color: T.textMuted, fontStyle: 'italic' }}>
                            No feedback available for this round.
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}

          {/* Fallback: Show full evaluation if no rounds were parsed */}
          {(!results.parsedRounds || Object.values(results.parsedRounds).every(r => r.questions.length === 0 && !r.rawContent)) && results.evaluation && (
            <Card 
              sx={{ 
                ...cardBase, 
                mb: 4,
                '&:hover': {
                  boxShadow: '0 4px 24px rgba(26,82,118,0.10), 0 1px 4px rgba(41,128,185,0.06)',
                }
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    px: 4,
                    py: 3,
                    borderBottom: `1px solid ${T.borderLight}`
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography sx={{ fontSize: '1.75rem' }}>📋</Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 800, 
                        color: T.text,
                        fontSize: '1.1rem'
                      }}
                    >
                      Detailed Evaluation
                    </Typography>
                  </Box>
                  <Chip 
                    label="COMPREHENSIVE FEEDBACK" 
                    size="small" 
                    sx={{ 
                      bgcolor: T.surface, 
                      color: T.textMuted, 
                      fontWeight: 700, 
                      fontSize: '0.6rem',
                      letterSpacing: 1.5,
                      borderRadius: '8px',
                      border: `1px solid ${T.borderLight}`,
                    }} 
                  />
                </Box>
                <Box sx={{ p: 4, bgcolor: T.cardBg }}>
                  {results.evaluation.split('\n').map((line, i) => (
                    <Typography 
                      key={i}
                      sx={{ 
                        color: T.textSecondary, 
                        lineHeight: 1.9, 
                        fontSize: '0.95rem',
                        mb: 2,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      {line || '\u00A0'}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Footer Buttons */}
        <Box display="flex" justifyContent="center" gap={2} mt={4} mb={2}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/student/dashboard')} 
            sx={{ 
              borderRadius: '14px', 
              px: 4, 
              py: 1.5, 
              borderColor: T.borderMedium, 
              color: T.textSecondary, 
              textTransform: 'none', 
              fontWeight: 600,
              '&:hover': {
                borderColor: T.primary,
                backgroundColor: `${T.primary}06`,
              }
            }}
          >
            Return to Dashboard
          </Button>
          <Button 
            variant="contained" 
            onClick={() => navigate('/student/mock-interviews')} 
            sx={{ 
              borderRadius: '14px', 
              px: 4, 
              py: 1.5, 
              background: T.gradientPrimary,
              textTransform: 'none', 
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(26,82,118,0.25)',
              '&:hover': { boxShadow: '0 6px 20px rgba(26,82,118,0.35)' }
            }}
          >
            Initiate New Assessment
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default InterviewResults;