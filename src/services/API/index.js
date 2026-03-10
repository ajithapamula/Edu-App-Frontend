// src/services/API/index.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://192.168.48.201:8005';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const getHeaders = (isFormData = false) => {
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const isFormData = options.body instanceof FormData;
  
  const config = {
    method: options.method || 'GET',
    headers: getHeaders(isFormData),
  };

  // Only add body for non-GET requests
  if (options.body && config.method !== 'GET') {
    config.body = options.body;
  }

  console.log(`API Request: ${config.method} ${url}`);

  try {
    const response = await fetch(url, config);
    
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log(`API Response [${response.status}]:`, responseData);
    
    if (!response.ok) {
      // ── FIX: Preserve the FULL response data on errors ──
      // This is critical for multi-account flows where backend sends
      // { "Error": "...", "Matched_Accounts": ["trainer", "student"] }
      const errorMessage = responseData?.Error || responseData?.error || responseData?.message || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.responseData = responseData;  // ← Attach full response data
      throw error;
    }
    
    return responseData;
    
  } catch (error) {
    console.error('API request failed:', error);
    // If it's already our enhanced error, re-throw as-is
    if (error.responseData !== undefined) {
      throw error;
    }
    // Network errors (CORS, connection refused, etc.)
    throw error;
  }
};

// Enhanced FormData creator for student registration
export const createStudentFormData = (data) => {
  const formData = new FormData();
  
  const directFields = [
    'Student_Code', 'First_Name', 'Last_Name', 'Email', 'Mobile_Number',
    'Alternate_Number', 'Password', 'Org_ID', 'Gender', 'Dob', 'Address',
    'State', 'Pincode', 'Country', 'Qualification', 'Passout_Year',
    'University_School', 'Govt_Id_Type', 'Govt_Id_Number', 'Course', 'Batch',
    'status'
  ];
  
  directFields.forEach(field => {
    if (data[field] !== null && data[field] !== undefined && data[field] !== '') {
      formData.append(field, data[field]);
    }
  });
  
  // ── Photo (base64) ──
  if (data.photo_base64) {
    formData.append('photo_base64', data.photo_base64);
  }
  
  // ── Voice (base64 + metadata) ──
  if (data.voice_base64) {
    formData.append('voice_base64', data.voice_base64);
    formData.append('voice_content_type', data.voice_content_type || 'audio/webm');
    if (data.voice_sentence) {
      formData.append('voice_sentence', data.voice_sentence);
    }
  }

  // ── Resume (PDF base64) ──
  if (data.resume_base64) {
    formData.append('resume_base64', data.resume_base64);
  }
  
  return formData;
};

export const createFormData = (data) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (data[key] instanceof File) {
      formData.append(key, data[key]);
    } else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  return formData;
};

export { API_BASE_URL };
