// =============================================================================
// EXAMPLE: HOW TO REPLACE CONSOLE.LOG WITH ENVIRONMENT-BASED LOGGING
// =============================================================================

import { logHealth, logDebug, logError, logApiResponse } from './logger.ts';

// Mock imports for demonstration (replace with actual imports in production)
const CONFIG = { API_URL: 'http://localhost:8000' };
const ENDPOINTS = { HEALTH: '/health' };
const HttpClient = {
  getWithRetry: async (_url: string) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ status: 'healthy', version: '1.0.0' })
  })
};

// =============================================================================
// ❌ BEFORE: Direct console.log (shows in all environments)
// =============================================================================

// Example demonstration function (removed for production)

// =============================================================================
// ✅ AFTER: Environment-based logging (clean production output)
// =============================================================================

// Example demonstration function (removed for production)

// =============================================================================
// 🎯 RESULT: CLEAN CONSOLE OUTPUT BY ENVIRONMENT
// =============================================================================

/*
DEVELOPMENT MODE (DEV=true):
🔍 Raw backend health response {...}
📊 Metrics update: backend {...}
✅ backend health: healthy {...}

PRODUCTION MODE (DEV=false):
[2025-01-15T10:30:45.123Z] [WARN] Connection timeout exceeded
[2025-01-15T10:30:45.456Z] [ERROR] API call failed: 500 Internal Server Error
*/

// =============================================================================
// 🚀 ADVANCED: STRUCTURED LOGGING FOR BETTER DEBUGGING
// =============================================================================

async function exampleHealthCheck() {
  const startTime = Date.now();
  
  try {
    logDebug('Starting backend health check', { url: ENDPOINTS.HEALTH });
    
    const response = await HttpClient.getWithRetry(`${CONFIG.API_URL}${ENDPOINTS.HEALTH}`);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      
      // 🎯 Clean, structured logging
      logApiResponse(response.status, '/health', data);
      logHealth('backend', data.status, { responseTime, version: data.version });
      
      return {
        status: 'up',
        data,
        responseTime
      };
    } else {
      logError('Backend health check failed', { 
        status: response.status, 
        statusText: response.statusText,
        responseTime 
      });
      
      return { status: 'down', error: response.statusText };
    }
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logError('Backend health check error', {
      error: errorMessage,
      responseTime,
      stack: errorStack
    });

    return { status: 'error', error: errorMessage };
  }
}

export { exampleHealthCheck };