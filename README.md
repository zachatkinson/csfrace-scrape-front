# CSFrace Scrape Frontend

**TypeScript-only** React/Astro frontend application for the CSFrace WordPress to Shopify content scraper and converter.

## 🚀 Features

- **100% TypeScript**: Zero JavaScript tolerance with strictest TypeScript configuration
- **Modern Stack**: Astro + React + TypeScript + Tailwind CSS
- **Real-time Updates**: WebSocket integration for live scraping status
- **Responsive Design**: Mobile-first UI with Headless UI components
- **Semantic Releases**: Automated versioning and changelog generation
- **Type Safety**: Comprehensive type checking with `astro check` integration
- **Development Standards**: Enforced via CLAUDE.md with SOLID principles

## 🛠 Tech Stack

- [Astro 5.13+](https://astro.build) - SSR-enabled static site generator with Netlify adapter
- [React 19](https://react.dev) - UI Library with latest features
- [TypeScript 5.9+](https://www.typescriptlang.org) - **Strictest configuration** (no JS allowed)
- [Tailwind CSS 3.4+](https://tailwindcss.com) - Utility-first styling
- [Headless UI](https://headlessui.com) - Accessible component primitives
- [Heroicons](https://heroicons.com) - SVG icon library
- [Axios](https://axios-http.com) - HTTP client with retry logic
- [Socket.IO Client](https://socket.io) - Real-time WebSocket communication
- [pnpm](https://pnpm.io) - Fast, disk space efficient package manager

## 🚦 Getting Started

### Prerequisites

- **Node.js 18+** and **pnpm** (recommended package manager)
- Backend API running at `http://localhost:8000` (see [csfrace-scrape](https://github.com/zachatkinson/csfrace-scrape))
- TypeScript knowledge (project is 100% TypeScript)

### Installation

```bash
# Clone the repository
git clone https://github.com/zachatkinson/csfrace-scrape-front.git
cd csfrace-scrape-front

# Install dependencies (uses pnpm for performance)
pnpm install

# Run type checking (recommended first step)
pnpm run check

# Start development server
pnpm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_API_KEY=development-key

# Feature flags
VITE_ENABLE_BATCH_PROCESSING=true
VITE_MAX_CONCURRENT_JOBS=5

# Development settings
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

## 📁 Project Structure

```
csfrace-scrape-front/
├── .github/workflows/   # GitHub Actions (semantic-release)
├── src/
│   └── pages/          # Astro pages (currently minimal)
├── public/             # Static assets
├── astro.config.ts     # Astro configuration (TypeScript)
├── tsconfig.json       # TypeScript config (strictest)
├── tailwind.config.js  # Tailwind configuration  
├── .env.example        # Environment variables template
├── .gitignore          # Comprehensive ignore rules
├── CLAUDE.md           # Development standards and rules
├── .releaserc.json     # Semantic release configuration
└── package.json        # Dependencies and scripts
```

**Planned structure** (as features are added):

```
src/
├── components/          # TypeScript React components
│   ├── ui/             # Base UI components
│   ├── forms/          # Scraping job forms
│   ├── layout/         # Layout components
│   └── dashboard/      # Dashboard components
├── pages/              # Astro pages (.astro files)
│   ├── api/           # API endpoints (.ts files)
│   └── dashboard/     # Dashboard pages
├── lib/               # Utilities and API clients (.ts)
├── hooks/             # React custom hooks (.ts)
├── types/             # Shared TypeScript definitions
└── styles/            # Global CSS and Tailwind
```

## 🎨 UI Components

Built with accessibility-first approach using Headless UI:

- **Forms**: Conversion job creation and configuration
- **Tables**: Job listings with sorting and filtering
- **Modals**: Job details and confirmation dialogs
- **Notifications**: Real-time status updates
- **Progress Bars**: Visual job progress indicators

## 🔐 Authentication

Supports multiple authentication methods:

- **Local Authentication**: Email/password with secure sessions
- **OAuth Providers**: Google, GitHub integration
- **JWT Tokens**: Secure API communication
- **Role-based Access**: Admin and user permissions

## 📊 Dashboard Features

### Job Management
- Create new conversion jobs
- Monitor job progress in real-time
- View detailed job logs and results
- Download converted content

### Batch Operations
- Upload multiple URLs for processing
- Configure conversion settings per batch
- Parallel processing with progress tracking

### Statistics
- Conversion success rates
- Performance metrics
- Historical data visualization

## 🌐 API Integration

The frontend communicates with the backend API:

- **REST API**: Job CRUD operations
- **WebSocket**: Real-time updates
- **File Upload**: Content and configuration files
- **Download**: Converted content retrieval

## 🚀 Deployment

### Netlify (Recommended)

```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Environment Configuration

Set production environment variables in Netlify:

- `API_BASE_URL`: Production backend URL
- `WS_BASE_URL`: Production WebSocket URL
- Authentication credentials

## 🧪 Development

### Available Scripts

```bash
pnpm run dev         # Start development server
pnpm run build       # Build with type checking (astro check && astro build)
pnpm run preview     # Preview production build
pnpm run check       # TypeScript type checking only
pnpm run type-check  # Alias for check command
pnpm run astro       # Direct Astro CLI access
```

### Code Quality & Standards

- **TypeScript Strictest**: `allowJs: false`, zero JavaScript tolerance
- **CLAUDE.md**: Comprehensive development standards document
- **Semantic Release**: Automated versioning based on conventional commits
- **Type Validation**: Integrated into build process via `astro check`
- **Backend Integration**: Typed API communication patterns
- **Error Handling**: Comprehensive error boundaries and retry logic

## 🔗 Related Repositories

- [csfrace-scrape](https://github.com/zachatkinson/csfrace-scrape) - Backend API and scraping engine

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow [CLAUDE.md](CLAUDE.md) development standards
4. Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
5. Ensure TypeScript checks pass (`pnpm run check`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated semantic versioning:

```bash
feat: add new scraping job dashboard component
fix: resolve TypeScript error in API client
docs: update README with TypeScript migration notes
chore: upgrade dependencies to latest versions
```

### Code Standards

- **100% TypeScript**: No JavaScript files allowed
- **Type Safety**: All functions must have explicit return types
- **Error Handling**: Comprehensive error boundaries required
- **Testing**: Minimum 80% code coverage (when tests are added)
- **Documentation**: JSDoc required for public functions

## 📞 Support

For support and questions:

- Create an [Issue](https://github.com/zachatkinson/csfrace-scrape-front/issues)
- Backend API issues: [csfrace-scrape Issues](https://github.com/zachatkinson/csfrace-scrape/issues)
