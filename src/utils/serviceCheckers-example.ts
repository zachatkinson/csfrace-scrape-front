// =============================================================================
// EXAMPLE: HOW TO REPLACE CONSOLE.LOG WITH ENVIRONMENT-BASED LOGGING
// =============================================================================

import { logger, logHealth, logDebug, logError, logApiResponse } from './logger.ts';

// =============================================================================
// ❌ BEFORE: Direct console.log (shows in all environments)
// =============================================================================

function oldApproach() {
  // Example variables for demonstration
  const data = {};
  const metricsData = {};
  const result = {};

  // This shows in both dev AND production
  console.log('🔍 Raw backend health response:', data); // DEBUG
  console.log('🔍 Building metrics from data:', metricsData);
  console.log('🔍 Formatted metrics result:', result); // DEBUG
}

// =============================================================================
// ✅ AFTER: Environment-based logging (clean production output)
// =============================================================================

function newApproach() {
  // Example variables for demonstration
  const data = {};
  const metricsData = {};
  const result = {};
  const response = { status: 200 };

  // Option 1: Use the logger instance
  logger.debug('Raw backend health response', data);
  logger.metrics('backend', metricsData);
  logger.debug('Formatted metrics result', result);

  // Option 2: Use convenience functions (recommended)
  logDebug('Raw backend health response', data);
  logApiResponse(response.status, '/health', data);
  logHealth('backend', 'healthy', result);
}

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
      const data = await response.tson();
      
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
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logError('Backend health check error', { 
      error: error.message, 
      responseTime,
      stack: error.stack 
    });
    
    return { status: 'error', error: error.message };
  }
}

export { exampleHealthCheck };