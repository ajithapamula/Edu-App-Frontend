// ═══════════════════════════════════════════════════════════════
// ProfilePage.jsx — Place in: src/pages/ProfilePage.jsx
//
// Universal profile page that renders the correct profile
// component based on the logged-in user's role.
// ═══════════════════════════════════════════════════════════════
import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import StudentProfile from '../components/profile/StudentProfile';
import TrainerProfile from '../components/profile/TrainerProfile';
import MentorProfile from '../components/profile/MentorProfile';

const ProfilePage = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  if (role === 'student') return <StudentProfile />;
  if (role === 'trainer') return <TrainerProfile />;
  if (role === 'mentor') return <MentorProfile />;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', px: 3 }}>
      <Typography sx={{ fontSize: '1rem', color: '#94a3b8', textAlign: 'center' }}>
        Profile not available for role: <strong>{role || 'unknown'}</strong>
      </Typography>
    </Box>
  );
};

export default ProfilePage;