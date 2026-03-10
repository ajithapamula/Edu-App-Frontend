// src/components/student/MockTest/MockTestResults.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Code as CodeIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Download as DownloadIcon,
  Calculate as CalculateIcon,
  MenuBook as MenuBookIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { mockTestAPI } from '../../../services/API/studentmocktest';

// Dashboard color tokens
const colors = {
  primary: '#2980b9',
  primaryDark: '#1a5276',
  teal: '#0d9488',
  tealLight: '#5eead4',
  dark: '#0f172a',
  subtle: '#64748b',
  muted: '#94a3b8',
  bg: '#f0f4f8',
  cardBorder: 'rgba(41,128,185,0.08)',
  cardShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
  gradientPrimary: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
  gradientTeal: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)',
  gradientMixed: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)',
  accent: '#e65100',
  success: '#0d9488',
  warning: '#f59e0b',
  error: '#ef4444',
  indigo: '#2980b9'
};

// Section configurations
const SECTION_CONFIG = {
  aptitude: {
    name: 'Aptitude',
    icon: CalculateIcon,
    color: colors.primary,
    description: 'Logical reasoning & problem solving'
  },
  mcq: {
    name: 'Theory',
    icon: MenuBookIcon,
    color: colors.teal,
    description: 'Conceptual understanding'
  },
  theory: {
    name: 'Theory',
    icon: MenuBookIcon,
    color: colors.teal,
    description: 'Conceptual understanding'
  },
  coding: {
    name: 'Coding',
    icon: CodeIcon,
    color: colors.accent,
    description: 'Programming challenges'
  }
};

const MockTestResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const navigationState = location.state || {};
  const passedResults = navigationState.results;
  const testType = navigationState.testType || 'developer';
  const testData = navigationState.testData;

  const [results, setResults] = useState(passedResults);
  const [loading, setLoading] = useState(!passedResults);
  const [error, setError] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSection, setExpandedSection] = useState('');

  const testId = results?.testId || results?.test_id || testData?.testId;

  // Browser back navigation prevention
  useEffect(() => {
    window.history.replaceState({ page: 'results' }, '', window.location.href);
    window.history.pushState({ page: 'results-guard' }, '', window.location.href);

    const handlePopState = (event) => {
      navigate('/student/mock-tests', { replace: true });
      console.log(event)
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, testId]);

  // Fetch results if not passed
  useEffect(() => {
    const fetchResults = async () => {
      if (passedResults || !testId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiResults = await mockTestAPI.getTestResults(testId);
        if (apiResults) {
          setResults(apiResults);
        } else {
          throw new Error('No results data received');
        }
      } catch (error) {
        console.error('Failed to fetch results:', error);
        setError(`Failed to load results: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [testId, passedResults]);

  const handleDownloadPDF = async () => {
    if (!testId) {
      setPdfError('Test ID not found.');
      return;
    }

    try {
      setDownloadingPDF(true);
      setPdfError('');
      
      const pdfBlob = await mockTestAPI.downloadResultsPDF(testId);
      
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mock_test_results_${testId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      setPdfError('PDF generation failed. Please try again later.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleBackToMockTests = () => {
    navigate('/student/mock-tests', { replace: true });
  };

  const handleTakeAnotherTest = () => {
    navigate('/student/mock-tests/start', { replace: true });
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: colors.bg,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            background: colors.gradientMixed,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AssignmentIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Typography sx={{ color: colors.subtle }}>Loading test results...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 8 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>{error}</Alert>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={handleBackToMockTests}
              sx={{
                background: colors.gradientPrimary,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4
              }}
            >
              Go to Mock Tests
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  if (!results) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h6" sx={{ mb: 2, color: colors.subtle }}>
            No test results found.
          </Typography>
          <Button
            variant="contained"
            onClick={handleBackToMockTests}
            sx={{
              background: colors.gradientPrimary,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 4
            }}
          >
            Go to Mock Tests
          </Button>
        </Container>
      </Box>
    );
  }

  // Helper functions
  const getScoreColor = (percentage) => {
    if (percentage >= 70) return colors.success;
    if (percentage >= 40) return colors.warning;
    return colors.error;
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Needs Improvement';
  };

  const formatTimeWithLabels = (seconds) => {
    if (!seconds || seconds < 0) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  };

  const isCodeContent = (text) => {
    if (!text) return false;
    const codeIndicators = [
      'def ', 'class ', 'import ', 'from ', 'return ',
      'print(', 'if ', 'for ', 'while ', 'try:', 'except',
      '= ', '==', '!=', '>=', '<=', '+=', '-=',
      'function', 'const ', 'let ', 'var ',
      '=>', '()', '{}', '[]'
    ];
    return codeIndicators.some(indicator => text.includes(indicator));
  };

  // Extract data
  const score = results.score ?? 0;
  const totalQuestions = results.totalQuestions || results.total_questions || 25;
  const percentage = results.scorePercentage || results.score_percentage || 
                     (totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0);
  const analytics = results.analytics || results.detailed_feedback || '';
  const sectionScores = results.sectionScores || results.section_scores || {};
  const sectionDetails = results.sectionDetails || results.section_details || {};
  const timestamp = results.timestamp || Date.now();
  const timeUsed = results.timeUsed || results.time_used || 0;

  // Render individual question detail inside section accordion
  const renderQuestionDetail = (question, index, sectionKey) => {
    const isCorrect = question.is_correct || question.correct;
    const userAnswer = question.user_answer || question.answer || 'No answer';
    const correctAnswer = question.correct_answer || 'N/A';
    const explanation = question.explanation || question.feedback || '';
    const questionText = question.question || '';
    
    const isCodingSection = sectionKey === 'coding';
    const isCodeAnswer = isCodingSection || isCodeContent(correctAnswer) || isCodeContent(userAnswer);

    return (
      <Paper
        key={index}
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: '14px',
          border: `1px solid ${isCorrect ? alpha(colors.success, 0.25) : alpha(colors.error, 0.25)}`,
          bgcolor: isCorrect ? alpha(colors.success, 0.03) : alpha(colors.error, 0.03)
        }}
      >
        {/* Question Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {isCorrect ? (
            <CheckCircleIcon sx={{ color: colors.success, fontSize: 20 }} />
          ) : (
            <CancelIcon sx={{ color: colors.error, fontSize: 20 }} />
          )}
          <Typography sx={{ fontWeight: 600, color: colors.dark }}>
            Q{question.question_number || index + 1}. {isCorrect ? 'Correct' : 'Incorrect'}
          </Typography>
          {isCodingSection && (
            <Chip 
              label="Coding" 
              size="small" 
              icon={<CodeIcon sx={{ fontSize: 14 }} />}
              sx={{
                ml: 'auto',
                bgcolor: alpha(colors.accent, 0.08),
                color: colors.accent,
                fontSize: '0.7rem',
                border: `1px solid ${alpha(colors.accent, 0.2)}`
              }} 
            />
          )}
        </Box>

        {/* Question Text */}
        <Box sx={{
          p: 2,
          bgcolor: '#fff',
          borderRadius: '10px',
          mb: 2,
          border: `1px solid ${colors.cardBorder}`
        }}>
          <Typography 
            variant="body2" 
            sx={{ color: colors.subtle, lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ 
              __html: questionText.length > 500 ? questionText.substring(0, 500) + '...' : questionText 
            }}
          />
        </Box>

        {/* Answer Comparison */}
      <Grid container spacing={4} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
            <Box sx={{
              p: 2,
              bgcolor: isCorrect ? alpha(colors.success, 0.06) : alpha(colors.error, 0.06),
              borderRadius: '10px'
            }}>
              <Typography sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: colors.muted,
                mb: 0.5,
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}>
                Your Answer:
              </Typography>
              {isCodeAnswer ? (
                <Box
                  component="pre"
                  sx={{
                    m: 0, p: 1,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: isCorrect ? '#166534' : '#dc2626',
                    overflow: 'hidden'
                  }}
                >
                  {userAnswer || 'No answer provided'}
                </Box>
              ) : (
                <Typography sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isCorrect ? '#166534' : '#dc2626'
                }}>
                  {userAnswer || 'No answer provided'}
                </Typography>
              )}
            </Box>
          </Grid>

         <Grid item xs={6}>
            <Box sx={{
              p: 2,
              bgcolor: alpha(colors.success, 0.06),
              borderRadius: '10px'
            }}>
              <Typography sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: colors.muted,
                mb: 0.5,
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}>
                Correct Answer:
              </Typography>
              {isCodeAnswer ? (
                <Box
                  component="pre"
                  sx={{
                    m: 0, p: 1,
                    bgcolor: colors.primaryDark,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: colors.tealLight,
                    overflow: 'hidden',
                   
                    lineHeight: 1.5
                  }}
                >
                  {correctAnswer}
                </Box>
              ) : (
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#166534' }}>
                  {correctAnswer}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* AI Explanation */}
        {explanation && (
          <Box sx={{
            p: 2,
            bgcolor: alpha(colors.warning, 0.06),
            borderRadius: '10px',
            border: `1px solid ${alpha(colors.warning, 0.2)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <LightbulbIcon sx={{ color: colors.warning, fontSize: 16 }} />
              <Typography sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#92400e',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}>
                AI Explanation:
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.875rem', color: '#78716c', fontStyle: 'italic' }}>
              {explanation}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  // Render section accordion with all questions inside
  const renderSectionDetails = (sectionKey, sectionData) => {
    const config = SECTION_CONFIG[sectionKey] || SECTION_CONFIG.mcq;
    const IconComponent = config.icon;
    const questions = sectionData?.questions || [];
    const sectionScore = sectionData?.score || {};
    
    const correct = sectionScore.correct || 0;
    const total = sectionScore.total || questions.length;
    const sectionPct = sectionScore.percentage || (total > 0 ? Math.round((correct / total) * 100) : 0);

    return (
      <Accordion 
        key={sectionKey}
        expanded={expandedSection === sectionKey}
        onChange={() => setExpandedSection(expandedSection === sectionKey ? '' : sectionKey)}
        elevation={0}
        sx={{ 
          mb: 2, 
          '&:before': { display: 'none' },
          borderRadius: '14px !important',
          overflow: 'hidden',
          border: `1px solid ${colors.cardBorder}`
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: colors.muted }} />}
          sx={{ 
            bgcolor: alpha(config.color, 0.03),
            '&:hover': { bgcolor: alpha(config.color, 0.06) },
            minHeight: 64
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(config.color, 0.1),
                color: config.color
              }}
            >
              <IconComponent />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600, color: colors.dark }}>
                {config.name} Section
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.muted }}>
                {config.description}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`${correct}/${total}`}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: alpha(config.color, 0.08),
                  color: colors.dark,
                  border: `1px solid ${alpha(config.color, 0.15)}`
                }}
              />
              <Chip 
                label={`${sectionPct}%`}
                size="small"
                sx={{ 
                  fontWeight: 600,
                  bgcolor: alpha(getScoreColor(sectionPct), 0.08),
                  color: getScoreColor(sectionPct),
                  border: `1px solid ${alpha(getScoreColor(sectionPct), 0.2)}`
                }}
              />
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2, bgcolor: 'white' }}>
          {questions.length > 0 ? (
            questions.map((q, idx) => renderQuestionDetail(q, idx, sectionKey))
          ) : (
            <Typography sx={{ color: colors.muted, textAlign: 'center', py: 2 }}>
              No detailed questions available for this section.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 3 }}>
      <Container maxWidth="lg">
        {/* Header Card */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
            borderRadius: '22px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: colors.cardShadow,
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
            background: '#fff'
          }}
        >
          {/* Subtle icon */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.06 }}>
            <PsychologyIcon sx={{ fontSize: 100, color: colors.primary }} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            Test Completed!
          </Typography>
          <Typography sx={{ color: colors.subtle, mb: 2 }}>
            {testType === 'developer' ? 'Developer' : 'Non-Developer'} Assessment Results
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: colors.primary, ml: 1 }} />}
              label={new Date(timestamp).toLocaleDateString()}
              sx={{
                bgcolor: alpha(colors.primary, 0.06),
                border: `1px solid ${colors.cardBorder}`,
                fontSize: '0.8rem',
                fontWeight: 500
              }}
            />
            {testId && (
              <Chip
                size="small"
                label={`ID: ${testId.slice(0, 8)}...`}
                sx={{
                  bgcolor: alpha(colors.primary, 0.06),
                  border: `1px solid ${colors.cardBorder}`,
                  fontSize: '0.8rem'
                }}
              />
            )}
            {timeUsed > 0 && (
              <Chip
                size="small"
                icon={<TimerIcon sx={{ fontSize: 16 }} />}
                label={formatTimeWithLabels(timeUsed)}
                sx={{
                  bgcolor: alpha(colors.primary, 0.06),
                  border: `1px solid ${colors.cardBorder}`,
                  fontSize: '0.8rem'
                }}
              />
            )}
          </Box>
        </Paper>

        {/* PDF Error */}
        {pdfError && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setPdfError('')}>
            {pdfError}
          </Alert>
        )}

        {/* Score Cards Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Overall Score */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '18px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: colors.cardShadow,
                height: '100%',
                background: '#fff'
              }}
            >
              <Typography sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: colors.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                mb: 3,
                textAlign: 'center'
              }}>
                Overall Score
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Donut Chart */}
                <Box sx={{ position: 'relative', width: 140, height: 140, mb: 2 }}>
                  <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="70" cy="70" r="55"
                      fill="none"
                      stroke={alpha(colors.primary, 0.1)}
                      strokeWidth="12"
                    />
                    <circle
                      cx="70" cy="70" r="55" fill="none"
                      stroke={getScoreColor(percentage)}
                      strokeWidth="12"
                      strokeDasharray={345}
                      strokeDashoffset={345 - (345 * percentage) / 100}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography sx={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: getScoreColor(percentage),
                      lineHeight: 1
                    }}>
                      {percentage}%
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: colors.muted, fontWeight: 500 }}>
                      {score} / {totalQuestions}
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label={getPerformanceLevel(percentage)}
                  sx={{
                    fontWeight: 600,
                    bgcolor: alpha(getScoreColor(percentage), 0.08),
                    color: getScoreColor(percentage),
                    border: `1px solid ${alpha(getScoreColor(percentage), 0.2)}`
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Section Performance */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '18px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: colors.cardShadow,
                height: '100%',
                background: '#fff'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: colors.gradientPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AssignmentIcon sx={{ color: '#fff', fontSize: 16 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, color: colors.dark }}>
                  Section Performance
                </Typography>
              </Box>

              {Object.keys(sectionScores).length > 0 ? (
                <Grid container spacing={2}>
                  
                      {Object.entries(sectionScores).map(([sectionKey, data]) => {
  const config = SECTION_CONFIG[sectionKey] || SECTION_CONFIG.mcq;
  const correct = data?.correct || 0;
  const total = data?.total || 0;
  const sectionPct = data?.percentage || 0;
  const IconComponent = config.icon;
  
  // Calculate grid size based on number of sections
  const sectionCount = Object.keys(sectionScores).length;
  const gridSize = sectionCount === 2 ? 6 : sectionCount === 1 ? 12 : 4;

  return (
    <Grid item xs={12} sm={gridSize} key={sectionKey}>
      <Box sx={{
        p: 2,
        bgcolor: alpha(config.color, 0.03),
        borderRadius: '14px',
        border: `1px solid ${alpha(config.color, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <IconComponent sx={{ fontSize: 18, color: config.color }} />
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: config.color }}>
            {config.name}
          </Typography>
        </Box>

        <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: colors.dark, mb: 0.5 }}>
          {correct}<span style={{ fontSize: '1rem', fontWeight: 500, color: colors.muted }}>/{total}</span>
        </Typography>

        <Box sx={{ width: '100%', height: 4, bgcolor: alpha(config.color, 0.1), borderRadius: 2, mb: 1 }}>
          <Box sx={{
            width: `${sectionPct}%`,
            height: '100%',
            bgcolor: config.color,
            borderRadius: 2,
            transition: 'width 0.5s'
          }} />
        </Box>

        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: getScoreColor(sectionPct) }}>
          {sectionPct}%
        </Typography>
      </Box>
    </Grid>
  );
})}
                       
                </Grid>
              ) : (
                <Typography sx={{ color: colors.muted, textAlign: 'center' }}>
                  Section scores not available.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '18px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: colors.cardShadow,
            overflow: 'hidden',
            mb: 3,
            background: '#fff'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{
              borderBottom: `1px solid ${colors.cardBorder}`,
              '& .MuiTabs-indicator': { bgcolor: colors.primary, height: 2 },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                color: colors.subtle,
                '&.Mui-selected': { color: colors.primary, fontWeight: 600 }
              }
            }}
          >
            <Tab label="Question Review" sx={{ flex: 1 }} />
            <Tab label="Detailed Report" sx={{ flex: 1 }} />
          </Tabs>

          <Box sx={{ p: 3, bgcolor: 'white' }}>
            {activeTab === 0 && (
              <Box>
                {Object.keys(sectionDetails).length > 0 ? (
                  // Section-based accordions
                  Object.entries(sectionDetails).map(([sectionKey, sectionData]) => 
                    renderSectionDetails(sectionKey, sectionData)
                  )
                ) : results.raw?.conversation_pairs ? (
                  // Fallback: group by section
                  <Box>
                    {['aptitude', 'mcq', 'coding'].map(sectionKey => {
                      const questions = results.raw.conversation_pairs.filter(
                        q => q.question_type === sectionKey
                      );
                      if (questions.length === 0) return null;
                      
                      const correct = questions.filter(q => q.correct).length;
                      
                      return renderSectionDetails(sectionKey, {
                        score: { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) },
                        questions: questions.map(q => ({
                          question_number: q.question_number,
                          question: q.question,
                          user_answer: q.answer,
                          correct_answer: q.correct_answer,
                          is_correct: q.correct,
                          explanation: q.feedback
                        }))
                      });
                    })}
                  </Box>
                ) : (
                  <Typography sx={{ color: colors.muted, textAlign: 'center', py: 4 }}>
                    Detailed question review not available. Download PDF for full results.
                  </Typography>
                )}
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      background: colors.gradientPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <TrendingUpIcon sx={{ color: '#fff', fontSize: 16 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: colors.dark }}>
                    Evaluation Report
                  </Typography>
                </Box>

                {analytics ? (
                  <Box sx={{
                    p: 3,
                    bgcolor: alpha(colors.primary, 0.03),
                    borderRadius: '14px',
                    border: `1px solid ${colors.cardBorder}`,
                    maxHeight: 400,
                    overflow: 'auto'
                  }}>
                    <Typography component="pre" sx={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.875rem',
                      color: colors.subtle,
                      lineHeight: 1.7,
                      m: 0,
                      fontFamily: 'inherit'
                    }}>
                      {analytics}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ color: colors.muted, textAlign: 'center', py: 4 }}>
                    Detailed report not available. Download PDF for full evaluation.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          {testId && (
            <Button
              variant="outlined"
              startIcon={downloadingPDF ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: '12px',
                borderColor: colors.cardBorder,
                color: colors.dark,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: alpha(colors.primary, 0.04),
                  borderColor: alpha(colors.primary, 0.3)
                }
              }}
            >
              {downloadingPDF ? 'Downloading...' : 'Download PDF Report'}
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleTakeAnotherTest}
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: '12px',
              borderColor: colors.cardBorder,
              color: colors.dark,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: alpha(colors.primary, 0.04),
                borderColor: alpha(colors.primary, 0.3)
              }
            }}
          >
            Retake Test
          </Button>

          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={handleBackToMockTests}
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: '12px',
              background: colors.gradientPrimary,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(41,128,185,0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #153d6b 0%, #2471a3 100%)',
                boxShadow: '0 6px 18px rgba(41,128,185,0.35)'
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default MockTestResults;