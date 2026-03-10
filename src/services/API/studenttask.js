// src/services/API/studenttask.js
import { apiRequest } from './index';

export const taskSubmissionsAPI = {

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: Get all tasks assigned to student's batch(es) with submission status
  // Backend: GET /api/student/task-submissions/assigned-tasks/<student_id>
  // Returns: { student_id, student_name, batch_ids, total_tasks, tasks: [...] }
  // Each task includes: Task_ID, Task_Box, Batch_ID, Session_ID, Trainer_ID,
  //   Trainer_Name, Submission_Status, Submission (null or {Submission_ID, ...})
  // ═══════════════════════════════════════════════════════════════════════════
  getAssignedTasks: async (studentId) => {
    try {
      if (!studentId) {
        throw new Error('Student ID is required');
      }

      const response = await apiRequest(`/api/student/task-submissions/assigned-tasks/${studentId}`, {
        method: 'GET'
      });

      console.log('API Response for assigned tasks:', response);
      return response;
    } catch (error) {
      console.error('API Error in getAssignedTasks:', error);
      throw new Error(`Failed to fetch assigned tasks: ${error.message}`);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: Get only this student's own submissions
  // Backend: GET /api/student/task-submissions/my-submissions/<student_id>
  // Returns: { student_id, student_name, total_submissions, submissions: [...] }
  // ═══════════════════════════════════════════════════════════════════════════
  getMySubmissions: async (studentId) => {
    try {
      if (!studentId) {
        throw new Error('Student ID is required');
      }

      const response = await apiRequest(`/api/student/task-submissions/my-submissions/${studentId}`, {
        method: 'GET'
      });

      console.log('API Response for my submissions:', response);
      return response;
    } catch (error) {
      console.error('API Error in getMySubmissions:', error);
      throw new Error(`Failed to fetch my submissions: ${error.message}`);
    }
  },

  // Add new task submission - using enhanced endpoint with better error handling
  // FIXED: Now calls /add as primary (not broken /add-enhanced)
  // FIXED: FormData MUST include Task_ID (Student_ID, Task_ID, Task_Submit required)
  add: async (submissionData) => {
    try {
      // FIXED: Validate required fields before sending
      if (submissionData instanceof FormData) {
        if (!submissionData.get('Student_ID')) {
          throw new Error('Student_ID is required in FormData');
        }
        if (!submissionData.get('Task_ID')) {
          throw new Error('Task_ID is required in FormData');
        }
        if (!submissionData.get('Task_Submit')) {
          throw new Error('Task_Submit (file) is required in FormData');
        }
      }

      // FIXED: Primary endpoint is now /add (the correctly fixed one)
      // submissionData should be FormData with Student_ID, Task_ID, and Task_Submit
      const response = await apiRequest('/api/student/task-submissions/add', {
        method: 'POST',
        body: submissionData, // FormData object
        // Don't set Content-Type header for FormData - browser will set it with boundary
      });
      
      console.log('API Response for task submission add:', response);
      return response;
    } catch (error) {
      console.error('API Error in task submission add:', error);
      
      // Fallback to enhanced endpoint if primary fails
      try {
        console.log('Trying fallback to enhanced endpoint...');
        const fallbackResponse = await apiRequest('/api/student/task-submissions/add-enhanced', {
          method: 'POST',
          body: submissionData,
        });
        console.log('Fallback API Response:', fallbackResponse);
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error(`Failed to add task submission: ${error.message}`);
      }
    }
  },

  // Get all task submissions - matching Django endpoint
  // NOTE: This calls the TRAINER endpoint which requires trainer_id query param.
  // For student use, prefer getAssignedTasks() or getMySubmissions() instead.
  // FIXED: Added optional trainerId param for proper filtering
  getAll: async (trainerId = null) => {
    try {
      let url = '/api/student/task-submissions/lists';
      if (trainerId) {
        url += `?trainer_id=${trainerId}`;
      }

      const response = await apiRequest(url, {
        method: 'GET'
      });
      
      console.log('API Response for task submissions getAll:', response);
      
      // Django backend returns object with submissions array when trainer_id provided
      if (response && response.submissions) {
        return Array.isArray(response.submissions) ? response.submissions : [];
      }
      // Django backend returns array directly for legacy calls
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('API Error in task submissions getAll:', error);
      throw new Error(`Failed to fetch task submissions: ${error.message}`);
    }
  },

  // Get specific task submission by Submission ID
  // FIXED: First param is now submissionId (was Student_ID - wrong)
  // FIXED: Added studentId param for access control
  // FIXED: Appends ?role=student&user_id=<student_id> as required by backend
  // Backend: GET /api/student/task-submissions/list/<submission_id>?role=student&user_id=<student_id>
  getById: async (submissionId, studentId = null) => {
    try {
      if (!submissionId) {
        throw new Error('Submission ID is required');
      }
      
      // FIXED: Build URL with required query params
      let url = `/api/student/task-submissions/list/${submissionId}`;
      if (studentId) {
        url += `?role=student&user_id=${studentId}`;
      }

      const response = await apiRequest(url, {
        method: 'GET'
      });
      
      console.log('API Response for task submission getById:', response);
      return response;
    } catch (error) {
      console.error('API Error in task submission getById:', error);
      throw new Error(`Failed to fetch task submission: ${error.message}`);
    }
  },

  // Update task submission - matching Django backend
  // FIXED: First param is submissionId (the submission record ID, not student ID)
  // Backend: PUT /api/student/task-submissions/update/<submission_id>
  // Required: FormData with Student_ID, optionally new Task_Submit file
  update: async (submissionId, submissionData) => {
    try {
      if (!submissionId) {
        throw new Error('Submission ID is required');
      }
      
      // submissionData should be FormData with Student_ID and optionally Task_Submit
      const response = await apiRequest(`/api/student/task-submissions/update/${submissionId}`, {
        method: 'PUT',
        body: submissionData, // FormData object
        // Don't set Content-Type header for FormData
      });
      
      console.log('API Response for task submission update:', response);
      return response;
    } catch (error) {
      console.error('API Error in task submission update:', error);
      throw new Error(`Failed to update task submission: ${error.message}`);
    }
  },

  // Delete task submission by Submission ID
  // FIXED: Added studentId param for access control
  // FIXED: Appends ?role=student&user_id=<student_id> for backend access check
  // Backend: DELETE /api/student/task-submissions/remove/<submission_id>?role=student&user_id=<student_id>
  remove: async (submissionId, studentId = null) => {
    try {
      if (!submissionId) {
        throw new Error('Submission ID is required');
      }
      
      // FIXED: Build URL with access control query params
      let url = `/api/student/task-submissions/remove/${submissionId}`;
      if (studentId) {
        url += `?role=student&user_id=${studentId}`;
      }

      const response = await apiRequest(url, {
        method: 'DELETE'
      });
      
      console.log('API Response for task submission delete:', response);
      return response;
    } catch (error) {
      console.error('API Error in task submission delete:', error);
      throw new Error(`Failed to delete task submission: ${error.message}`);
    }
  },

  // Simplified view submission file method
  // FIXED: First param is submissionId (not Student_ID)
  // FIXED: Added studentId param for access control
  // FIXED: Appends ?role=student&user_id=<student_id> as required by backend
  // Backend: GET /api/student/task-submissions/view-submission/<submission_id>?role=student&user_id=<student_id>
  // Returns: JSON { url: "https://s3-presigned-url..." }
  viewSubmission: async (submissionId, studentId = null) => {
    try {
      if (!submissionId) {
        throw new Error('Submission ID is required');
      }
      
      // FIXED: Build URL with access control query params
      let url = `/api/student/task-submissions/view-submission/${submissionId}`;
      if (studentId) {
        url += `?role=student&user_id=${studentId}`;
      }

      console.log(`Making request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to get more detailed error info
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else if (contentType && contentType.includes('text/')) {
            const errorText = await response.text();
            if (errorText.includes('<!DOCTYPE html>')) {
              errorMessage = 'Backend returned HTML page instead of file - check Django URL configuration';
            } else {
              errorMessage = errorText.substring(0, 200); // First 200 chars
            }
          }
        } catch (parseError) {
          console.log('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error in viewSubmission:', error);
      throw error;
    }
  },

  // Alternative method to download file directly
  // FIXED: First param is submissionId (not Student_ID)
  // FIXED: Added studentId param for access control
  // FIXED: Appends ?role=student&user_id=<student_id>
  downloadSubmission: async (submissionId, studentId = null, filename = null) => {
    try {
      if (!submissionId) {
        throw new Error('Submission ID is required');
      }
      
      // FIXED: Build URL with access control query params
      let url = `/api/student/task-submissions/view-submission/${submissionId}`;
      if (studentId) {
        url += `?role=student&user_id=${studentId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      // Check if response is JSON with presigned URL
      const contentType = response.headers.get('content-type');
      let blob;

      if (contentType && contentType.includes('application/json')) {
        // Backend returns { url: "presigned-s3-url" }
        const data = await response.json();
        if (data.url) {
          const fileResponse = await fetch(data.url);
          if (!fileResponse.ok) {
            throw new Error(`File download from S3 failed: ${fileResponse.status}`);
          }
          blob = await fileResponse.blob();
        } else {
          throw new Error('No download URL returned from server');
        }
      } else {
        // Direct file response (legacy)
        blob = await response.blob();
      }

      // Create blob and trigger download
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || `submission_${submissionId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error in downloadSubmission:', error);
      throw error;
    }
  },

  // Method to check if the file endpoint is working
  // FIXED: Added studentId param for access control
  testFileEndpoint: async (submissionId, studentId = null) => {
    try {
      let url = `/api/student/task-submissions/view-submission/${submissionId}`;
      if (studentId) {
        url += `?role=student&user_id=${studentId}`;
      }

      const response = await fetch(url, {
        method: 'HEAD', // Only get headers, not content
      });
      
      return {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        headers: [...response.headers.entries()]
      };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Get submission details (JSON data, not file)
  // FIXED: First param is submissionId (not Student_ID)
  // FIXED: Added studentId param for access control
  // FIXED: Appends ?role=student&user_id=<student_id>
  // Backend: GET /api/student/task-submissions/list/<submission_id>?role=student&user_id=<student_id>
  getSubmissionDetails: async (submissionId, studentId = null) => {
    try {
      if (!submissionId) {
        throw new Error('Submission ID is required');
      }
      
      // FIXED: Build URL with access control query params
      let url = `/api/student/task-submissions/list/${submissionId}`;
      if (studentId) {
        url += `?role=student&user_id=${studentId}`;
      }

      const response = await apiRequest(url, {
        method: 'GET'
      });
      
      console.log('API Response for submission details:', response);
      return response;
    } catch (error) {
      console.error('API Error in get submission details:', error);
      throw new Error(`Failed to get submission details: ${error.message}`);
    }
  },

  // Debug endpoint to check database contents
  debugStudents: async () => {
    try {
      const response = await apiRequest('/api/debug/students', {
        method: 'GET'
      });
      
      console.log('API Response for debug students:', response);
      return response;
    } catch (error) {
      console.error('API Error in debug students:', error);
      throw new Error(`Failed to get debug information: ${error.message}`);
    }
  }
};

// Helper function to create a student name lookup API call
export const getStudentName = async (studentId) => {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }
    
    const response = await fetch(`/api/get-student-name/${studentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      // Check if it's a JSON response with error details
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Student not found');
      } else {
        throw new Error('Student not found');
      }
    }
    
    const data = await response.json();
    return data.student_name || data.name || '';
    
  } catch (error) {
    console.error('API Error in get student name:', error);
    throw new Error(`Failed to get student name: ${error.message}`);
  }
};

// Enhanced helper function with better error handling
export const getStudentNameEnhanced = async (studentId) => {
  try {
    if (!studentId) {
      return { success: false, error: 'Student ID is required' };
    }
    
    const response = await fetch(`/api/get-student-name/${studentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { 
        success: false, 
        error: 'Student name endpoint not available (returns HTML instead of JSON)' 
      };
    }
    
    const data = await response.json();
    
    if (response.ok) {
      const studentName = data.student_name || data.name || '';
      return { 
        success: true, 
        studentName: studentName,
        data: data 
      };
    } else {
      return { 
        success: false, 
        error: data.error || 'Student not found' 
      };
    }
    
  } catch (error) {
    console.error('API Error in enhanced get student name:', error);
    return { 
      success: false, 
      error: error.message.includes('Unexpected token') 
        ? 'Student name endpoint not available (HTML response)' 
        : error.message 
    };
  }
};

// Function to check if debug endpoint is available
export const checkDebugEndpoint = async () => {
  try {
    const response = await fetch('/api/debug/students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, error: 'Debug endpoint not available' };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message.includes('Unexpected token') 
        ? 'Debug endpoint not implemented' 
        : error.message 
    };
  }
};

// Enhanced error handler utility function
export const handleAPIError = (error, context = 'API operation') => {
  console.error(`❌ Error in ${context}:`, error);
  
  // Common error patterns and user-friendly messages
  const errorPatterns = {
    'Failed to fetch': 'Unable to connect to the server. Please check your internet connection and try again.',
    'NetworkError': 'Network connection failed. Please check your internet connection.',
    '404': 'The requested resource was not found. Please contact your administrator.',
    '403': 'You do not have permission to perform this action.',
    '401': 'Your session has expired. Please log in again.',
    '500': 'Internal server error. Please try again later or contact support.',
    'HTML page instead of file': 'Server configuration issue. The API is returning a webpage instead of the expected file.',
    'Unexpected token': 'Server response format error. Please contact your administrator.',
    'Student ID is required': 'Student ID is missing. Please provide a valid Student ID.',
    'Task_ID is required': 'Task ID is missing. Please select a task before submitting.',
    'already submitted': 'You have already submitted for this task. Use the update option to resubmit.',
    'not assigned to your batch': 'This task is not assigned to your batch. You cannot submit to it.',
    'cors': 'Cross-origin request blocked. Please contact your administrator.',
  };
  
  // Find matching error pattern
  const errorMessage = error.message || error.toString();
  const matchedPattern = Object.keys(errorPatterns).find(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (matchedPattern) {
    return {
      userMessage: errorPatterns[matchedPattern],
      technicalMessage: errorMessage,
      errorCode: matchedPattern
    };
  }
  
  // Generic fallback
  return {
    userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    technicalMessage: errorMessage,
    errorCode: 'UNKNOWN_ERROR'
  };
};