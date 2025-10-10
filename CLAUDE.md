# CSFRACE Scrape Frontend - Development Standards

## Project Overview

This is an Astro-based frontend application for scraping and displaying content from URLs, built with React components and Tailwind CSS.

## 🚨 CRITICAL: DOCKER LIGHTNINGCSS FIX 🚨

**MANDATORY DOCKER LIGHTNINGCSS ARM64 SOLUTION - NEVER FORGET THIS!**

If you EVER see this error in Docker containers:

```
Cannot find module '../pkg'
Require stack:
- /app/node_modules/lightningcss/node/index.js
```

**IMMEDIATE SOLUTION - Copy this EXACT Dockerfile configuration:**

```dockerfile
# CRITICAL: lightningcss ARM64 workaround (still required as of 2025)
# Using build arg instead of hardcoded platform to satisfy Docker linting
# Default to linux/amd64 to fix lightningcss native binary issues on ARM64 Macs
# See: https://github.com/parcel-bundler/lightningcss/issues/335
ARG BUILDPLATFORM=linux/amd64
FROM --platform=${BUILDPLATFORM} node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
# MANDATORY: Install WASM package to fix missing ../pkg directory
RUN npm install lightningcss-wasm --save-optional
# MANDATORY: Create the missing pkg directory with WASM fallback
RUN mkdir -p node_modules/lightningcss/pkg && \
    cp -r node_modules/lightningcss-wasm/* node_modules/lightningcss/pkg/ || true
COPY . .
```

**This fixes the fundamental ARM64 + Docker + lightningcss incompatibility issue.**

**Root Cause**: lightningcss native binaries don't work properly in ARM64 Docker environments, causing the `../pkg` directory to be missing, which breaks Tailwind 4 CSS processing.

**Why This Works**:

1. `ARG BUILDPLATFORM=linux/amd64` + `--platform=${BUILDPLATFORM}` forces AMD64 emulation (works on ARM64 Macs, Docker-lint compliant)
2. `lightningcss-wasm` provides WASM fallback when native binaries fail
3. Manual `pkg` directory creation bridges the gap between native and WASM versions
4. Build arg approach satisfies Docker linting while maintaining the workaround

**NEVER try these failed approaches again:**

- ❌ Environment variables (CSS_TRANSFORMER_WASM=1) - doesn't work
- ❌ Architecture-specific npm install flags - doesn't work
- ❌ Manual binary downloads - too complex and fragile
- ❌ Downgrading to Tailwind 3 - absolutely forbidden

**If this happens again: Copy the Dockerfile section above EXACTLY.**

## 🚨 CRITICAL: NO LOCAL SERVICES RULE 🚨

**NEVER CREATE LOCAL AUTHENTICATION OR API SERVICES IN THE FRONTEND**

This project has a **complete Docker backend** at `http://localhost:8000` with enterprise-grade APIs:

- ✅ **Authentication**: `/auth/token`, `/auth/register`, `/auth/me`, `/auth/refresh`
- ✅ **OAuth**: `/auth/oauth/providers`, `/auth/oauth/login`, `/auth/oauth/{provider}/callback`
- ✅ **Passkeys**: `/auth/passkeys/register/begin`, `/auth/passkeys/authenticate/complete`
- ✅ **Security**: `/auth/lockout-status`, `/auth/revoke-token`, `/auth/revocation-stats`
- ✅ **User Management**: `/auth/users`, `/auth/change-password`, `/auth/password-reset`

**Frontend should ONLY:**

- Make simple `fetch()` calls to Docker backend APIs
- Manage browser state (React Context for UI)
- Handle forms and UI interactions
- Store tokens in localStorage/sessionStorage

**Frontend should NEVER:**

- Create `AuthProvider`, `TokenManager`, `OAuthHandler` services
- Implement JWT token validation or refresh logic
- Create database models or ORM abstractions
- Duplicate functionality that exists in Docker backend

**Example of CORRECT approach:**

```typescript
// ✅ GOOD: Simple API client
const login = async (email, password) => {
  const response = await fetch('http://localhost:8000/auth/token', {
    method: 'POST',
    body: new FormData()...
  });
  return response.json();
};
```

**Example of WRONG approach:**

```typescript
// ❌ BAD: Local services that duplicate Docker functionality
class AuthService {
  private tokenManager = new TokenManager();
  private oauthHandler = new OAuthHandler();
  async login() {
    /* complex logic */
  }
}
```

**When in doubt: Check if the endpoint exists in Docker first!**

```bash
curl -s http://localhost:8000/openapi.json | jq -r '.paths | keys[]'
```

## Core Development Principles

### 1. SOLID Principles

- **Single Responsibility**: Each component/function should have one clear purpose
- **Open/Closed**: Code should be open for extension but closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for their base classes
- **Interface Segregation**: Many client-specific interfaces are better than one general-purpose interface
- **Dependency Inversion**: Depend on abstractions, not concretions

### 2. DRY (Don't Repeat Yourself)

- No duplicate code blocks
- Extract common functionality into reusable utilities
- Use custom hooks for shared React logic
- Create reusable Astro components for common layouts

### 3. Zero Technical Debt Policy

- Fix issues immediately when discovered
- Refactor code before adding new features if needed
- Document all workarounds with TODO comments and tickets

## TypeScript Standards

### Configuration Requirements

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Safety Rules

- **NO `any` types** - Use `unknown` if type is truly unknown
- All function parameters must be typed
- All function return types must be explicitly declared
- Use interface for object shapes, type for unions/intersections
- Prefer const assertions for literal types

### Naming Conventions

- **Interfaces**: PascalCase with 'I' prefix (e.g., `IScrapedData`)
- **Types**: PascalCase (e.g., `ScrapingStatus`)
- **Enums**: PascalCase for name, UPPER_SNAKE_CASE for values
- **Components**: PascalCase (e.g., `ScraperDashboard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useScrapeData`)
- **Utilities**: camelCase (e.g., `parseScrapedContent`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)

## React/Astro Component Standards

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import type { IComponentProps } from './types';

// 2. Type definitions
interface ILocalState {
  // ...
}

// 3. Component
export const ComponentName: React.FC<IComponentProps> = ({ prop1, prop2 }) => {
  // 4. Hooks
  const [state, setState] = useState<ILocalState>();

  // 5. Effects
  useEffect(() => {
    // ...
  }, []);

  // 6. Handlers
  const handleClick = () => {
    // ...
  };

  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Astro Component Standards

- Use TypeScript in frontmatter
- Separate data fetching from rendering
- Use content collections for structured data
- Implement proper error boundaries

## Scraping Standards

### Data Validation

- Validate all scraped data against schemas
- Sanitize HTML content before display
- Implement rate limiting for scraping requests
- Handle network errors gracefully

### Error Handling

```typescript
interface IScrapingError {
  code: string;
  message: string;
  url?: string;
  timestamp: Date;
  retryable: boolean;
}

class ScrapingError extends Error {
  constructor(public readonly error: IScrapingError) {
    super(error.message);
    this.name = "ScrapingError";
  }
}
```

### Rate Limiting

- Implement exponential backoff for retries
- Respect robots.txt and rate limits
- Queue scraping requests appropriately
- Monitor and log scraping performance

## Security Requirements

### Input Validation

- Validate all URLs before scraping
- Sanitize scraped content to prevent XSS
- Use Content Security Policy headers
- Implement CORS properly

### Data Protection

- Never expose API keys in frontend code
- Use environment variables for sensitive config
- Implement proper authentication if needed
- Sanitize all user inputs

## State Management

### Guidelines

- Use React Context for global state
- Implement proper loading/error states
- Use optimistic updates where appropriate
- Cache scraped data appropriately

### State Structure

```typescript
interface IAppState {
  scraping: {
    queue: IScrapeRequest[];
    active: IScrapeJob[];
    completed: IScrapedData[];
    errors: IScrapingError[];
  };
  ui: {
    isLoading: boolean;
    notification: INotification | null;
  };
}
```

## Server-Sent Events (SSE) Architecture

### SSE Best Practices - MANDATORY PATTERNS

This project uses **Server-Sent Events (SSE)** for real-time communication between backend and frontend. All SSE implementations **MUST** follow the DRY/SOLID architecture patterns established in this codebase.

#### Architecture Overview

```
Backend (Python/FastAPI)
    ↓ Redis Pub/Sub
    ↓ BaseSSEService (abstract base class)
    ↓ HealthSSEService, PerformanceSSEService, JobSSEService
    ↓ SSE Endpoints (/health/stream, /performance/stream, /jobs/stream)
    ↓
Frontend (Astro/TypeScript)
    ↓ BaseSSEClient (abstract base class)
    ↓ PerformanceSSEService, JobSSEService
    ↓ Nanostores (healthStore, jobsStore)
    ↓ React Components (reactive UI updates)
```

### MANDATORY: BaseSSEClient Pattern

**ALL frontend SSE services MUST extend BaseSSEClient**. Never create standalone SSE implementations.

#### Creating a New SSE Service

```typescript
// ✅ CORRECT: Extend BaseSSEClient
import { BaseSSEClient } from "./BaseSSEClient";
import type { SSEEvent } from "./BaseSSEClient";

export class MySSEService extends BaseSSEClient {
  constructor() {
    super("MySSEService", false); // serviceName, withCredentials
  }

  // REQUIRED: Return SSE endpoint path
  protected getEndpoint(): string {
    return "/my/stream";
  }

  // REQUIRED: Register event handlers
  protected registerEventHandlers(): void {
    this.on<MyEvent>("my-event", (event) => {
      // Handle event
      // Update nanostore for reactive UI
    });
  }

  // REQUIRED: Handle connection event
  protected handleConnectionEvent(event: MessageEvent): void {
    const connectionData = JSON.parse(event.data);
    this.logger.info("Connected", { connectionData });
  }

  // REQUIRED: Handle initial data
  protected handleInitialData(event: MessageEvent): void {
    const initialData = JSON.parse(event.data);
    // Initialize nanostore with initial data
  }
}

// REQUIRED: Export singleton instance
export const mySSEService = new MySSEService();
```

#### BaseSSEClient Features (Built-in)

- ✅ **Exponential backoff retry** with jitter (prevents thundering herd)
- ✅ **Max 5 retries** with configurable delay (default 5s)
- ✅ **Connection state management** (isConnected, retryCount)
- ✅ **Lifecycle hooks** (beforeConnect, afterConnect, onDisconnect)
- ✅ **Event handler registration** with automatic JSON parsing
- ✅ **Structured logging** with context
- ✅ **Auth support** via withCredentials flag
- ✅ **@microsoft/fetch-event-source** integration for cookie authentication

#### Why @microsoft/fetch-event-source? (CRITICAL)

**MANDATORY: Native `EventSource` CANNOT send cookies with requests!**

The native browser EventSource API has a fundamental limitation: it doesn't send HTTP-only cookies with SSE requests. This breaks authentication for cookie-based auth systems.

**Problem with Native EventSource:**

```typescript
// ❌ WRONG: Native EventSource (no cookies sent)
const eventSource = new EventSource("/jobs/stream");
// Result: 401 Unauthorized (cookies not sent to backend)
```

**Solution: @microsoft/fetch-event-source**

```typescript
// ✅ CORRECT: fetch-event-source (cookies automatically sent)
await fetchEventSource("/jobs/stream", {
  credentials: "include", // Sends cookies!
  // ... other options
});
// Result: Authenticated SSE connection
```

**BaseSSEClient Implementation:**

```typescript
// BaseSSEClient.ts (line 207-209)
await fetchEventSource(sseUrl, {
  signal: this.abortController.signal,
  credentials: this.withCredentials ? "include" : "same-origin", // Cookie support
  // ... rest of configuration
});
```

**Key Benefits:**

- ✅ **Cookie Authentication**: Automatically sends HTTP-only cookies
- ✅ **CORS Support**: Handles cross-origin requests properly
- ✅ **Retry Logic**: Built-in retry with exponential backoff
- ✅ **AbortController**: Proper cancellation support
- ✅ **TypeScript**: Full type safety

### Nanostore Integration (MANDATORY)

**ALL SSE services MUST update nanostores for reactive UI**. Never use callbacks alone.

#### Why Nanostores?

- 🎯 **286 bytes** - Minimal bundle size
- 🎯 **Framework-agnostic** - Works with Astro, React, Vue, vanilla JS
- 🎯 **Reactive** - Components automatically re-render on state changes
- 🎯 **Type-safe** - Full TypeScript support
- 🎯 **Astro-recommended** - Official state management solution

#### Nanostore Architecture

```typescript
// ✅ CORRECT: Nanostore pattern (see jobsStore.ts, healthStore.ts)
import { atom, map, computed } from 'nanostores';

// Core data store (Map for O(1) lookup)
export const $myData = map<MyState>({
  items: new Map<string, MyItem>(),
  metadata: {
    total: 0,
    lastUpdate: null,
    sseConnected: false,
  },
});

// Computed stores (auto-recalculate)
export const $myList = computed($myData, (state) => {
  return Array.from(state.items.values());
});

// Store actions (single responsibility functions)
export function initializeData(data: InitialData): void {
  const itemsMap = new Map<string, MyItem>();
  data.items.forEach((item) => itemsMap.set(item.id, item));
  $myData.set({ items: itemsMap, metadata: { ... } });
}

export function upsertItem(item: MyItem): void {
  const currentState = $myData.get();
  const updatedItems = new Map(currentState.items);
  updatedItems.set(item.id, item);
  $myData.set({ items: updatedItems, metadata: { ... } });
}
```

#### Using Stores in React Components

```typescript
// ✅ CORRECT: useStore hook for reactive updates
import { useStore } from '@nanostores/react';
import { $myList, $myData } from '../stores/myStore';

export const MyComponent: React.FC = () => {
  const myList = useStore($myList); // Automatically re-renders
  const myData = useStore($myData);

  return (
    <div>
      {myList.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

### SSE Event Handling Patterns

#### Pattern 1: Store-Only (Recommended)

```typescript
// ✅ BEST: Update store only, components react automatically
protected registerEventHandlers(): void {
  this.on<MyEvent>('my-event', (event) => {
    // Update nanostore (triggers React re-render)
    upsertItem(this._eventToItem(event));
  });
}
```

#### Pattern 2: Store + Callbacks (Advanced)

```typescript
// ✅ GOOD: Store updates + optional callbacks for custom logic
private onMyEventCallback?: (event: MyEvent) => void;

protected registerEventHandlers(): void {
  this.on<MyEvent>('my-event', (event) => {
    // Update store (reactive UI)
    upsertItem(this._eventToItem(event));

    // Call optional callback (custom logic beyond store)
    this.onMyEventCallback?.(event);
  });
}

// Public API for custom logic
public onMyEvent(callback: (event: MyEvent) => void): void {
  this.onMyEventCallback = callback;
}
```

### SSE Connection Lifecycle

#### Initialization in MainLayout.astro

```typescript
// ✅ CORRECT: Global singleton pattern
<script>
  import { mySSEService } from '/src/services/MySSEService.ts';

  if (!window.__mySSEService) {
    window.__mySSEService = mySSEService;

    document.addEventListener('DOMContentLoaded', () => {
      window.__mySSEService?.connect();
    });

    window.addEventListener('beforeunload', () => {
      window.__mySSEService?.disconnect();
    });
  }
</script>
```

#### Connection Status Tracking

```typescript
// ✅ CORRECT: Track connection status in store
export const $sseConnected = atom<boolean>(false);

export function setSSEConnectionStatus(connected: boolean): void {
  $sseConnected.set(connected);
  // Also update in main data store
  const currentState = $myData.get();
  $myData.setKey('metadata', {
    ...currentState.metadata,
    sseConnected: connected,
  });
}

// In SSE service lifecycle hooks
protected afterConnect(): void {
  setSSEConnectionStatus(true);
}

protected onDisconnect(): void {
  setSSEConnectionStatus(false);
}
```

### ANTI-PATTERNS (NEVER DO THIS)

#### ❌ Manual EventSource Management

```typescript
// ❌ WRONG: Manual EventSource (duplicates BaseSSEClient logic)
class BadSSEService {
  private eventSource: EventSource | null = null;

  connect() {
    this.eventSource = new EventSource('/my/stream');
    this.eventSource.onopen = () => { ... };
    this.eventSource.onerror = () => { ... };
  }
}
```

#### ❌ Callback-Only (No Store)

```typescript
// ❌ WRONG: Callbacks only (not reactive, requires prop drilling)
class BadSSEService extends BaseSSEClient {
  private onEventCallback?: (event) => void;

  protected registerEventHandlers(): void {
    this.on("my-event", (event) => {
      // NO STORE UPDATE - components must pass callbacks down
      this.onEventCallback?.(event);
    });
  }
}
```

#### ❌ Creating SSE Endpoints in Frontend

```typescript
// ❌ WRONG: Frontend API routes for SSE (backend handles this)
// /pages/api/my/stream.ts
export const GET = async () => {
  // NEVER create SSE endpoints in frontend
  // Backend already provides /my/stream
};
```

#### ❌ Direct State in Components

```typescript
// ❌ WRONG: Local useState for SSE data (not shared across components)
const MyComponent: React.FC = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    mySSEService.onEvent((event) => {
      setData((prev) => [...prev, event]); // Not shared with other components
    });
  }, []);
};
```

### SSE Testing Checklist

Before deploying SSE changes:

- [ ] Service extends BaseSSEClient
- [ ] All abstract methods implemented (getEndpoint, registerEventHandlers, handleConnectionEvent, handleInitialData)
- [ ] Updates nanostore for reactive UI
- [ ] Singleton instance exported
- [ ] Connection status tracked in store
- [ ] Lifecycle hooks implemented (afterConnect, onDisconnect)
- [ ] Event handlers have proper error handling
- [ ] TypeScript types defined for all events
- [ ] Tested with backend SSE endpoint
- [ ] Verified exponential backoff retry works
- [ ] Confirmed no memory leaks (cleanup on unmount)

### Reference Implementations

**Perfect Examples:**

- `/src/services/BaseSSEClient.ts` - Abstract base class (340 lines)
- `/src/services/PerformanceSSEService.ts` - Store-only pattern (150 lines)
- `/src/services/JobSSEService.ts` - Store + callbacks pattern (271 lines)
- `/src/stores/jobsStore.ts` - Nanostore implementation (370 lines)
- `/src/stores/healthStore.ts` - Nanostore implementation (415 lines)

**Code Reduction Achieved:**

- PerformanceSSEService: 250→150 lines (40% reduction)
- JobSSEService: 348→271 lines (22% reduction)
- **Total: ~970 lines eliminated** via BaseSSEClient abstraction

## Backend Integration Standards

### Architecture Overview

The frontend communicates with a Python-based backend (csfrace-scrape) that handles WordPress to Shopify content conversion. The backend follows async/concurrent patterns and provides REST APIs for job management.

### Backend Repository Structure

- **Backend**: `https://github.com/zachatkinson/csfrace-scrape` (Python/FastAPI)
- **Frontend**: Current repository (Astro/React/TypeScript)
- **Development Wrapper**: Future repository combining both projects

### API Communication Standards

#### Expected Backend Endpoints

```typescript
interface IBackendEndpoints {
  // Content conversion
  "/api/convert": {
    method: "POST";
    body: IConversionRequest;
    response: IConversionResponse;
  };

  // Batch processing
  "/api/batch": {
    method: "POST";
    body: IBatchRequest;
    response: IBatchJobResponse;
  };

  // Job status
  "/api/jobs/:jobId": {
    method: "GET";
    response: IJobStatus;
  };

  // Health check
  "/api/health": {
    method: "GET";
    response: IHealthStatus;
  };
}
```

#### Request/Response Types

```typescript
interface IConversionRequest {
  url: string;
  options?: {
    preserveStyles?: boolean;
    downloadImages?: boolean;
    customCSS?: string;
  };
}

interface IConversionResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: {
    html: string;
    images: string[];
    metadata: Record<string, any>;
  };
  error?: IScrapingError;
}
```

### Cross-Repository Standards

#### Shared Types

Create a shared types package or maintain synchronized type definitions:

```typescript
// shared-types.ts
export interface IWordPressContent {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  categories?: string[];
  tags?: string[];
  publishDate: Date;
}

export interface IShopifyContent {
  handle: string;
  title: string;
  bodyHtml: string;
  excerpt?: string;
  image?: {
    src: string;
    alt?: string;
  };
  tags: string[];
  publishedAt: string;
}
```

#### Error Handling Coordination

```typescript
// Align with backend error codes
enum BackendErrorCode {
  RATE_LIMIT = "RATE_LIMIT",
  INVALID_URL = "INVALID_URL",
  PARSE_ERROR = "PARSE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
}

class BackendError extends Error {
  constructor(
    public code: BackendErrorCode,
    public message: string,
    public retryable: boolean = false,
  ) {
    super(message);
  }
}
```

### Development Environment Setup

#### Environment Variables

```env
# Backend connection
VITE_API_URL=http://localhost:8000
VITE_API_KEY=development-key
VITE_API_TIMEOUT=30000

# WebSocket connection (if implemented)
VITE_WS_URL=ws://localhost:8000/ws

# Feature flags
VITE_ENABLE_BATCH_PROCESSING=true
VITE_MAX_CONCURRENT_JOBS=5
```

#### Docker Compose Development

When using the development wrapper repository:

```yaml
# docker-compose.dev.yml
version: "3.8"
services:
  backend:
    build: ./csfrace-scrape
    ports:
      - "8000:8000"
    environment:
      - ENV=development

  frontend:
    build: ./csfrace-scrape-front
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:8000
    depends_on:
      - backend
```

## API/Network Standards

### Axios Configuration

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": import.meta.env.VITE_API_KEY,
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry on 503 or timeout
    if (
      (error.response?.status === 503 || error.code === "ECONNABORTED") &&
      !originalRequest._retry &&
      originalRequest._retryCount < 3
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Exponential backoff
      const delay = Math.pow(2, originalRequest._retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
```

### WebSocket Standards (Socket.io)

- Implement reconnection logic with exponential backoff
- Handle connection state properly in React context
- Clean up listeners on component unmount
- Use typed events matching backend definitions
- Implement heartbeat/ping-pong for connection health

## Styling Standards

### Tailwind CSS Guidelines

- Use utility classes for styling
- Create component classes for repeated patterns
- Follow mobile-first responsive design
- Use CSS variables for theming

### Component Styling

```tsx
// Prefer utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// Extract repeated patterns
const cardStyles = "p-4 bg-white rounded-lg shadow-md";
```

## Testing Requirements

### Test Coverage

- Minimum 80% code coverage
- 100% coverage for critical paths
- Test all error scenarios
- Test edge cases

### Test Structure

```typescript
describe("ComponentName", () => {
  describe("when mounted", () => {
    it("should render without errors", () => {
      // ...
    });
  });

  describe("when scraping", () => {
    it("should handle successful response", () => {
      // ...
    });

    it("should handle network errors", () => {
      // ...
    });
  });
});
```

## Performance Standards

### Optimization Requirements

- Lazy load components where appropriate
- Implement virtual scrolling for large lists
- Optimize images and assets
- Use React.memo for expensive components
- Implement proper caching strategies

### Bundle Size

- Monitor bundle size with each build
- Code split by route
- Tree shake unused dependencies
- Use dynamic imports for large libraries

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance tasks

### Commit Messages

Follow Conventional Commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Pre-commit Checks

- TypeScript compilation must pass
- No ESLint errors
- All tests must pass
- Code must be formatted

## Deployment Standards

### Environment Variables

```env
# Required environment variables
PUBLIC_API_URL=
PUBLIC_SOCKET_URL=
SCRAPING_API_KEY=
RATE_LIMIT_REQUESTS=
RATE_LIMIT_WINDOW=
```

### Build Process

1. Run `npm run build`
2. Verify TypeScript compilation
3. Run tests
4. Check bundle size
5. Deploy to Netlify

### Monitoring

- Implement error tracking (e.g., Sentry)
- Monitor performance metrics
- Track scraping success rates
- Set up alerts for failures

## Documentation Requirements

### Code Documentation

- JSDoc for all public functions
- README for each major module
- Inline comments for complex logic
- Type definitions must be self-documenting

### API Documentation

- Document all endpoints
- Include request/response examples
- Document error codes
- Maintain changelog

## Code Review Checklist

Before submitting PR:

- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Code coverage meets requirements
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance optimized
- [ ] Documentation updated
- [ ] Follows naming conventions
- [ ] No duplicate code

## Continuous Improvement

### Regular Tasks

- Weekly dependency updates
- Monthly performance audits
- Quarterly security reviews
- Continuous refactoring

### Technical Debt Management

- Document all debt in issues
- Prioritize debt reduction
- Allocate time for refactoring
- Prevent new debt creation

---

## Quick Reference Commands

```bash
# Development
npm run dev          # Start dev server

# Testing
npm test            # Run tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report

# Building
npm run build       # Production build
npm run preview    # Preview production build

# Code Quality
npm run lint        # Run ESLint
npm run type-check  # TypeScript check
npm run format      # Format code
```

## Important Notes

1. **Always validate scraped content** - Never trust external data
2. **Implement proper error boundaries** - Prevent app crashes
3. **Use TypeScript strictly** - No bypassing with any
4. **Follow React best practices** - Hooks rules, memo, etc.
5. **Optimize for performance** - This is a data-heavy application
6. **Security first** - Sanitize, validate, protect

Remember: The goal is to build a maintainable, scalable, and secure scraping frontend that provides excellent user experience while handling potentially unreliable external data sources.
