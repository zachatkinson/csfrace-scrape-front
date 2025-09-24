import { vi } from "vitest";

// Mock global objects that might not be available in the test environment
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto for environments that don't have it
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => "test-uuid-123"),
    getRandomValues: vi.fn((arr: Uint8Array) => arr),
  },
});

// Setup fetch mock
global.fetch = vi.fn();

// Setup console methods to avoid noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // Keep error and warn for important messages
  error: originalConsole.error,
  warn: originalConsole.warn,
  // Mock info, log, debug to reduce test noise
  info: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
};
