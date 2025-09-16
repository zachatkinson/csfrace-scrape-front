# CSFrace Scrape Frontend

> **Enterprise-grade TypeScript frontend with SOLID architecture** — A modern, scalable web application for WordPress to Shopify content scraping and conversion.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-5.13.5-orange.svg)](https://astro.build/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![SOLID](https://img.shields.io/badge/Architecture-SOLID-green.svg)](https://en.wikipedia.org/wiki/SOLID)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🚀 What is CSFrace Scrape Frontend?

A production-ready, enterprise-grade frontend application built with modern web technologies and architectural patterns. This application provides a beautiful, intuitive interface for scraping WordPress content and converting it for Shopify stores.

### ✨ Key Highlights

- 🏗️ **SOLID Architecture** — Complete implementation of SOLID principles for maintainable, scalable code
- 🎨 **Liquid Glass Design System** — Beautiful, modern UI inspired by Apple's design language
- ⚡ **Performance First** — Optimized for speed with lazy loading, code splitting, and efficient rendering
- 🔒 **Type Safety** — 100% TypeScript with strict configuration and comprehensive type coverage
- 🛡️ **Enterprise Ready** — Production-tested with Docker, monitoring, and comprehensive error handling

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [API Integration](#-api-integration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Features

### Core Functionality
- **📊 Dashboard** — Real-time job monitoring with filtering, sorting, and batch operations
- **🔗 URL Processing** — Single URL and batch URL scraping with intelligent validation
- **⚙️ Settings Management** — Comprehensive configuration with persistent storage
- **🔐 Authentication** — OAuth integration with secure token management
- **📱 Responsive Design** — Mobile-first approach with seamless desktop experience

### Technical Features
- **🔄 Real-time Updates** — WebSocket integration for live job status updates
- **🎨 Design System** — Modular liquid glass components with strategy patterns
- **📝 Form Management** — Standardized form system with validation and error handling
- **🛠️ Service Architecture** — Dependency injection with service containers
- **🔍 Type Safety** — Comprehensive TypeScript interfaces and type checking

### User Experience
- **⚡ Fast Loading** — Optimized assets and progressive enhancement
- **♿ Accessible** — WCAG compliant with keyboard navigation and screen reader support
- **🌙 Modern UI** — Glass morphism effects with smooth animations and transitions
- **📊 Data Visualization** — Clear job status indicators and progress tracking

## 🏗️ Architecture

This project implements **SOLID principles** throughout the codebase:

```
src/
├── components/          # UI Components
│   ├── forms/          # Standardized form system with BaseForm pattern
│   ├── liquid-glass/   # Design system with strategy patterns
│   ├── scraping/       # Domain-specific scraping components
│   └── settings/       # Configuration management components
├── services/           # Service layer (Dependency Inversion)
│   ├── implementations/ # Concrete service implementations
│   ├── AuthProvider.ts # Authentication service
│   ├── ServiceContainer.ts # IoC container
│   └── JobProcessingService.ts # Job management
├── strategies/         # Strategy pattern implementations
├── hooks/              # Custom React hooks
├── interfaces/         # TypeScript interfaces (Interface Segregation)
├── utils/              # Pure utility functions
└── constants/          # Application constants
```

### Design Patterns Used

- **🏭 Service Layer** — Clean separation of concerns with dependency injection
- **🔄 Strategy Pattern** — Flexible job status management and glass variants
- **🏪 Repository Pattern** — Abstracted data access layer
- **🔗 Observer Pattern** — Real-time updates and state management
- **📦 Container Pattern** — Dependency injection container for services

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** (recommended) or npm
- **Docker** (optional, for containerized development)

### Installation

```bash
# Clone the repository
git clone https://github.com/zachatkinson/csfrace-scrape-front.git
cd csfrace-scrape-front

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### Docker Development

```bash
# Using the wrapper repository
git clone --recurse-submodules https://github.com/zachatkinson/csfrace-scrape.git
cd csfrace-scrape

# Start all services (frontend, backend, database)
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose logs -f frontend
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production
pnpm preview          # Preview production build locally

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix linting issues
pnpm type-check       # TypeScript type checking
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run test suite
pnpm test:coverage    # Generate coverage report
pnpm test:e2e         # Run end-to-end tests
```

### Development Workflow

1. **Feature Development** — Create feature branches from `main`
2. **Code Quality** — All code must pass TypeScript, ESLint, and tests
3. **Testing** — Write tests for new features and bug fixes
4. **Documentation** — Update relevant documentation
5. **Pull Request** — Create PR with clear description and context

### Environment Configuration

```bash
# Core Configuration
VITE_API_BASE_URL=http://localhost:8000    # Backend API URL
VITE_WS_URL=ws://localhost:8000/ws         # WebSocket URL

# Feature Flags
VITE_ENABLE_OAUTH=true                     # OAuth authentication
VITE_ENABLE_MONITORING=true                # Performance monitoring
VITE_ENABLE_DEBUG=false                    # Debug mode

# UI Configuration
VITE_THEME=dark                            # Default theme
VITE_ANIMATION_SPEED=300                   # Animation timing
```

## 📁 Project Structure

<details>
<summary>Click to expand detailed project structure</summary>

```
csfrace-scrape-front/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── auth/             # Authentication components
│   │   ├── forms/            # Standardized form system
│   │   │   ├── BaseForm.tsx  # Base form component
│   │   │   ├── StandardizedLoginForm.tsx
│   │   │   └── StandardizedUrlForms.tsx
│   │   ├── layout/           # Layout components
│   │   ├── liquid-glass/     # Design system
│   │   │   ├── strategies/   # Glass variant strategies
│   │   │   ├── LiquidButton.tsx
│   │   │   └── LiquidCard.tsx
│   │   ├── scraping/         # Scraping-specific UI
│   │   ├── settings/         # Settings management
│   │   └── wordpress/        # WordPress-specific components
│   ├── contexts/             # React contexts
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── ThemeContext.tsx  # Theme management
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts        # Authentication hook
│   │   ├── useScrapingForm.ts # Form management
│   │   └── useWebSocket.ts   # WebSocket connection
│   ├── interfaces/           # TypeScript interfaces
│   │   ├── forms.ts          # Form-related types
│   │   └── services.ts       # Service interfaces
│   ├── lib/                  # Core libraries
│   │   ├── api-client.ts     # API client configuration
│   │   └── auth-storage.ts   # Authentication storage
│   ├── pages/                # Astro pages
│   │   ├── index.astro       # Homepage
│   │   └── dashboard.astro   # Dashboard page
│   ├── services/             # Service layer
│   │   ├── implementations/  # Service implementations
│   │   ├── AuthProvider.ts   # Authentication service
│   │   ├── ServiceContainer.ts # IoC container
│   │   └── JobProcessingService.ts
│   ├── strategies/           # Strategy pattern implementations
│   ├── styles/              # Global styles
│   │   ├── globals.css       # Global CSS
│   │   └── liquid-glass.css  # Design system styles
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── astro.config.ts          # Astro configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
├── docker-compose.yml       # Docker configuration
└── .env.example             # Environment variables template
```
</details>

## 🔌 API Integration

This frontend integrates with the [CSFrace Scrape Backend](https://github.com/zachatkinson/csfrace-scrape) via REST APIs and WebSocket connections.

### Key API Endpoints

```typescript
// Job Management
POST /api/jobs                 // Create new scraping job
GET /api/jobs                  // List jobs with filtering
GET /api/jobs/:id              // Get job details
DELETE /api/jobs/:id           // Cancel/delete job

// Batch Operations
POST /api/jobs/batch           // Create multiple jobs
PUT /api/jobs/batch            // Update multiple jobs

// Authentication
POST /api/auth/login           // User login
POST /api/auth/oauth/:provider // OAuth authentication
GET /api/auth/me               // Get current user

// Real-time Updates
WS /api/ws                     // WebSocket for live updates
```

### Service Architecture

```typescript
// Service container with dependency injection
const container = new ServiceContainer({
  api: new RestApiService(apiConfig),
  auth: new CustomAuthService(authConfig),
  storage: new BrowserStorageService(),
  notifications: new ToastNotificationService()
});

// Usage in components
const { api, auth } = useServiceContainer();
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview

# Deploy to Netlify (configured)
pnpm deploy
```

### Docker Production

```bash
# Build production image
docker build -t csfrace-frontend .

# Run production container
docker run -p 3000:3000 csfrace-frontend
```

### Environment Variables

Production deployments require these environment variables:

```bash
VITE_API_BASE_URL=https://api.csfrace.com
VITE_WS_URL=wss://api.csfrace.com/ws
VITE_OAUTH_CLIENT_ID=your_oauth_client_id
VITE_SENTRY_DSN=your_sentry_dsn
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following our coding standards
4. Run tests: `pnpm test`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards

- **TypeScript** — All code must be typed, no `any` types allowed
- **SOLID Principles** — Follow SOLID principles in all new code
- **Testing** — Write tests for new features and bug fixes
- **Documentation** — Update documentation for API changes
- **Conventional Commits** — Use conventional commit messages

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Integration tests  
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

## 📈 Performance

This application is optimized for performance:

- **Lazy Loading** — Components and routes loaded on demand
- **Code Splitting** — Automatic code splitting with Vite
- **Asset Optimization** — Images and assets optimized for web
- **Bundle Analysis** — Regular bundle size monitoring
- **Core Web Vitals** — Optimized for Google's Core Web Vitals

## 🐛 Issues and Support

- **Bug Reports** — [Create an issue](https://github.com/zachatkinson/csfrace-scrape-front/issues/new?template=bug_report.md)
- **Feature Requests** — [Request a feature](https://github.com/zachatkinson/csfrace-scrape-front/issues/new?template=feature_request.md)
- **Documentation** — [View full documentation](https://docs.csfrace.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Astro](https://astro.build/) and [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Design inspired by Apple's design language
- Architecture follows SOLID principles

---

<div align="center">
  <strong>Built with ❤️ by the CSFrace Team</strong><br>
  <sub>Making WordPress to Shopify migration effortless</sub>
</div>