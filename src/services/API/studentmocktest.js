// src/services/API/studentmocktest.js
import { assessmentApiRequest } from './index2';

export const mockTestAPI = {
  // Start a new mock test - POST /weekend_mocktest/api/test/start
  startTest: async (testConfig = {}) => {
    try {
      console.log('API: Starting mock test with config:', testConfig);
      
      const response = await assessmentApiRequest('/weekend_mocktest/api/test/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testConfig)
      });
      
      console.log('API Response for start test:', response);
      return response;
    } catch (error) {
      console.error('API Error in startTest:', error);
      throw new Error(`Failed to start test: ${error.message}`);
    }
  },

  // Submit a single answer - POST /weekend_mocktest/api/test/submit
  submitAnswer: async (answerData) => {
    try {
      if (!answerData) {
        throw new Error('Answer data is required');
      }
      
      console.log('API: Submitting answer:', answerData);
      
      const response = await assessmentApiRequest('/weekend_mocktest/api/test/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData)
      });
      
      console.log('API Response for submit answer:', response);
      return response;
    } catch (error) {
      console.error('API Error in submitAnswer:', error);
      throw new Error(`Failed to submit answer: ${error.message}`);
    }
  },

  // Get test results - GET /weekend_mocktest/api/test/results/{test_id}
  getTestResults: async (testId) => {
    try {
      if (!testId) {
        throw new Error('Test ID is required');
      }
      
      console.log('API: Getting test results for:', testId);
      
      const response = await assessmentApiRequest(`/weekend_mocktest/api/test/results/${testId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('API Response for test results:', response);
      
      // Transform response for frontend consistency
      return {
        testId: response.testId || response.test_id || testId,
        score: response.score || 0,
        totalQuestions: response.totalQuestions || response.total_questions || 0,
        scorePercentage: response.scorePercentage || response.score_percentage || 0,
        analytics: response.analytics || response.detailed_feedback || '',
        sectionScores: response.sectionScores || response.section_scores || {},
        pdfAvailable: response.pdfAvailable !== false,
        timestamp: response.timestamp || Date.now(),
        raw: response
      };
    } catch (error) {
      console.error('API Error in getTestResults:', error);
      throw new Error(`Failed to get test results: ${error.message}`);
    }
  },

  // Download PDF results - GET /weekend_mocktest/api/test/pdf/{test_id}
  downloadResultsPDF: async (testId) => {
    try {
      if (!testId) {
        throw new Error('Test ID is required');
      }
      
      console.log('API: Downloading PDF for test:', testId);
      
      const baseUrl = import.meta.env.VITE_ASSESSMENT_API_URL || 'https://192.168.48.201:8090';
      const url = `${baseUrl}/weekend_mocktest/api/test/pdf/${testId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.blob();
    } catch (error) {
      console.error('API Error in downloadResultsPDF:', error);
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  },

  // ════════════════════════════════════════════════════════════
  // FIXED: Helper method to prepare test start request
  // Now properly handles all non-dev variations
  // ════════════════════════════════════════════════════════════
  prepareStartTestRequest: (options = {}) => {
    let userType = options.user_type || options.userType || 'dev';
    
    console.log('📝 Original user_type received:', userType);
    
    // Normalize developer variations
    if (userType === 'developer') {
      userType = 'dev';
    }
    
    // ════════════════════════════════════════════════════════════
    // FIXED: Handle ALL non-developer variations
    // ════════════════════════════════════════════════════════════
    if (userType === 'non-developer' || 
        userType === 'non-dev' || 
        userType === 'nondev' || 
        userType === 'non_developer' ||
        userType === 'nondeveloper') {
      userType = 'non_dev';
      console.log('✅ Converted to non_dev');
    }
    
    // Final validation
    if (!['dev', 'non_dev'].includes(userType)) {
      console.warn(`⚠️ Invalid user_type: ${userType}, defaulting to 'dev'`);
      userType = 'dev';
    }
    
    console.log('📤 Final user_type for API:', userType);
    
    return {
      user_type: userType,
      student_id: options.student_id || null,
      timestamp: Date.now()
    };
  },

  // Start test with prepared configuration
  startTestWithConfig: async (options = {}) => {
    try {
      const config = mockTestAPI.prepareStartTestRequest(options);
      console.log('Prepared config for API:', config);
      
      const response = await mockTestAPI.startTest(config);
      
      console.log('🚀 RAW API Response:', JSON.stringify(response, null, 2));
      
      // Extract exam structure
      const examStructure = response.examStructure || response.exam_structure || {
        sections: {
          aptitude: { question_count: 9, time_per_question_sec: 120 },
          theory: { question_count: 9, time_per_question_sec: 120 },
          coding: { question_count: 5, time_per_question_sec: 300 }
        }
      };
      
      // Determine question type for first question - FIRST question is ALWAYS aptitude for dev
      let questionType = response.questionType || response.question_type;
      console.log('📝 Raw question_type from backend:', questionType);
      
      if (!questionType || questionType === 'unknown') {
        // First question is always aptitude for developer test
        questionType = 'aptitude';
        console.log('⚠️ No question_type received, defaulting to:', questionType);
      } else {
        questionType = questionType.toLowerCase().trim();
        // Normalize
        if (questionType.includes('aptitude') || questionType.includes('logical')) {
          questionType = 'aptitude';
        } else if (questionType.includes('coding') || questionType.includes('code')) {
          questionType = 'coding';
        } else if (questionType.includes('theory') || questionType.includes('concept') || questionType.includes('mcq')) {
          questionType = 'mcq';
        }
      }
      
      console.log('✅ Final question_type:', questionType);
      
      const timeLimit = response.timeLimit || response.time_limit || 
        (questionType === 'coding' ? 300 : 120);
      
      // Get section info from backend
      const sectionInfo = response.section_info || response.sectionInfo || {};
      const sectionProgress = response.section_progress || response.sectionProgress || {};
      
      // Transform response for frontend
      const transformedResponse = {
        testId: response.testId || response.test_id,
        sessionId: response.sessionId || response.session_id,
        userType: response.userType || response.user_type,
        totalQuestions: response.totalQuestions || response.total_questions,
        timeLimit: timeLimit,
        duration: response.duration || (timeLimit / 60),
        examStructure: examStructure,
        sectionInfo: sectionInfo,
        
        // Current question data
        currentQuestion: {
          questionNumber: response.questionNumber || response.question_number || 1,
          questionHtml: response.questionHtml || response.question_html,
          questionType: questionType,
          options: response.options,
          timeLimit: timeLimit,
          title: response.title || '',
          sectionQuestionNumber: sectionProgress.current_in_section || 1,
          sectionTotalQuestions: sectionProgress.total_in_section || 9
        },
        
        raw: response.raw || response
      };
      
      console.log('✅ Transformed response:', transformedResponse);
      return transformedResponse;
    } catch (error) {
      console.error('Error starting test with config:', error);
      throw error;
    }
  },

  // Submit answer with proper formatting
  submitAnswerWithData: async (testId, questionNumber, answer) => {
    try {
      if (!testId || !questionNumber) {
        throw new Error('Test ID and question number are required');
      }
      
      const answerData = {
        test_id: testId,
        question_number: parseInt(questionNumber),
        answer: answer || ''
      };
      
      console.log('Sending answer data:', answerData);
      
      const response = await mockTestAPI.submitAnswer(answerData);
      
      // Check if test is completed
      if (response.testCompleted || response.test_completed) {
        return {
          testCompleted: true,
          score: response.score || 0,
          totalQuestions: response.totalQuestions || response.total_questions,
          scorePercentage: response.scorePercentage || response.score_percentage,
          analytics: response.analytics || response.detailed_feedback || 'Test completed successfully',
          sectionScores: response.sectionScores || response.section_scores || {},
          pdfAvailable: response.pdfAvailable !== false
        };
      } else {
        // More questions remaining
        const nextQuestion = response.nextQuestion || response.next_question;
        
        // Determine question type from backend
        let questionType = nextQuestion.questionType || nextQuestion.question_type || 'mcq';
        questionType = questionType.toLowerCase();
        
        // Normalize
        if (questionType.includes('aptitude') || questionType.includes('logical')) {
          questionType = 'aptitude';
        } else if (questionType.includes('coding') || questionType.includes('code')) {
          questionType = 'coding';
        } else if (questionType.includes('theory') || questionType.includes('concept') || questionType.includes('mcq')) {
          questionType = 'mcq';
        }
        
        // Get time limit
        const timeLimit = nextQuestion.timeLimit || nextQuestion.time_limit || 
          (questionType === 'coding' ? 300 : 120);
        
        // Get section progress from backend
        const sectionProgress = response.section_progress || response.sectionProgress || {};
        
        return {
          testCompleted: false,
          nextQuestion: {
            questionNumber: nextQuestion.questionNumber || nextQuestion.question_number,
            totalQuestions: nextQuestion.totalQuestions || nextQuestion.total_questions,
            questionHtml: nextQuestion.questionHtml || nextQuestion.question_html,
            questionType: questionType,
            title: nextQuestion.title || '',
            options: nextQuestion.options,
            timeLimit: timeLimit,
            // Section-specific info from backend
            sectionQuestionNumber: nextQuestion.section_question_number || nextQuestion.sectionQuestionNumber || sectionProgress.current_in_section || 1,
            sectionTotalQuestions: nextQuestion.section_total_questions || nextQuestion.sectionTotalQuestions || sectionProgress.total_in_section || 9
          },
          // Section navigation from backend
          sectionJustCompleted: response.section_just_completed || response.sectionJustCompleted,
          nextSectionStarting: response.next_section_starting || response.nextSectionStarting,
          sectionProgress: sectionProgress,
          currentSection: response.current_section || response.currentSection
        };
      }
    } catch (error) {
      console.error('Error submitting answer with data:', error);
      throw error;
    }
  },

  // Validate test configuration
  validateTestConfig: (config) => {
    const errors = [];
    
    const userType = config.user_type || config.userType;
    if (!userType) {
      errors.push('User type is required');
    } else if (!['dev', 'non_dev', 'developer', 'non-developer', 'non-dev', 'nondev'].includes(userType)) {
      errors.push('User type must be "dev", "non_dev", "developer", or "non-developer"');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate answer submission data
  validateAnswerData: (testId, questionNumber, answer) => {
    const errors = [];
    
    if (!testId || typeof testId !== 'string') {
      errors.push('Valid test ID is required');
    }
    
    if (!questionNumber || questionNumber < 1) {
      errors.push('Valid question number is required');
    }
    
    if (answer === undefined || answer === null) {
      errors.push('Answer is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await assessmentApiRequest('/weekend_mocktest/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      return response;
    } catch (error) {
      console.error('API Error in healthCheck:', error);
      throw new Error(`Health check failed: ${error.message}`);
    }
  },

  // Test API connection
  testAPIConnection: async () => {
    try {
      console.log('Testing API connection...');
      const health = await mockTestAPI.healthCheck();
      console.log('API Health Check Response:', health);
      return { status: 'success', health };
    } catch (error) {
      console.error('API Connection Test Failed:', error);
      return { status: 'failed', error: error.message };
    }
  },

  // Get all tests (for admin/debugging)
  getAllTests: async () => {
    try {
      console.log('API: Getting all tests');
      
      const response = await assessmentApiRequest('/weekend_mocktest/api/tests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('API Response for all tests:', response);
      return response;
    } catch (error) {
      console.error('API Error in getAllTests:', error);
      throw new Error(`Failed to get all tests: ${error.message}`);
    }
  },

  // Error handling helper
  handleAPIError: (error, context = 'API call') => {
    console.error(`${context} failed:`, error);
    
    if (error.message.includes('Failed to fetch')) {
      return new Error('Network connection failed. Please check your internet connection and try again.');
    } else if (error.message.includes('404')) {
      return new Error('Test not found. Please start a new test.');
    } else if (error.message.includes('500')) {
      return new Error('Server error. Please try again later.');
    } else {
      return error;
    }
  },

  // Get user-friendly error messages
  getErrorMessage: (error) => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  },

  // ═══════════════════════════════════════════════════════════════
  // CODE EXECUTION APIs (HackerRank-style test case runner)
  // ═══════════════════════════════════════════════════════════════

  // Get visible test cases for a coding question
  getTestCases: async (testId, questionNumber) => {
    try {
      const response = await assessmentApiRequest(
        `/weekend_mocktest/api/code/test-cases/${testId}/${questionNumber}`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch test cases:', error);
      return { test_cases: [], total_visible: 0, total_hidden: 0, total_cases: 0 };
    }
  },

  // Run code against test cases via backend Piston
 runCodeTests: async (language, code, testCases, testId = null, questionNumber = null) => {
    try {
      const response = await assessmentApiRequest(
        '/weekend_mocktest/api/code/run-tests',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language,
            code,
            test_cases: testCases,
            test_id: testId,
            question_number: questionNumber,
          }),
        }
      );
      return response;
    } catch (error) {
      console.error('Run tests failed:', error);
      throw error;
    }
  },

  // Execute code with custom input via backend
  executeCodeViaBackend: async (language, code, stdin) => {
    try {
      const response = await assessmentApiRequest(
        '/weekend_mocktest/api/code/execute',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code, stdin }),
        }
      );
      return response;
    } catch (error) {
      console.error('Code execution failed:', error);
      throw error;
    }
  },

  // Submit code for final evaluation (runs hidden tests too)
  submitCode: async (testId, questionNumber, language, code) => {
    try {
      const response = await assessmentApiRequest(
        '/weekend_mocktest/api/code/submit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_id: testId,
            question_number: questionNumber,
            language,
            code,
          }),
        }
      );
      return response;
    } catch (error) {
      console.error('Code submit failed:', error);
      throw error;
    }
  },
};