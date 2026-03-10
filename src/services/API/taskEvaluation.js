// ============================================================
// Task Evaluation API Service
// src/services/API/taskEvaluation.js
//
// Backend endpoint:
//   GET /api/student/task-evaluation/my-results/<student_id>
//
// Response shape (snake_case from Django backend):
//   { student_id, student_name, total_evaluations, evaluations: [
//       { task_name, submitted_date, evaluation_status, overall_score,
//         passed, rating, strengths, weaknesses, recommendations,
//         criteria_scores: { Task_Name, Objective, Tools_Software,
//           Steps_Performed, Code_Commands, Explanation, Conclusion } }
//   ]}
// ============================================================

const BASE_URL = '/api';

const getMyEvaluations = async (studentId) => {
  if (!studentId) throw new Error('Student ID is required');

  const response = await fetch(
    `${BASE_URL}/student/task-evaluation/my-results/${studentId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export const taskEvaluationAPI = {
  getMyEvaluations,
};
