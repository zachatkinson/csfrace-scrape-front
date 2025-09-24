# CSFrace Scrape Frontend

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-5.13.5-orange.svg)](https://astro.build/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![SOLID](https://img.shields.io/badge/Architecture-SOLID-green.svg)](https://en.wikipedia.org/wiki/SOLID)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Modern Astro-powered frontend for the CSFrace WordPress-to-Shopify content conversion platform. Built with React 19 Islands architecture, TypeScript, and enterprise-grade UI components featuring the Liquid Glass design system.

## 🚀 Features

- **📊 Real-time Dashboard**: Monitor conversion jobs with live status updates via WebSocket
- **🎨 Liquid Glass Design**: Modern glass morphism UI inspired by Apple's design language
- **🔐 Enterprise Auth**: JWT + OAuth2 + WebAuthn/Passkeys authentication stack
- **⚡ Performance Optimized**: Islands architecture with lazy loading and code splitting
- **📱 Mobile-First**: Responsive design with seamless desktop experience
- **🛠 Developer Experience**: 100% TypeScript with strict mode and SOLID architecture

## 🛠 Technology Stack

- **[Astro 5.13.5](https://astro.build/)** - Modern static site generator with Islands architecture
- **[React 19](https://react.dev/)** - UI library with concurrent features and automatic batching
- **[TypeScript](https://www.typescriptlang.org/)** - 100% type coverage with strict configuration
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework with latest features
- **[Vite](https://vitejs.dev/)** - Fast build tool and development server

## 🏃‍♂️ Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Backend API** running at `http://localhost:8000`

### Installation

```bash
# Clone and install
git clone https://github.com/zachatkinson/csfrace-scrape-front.git
cd csfrace-scrape-front
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API endpoints

# Start development server
npm run dev
# Open http://localhost:4321
```

## 📜 Available Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start development server with hot reload |
| `npm run build`      | Build optimized production bundle        |
| `npm run preview`    | Preview production build locally         |
| `npm run type-check` | Run TypeScript type checking             |
| `npm run lint`       | Lint code with ESLint                    |
| `npm run format`     | Format code with Prettier                |

## 🏗 Architecture

Built with SOLID principles and modern design patterns:

```
src/
├── components/           # React UI components
│   ├── forms/           # Standardized form system
│   ├── liquid-glass/    # Design system components
│   └── layout/          # Layout and navigation
├── pages/               # Astro pages (SSG + Islands)
├── services/            # Service layer with DI
├── hooks/               # Custom React hooks
├── stores/              # Global state management
├── types/               # TypeScript definitions
└── utils/               # Pure utility functions
```

## 🔌 API Integration

Integrates with the [CSFrace Backend](https://github.com/zachatkinson/csfrace-scrape-back) for job management:

```bash
# Core Endpoints
POST   /jobs              # Create conversion job
GET    /jobs              # List user jobs
GET    /jobs/{id}         # Get job details
POST   /jobs/{id}/start   # Start job processing
POST   /jobs/{id}/cancel  # Cancel running job

# Authentication
POST   /auth/token        # Login with credentials
POST   /auth/refresh      # Refresh JWT token
GET    /auth/me          # Get current user

# Real-time Updates
WS     /ws/jobs/{id}     # Job status updates
SSE    /events          # Server-sent events
```

## 🚀 Deployment

### Production Build

```bash
npm run build           # Creates optimized dist/ folder
npm run preview        # Test production build locally
```

### Environment Variables

```bash
# Required for production
PUBLIC_API_URL=https://api.csfrace.com
PUBLIC_WS_URL=wss://api.csfrace.com/ws
PUBLIC_JWT_SECRET=your-jwt-secret
```

### Docker Deployment

```bash
docker build -t csfrace-frontend .
docker run -p 4321:4321 csfrace-frontend
```

## 🧪 Testing

```bash
npm test              # Unit tests with Vitest
npm run test:e2e      # End-to-end tests with Playwright
npm run test:coverage # Generate coverage report
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes following TypeScript and SOLID principles
4. Run tests: `npm test`
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push and create Pull Request

### Code Standards

- **TypeScript**: Strict mode, no `any` types
- **SOLID Principles**: Dependency injection and interface segregation
- **Testing**: Unit tests for new features
- **Documentation**: Update README for significant changes

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the CSFrace Development Team**
