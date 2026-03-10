// src/components/student/Results/DailyStandupResults.jsx
// Displays a list of daily standup evaluation results for the logged-in student
// Each row shows scores and View/Download buttons for PDF reports

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
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  RecordVoiceOver as VoiceIcon,
  Psychology as PsychologyIcon,
  Chat as ChatIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  getStudentStandupResults,
  getStandupReportViewUrl,
  getStandupReportDownloadUrl,
} from '../../../services/API/results';

// Dashboard color tokens (matching your existing design system)
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

const DailyStandupResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  // FIX: Track loading by unique row key (session_id + index) instead of session_id alone
  // to handle duplicate session_ids gracefully
  const [reportLoading, setReportLoading] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const studentId = user?.id || localStorage.getItem('student_id');

  const fetchResults = async () => {
    if (!studentId) {
      setError('Student ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getStudentStandupResults(studentId);
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to fetch standup results:', err);
      setError(err.message || 'Failed to load daily standup results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [studentId]);

  // Filter results by search term
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

  // View Report - calls backend to get presigned S3 URL, opens in new tab
  const handleViewReport = async (sessionId, rowKey) => {
    if (!sessionId || !studentId) return;

    setReportLoading(rowKey);
    try {
      const url = await getStandupReportViewUrl(studentId, sessionId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to get report view URL:', err);
      // FIX: Provide a clearer, user-friendly message for 404 "Report not found"
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

  // Download Report - calls backend to get presigned S3 URL with download disposition
  const handleDownloadReport = async (sessionId, rowKey) => {
    if (!sessionId || !studentId) return;

    setReportLoading(rowKey);
    try {
      const url = await getStandupReportDownloadUrl(studentId, sessionId);
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to get report download URL:', err);
      // FIX: Provide a clearer, user-friendly message for 404 "Report not found"
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

  // Calculate summary stats
  const avgOverall =
    results.length > 0
      ? (results.reduce((sum, r) => sum + (r.overall_score || 0), 0) / results.length).toFixed(1)
      : 0;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        {/* Header */}
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
              <VoiceIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: colors.dark }}
              >
                Daily Standup Results
              </Typography>
              <Typography variant="body2" sx={{ color: colors.subtle }}>
                View your standup evaluation history and download reports
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Summary Cards */}
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
              <Typography
                sx={{ fontSize: '1.75rem', fontWeight: 800, color: colors.dark }}
              >
                {results.length}
              </Typography>
            </Paper>

            {/* Avg Overall Score */}
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
                sx={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: colors.success,
                }}
              >
                {Math.max(...results.map((r) => r.overall_score || 0))}
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
                sx={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: colors.primary,
                }}
              >
                {results.filter((r) => r.has_report).length}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Search & Actions Bar */}
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
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                fontSize: '0.875rem',
              },
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

        {/* Loading State */}
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
              Loading your standup results...
            </Typography>
          </Box>
        )}

        {/* Error State */}
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

        {/* Empty State */}
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
            <VoiceIcon
              sx={{ fontSize: 64, color: alpha(colors.primary, 0.2), mb: 2 }}
            />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: colors.dark, mb: 1 }}
            >
              No Standup Results Yet
            </Typography>
            <Typography sx={{ color: colors.subtle, mb: 3 }}>
              Complete a daily standup session to see your evaluation results here.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/student/daily-standups')}
              sx={{
                background: colors.gradientPrimary,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
              }}
            >
              Go to Daily Standups
            </Button>
          </Paper>
        )}

        {/* Results Table */}
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
                  <TableRow
                    sx={{
                      bgcolor: alpha(colors.primary, 0.04),
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: colors.dark,
                        fontSize: '0.8rem',
                        letterSpacing: '0.03em',
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: colors.dark,
                        fontSize: '0.8rem',
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: colors.dark,
                        fontSize: '0.8rem',
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <TrendingUpIcon sx={{ fontSize: 16 }} />
                        Overall
                      </Box>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: colors.dark,
                        fontSize: '0.8rem',
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <PsychologyIcon sx={{ fontSize: 16 }} />
                        Technical
                      </Box>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: colors.dark,
                        fontSize: '0.8rem',
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <ChatIcon sx={{ fontSize: 16 }} />
                        Communication
                      </Box>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: colors.dark,
                        fontSize: '0.8rem',
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <VoiceIcon sx={{ fontSize: 16 }} />
                        Attentiveness
                      </Box>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: colors.dark,
                        fontSize: '0.8rem',
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: colors.dark,
                        fontSize: '0.8rem',
                      }}
                    >
                      Report
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedResults.map((result, index) => {
                    const overallScore = result.overall_score;
                    const globalIndex = page * rowsPerPage + index;

                    // FIX: Build a truly unique row key by combining session_id (or test_id)
                    // with the absolute index — this prevents duplicate key warnings even
                    // when the backend returns repeated session_ids.
                    const rowKey = `${result.session_id || result.test_id || 'row'}_${globalIndex}`;

                    const isReportLoading = reportLoading === rowKey;

                    return (
                      <TableRow
                        // FIX: Use rowKey instead of session_id alone
                        key={rowKey}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(colors.primary, 0.02),
                          },
                          '&:last-child td': { borderBottom: 0 },
                        }}
                      >
                        {/* Row Number */}
                        <TableCell>
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: colors.muted,
                            }}
                          >
                            {globalIndex + 1}
                          </Typography>
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: colors.dark,
                            }}
                          >
                            {formatDate(result.created_at)}
                          </Typography>
                          {result.session_id && (
                            <Typography
                              sx={{
                                fontSize: '0.7rem',
                                color: colors.muted,
                              }}
                            >
                              Session: {result.session_id.toString().slice(0, 12)}
                              {result.session_id.toString().length > 12 ? '...' : ''}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Overall Score */}
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

                        {/* Technical Score */}
                        <TableCell align="center">
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: getScoreColor(result.technical_score),
                            }}
                          >
                            {result.technical_score != null
                              ? result.technical_score
                              : '—'}
                          </Typography>
                        </TableCell>

                        {/* Communication Score */}
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

                        {/* Attentiveness Score */}
                        <TableCell align="center">
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: getScoreColor(result.attentiveness_score),
                            }}
                          >
                            {result.attentiveness_score != null
                              ? result.attentiveness_score
                              : '—'}
                          </Typography>
                        </TableCell>

                        {/* Status */}
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

                        {/* Report Buttons */}
                        <TableCell align="center">
                          {result.has_report && result.session_id ? (
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                              {isReportLoading ? (
                                <CircularProgress size={20} sx={{ color: colors.primary }} />
                              ) : (
                                <>
                                  <Tooltip title="View Report">
                                    <span>
                                      <IconButton
                                        size="small"
                                        // FIX: Pass rowKey so each row tracks its own loading state
                                        onClick={() => handleViewReport(result.session_id, rowKey)}
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
                                        // FIX: Pass rowKey so each row tracks its own loading state
                                        onClick={() => handleDownloadReport(result.session_id, rowKey)}
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
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{
                borderTop: `1px solid ${colors.cardBorder}`,
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':
                  {
                    fontSize: '0.8rem',
                    color: colors.subtle,
                  },
              }}
            />
          </Paper>
        )}

        {/* No search results */}
        {!loading &&
          !error &&
          results.length > 0 &&
          filteredResults.length === 0 && (
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
              <SearchIcon
                sx={{ fontSize: 48, color: alpha(colors.muted, 0.4), mb: 1 }}
              />
              <Typography sx={{ color: colors.subtle }}>
                No results match your search "{searchTerm}"
              </Typography>
            </Paper>
          )}
      </Box>

      {/* Snackbar for errors */}
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

export default DailyStandupResults;