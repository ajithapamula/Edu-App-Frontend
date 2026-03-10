// src/services/API/results.js
// API service for fetching student result history
// Backends:
//   - student_results.py         (Django) → Daily Standup
//   - weekly_interview_results.py (Django) → Weekly Interview

const ASSESSMENT_BASE_URL = 'https://192.168.48.201:8005';
// ^^^ CHANGE THIS if the backend runs on a different port

// ============================================================
// DAILY STANDUP
// ============================================================

/**
 * Fetch daily standup results for a student
 * Backend: GET /api/student/daily-standup/results/<student_id>
 * Returns: { total, results: [{ test_id, session_id, overall_score, technical_score,
 *             communication_score, attentiveness_score, has_report, created_at }] }
 */
export const getStudentStandupResults = async (studentId) => {
  if (!studentId) {
    throw new Error('Student ID is required');
  }

  console.log('API: Fetching daily standup results for student:', studentId);

  try {
    const response = await fetch(
      `${ASSESSMENT_BASE_URL}/api/student/daily-standup/results/${studentId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch standup results`);
    }

    const data = await response.json();
    console.log('API: Standup results response:', data);

    if (data.status === 'success') {
      return {
        total: data.total || 0,
        results: data.results || [],
      };
    }

    throw new Error(data.error || 'Unknown error fetching standup results');
  } catch (error) {
    console.error('API Error in getStudentStandupResults:', error);
    throw error;
  }
};

/**
 * Get presigned URL to VIEW a standup report PDF (opens in browser)
 * Backend: GET /api/student/daily-standup/report/view/<student_id>/<session_id>
 * Returns: { status, url }
 */
export const getStandupReportViewUrl = async (studentId, sessionId) => {
  if (!studentId || !sessionId) {
    throw new Error('Student ID and Session ID are required');
  }

  console.log('API: Fetching view URL for session:', sessionId);

  try {
    const response = await fetch(
      `${ASSESSMENT_BASE_URL}/api/student/daily-standup/report/view/${studentId}/${sessionId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to get report URL`);
    }

    const data = await response.json();

    if (data.status === 'success' && data.url) {
      return data.url;
    }

    throw new Error(data.error || 'Failed to get report URL');
  } catch (error) {
    console.error('API Error in getStandupReportViewUrl:', error);
    throw error;
  }
};

/**
 * Get presigned URL to DOWNLOAD a standup report PDF (forces download)
 * Backend: GET /api/student/daily-standup/report/download/<student_id>/<session_id>
 * Returns: { status, url }
 */
export const getStandupReportDownloadUrl = async (studentId, sessionId) => {
  if (!studentId || !sessionId) {
    throw new Error('Student ID and Session ID are required');
  }

  console.log('API: Fetching download URL for session:', sessionId);

  try {
    const response = await fetch(
      `${ASSESSMENT_BASE_URL}/api/student/daily-standup/report/download/${studentId}/${sessionId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to get download URL`);
    }

    const data = await response.json();

    if (data.status === 'success' && data.url) {
      return data.url;
    }

    throw new Error(data.error || 'Failed to get download URL');
  } catch (error) {
    console.error('API Error in getStandupReportDownloadUrl:', error);
    throw error;
  }
};

// ============================================================
// WEEKLY INTERVIEW
// ============================================================

/**
 * Fetch weekly interview results for a student
 * Backend: GET /api/student/weekly-interview/results/<student_id>
 * Returns: { total, results: [{ test_id, session_id, communication_score, technical_score,
 *             hr_questions, weighted_overall, has_report, created_at }] }
 *
 * Score fields map directly from backend scores sub-document:
 *   scores.communication_score  → communication_score
 *   scores.technical_score      → technical_score
 *   scores.hr_questions         → hr_questions  (HR round score)
 *   scores.weighted_overall     → weighted_overall  (overall/composite score)
 */
export const getStudentWeeklyInterviewResults = async (studentId) => {
  if (!studentId) {
    throw new Error('Student ID is required');
  }

  console.log('API: Fetching weekly interview results for student:', studentId);

  try {
    const response = await fetch(
      `${ASSESSMENT_BASE_URL}/api/student/weekly-interview/results/${studentId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to fetch weekly interview results`
      );
    }

    const data = await response.json();
    console.log('API: Weekly interview results response:', data);

    if (data.status === 'success') {
      return {
        total: data.total || 0,
        results: data.results || [],
      };
    }

    throw new Error(data.error || 'Unknown error fetching weekly interview results');
  } catch (error) {
    console.error('API Error in getStudentWeeklyInterviewResults:', error);
    throw error;
  }
};

/**
 * Get presigned URL to VIEW a weekly interview report PDF (opens in browser)
 * Backend: GET /api/student/weekly-interview/report/view/<student_id>/<session_id>
 * Returns: { status, url }
 */
export const getWeeklyInterviewReportViewUrl = async (studentId, sessionId) => {
  if (!studentId || !sessionId) {
    throw new Error('Student ID and Session ID are required');
  }

  console.log('API: Fetching weekly interview view URL for session:', sessionId);

  try {
    const response = await fetch(
      `${ASSESSMENT_BASE_URL}/api/student/weekly-interview/report/view/${studentId}/${sessionId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to get interview report URL`
      );
    }

    const data = await response.json();

    if (data.status === 'success' && data.url) {
      return data.url;
    }

    throw new Error(data.error || 'Failed to get interview report URL');
  } catch (error) {
    console.error('API Error in getWeeklyInterviewReportViewUrl:', error);
    throw error;
  }
};

/**
 * Get presigned URL to DOWNLOAD a weekly interview report PDF (forces download)
 * Backend: GET /api/student/weekly-interview/report/download/<student_id>/<session_id>
 * Returns: { status, url }
 */
export const getWeeklyInterviewReportDownloadUrl = async (studentId, sessionId) => {
  if (!studentId || !sessionId) {
    throw new Error('Student ID and Session ID are required');
  }

  console.log('API: Fetching weekly interview download URL for session:', sessionId);

  try {
    const response = await fetch(
      `${ASSESSMENT_BASE_URL}/api/student/weekly-interview/report/download/${studentId}/${sessionId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to get interview download URL`
      );
    }

    const data = await response.json();

    if (data.status === 'success' && data.url) {
      return data.url;
    }

    throw new Error(data.error || 'Failed to get interview download URL');
  } catch (error) {
    console.error('API Error in getWeeklyInterviewReportDownloadUrl:', error);
    throw error;
  }
};

// ============================================================
// Default export — all API functions grouped
// ============================================================
const studentResultsAPI = {
  // Daily Standup
  getStudentStandupResults,
  getStandupReportViewUrl,
  getStandupReportDownloadUrl,
  // Weekly Interview
  getStudentWeeklyInterviewResults,
  getWeeklyInterviewReportViewUrl,
  getWeeklyInterviewReportDownloadUrl,
};

export default studentResultsAPI;