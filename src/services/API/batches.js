// src/services/API/batches.js
// API service for Trainer & Mentor Batch management

import { apiRequest } from './index';

// ── Helper: get user context from localStorage ──
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

// ═══════════════════════════════════════════════════
// TRAINER APIs
// ═══════════════════════════════════════════════════

export const batchesAPI = {
  /**
   * List all batches assigned to the current trainer
   * GET /api/trainer/batches/<trainer_id>/<org_id>
   */
  getAll: async () => {
    const { userId, orgId } = getUserContext();
    return apiRequest(`/api/trainer/batches/${userId}/${orgId}`, {
      method: 'GET',
    });
  },

  /**
   * List all students in a specific batch (trainer)
   * GET /api/trainer/batch/students/<batch_id>/<trainer_id>/<org_id>
   */
  getStudentsByBatch: async (batchId) => {
    const { userId, orgId } = getUserContext();
    return apiRequest(`/api/trainer/batch/students/${batchId}/${userId}/${orgId}`, {
      method: 'GET',
    });
  },
};

// ═══════════════════════════════════════════════════
// MENTOR APIs
// ═══════════════════════════════════════════════════

export const mentorBatchesAPI = {
  /**
   * List all batches assigned to the current mentor
   * GET /api/mentor/batches/<mentor_id>/<org_id>
   */
  getAll: async () => {
    const { userId, orgId } = getUserContext();
    return apiRequest(`/api/mentor/batches/${userId}/${orgId}`, {
      method: 'GET',
    });
  },

  /**
   * List all students in a specific batch (mentor)
   * GET /api/mentor/batch/students/<batch_id>/<mentor_id>/<org_id>
   */
  getStudentsByBatch: async (batchId) => {
    const { userId, orgId } = getUserContext();
    return apiRequest(`/api/mentor/batch/students/${batchId}/${userId}/${orgId}`, {
      method: 'GET',
    });
  },
};