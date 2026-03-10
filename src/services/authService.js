
// src/services/authService.js
import { apiRequest } from './API/index';

const authService = {
  // ============================================================
  // STUDENT LOGIN - Real API
  // ============================================================
  loginStudent: async (credential, password) => {
    console.log('Student Login attempt for:', credential);

    try {
      const response = await apiRequest('/api/student/login', {
        method: 'POST',
        body: JSON.stringify({
          Credential: credential,
          Password: password,
        }),
      });

      if (response.Entity_Type && response.Entity_Type !== 'student') {
        throw new Error('Not a student account');
      }

      console.log('Student Login successful:', response);

      const userData = {
        id: response.Id,
        name: response.Name,
        role: 'student',
        orgId: response.Org_Id || response.org_id || response.Org_ID,
        photoUrl: response.Photo_URL,
        entityType: response.Entity_Type,
      };

      localStorage.setItem('token', `student_${response.Id}_${Date.now()}`);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('student_id', response.Id);

      return {
        success: true,
        data: {
          user: userData,
          token: localStorage.getItem('token'),
        },
      };
    } catch (error) {
      console.error('Student Login failed:', error);
      throw new Error(error.message || 'Invalid email or password');
    }
  },

  // ============================================================
  // TRAINER LOGIN
  // ============================================================
  loginTrainer: async (credential, password) => {
    console.log('Trainer Login attempt for:', credential);
    try {
      const response = await apiRequest('/api/admin/org/trainer/login', {
        method: 'POST',
        body: JSON.stringify({
          Credential: credential,
          Password: password,
        }),
      });

      console.log('Trainer Login successful:', response);

      const userData = {
        id: response.Id,
        name: response.Name,
        role: 'trainer',
        orgId: response.Org_Id || response.org_id || response.Org_ID,
        photoUrl: response.Photo_upload || null,
      };

      localStorage.setItem('token', `trainer_${response.Id}_${Date.now()}`);
      localStorage.setItem('user', JSON.stringify(userData));

      return {
        success: true,
        data: {
          user: userData,
          token: localStorage.getItem('token'),
        },
      };
    } catch (error) {
      console.error('Trainer Login failed:', error);
      throw new Error(error.message || 'Invalid email or password');
    }
  },

  // ============================================================
  // MENTOR LOGIN
  // ============================================================
  loginMentor: async (credential, password) => {
    console.log('Mentor Login attempt for:', credential);

    try {
      const response = await apiRequest('/api/admin/org/mentor/login', {
        method: 'POST',
        body: JSON.stringify({
          Credential: credential,
          Password: password,
        }),
      });

      console.log('Mentor Login successful:', response);

      const userData = {
        id: response.Id,
        name: response.Name,
        role: 'mentor',
        orgId: response.Org_Id || response.org_id || response.Org_ID,
        photoUrl: response.Photo_upload || null,
      };

      localStorage.setItem('token', `mentor_${response.Id}_${Date.now()}`);
      localStorage.setItem('user', JSON.stringify(userData));

      return {
        success: true,
        data: {
          user: userData,
          token: localStorage.getItem('token'),
        },
      };
    } catch (error) {
      console.error('Mentor Login failed:', error);
      throw new Error(error.message || 'Invalid email or password');
    }
  },

  // ============================================================
  // UNIFIED LOGIN
  // ============================================================
  login: async (email, password, entityType = null) => {
    console.log('Login attempt for:', email, 'Type:', entityType);

    const payload = {
      Credential: email,
      Password: password,
    };

    if (entityType) {
      payload.Entity_Type = entityType;
    }

    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log('Unified Login raw response:', response);

    const role = (response.Entity_Type || entityType || '').toLowerCase();

    const userData = {
      id: response.Id,
      name: response.Name,
      role: role,
      orgId: response.Org_Id || response.org_id || response.Org_ID,
      photoUrl: role === 'student'
        ? response.Photo_URL
        : (response.Photo_upload || null),
      entityType: response.Entity_Type,
    };

    localStorage.setItem('token', `${role}_${response.Id}_${Date.now()}`);
    localStorage.setItem('user', JSON.stringify(userData));

    if (role === 'student') {
      localStorage.setItem('student_id', response.Id);
    }

    return {
      success: true,
      data: {
        user: userData,
        token: localStorage.getItem('token'),
      },
    };
  },

  // ============================================================
  // LOGOUT
  // ============================================================
  logout: async () => {
    console.log('Logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('student_id');
    console.log('Logout successful');
    return { success: true };
  },

  // ============================================================
  // FORGOT PASSWORD
  //
  // Backend: POST /api/auth/forgot-password
  // Request:  { "email": "...", "Entity_Type": "..." (optional) }
  // 
  // Success (200):  { "Message": "OTP sent...", "Entity_Type": "trainer" }
  // Multi (400):    { "Error": "...", "Matched_Accounts": ["trainer","student"] }
  //
  // FIX: Handle BOTH success and multi-account (400) responses properly.
  // apiRequest now attaches responseData to the error object so we can
  // extract Matched_Accounts even from 400 responses.
  // ============================================================
  forgotPassword: async (email, entityType = null) => {
    console.log('Forgot Password for:', email, 'Entity:', entityType);

    const payload = { email };
    if (entityType) {
      payload.Entity_Type = entityType;
    }

    try {
      // Success path (200) — OTP sent for single account
      const response = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: response.Message || 'OTP sent to your email.',
        entityType: response.Entity_Type || entityType,
        matchedAccounts: response.Matched_Accounts || null,
      };
    } catch (error) {
      console.error('Forgot password error:', error);

      // ── FIX: Check if this is a multi-account response (400) ──
      // apiRequest now attaches error.responseData with the full backend JSON
      const responseData = error.responseData;
      if (responseData && responseData.Matched_Accounts && responseData.Matched_Accounts.length > 1) {
        // Return as a "success" with matchedAccounts so ForgotPasswordForm
        // can show the account type dropdown
        return {
          success: false,
          multiAccount: true,
          message: responseData.Error || 'Multiple accounts found.',
          matchedAccounts: responseData.Matched_Accounts,
        };
      }

      // All other errors — re-throw
      throw error;
    }
  },

  // ============================================================
  // RESET PASSWORD
  //
  // Backend: POST /api/auth/reset-password
  // Request:  { "email": "...", "OTP": "123456", "password": "NewPass@123" }
  // Success:  { "Message": "Password reset successfully", "Entity_Type": "..." }
  // ============================================================
  resetPassword: async (email, otp, password) => {
    console.log('Reset Password for:', email);

    const response = await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        OTP: otp,
        password: password,
      }),
    });

    return {
      success: true,
      message: response.Message || 'Password reset successful!',
      entityType: response.Entity_Type || null,
    };
  },

  // ============================================================
  // GET CURRENT USER
  // ============================================================
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        console.log('Current user:', userData.name, '- Role:', userData.role);
        return userData;
      } catch (e) {
        console.log('Failed to parse user data:', e);
        return null;
      }
    }
    return null;
  },

  // ============================================================
  // CHECK IF AUTHENTICATED
  // ============================================================
  isAuthenticated: () => {
    const isAuth = !!localStorage.getItem('token');
    console.log('Is authenticated:', isAuth);
    return isAuth;
  },

  // ============================================================
  // GET TOKEN
  // ============================================================
  getToken: () => {
    return localStorage.getItem('token');
  },
};

export default authService;

