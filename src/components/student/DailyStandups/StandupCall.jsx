import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Card,
  CardContent,
  IconButton,
  Button,
  Avatar,
  Tooltip,
  Fade,
  Zoom,
  Grid,
  useTheme,
  alpha,
  styled,
  keyframes
} from '@mui/material';
import { 
  Refresh, 
  PlayArrow,
  School,
  TrendingUp,
  Mic,
  Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import the standup API
import { standupCallAPI } from '../../../services/API/studentstandup';

// Shimmer animation keyframes
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

// Styled components for animations
const PulseButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(45deg, rgba(41,128,185,0.1), rgba(13,148,136,0.1))`,
    borderRadius: 'inherit',
    animation: `${shimmer} 2s infinite ease-in-out`,
  },
  '&:hover::before': {
    animationDuration: '0.5s',
  }
}));

const StandupCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleStartStandup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting standup session...');
      
      // Call API to start standup
      const response = await standupCallAPI.startStandup();
      console.log('Standup started:', response);
      
      // Navigate to standup call page with test ID
      if (response && (response.test_id || response.testId || response.id)) {
        const testId = response.test_id || response.testId || response.id;
        navigate(`/student/daily-standups/call/${testId}`);
      } else {
        throw new Error('No test ID received from server');
      }
      
    } catch (err) {
      console.error('Error starting standup:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setError(null);
  };

  // Show error state
  if (error && !loading) {
    return (
      <Fade in={true}>
        <Box sx={{ p: 3 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            Daily Standup
          </Typography>
          <Alert 
            severity="error" 
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
            action={
              <IconButton 
                size="small" 
                onClick={handleRefresh}
                sx={{
                  '&:hover': {
                    transform: 'rotate(180deg)',
                    transition: 'transform 0.3s ease-in-out'
                  }
                }}
              >
                <Refresh />
              </IconButton>
            }
          >
            Failed to start standup: {error}
          </Alert>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in={true}>
      <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
        {/* Header Section */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={4}
          sx={{
            background: '#fff',
            p: 3,
            borderRadius: '18px',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar 
              sx={{ 
                background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                width: 48,
                height: 48,
                boxShadow: '0 4px 12px rgba(41,128,185,0.25)',
              }}
            >
              <Mic />
            </Avatar>
            <Box>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{
                  background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold',
                  mb: 0.5
                }}
              >
                Daily Standup
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start your daily standup session
              </Typography>
            </Box>
          </Box>
          
          <Tooltip title="Refresh">
            <IconButton 
              onClick={handleRefresh} 
              disabled={loading}
              sx={{
                bgcolor: '#fff',
                border: '1px solid rgba(41,128,185,0.15)',
                boxShadow: '0 2px 8px rgba(26,82,118,0.08)',
                '&:hover': {
                  bgcolor: 'rgba(41,128,185,0.06)',
                  transform: 'rotate(180deg)',
                  transition: 'all 0.3s ease-in-out'
                },
                '&:disabled': {
                  bgcolor: 'rgba(148,163,184,0.1)'
                }
              }}
            >
              <Refresh sx={{ color: '#2980b9' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Card 
                sx={{
                  background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                  color: 'white',
                  borderRadius: '18px',
                  boxShadow: '0 4px 20px rgba(41,128,185,0.25)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(41,128,185,0.35)',
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        Ready
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        System Status
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <School sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Card 
                sx={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)',
                  color: 'white',
                  borderRadius: '18px',
                  boxShadow: '0 4px 20px rgba(13,148,136,0.25)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(13,148,136,0.35)',
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        5-10
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Minutes Duration
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <Schedule sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Card 
                sx={{
                  background: 'linear-gradient(135deg, #3498c8 0%, #2db5a0 100%)',
                  color: 'white',
                  borderRadius: '18px',
                  boxShadow: '0 4px 20px rgba(52,152,200,0.25)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(52,152,200,0.35)',
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        Interactive
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Voice Enabled
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <TrendingUp sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Main Start Button Section */}
        <Paper 
          sx={{
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
            border: '1px solid rgba(41,128,185,0.08)',
            background: '#fff',
          }}
        >
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(41,128,185,0.08)',
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
                border: '3px solid rgba(41,128,185,0.15)'
              }}
            >
              <Mic sx={{ fontSize: 40, color: '#2980b9' }} />
            </Avatar>
            
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom
              sx={{
                background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              Ready to Start Your Standup?
            </Typography>
            
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              Your daily standup session will guide you through key questions about your progress, 
              challenges, and plans. The session is interactive and voice-enabled for a natural conversation experience.
            </Typography>
            
            <Box display="flex" justifyContent="center" gap={2}>
              <PulseButton
                variant="contained"
                size="large"
                onClick={handleStartStandup}
                disabled={loading}
                startIcon={<PlayArrow />}
                sx={{
                  minWidth: 200,
                  height: 56,
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                  boxShadow: '0 4px 12px rgba(41,128,185,0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #153d6b 0%, #1a6fa0 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 18px rgba(41,128,185,0.35)',
                  },
                  '&:disabled': {
                    background: 'rgba(148,163,184,0.3)'
                  }
                }}
              >
                {loading ? 'Starting...' : 'Start Standup'}
              </PulseButton>
            </Box>
            
            {/* Instructions */}
            <Box 
              sx={{ 
                mt: 4, 
                p: 3, 
                bgcolor: 'rgba(41,128,185,0.04)',
                borderRadius: '14px',
                border: '1px solid rgba(41,128,185,0.10)'
              }}
            >
              <Typography variant="h6" sx={{ color: '#2980b9' }} gutterBottom>
                What to Expect:
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>1. Yesterday's Work:</strong> Discuss what you accomplished
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>2. Today's Plans:</strong> Share what you plan to work on
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>3. Blockers:</strong> Mention any challenges or obstacles
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </Box>
    </Fade>
  );
};

export default StandupCall;