// src/services/API/compilerService.js
// ═══════════════════════════════════════════════════════════════════
// Compiler Service — Routes through YOUR backend (no external API!)
//
// HOW IT WORKS:
//   Frontend → Your FastAPI backend → subprocess → Result
//   No Piston, no external API, no 401 errors, free forever.
//
// REQUIRES: Backend endpoint POST /weekend_mocktest/api/code/execute
// ═══════════════════════════════════════════════════════════════════

// Your backend URL (same one your app already uses)
const BACKEND_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'https://192.168.48.201:8090'
).replace(/\/$/, '');

// Build the code execution endpoint
const getExecuteUrl = () => {
  if (BACKEND_URL) {
    return `${BACKEND_URL}/weekend_mocktest/api/code/execute`;
  }
  // Fallback: same origin (works if frontend and backend share domain)
  return '/weekend_mocktest/api/code/execute';
};

const EXECUTE_URL = getExecuteUrl();

// ─── Language Configurations ───
export const LANGUAGES = [
  {
    id: 'python',
    label: 'Python 3',
    pistonId: 'python',
    version: '3.10.0',
    ext: '.py',
    monacoId: 'python',
    defaultCode: `# Write your solution here\ndef solution():\n    # Your code here\n    pass\n\n# Test your solution\nif __name__ == "__main__":\n    solution()`,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    pistonId: 'javascript',
    version: '18.15.0',
    ext: '.js',
    monacoId: 'javascript',
    defaultCode: `// Write your solution here\nfunction solution() {\n  // Your code here\n}\n\n// Test your solution\nsolution();`,
  },
  {
    id: 'java',
    label: 'Java',
    pistonId: 'java',
    version: '15.0.2',
    ext: '.java',
    monacoId: 'java',
    defaultCode: `public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n        solution();\n    }\n\n    public static void solution() {\n        // Your code here\n    }\n}`,
  },
  {
    id: 'cpp',
    label: 'C++',
    pistonId: 'c++',
    version: '10.2.0',
    ext: '.cpp',
    monacoId: 'cpp',
    defaultCode: `#include <iostream>\nusing namespace std;\n\n// Write your solution here\nvoid solution() {\n    // Your code here\n}\n\nint main() {\n    solution();\n    return 0;\n}`,
  },
  {
    id: 'c',
    label: 'C',
    pistonId: 'c',
    version: '10.2.0',
    ext: '.c',
    monacoId: 'c',
    defaultCode: `#include <stdio.h>\n\n// Write your solution here\nvoid solution() {\n    // Your code here\n}\n\nint main() {\n    solution();\n    return 0;\n}`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    pistonId: 'typescript',
    version: '5.0.3',
    ext: '.ts',
    monacoId: 'typescript',
    defaultCode: `// Write your solution here\nfunction solution(): void {\n  // Your code here\n}\n\n// Test your solution\nsolution();`,
  },
 
  {
    id: 'go',
    label: 'Go',
    pistonId: 'go',
    version: '1.21.0',
    ext: '.go',
    monacoId: 'go',
    defaultCode: `package main\n\nimport "fmt"\n\n// Write your solution here\nfunc solution() {\n    // Your code here\n    fmt.Println("Hello, World!")\n}\n\nfunc main() {\n    solution()\n}`,
  },
];

// ─── Execute Code via Backend ───
export const executeCode = async (languageId, code, stdin = '') => {
  const langConfig = LANGUAGES.find(l => l.id === languageId);
  if (!langConfig) {
    throw new Error(`Unsupported language: ${languageId}`);
  }

  if (!code || code.trim().length === 0) {
    return {
      success: false,
      stdout: '',
      stderr: 'No code provided.',
      output: '',
      exitCode: -1,
      executionTime: '0ms',
      memory: 'N/A',
      language: langConfig.label,
    };
  }

  if (code.length > 100000) {
    return {
      success: false,
      stdout: '',
      stderr: 'Code exceeds maximum size limit (100KB).',
      output: '',
      exitCode: -1,
      executionTime: '0ms',
      memory: 'N/A',
      language: langConfig.label,
    };
  }

  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(EXECUTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        language: languageId,
        code: code,
        stdin: stdin,
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const elapsed = Math.round(performance.now() - startTime);

    return {
      success: data.success || false,
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      output: data.stdout || '',
      exitCode: data.exit_code ?? -1,
      signal: null,
      executionTime: `${data.execution_time_ms || elapsed}ms`,
      memory: 'N/A',
      language: data.language || langConfig.label,
      isCompileError: data.is_compile_error || false,
      isRuntimeError: data.is_runtime_error || false,
      isTimeout: data.is_timeout || false,
    };
  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime);

    if (error.name === 'AbortError') {
      return {
        success: false,
        stdout: '',
        stderr: 'Code execution timed out. Your code may have an infinite loop.',
        output: '',
        exitCode: -1,
        signal: null,
        executionTime: `${elapsed}ms`,
        memory: 'N/A',
        language: langConfig.label,
        isCompileError: false,
        isRuntimeError: false,
        isTimeout: true,
      };
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return {
        success: false,
        stdout: '',
        stderr: 'Unable to reach the server. Please check your internet connection and try again.',
        output: '',
        exitCode: -1,
        signal: null,
        executionTime: `${elapsed}ms`,
        memory: 'N/A',
        language: langConfig?.label || languageId,
        isCompileError: false,
        isRuntimeError: false,
        isTimeout: false,
        isNetworkError: true,
      };
    }

    return {
      success: false,
      stdout: '',
      stderr: error.message,
      output: '',
      exitCode: -1,
      signal: null,
      executionTime: `${elapsed}ms`,
      memory: 'N/A',
      language: langConfig?.label || languageId,
      isCompileError: false,
      isRuntimeError: false,
      isTimeout: error.message.includes('timed out') || error.message.includes('infinite loop'),
      isNetworkError: false,
    };
  }
};

// ─── Run Test Cases ───
export const runTestCases = async (languageId, code, testCases = []) => {
  const results = [];

  for (const tc of testCases) {
    try {
      const result = await executeCode(languageId, code, tc.input || '');
      const actualOutput = (result.stdout || '').trim();
      const expectedOutput = (tc.expected || '').trim();

      const isExactMatch = actualOutput === expectedOutput;
      const isPartialMatch = expectedOutput && actualOutput.toLowerCase().includes(expectedOutput.toLowerCase());

      results.push({
        ...tc,
        actualOutput: actualOutput,
        passed: isExactMatch || isPartialMatch,
        executionTime: result.executionTime,
        error: result.stderr || null,
        isCompileError: result.isCompileError,
        isRuntimeError: result.isRuntimeError,
        isTimeout: result.isTimeout,
      });
    } catch (err) {
      results.push({
        ...tc,
        actualOutput: '',
        passed: false,
        executionTime: 'N/A',
        error: err.message,
        isCompileError: false,
        isRuntimeError: true,
        isTimeout: false,
      });
    }
  }

  return {
    results,
    totalPassed: results.filter(r => r.passed).length,
    totalFailed: results.filter(r => !r.passed).length,
    totalCases: results.length,
    allPassed: results.every(r => r.passed),
  };
};

// ─── Get Available Runtimes (from backend) ───
export const getAvailableRuntimes = async () => {
  try {
    const url = EXECUTE_URL.replace('/execute', '/languages');
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch runtimes');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch runtimes:', error);
    return [];
  }
};

// ─── Health Check ───
export const testCompilerConnection = async () => {
  try {
    const result = await executeCode('python', 'print("OK")', '');
    return {
      connected: result.stdout.trim() === 'OK',
      latency: result.executionTime,
      message: result.stdout.trim() === 'OK' ? 'Compiler connected' : 'Unexpected output',
      server: 'backend-local',
    };
  } catch (error) {
    return {
      connected: false,
      latency: 'N/A',
      message: error.message,
      server: 'none',
    };
  }
};

export default {
  LANGUAGES,
  executeCode,
  runTestCases,
  getAvailableRuntimes,
  testCompilerConnection,
};