// src/components/student/Results/WeeklyInterviewResults.jsx
// Displays a list of weekly interview evaluation results for the logged-in student.
// Each row shows scores and View/Download buttons for PDF reports.
//
// Backend: weekly_interview_results.py
// Score fields from backend response (scores sub-document):
//   weighted_overall     → overall/composite score  (scores.weighted_overall)
//   technical_score      → technical round score    (scores.technical_score)
//   communication_score  → communication score      (scores.communication_score)
//   hr_questions         → HR round score           (scores.hr_questions)

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Chat as ChatIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  WorkOutline as WorkIcon,
  EmojiPeople as HRIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  getStudentWeeklyInterviewResults,
  getWeeklyInterviewReportViewUrl,
  getWeeklyInterviewReportDownloadUrl,
} from '../../../services/API/results';

// ── Design tokens (identical to DailyStandupResults) ──────────────────────
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
  success: '#0d9488',
  warning: '#f59e0b',
  error: '#ef4444',
};

// ── Score helpers ──────────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score == null) return colors.muted;
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
};

const getScoreLabel = (score) => {
  if (score == null) return 'N/A';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Work';
};

// ── Component ──────────────────────────────────────────────────────────────
const WeeklyInterviewResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  // Track per-row loading by unique rowKey (session_id + globalIndex)
  const [reportLoading, setReportLoading] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const studentId = user?.id || localStorage.getItem('student_id');

  // ── Fetch results ────────────────────────────────────────────────────────
  const fetchResults = async () => {
    if (!studentId) {
      setError('Student ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getStudentWeeklyInterviewResults(studentId);
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to fetch weekly interview results:', err);
      setError(err.message || 'Failed to load weekly interview results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [studentId]);

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredResults = results.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.test_id && r.test_id.toLowerCase().includes(term)) ||
      (r.session_id && r.session_id.toString().toLowerCase().includes(term)) ||
      (r.created_at && r.created_at.toLowerCase().includes(term))
    );
  });

  const paginatedResults = filteredResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ── Report actions ───────────────────────────────────────────────────────

  // View report — opens in new tab
  const handleViewReport = async (sessionId, rowKey) => {
    if (!sessionId || !studentId) return;
    setReportLoading(rowKey);
    try {
      const url = await getWeeklyInterviewReportViewUrl(studentId, sessionId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to get interview report view URL:', err);
      const isNotFound =
        err.message?.toLowerCase().includes('not found') ||
        err.message?.includes('404');
      setSnackbar({
        open: true,
        message: isNotFound
          ? 'Report is not available yet. It may still be generating — please try again later.'
          : err.message || 'Failed to open report. Please try again.',
        severity: 'warning',
      });
    } finally {
      setReportLoading(null);
    }
  };

  // Download report — triggers browser download
  const handleDownloadReport = async (sessionId, rowKey) => {
    if (!sessionId || !studentId) return;
    setReportLoading(rowKey);
    try {
      const url = await getWeeklyInterviewReportDownloadUrl(studentId, sessionId);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to get interview report download URL:', err);
      const isNotFound =
        err.message?.toLowerCase().includes('not found') ||
        err.message?.includes('404');
      setSnackbar({
        open: true,
        message: isNotFound
          ? 'Report is not available yet. It may still be generating — please try again later.'
          : err.message || 'Failed to download report. Please try again.',
        severity: 'warning',
      });
    } finally {
      setReportLoading(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // ── Summary stats (uses weighted_overall — the backend's composite score) ─
  const avgOverall =
    results.length > 0
      ? (
          results.reduce((sum, r) => sum + (r.weighted_overall || 0), 0) /
          results.length
        ).toFixed(1)
      : 0;

  const bestScore =
    results.length > 0
      ? Math.max(...results.map((r) => r.weighted_overall || 0))
      : 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                background: colors.gradientMixed,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(41,128,185,0.3)',
              }}
            >
              <WorkIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: colors.dark }}>
                Weekly Interview Results
              </Typography>
              <Typography variant="body2" sx={{ color: colors.subtle }}>
                View your weekly mock interview evaluation history and download reports
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Summary Cards ───────────────────────────────────────────────── */}
        {!loading && !error && results.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Total Sessions */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: colors.cardShadow,
                background: '#fff',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  mb: 0.5,
                }}
              >
                Total Sessions
              </Typography>
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: colors.dark }}>
                {results.length}
              </Typography>
            </Paper>

            {/* Avg Overall (weighted_overall) */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: colors.cardShadow,
                background: '#fff',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  mb: 0.5,
                }}
              >
                Avg Overall
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: getScoreColor(parseFloat(avgOverall)),
                }}
              >
                {avgOverall}
              </Typography>
            </Paper>

            {/* Best Score */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: colors.cardShadow,
                background: '#fff',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  mb: 0.5,
                }}
              >
                Best Score
              </Typography>
              <Typography
                sx={{ fontSize: '1.75rem', fontWeight: 800, color: colors.success }}
              >
                {bestScore}
              </Typography>
            </Paper>

            {/* Reports Available */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: colors.cardShadow,
                background: '#fff',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  mb: 0.5,
                }}
              >
                Reports Available
              </Typography>
              <Typography
                sx={{ fontSize: '1.75rem', fontWeight: 800, color: colors.primary }}
              >
                {results.filter((r) => r.has_report).length}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* ── Search & Refresh Bar ────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '16px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: colors.cardShadow,
            background: '#fff',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            size="small"
            placeholder="Search by test ID, session ID, or date..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colors.muted, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.875rem' },
            }}
          />

          <Tooltip title="Refresh results">
            <span>
              <IconButton
                onClick={fetchResults}
                disabled={loading}
                sx={{
                  bgcolor: alpha(colors.primary, 0.08),
                  '&:hover': { bgcolor: alpha(colors.primary, 0.15) },
                }}
              >
                <RefreshIcon sx={{ color: colors.primary, fontSize: 20 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Paper>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <CircularProgress sx={{ color: colors.primary, mb: 2 }} />
            <Typography sx={{ color: colors.subtle }}>
              Loading your interview results...
            </Typography>
          </Box>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && !loading && (
          <Alert
            severity="error"
            sx={{ borderRadius: '12px', mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchResults}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* ── Empty State ─────────────────────────────────────────────────── */}
        {!loading && !error && results.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: '18px',
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: colors.cardShadow,
              background: '#fff',
              textAlign: 'center',
            }}
          >
            <WorkIcon
              sx={{ fontSize: 64, color: alpha(colors.primary, 0.2), mb: 2 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.dark, mb: 1 }}>
              No Interview Results Yet
            </Typography>
            <Typography sx={{ color: colors.subtle, mb: 3 }}>
              Complete a weekly mock interview session to see your evaluation results here.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/student/mock-interviews')}
              sx={{
                background: colors.gradientPrimary,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
              }}
            >
              Go to Weekly Interviews
            </Button>
          </Paper>
        )}

        {/* ── Results Table ────────────────────────────────────────────────── */}
        {!loading && !error && filteredResults.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: '18px',
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: colors.cardShadow,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(colors.primary, 0.04) }}>

                    {/* # */}
                    <TableCell
                      sx={{ fontWeight: 700, color: colors.dark, fontSize: '0.8rem', letterSpacing: '0.03em' }}
                    >
                      #
                    </TableCell>

                    {/* Date */}
                    <TableCell sx={{ fontWeight: 700, color: colors.dark, fontSize: '0.8rem' }}>
                      Date
                    </TableCell>

                    {/* Overall — weighted_overall from backend */}
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: colors.dark, fontSize: '0.8rem' }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <TrendingUpIcon sx={{ fontSize: 16 }} />
                        Overall
                      </Box>
                    </TableCell>

                    {/* Technical — technical_score from backend */}
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: colors.dark, fontSize: '0.8rem' }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <PsychologyIcon sx={{ fontSize: 16 }} />
                        Technical
                      </Box>
                    </TableCell>

                    {/* Communication — communication_score from backend */}
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: colors.dark, fontSize: '0.8rem' }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <ChatIcon sx={{ fontSize: 16 }} />
                        Communication
                      </Box>
                    </TableCell>

                    {/* HR — hr_questions from backend */}
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: colors.dark, fontSize: '0.8rem' }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <HRIcon sx={{ fontSize: 16 }} />
                        HR Round
                      </Box>
                    </TableCell>

                    {/* Status */}
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: colors.dark, fontSize: '0.8rem' }}
                    >
                      Status
                    </TableCell>

                    {/* Report */}
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: colors.dark, fontSize: '0.8rem' }}
                    >
                      Report
                    </TableCell>

                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedResults.map((result, index) => {
                    const globalIndex = page * rowsPerPage + index;

                    // Unique key — guards against duplicate session_ids in the DB
                    const rowKey = `${result.session_id || result.test_id || 'row'}_${globalIndex}`;
                    const isReportLoading = reportLoading === rowKey;

                    // weighted_overall is the primary score shown as the "overall"
                    const overallScore = result.weighted_overall;

                    return (
                      <TableRow
                        key={rowKey}
                        hover
                        sx={{
                          '&:hover': { bgcolor: alpha(colors.primary, 0.02) },
                          '&:last-child td': { borderBottom: 0 },
                        }}
                      >
                        {/* Row number */}
                        <TableCell>
                          <Typography
                            sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.muted }}
                          >
                            {globalIndex + 1}
                          </Typography>
                        </TableCell>

                        {/* Date + session hint */}
                        <TableCell>
                          <Typography
                            sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.dark }}
                          >
                            {formatDate(result.created_at)}
                          </Typography>
                          {result.session_id && (
                            <Typography sx={{ fontSize: '0.7rem', color: colors.muted }}>
                              Session:{' '}
                              {result.session_id.toString().slice(0, 12)}
                              {result.session_id.toString().length > 12 ? '...' : ''}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Overall (weighted_overall) */}
                        <TableCell align="center">
                          <Chip
                            label={overallScore != null ? `${overallScore}` : 'N/A'}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              bgcolor: alpha(getScoreColor(overallScore), 0.1),
                              color: getScoreColor(overallScore),
                              border: `1px solid ${alpha(getScoreColor(overallScore), 0.25)}`,
                              minWidth: 50,
                            }}
                          />
                        </TableCell>

                        {/* Technical (technical_score) */}
                        <TableCell align="center">
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: getScoreColor(result.technical_score),
                            }}
                          >
                            {result.technical_score != null ? result.technical_score : '—'}
                          </Typography>
                        </TableCell>

                        {/* Communication (communication_score) */}
                        <TableCell align="center">
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: getScoreColor(result.communication_score),
                            }}
                          >
                            {result.communication_score != null
                              ? result.communication_score
                              : '—'}
                          </Typography>
                        </TableCell>

                        {/* HR Round (hr_questions) */}
                        <TableCell align="center">
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: getScoreColor(result.hr_questions),
                            }}
                          >
                            {result.hr_questions != null ? result.hr_questions : '—'}
                          </Typography>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell align="center">
                          <Chip
                            label={getScoreLabel(overallScore)}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.72rem',
                              bgcolor: alpha(getScoreColor(overallScore), 0.08),
                              color: getScoreColor(overallScore),
                              borderRadius: '8px',
                            }}
                          />
                        </TableCell>

                        {/* Report buttons */}
                        <TableCell align="center">
                          {result.has_report && result.session_id ? (
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              gap={0.5}
                            >
                              {isReportLoading ? (
                                <CircularProgress size={20} sx={{ color: colors.primary }} />
                              ) : (
                                <>
                                  <Tooltip title="View Report">
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleViewReport(result.session_id, rowKey)
                                        }
                                        sx={{
                                          color: colors.primary,
                                          bgcolor: alpha(colors.primary, 0.08),
                                          '&:hover': { bgcolor: alpha(colors.primary, 0.15) },
                                        }}
                                      >
                                        <ViewIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Download Report">
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleDownloadReport(result.session_id, rowKey)
                                        }
                                        sx={{
                                          color: colors.teal,
                                          bgcolor: alpha(colors.teal, 0.08),
                                          '&:hover': { bgcolor: alpha(colors.teal, 0.15) },
                                        }}
                                      >
                                        <DownloadIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          ) : (
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                color: colors.muted,
                                fontStyle: 'italic',
                              }}
                            >
                              No report
                            </Typography>
                          )}
                        </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={filteredResults.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{
                borderTop: `1px solid ${colors.cardBorder}`,
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.8rem',
                  color: colors.subtle,
                },
              }}
            />
          </Paper>
        )}

        {/* ── No search match ──────────────────────────────────────────────── */}
        {!loading && !error && results.length > 0 && filteredResults.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '16px',
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: colors.cardShadow,
              background: '#fff',
              textAlign: 'center',
            }}
          >
            <SearchIcon sx={{ fontSize: 48, color: alpha(colors.muted, 0.4), mb: 1 }} />
            <Typography sx={{ color: colors.subtle }}>
              No results match your search "{searchTerm}"
            </Typography>
          </Paper>
        )}

      </Box>

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WeeklyInterviewResults;