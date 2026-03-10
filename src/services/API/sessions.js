// src/services/API/sessions.js
// ═══════════════════════════════════════════════════════════════
// SESSIONS API — Trainer + Mentor + Student (single file)
// ─────────────────────────────────────────────────────────────
// TRAINER endpoints:
//   GET  /api/trainer/session/batch-codes?trainer_id=<id>
//   GET  /api/trainer/session/lists?trainer_id=<id>
//   GET  /api/trainer/session/list/<id>?trainer_id=<id>
//   POST /api/trainer/batch/<batch_id>/session/create
//   PUT  /api/trainer/session/update/<id>
//   DELETE /api/trainer/session/remove/<id>?trainer_id=<id>
//   GET  /api/trainer/session/batch/<batch_id>?trainer_id=<id>
//   POST /api/trainer/session/<session_id>/task/create
//   GET  /api/trainer/session/<session_id>/tasks?trainer_id=<id>
//
// MENTOR endpoint (read-only):
//   GET  /api/mentor/batch/sessions/<batch_id>/<mentor_id>/<org_id>
//
// STUDENT endpoint (read-only):
//   GET  /api/student/sessions/<student_id>/<org_id>
// ═══════════════════════════════════════════════════════════════
import { apiRequest } from './index';

// ── Helper: get user context from localStorage (same pattern as batches.js) ──
const getUserContext = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) throw new Error('User not authenticated');

  const user = JSON.parse(userStr);

  const userId = user.id || user.Id || user.ID;
  if (!userId) throw new Error('User ID not found in session');

  const orgId = user.orgId || user.Org_Id || user.org_id || user.Org_ID || user.OrgId;
  if (!orgId) {
    console.error('User object from localStorage:', user);
    throw new Error('Organization ID not found in user session');
  }

  const role = user.role || '';

  return { userId, orgId, role };
};

export const sessionsAPI = {

  // ═══════════════════════════════════════════════════════════════
  //  TRAINER METHODS
  // ═══════════════════════════════════════════════════════════════

  // DROPDOWN: Get Batch Codes for session creation form
  // Backend: GET /api/trainer/session/batch-codes?trainer_id=<id>
  getBatchCodes: async (trainerId) => {
    try {
      if (!trainerId) {
        throw new Error('Trainer ID is required');
      }
      const response = await apiRequest(`/api/trainer/session/batch-codes?trainer_id=${trainerId}`, {
        method: 'GET'
      });
      console.log('API Response for getBatchCodes:', response);
      let batches = [];
      if (response && response.data && Array.isArray(response.data)) {
        batches = response.data;
      } else if (Array.isArray(response)) {
        batches = response;
      } else {
        batches = [];
      }
      return batches;
    } catch (error) {
      console.error('API Error in getBatchCodes:', error);
      throw new Error(`Failed to fetch batch codes: ${error.message}`);
    }
  },

  // LIST: Get all sessions
  // Backend: GET /api/trainer/session/lists?trainer_id=<id>
  getAll: async (trainerId) => {
    try {
      if (!trainerId) {
        throw new Error('Trainer ID is required');
      }
      console.log('API: Fetching all sessions for trainer:', trainerId);
      const url = `/api/trainer/session/lists?trainer_id=${trainerId}`;
      const response = await apiRequest(url, {
        method: 'GET'
      });
      console.log('API Response for getAll sessions:', response);

      let sessions = [];
      if (response && response.data && Array.isArray(response.data)) {
        sessions = response.data;
      } else if (Array.isArray(response)) {
        sessions = response;
      } else if (response && response.sessions && Array.isArray(response.sessions)) {
        sessions = response.sessions;
      } else {
        sessions = [];
      }
      return sessions;
    } catch (error) {
      console.error('API Error in getAll sessions:', error);
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }
  },

  // GET: Get specific session by ID
  // Backend: GET /api/trainer/session/list/<id>?trainer_id=<id>
  getById: async (sessionId, trainerId) => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      if (!trainerId) {
        throw new Error('Trainer ID is required');
      }
      const url = `/api/trainer/session/list/${sessionId}?trainer_id=${trainerId}`;
      const response = await apiRequest(url, {
        method: 'GET'
      });
      console.log('API Response for getById session:', response);

      let sessionData = null;
      if (response && response.data) {
        sessionData = response.data;
      } else if (response && response.session) {
        sessionData = response.session;
      } else {
        sessionData = response;
      }
      return sessionData;
    } catch (error) {
      console.error('API Error in getById session:', error);
      throw new Error(`Failed to fetch session: ${error.message}`);
    }
  },

  // CREATE: Create new session
  // Backend: POST /api/trainer/batch/<batch_id>/session/create
  create: async (sessionData) => {
    try {
      console.log('API: Creating session with data:', sessionData);

      if (!sessionData.Batch_ID) {
        throw new Error('Batch ID is required');
      }
      if (!sessionData.Start_DateTime) {
        throw new Error('Start Date Time is required');
      }
      if (!sessionData.Trainer_ID) {
        throw new Error('Trainer ID is required');
      }

      const batchId = sessionData.Batch_ID;

      const payload = {
        Start_DateTime: sessionData.Start_DateTime,
        Trainer_ID: sessionData.Trainer_ID,
      };
      if (sessionData.End_DateTime) payload.End_DateTime = sessionData.End_DateTime;
      if (sessionData.Session_Link) payload.Session_Link = sessionData.Session_Link;
      if (sessionData.Status) payload.Status = sessionData.Status;

      const response = await apiRequest(`/api/trainer/batch/${batchId}/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('API Response for create session:', response);
      return response;
    } catch (error) {
      console.error('API Error in create session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  },

  // UPDATE: Update session
  // Backend: PUT /api/trainer/session/update/<id>
  update: async (sessionId, sessionData) => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      console.log('API: Updating session with ID:', sessionId, 'Data:', sessionData);

      const response = await apiRequest(`/api/trainer/session/update/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      console.log('API Response for update session:', response);
      return response;
    } catch (error) {
      console.error('API Error in update session:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  },

  // DELETE: Delete session
  // Backend: DELETE /api/trainer/session/remove/<id>?trainer_id=<id>
  remove: async (sessionId, trainerId) => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      if (!trainerId) {
        throw new Error('Trainer ID is required');
      }
      const url = `/api/trainer/session/remove/${sessionId}?trainer_id=${trainerId}`;
      const response = await apiRequest(url, {
        method: 'DELETE'
      });
      console.log('API Response for remove session:', response);
      return response;
    } catch (error) {
      console.error('API Error in remove session:', error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  },

  // LIST BY BATCH (Trainer): Get sessions for a specific batch
  // Backend: GET /api/trainer/session/batch/<batch_id>?trainer_id=<id>
  getByBatch: async (batchId, trainerId) => {
    try {
      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      if (!trainerId) {
        throw new Error('Trainer ID is required');
      }
      const url = `/api/trainer/session/batch/${batchId}?trainer_id=${trainerId}`;
      const response = await apiRequest(url, { method: 'GET' });
      let sessions = [];
      if (Array.isArray(response)) {
        sessions = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        sessions = response.data;
      }
      return sessions;
    } catch (error) {
      console.error('API Error in getByBatch:', error);
      throw new Error(`Failed to fetch sessions by batch: ${error.message}`);
    }
  },

  // CREATE TASK FROM SESSION
  // Backend: POST /api/trainer/session/<session_id>/task/create
  createTaskFromSession: async (sessionId, taskData, trainerId) => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      if (!trainerId) {
        throw new Error('Trainer ID is required');
      }
      const payload = {
        Task_Box: taskData.Task_Box || taskData.task_box || '',
        Trainer_ID: trainerId,
      };
      if (taskData.Trainer_ID) {
        payload.Trainer_ID = taskData.Trainer_ID;
      }

      console.log('API: Creating task from session:', sessionId, payload);
      const response = await apiRequest(`/api/trainer/session/${sessionId}/task/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('API Response for createTaskFromSession:', response);
      return response;
    } catch (error) {
      console.error('API Error in createTaskFromSession:', error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
  },

  // GET TASKS FOR SESSION
  // Backend: GET /api/trainer/session/<session_id>/tasks?trainer_id=<id>
  getTasksForSession: async (sessionId, trainerId) => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      if (!trainerId) {
        throw new Error('Trainer ID is required');
      }
      const url = `/api/trainer/session/${sessionId}/tasks?trainer_id=${trainerId}`;
      const response = await apiRequest(url, { method: 'GET' });
      console.log('API Response for getTasksForSession:', response);

      let tasks = [];
      if (Array.isArray(response)) {
        tasks = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        tasks = response.data;
      }
      return tasks;
    } catch (error) {
      console.error('API Error in getTasksForSession:', error);
      throw new Error(`Failed to fetch tasks for session: ${error.message}`);
    }
  },

  // SEARCH: Search sessions with filters
  search: async (searchParams) => {
    try {
      if (!searchParams.trainerId) {
        throw new Error('Trainer ID is required');
      }
      const queryParams = new URLSearchParams();
      queryParams.append('trainer_id', searchParams.trainerId);
      if (searchParams.query) queryParams.append('q', searchParams.query);
      if (searchParams.status && searchParams.status !== 'all') queryParams.append('status', searchParams.status);
      if (searchParams.dateFrom) queryParams.append('dateFrom', searchParams.dateFrom);
      if (searchParams.dateTo) queryParams.append('dateTo', searchParams.dateTo);
      if (searchParams.batchId) queryParams.append('batchId', searchParams.batchId);

      const queryString = queryParams.toString();
      const url = `/api/trainer/session/lists?${queryString}`;
      const response = await apiRequest(url, { method: 'GET' });

      let sessions = [];
      if (response && response.data && Array.isArray(response.data)) {
        sessions = response.data;
      } else if (Array.isArray(response)) {
        sessions = response;
      }
      return sessions;
    } catch (error) {
      console.error('API Error in search sessions:', error);
      return [];
    }
  },

  // UPDATE STATUS: Quick status update
  updateStatus: async (sessionId, status, trainerId) => {
    try {
      if (!sessionId || !status) {
        throw new Error('Session ID and Status are required');
      }
      if (!trainerId) {
        throw new Error('Trainer ID is required');
      }
      const current = await sessionsAPI.getById(sessionId, trainerId);
      const payload = {
        Batch_Code: current.Batch_Code,
        Start_DateTime: current.Start_DateTime,
        Status: status,
        Session_Link: current.Session_Link,
        End_DateTime: current.End_DateTime,
        Trainer_ID: trainerId,
      };

      const response = await apiRequest(`/api/trainer/session/update/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response;
    } catch (error) {
      console.error('API Error in updateStatus session:', error);
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  },

  // Convenience: Get stats (computed client-side from getAll)
  getStats: async (trainerId) => {
    try {
      if (!trainerId) {
        throw new Error('Trainer ID is required');
      }
      const sessions = await sessionsAPI.getAll(trainerId);
      return {
        total: sessions.length,
        completed: sessions.filter(s => s.Status?.toLowerCase() === 'completed').length,
        scheduled: sessions.filter(s => s.Status?.toLowerCase() === 'scheduled').length,
        active: sessions.filter(s => s.Status?.toLowerCase() === 'active').length,
        cancelled: sessions.filter(s => s.Status?.toLowerCase() === 'cancelled').length,
      };
    } catch (error) {
      console.error('API Error in getStats:', error);
      return { total: 0, completed: 0, scheduled: 0, active: 0, cancelled: 0 };
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  MENTOR METHOD (Read-Only)
  // ═══════════════════════════════════════════════════════════════

  // LIST SESSIONS BY BATCH (Mentor View - Read Only)
  // Backend: GET /api/mentor/batch/sessions/<batch_id>/<mentor_id>/<org_id>
  // Uses getUserContext() from localStorage — same pattern as batches.js
  mentorGetByBatch: async (batchId) => {
    try {
      if (!batchId) throw new Error('Batch ID is required');

      const { userId, orgId } = getUserContext();

      console.log('Mentor Sessions API: Fetching sessions for batch:', batchId, 'mentor:', userId, 'org:', orgId);

      const url = `/api/mentor/batch/sessions/${batchId}/${userId}/${orgId}`;
      const response = await apiRequest(url, { method: 'GET' });

      console.log('Mentor Sessions API Response:', response);
      return response;
    } catch (error) {
      console.error('Mentor Sessions API Error:', error);
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  STUDENT METHODS (Read-Only)
  // ═══════════════════════════════════════════════════════════════

  // GET ALL SESSIONS for Student (across all assigned batches)
  // Backend: GET /api/student/sessions/<student_id>/<org_id>
  // Uses getUserContext() from localStorage — same pattern as batches.js
  studentGetAllSessions: async () => {
    try {
      const { userId, orgId } = getUserContext();

      console.log('Student Sessions API: Fetching all sessions for student:', userId, 'org:', orgId);

      const url = `/api/student/sessions/${userId}/${orgId}`;
      const response = await apiRequest(url, { method: 'GET' });

      console.log('Student Sessions API Response:', response);
      return response;
    } catch (error) {
      console.error('Student Sessions API Error:', error);
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }
  },
};