#!/usr/bin/env node

import { createServer } from 'http';
import { URL } from 'url';

const PORT = 8000;

// Mock API responses
const mockResponses = {
  '/health': {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  },
  '/api/convert': {
    jobId: 'mock-job-123',
    status: 'completed',
    result: {
      html: '<h1>Mock Converted Content</h1>',
      images: [],
      metadata: { title: 'Mock Article' },
    },
  },
  '/api/jobs/mock-job-123': {
    jobId: 'mock-job-123',
    status: 'completed',
    progress: 100,
    result: {
      html: '<h1>Mock Converted Content</h1>',
      images: [],
      metadata: { title: 'Mock Article' },
    },
  },
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Set content type
  res.setHeader('Content-Type', 'application/json');

  // Find matching mock response
  const mockResponse = mockResponses[path];

  if (mockResponse) {
    res.writeHead(200);
    res.end(JSON.stringify(mockResponse));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', path }));
  }
});

server.listen(PORT, () => {
  console.log(`🔧 Mock backend server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  Object.keys(mockResponses).forEach(path => {
    console.log(`  • http://localhost:${PORT}${path}`);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock backend server...');
  server.close(() => {
    console.log('✅ Mock backend server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down mock backend server...');
  server.close(() => {
    console.log('✅ Mock backend server stopped');
    process.exit(0);
  });
});