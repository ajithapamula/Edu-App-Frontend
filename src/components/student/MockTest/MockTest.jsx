// src/components/student/MockTest/StudentMockTestsList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Paper
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  PlayArrow as PlayArrowIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

const StudentMockTestsList = () => {
  const navigate = useNavigate();

  const handleStartMockTest = () => {
    navigate('/student/mock-tests/start');
  };

  // 🔒 DATA KEPT EXACTLY SAME
  const mockTestStats = [
    {
      icon: <QuizIcon sx={{ fontSize: 28 }} />,
      title: 'Total Tests',
      value: '25+',
      description: 'Available mock tests',
      gradient: 'linear-gradient(135deg, #2980b9 0%, #3498c8 100%)'
    },
    {
      icon: <TimerIcon sx={{ fontSize: 28 }} />,
      title: 'Average Duration',
      value: '45 min',
      description: 'Per test session',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
      title: 'Success Rate',
      value: '78%',
      description: 'Student average',
      gradient: 'linear-gradient(135deg, #3498c8 0%, #2db5a0 100%)'
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 28 }} />,
      title: 'Skill Level',
      value: 'All Levels',
      description: 'Beginner to Expert',
      gradient: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f0f4f8', py: 3, }}>
      <Container maxWidth="lg">

        {/* HERO SECTION */}
        <Paper
          elevation={0}
          sx={{
            textAlign: 'center',
            p: 6,
            mb: 5,
            borderRadius: '22px',
            backgroundColor: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle background circles */}
          <Box sx={{ position: 'absolute', top: -50, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(41,128,185,0.04)', display: { xs: 'none', sm: 'block' } }} />
          <Box sx={{ position: 'absolute', bottom: -40, left: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(13,148,136,0.04)', display: { xs: 'none', sm: 'block' } }} />

          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '18px',
              mx: 'auto',
              mb: 3,
              background: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(41,128,185,0.25)'
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 36, color: '#fff' }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              mb: 1
            }}
          >
            Mock Test
          </Typography>

          <Typography
            variant="body1"
            sx={{ maxWidth: 600, mx: 'auto', color: '#64748b', lineHeight: 1.7 }}
          >
            Test your knowledge with AI-generated questions tailored to your skill
            level and expertise. Push your boundaries and track your growth with
            real-time analytics.
          </Typography>

          <Box
            sx={{
              display: 'inline-block',
              mt: 2,
              px: 2,
              py: 0.5,
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: 'rgba(41,128,185,0.08)',
              color: '#2980b9',
              letterSpacing: '0.08em'
            }}
          >
            NEW FEATURE AVAILABLE
          </Box>
        </Paper>

        {/* STATS */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(4,1fr)' },
            gap: 3,
            mb: 5
          }}
        >
          {mockTestStats.map((stat, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                borderRadius: '18px',
                background: '#fff',
                border: '1px solid rgba(41,128,185,0.08)',
                boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 24px rgba(26,82,118,0.10)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Box sx={{ height: '3px', background: stat.gradient }} />
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    background: stat.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                >
                  {React.cloneElement(stat.icon, { sx: { color: '#fff', fontSize: 24 } })}
                </Box>

                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}
                >
                  {stat.value}
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: '#0f172a', mt: 0.5 }}
                >
                  {stat.title}
                </Typography>

                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  {stat.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* CTA */}
        <Box textAlign="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartMockTest}
            sx={{
              px: 6,
              py: 1.6,
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              boxShadow: '0 4px 12px rgba(41,128,185,0.25)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #153d6b 0%, #2471a3 100%)',
                boxShadow: '0 6px 18px rgba(41,128,185,0.35)'
              }
            }}
          >
            Start Mock Test
          </Button>
        </Box>

      </Container>
    </Box>
  );
};

export default StudentMockTestsList;