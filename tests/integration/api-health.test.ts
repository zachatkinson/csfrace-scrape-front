/**
 * API Integration Tests - Health Endpoints
 * Tests API endpoints without browser (true integration tests)
 */

import { describe, test, expect, beforeAll } from 'vitest';

const API_BASE_URL = process.env.SERVER_API_BASE_URL || 'http://localhost:8000';

describe('API Health Integration Tests', () => {
  beforeAll(async () => {
    // Wait for API to be ready
    const maxRetries = 10;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
        });
        if (response.ok) {
          break;
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`API not available after ${maxRetries} retries`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  test('GET /health should return 200 OK', async () => {
    const response = await fetch(`${API_BASE_URL}/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  test('GET /health should return health status object', async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(typeof data.status).toBe('string');
  });

  test('GET /health should respond within 5 seconds', async () => {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}/health`);
    const endTime = Date.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(5000);
  });
});
