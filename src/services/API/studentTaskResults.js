// ============================================================
// FILE: src/services/API/studenttaskresults.js
// PURPOSE: Fetch student task evaluation results
// USED BY: Trainer & Mentor dashboards
// 
// Trainer backend: /api/trainer/task-evaluation/...
// Mentor backend:  /api/mentor/task-evaluation/...
// ============================================================

import { apiRequest } from './index';

// Get cascading filter data (batches → sessions → tasks)
export const getStudentTaskResultFilters = async (role, userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.batch_id) queryParams.append('batch_id', params.batch_id);
        if (params.session_id) queryParams.append('session_id', params.session_id);

        const queryString = queryParams.toString();
        const endpoint = `/api/${role}/task-evaluation/filters/${userId}/${queryString ? `?${queryString}` : ''}`;

        const response = await apiRequest(endpoint);
        return response;
    } catch (error) {
        console.error('Failed to fetch student task result filters:', error);
        throw error;
    }
};

// Get student evaluation results
export const getStudentTaskResults = async (role, userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.batch_id) queryParams.append('batch_id', params.batch_id);
        if (params.session_id) queryParams.append('session_id', params.session_id);
        if (params.task_id) queryParams.append('task_id', params.task_id);

        const queryString = queryParams.toString();
        const endpoint = `/api/${role}/task-evaluation/results/${userId}/${queryString ? `?${queryString}` : ''}`;

        const response = await apiRequest(endpoint);
        return response;
    } catch (error) {
        console.error('Failed to fetch student task results:', error);
        throw error;
    }
};