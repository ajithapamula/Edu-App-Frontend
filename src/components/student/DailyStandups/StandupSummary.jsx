import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Grid,
  Fade,
  useTheme,
  alpha,
  IconButton
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Schedule,
  Block,
  ArrowBack,
  Download,
  Share,
  Print
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Import the standup API
import { standupCallAPI } from '../../../services/API/studentstandup';

const StandupSummary = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  const [summary, setSummary] = useState(location.state?.summary || null);
  const [loading, setLoading] = useState(!summary);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!summary && testId) {
      fetchSummary();
    }
  }, [testId, summary]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const summaryData = await standupCallAPI.getStandupSummary(testId);
      setSummary(summaryData);
      
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/student/daily-standups');
  };

  const handleStartNewStandup = () => {
    navigate('/student/daily-standups');
  };

  const handleDownload = () => {
    // Create a downloadable summary
    const summaryText = generateSummaryText();
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `standup-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateSummaryText = () => {
    if (!summary) return '';
    
    const date = new Date().toLocaleDateString();
    return `
Daily Standup Summary - ${date}
=====================================

Yesterday's Accomplishments:
${summary.yesterday || summary.accomplishments || 'Not provided'}

Today's Plans:
${summary.today || summary.plans || 'Not provided'}

Blockers/Challenges:
${summary.blockers || summary.challenges || 'None mentioned'}

Additional Notes:
${summary.notes || summary.additional_info || 'None'}

Session ID: ${testId}
Generated: ${new Date().toLocaleString()}
    `.trim();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Loading summary...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading summary
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={handleGoBack} sx={{ mt: 2, background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)' }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Fade in={true}>
      <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
        {/* Header */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={4}
          sx={{
            background: '#fff',
            p: 3,
            borderRadius: '18px',
            border: '1px solid rgba(13,148,136,0.10)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={handleGoBack} sx={{ mr: 1, color: '#1a5276' }}>
              <ArrowBack />
            </IconButton>
            <Avatar 
              sx={{ 
                background: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)',
                width: 48,
                height: 48,
                boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
              }}
            >
              <Assignment />
            </Avatar>
            <Box>
              <Typography 
                variant="h5" 
                component="h1"
                sx={{
                  background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold'
                }}
              >
                Standup Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date().toLocaleDateString()} • Session ID: {testId}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label="Completed"
              sx={{
                bgcolor: 'rgba(13,148,136,0.10)',
                color: '#0d9488',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
              icon={<CheckCircle sx={{ color: '#0d9488 !important' }} />}
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownload}
            sx={{
              borderColor: 'rgba(41,128,185,0.25)',
              color: '#2980b9',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
            }}
          >
            Download
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
            sx={{
              borderColor: 'rgba(41,128,185,0.25)',
              color: '#2980b9',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
            }}
          >
            Print
          </Button>
          <Button
            variant="contained"
            onClick={handleStartNewStandup}
            sx={{
              ml: 'auto',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(41,128,185,0.25)',
              '&:hover': { boxShadow: '0 6px 18px rgba(41,128,185,0.35)' },
            }}
          >
            Start New Standup
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Yesterday's Accomplishments */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{
                borderRadius: '18px',
                background: '#fff',
                border: '1px solid rgba(13,148,136,0.10)',
                boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 24px rgba(26,82,118,0.10)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Box sx={{ height: '3px', background: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)' }} />
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)', width: 40, height: 40 }}>
                    <CheckCircle />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: '#0d9488', fontWeight: 700 }}>
                    Yesterday's Accomplishments
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#475569' }}>
                  {summary?.yesterday || summary?.accomplishments || 'No accomplishments recorded'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Today's Plans */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{
                borderRadius: '18px',
                background: '#fff',
                border: '1px solid rgba(41,128,185,0.10)',
                boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 24px rgba(26,82,118,0.10)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Box sx={{ height: '3px', background: 'linear-gradient(135deg, #2980b9 0%, #3498c8 100%)' }} />
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #2980b9 0%, #3498c8 100%)', width: 40, height: 40 }}>
                    <Schedule />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: '#2980b9', fontWeight: 700 }}>
                    Today's Plans
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#475569' }}>
                  {summary?.today || summary?.plans || 'No plans recorded'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Blockers/Challenges */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{
                borderRadius: '18px',
                background: '#fff',
                border: '1px solid rgba(245,158,11,0.15)',
                boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 24px rgba(26,82,118,0.10)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Box sx={{ height: '3px', background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }} />
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', width: 40, height: 40 }}>
                    <Block />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                    Blockers & Challenges
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#475569' }}>
                  {summary?.blockers || summary?.challenges || 'No blockers mentioned'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Notes */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{
                borderRadius: '18px',
                background: '#fff',
                border: '1px solid rgba(41,128,185,0.10)',
                boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 24px rgba(26,82,118,0.10)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Box sx={{ height: '3px', background: 'linear-gradient(135deg, #3498c8 0%, #2db5a0 100%)' }} />
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #3498c8 0%, #2db5a0 100%)', width: 40, height: 40 }}>
                    <Assignment />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: '#3498c8', fontWeight: 700 }}>
                    Additional Notes
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#475569' }}>
                  {summary?.notes || summary?.additional_info || 'No additional notes'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Session Details */}
        <Paper 
          sx={{ 
            mt: 4, 
            p: 3, 
            borderRadius: '18px',
            background: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#0f172a' }}>
            Session Details
          </Typography>
          <Divider sx={{ mb: 2, borderColor: 'rgba(41,128,185,0.08)' }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Session ID
              </Typography>
              <Typography variant="body1" fontFamily="monospace" sx={{ color: '#0f172a', fontWeight: 600 }}>
                {testId}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Date
              </Typography>
              <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 600 }}>
                {new Date().toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Time
              </Typography>
              <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 600 }}>
                {new Date().toLocaleTimeString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Status
              </Typography>
              <Chip 
                label="COMPLETED" 
                size="small" 
                sx={{
                  height: 22,
                  fontSize: '0.56rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  borderRadius: '6px',
                  bgcolor: 'rgba(13,148,136,0.10)',
                  color: '#0d9488',
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Fade>
  );
};

export default StandupSummary;  