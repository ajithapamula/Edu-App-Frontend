// src/services/API/trainerTasks.js
// ═══════════════════════════════════════════════════════════════
// UPDATED:
//   - addTask now calls POST /api/trainer/session/<session_id>/task/create
//   - updateTask only sends Task_Box (trainer role)
//   - updateTaskAsMentor calls PUT /api/org/mentor/trainer-task/update/<id> (mentor role)
//   - getAllTasks supports filters: batch_code, session_id, start_date, end_date
//   - ADDED: getMentorTasks, getMentorTaskById, getMentorBatchCodes
//   - ADDED: getStudentTasks, getStudentTaskById
//   - ADDED: updateTaskAsMentor (dedicated mentor update endpoint)
// ═══════════════════════════════════════════════════════════════
import { apiRequest } from './index.js';

const TRAINER_BASE = '/api/org/trainer/trainer-task';
const MENTOR_BASE = '/api/org/mentor/trainer-task';
const STUDENT_BASE = '/api/org/student/trainer-task';

export const trainerTasksAPI = {
  // ═══════════════════════════════════════════════════════════════
  // TRAINER APIs
  // ═══════════════════════════════════════════════════════════════

  getAllTasks: async (trainerId, filters = {}) => {
    try {
      if (!trainerId) throw new Error('Trainer ID is required. Please log in again.');
      const params = new URLSearchParams();
      params.append('trainer_id', trainerId);
      if (filters.batch_code) params.append('batch_code', filters.batch_code);
      if (filters.batch_id) params.append('batch_id', filters.batch_id);
      if (filters.session_id) params.append('session_id', filters.session_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      const response = await apiRequest(`${TRAINER_BASE}/lists?${params.toString()}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching trainer tasks:', error);
      throw error;
    }
  },

  getTaskById: async (id, trainerId) => {
    try {
      let url = `${TRAINER_BASE}/list/${id}`;
      if (trainerId) url += `?trainer_id=${trainerId}`;
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`Error fetching trainer task ${id}:`, error);
      throw error;
    }
  },

  addTask: async (sessionId, taskBox, trainerId) => {
    try {
      if (!sessionId) throw new Error('Session ID is required.');
      if (!trainerId) throw new Error('Trainer ID is required. Please log in again.');
      const payload = { Task_Box: taskBox, Trainer_ID: trainerId };
      const response = await apiRequest(`/api/trainer/session/${sessionId}/task/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response;
    } catch (error) {
      console.error('Error adding trainer task:', error);
      throw error;
    }
  },

  /**
   * Update trainer task (trainer role)
   * Backend: PUT /api/org/trainer/trainer-task/update/<id>
   */
  updateTask: async (id, taskBox, trainerId) => {
    try {
      if (!trainerId) throw new Error('Trainer ID is required. Please log in again.');
      const payload = { Task_Box: taskBox, Trainer_ID: trainerId };
      const response = await apiRequest(`${TRAINER_BASE}/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response;
    } catch (error) {
      console.error(`Error updating trainer task ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update trainer task as mentor
   * Backend: PUT /api/org/mentor/trainer-task/update/<id>
   * Dedicated mentor endpoint — validates Mentor_ID ownership of batch
   *
   * @param {number|string} id - Task ID
   * @param {string} taskBox - Updated task content
   * @param {number|string} mentorId - Mentor ID for authorization
   */
  updateTaskAsMentor: async (id, taskBox, mentorId) => {
    try {
      if (!mentorId) throw new Error('Mentor ID is required. Please log in again.');
      const payload = { Task_Box: taskBox, Mentor_ID: mentorId };
      const response = await apiRequest(`${MENTOR_BASE}/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response;
    } catch (error) {
      console.error(`Error updating task ${id} as mentor:`, error);
      throw error;
    }
  },

  deleteTask: async (id, trainerId) => {
    try {
      if (!trainerId) throw new Error('Trainer ID is required. Please log in again.');
      const response = await apiRequest(`${TRAINER_BASE}/remove/${id}?trainer_id=${trainerId}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error(`Error deleting trainer task ${id}:`, error);
      throw error;
    }
  },

  bulkDeleteTasks: async (taskIds, trainerId) => {
    try {
      if (!trainerId) throw new Error('Trainer ID is required. Please log in again.');
      const deletePromises = taskIds.map(id =>
        apiRequest(`${TRAINER_BASE}/remove/${id}?trainer_id=${trainerId}`, { method: 'DELETE' })
      );
      const responses = await Promise.all(deletePromises);
      return responses;
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // MENTOR TASK APIs
  // ═══════════════════════════════════════════════════════════════

  getMentorTasks: async (mentorId, filters = {}) => {
    try {
      if (!mentorId) throw new Error('Mentor ID is required. Please log in again.');
      const params = new URLSearchParams();
      params.append('mentor_id', mentorId);
      if (filters.batch_code) params.append('batch_code', filters.batch_code);
      if (filters.session_id) params.append('session_id', filters.session_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      const response = await apiRequest(`${MENTOR_BASE}/lists?${params.toString()}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching mentor tasks:', error);
      throw error;
    }
  },

  getMentorTaskById: async (id, mentorId) => {
    try {
      if (!mentorId) throw new Error('Mentor ID is required. Please log in again.');
      const response = await apiRequest(`${MENTOR_BASE}/list/${id}?mentor_id=${mentorId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`Error fetching mentor task ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get batch codes dropdown for mentor
   * Backend: GET /api/mentor/session/batch-codes?mentor_id=<id>
   * @returns {Array} [{ Batch_ID, Batch_Code }]
   */
  getMentorBatchCodes: async (mentorId) => {
    try {
      if (!mentorId) throw new Error('Mentor ID is required. Please log in again.');
      const response = await apiRequest(`/api/mentor/session/batch-codes?mentor_id=${mentorId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching mentor batch codes:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // STUDENT TASK APIs (read-only)
  // ═══════════════════════════════════════════════════════════════

  getStudentTasks: async (studentId, filters = {}) => {
    try {
      if (!studentId) throw new Error('Student ID is required. Please log in again.');
      const params = new URLSearchParams();
      params.append('student_id', studentId);
      if (filters.batch_code) params.append('batch_code', filters.batch_code);
      if (filters.session_id) params.append('session_id', filters.session_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      const response = await apiRequest(`${STUDENT_BASE}/lists?${params.toString()}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching student tasks:', error);
      throw error;
    }
  },

  getStudentTaskById: async (id, studentId) => {
    try {
      if (!studentId) throw new Error('Student ID is required. Please log in again.');
      const response = await apiRequest(`${STUDENT_BASE}/list/${id}?student_id=${studentId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`Error fetching student task ${id}:`, error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // EXISTING METHODS — Task Submissions (kept exactly as original)
  // ═══════════════════════════════════════════════════════════════

  getStudentAssignedTasks: async (studentId, batchId) => {
    try {
      if (!studentId) throw new Error('Student ID is required. Please log in again.');
      let url = `/api/student/task-submissions/assigned-tasks/${studentId}`;
      if (batchId) url += `?batch_id=${batchId}`;
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching student assigned tasks:', error);
      throw error;
    }
  },

  getTaskSubmissions: async (trainerId) => {
    try {
      const response = await apiRequest(`/api/student/task-submissions/lists?trainer_id=${trainerId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching task submissions:', error);
      throw error;
    }
  },

  getStudentResults: async (trainerId) => {
    try {
      const response = await apiRequest(`/api/trainer/student-results/lists?trainer_id=${trainerId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching student results:', error);
      throw error;
    }
  },

  getSubmissionsByTask: async (taskId, trainerId) => {
    try {
      const response = await apiRequest(`/api/trainer/task-submissions/by-task/${taskId}?trainer_id=${trainerId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`Error fetching submissions for task ${taskId}:`, error);
      throw error;
    }
  },

  getSubmissionDetail: async (submissionId, trainerId) => {
    try {
      const response = await apiRequest(
        `/api/student/task-submissions/list/${submissionId}?role=trainer&user_id=${trainerId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`Error fetching submission ${submissionId}:`, error);
      throw error;
    }
  },

  viewSubmissionDocument: async (submissionId, trainerId) => {
    try {
      const response = await apiRequest(
        `/api/student/task-submissions/view-submission/${submissionId}?role=trainer&user_id=${trainerId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`Error viewing submission document ${submissionId}:`, error);
      throw error;
    }
  },

  viewMentorSubmissionDocument: async (submissionId, mentorId, action = 'download') => {
    try {
      if (!mentorId) throw new Error('Mentor ID is required. Please log in again.');
      const response = await apiRequest(
        `/api/student/task-submissions/view-submission/${submissionId}?role=mentor&user_id=${mentorId}&action=${action}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`Error viewing mentor submission document ${submissionId}:`, error);
      throw error;
    }
  },

  deleteSubmission: async (submissionId) => {
    try {
      const response = await apiRequest(`/api/student/task-submissions/remove/${submissionId}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error(`Error deleting submission ${submissionId}:`, error);
      throw error;
    }
  },

  getStudentName: async (studentId) => {
    try {
      const response = await apiRequest(`/api/get-student-name/${studentId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`Error fetching student name for ${studentId}:`, error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // MENTOR SUBMISSION METHODS (kept exactly as original)
  // ═══════════════════════════════════════════════════════════════

  getMentorSubmissions: async (mentorId, batchId, taskId) => {
    try {
      if (!mentorId) throw new Error('Mentor ID is required. Please log in again.');
      let url = `/api/mentor/submissions/${mentorId}`;
      const params = [];
      if (batchId) params.push(`batch_id=${batchId}`);
      if (taskId) params.push(`task_id=${taskId}`);
      if (params.length) url += `?${params.join('&')}`;
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching mentor submissions:', error);
      throw error;
    }
  },

  getMentorSingleSubmission: async (mentorId, submissionId) => {
    try {
      if (!mentorId) throw new Error('Mentor ID is required. Please log in again.');
      const response = await apiRequest(`/api/mentor/submission/${mentorId}/${submissionId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`Error fetching mentor submission ${submissionId}:`, error);
      throw error;
    }
  },

  getMentorBatchTasks: async (mentorId, batchId) => {
    try {
      if (!mentorId) throw new Error('Mentor ID is required. Please log in again.');
      let url = `/api/mentor/tasks/${mentorId}`;
      if (batchId) url += `?batch_id=${batchId}`;
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching mentor batch tasks:', error);
      throw error;
    }
  }
};

export default trainerTasksAPI;