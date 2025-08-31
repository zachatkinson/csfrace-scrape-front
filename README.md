# CSFrace Scrape Frontend

Modern React/Astro frontend application for the CSFrace WordPress to Shopify converter.

## 🚀 Features

- **Modern Stack**: Astro + React + TypeScript + Tailwind CSS
- **Real-time Updates**: WebSocket integration for live job status
- **Responsive Design**: Mobile-first UI with Headless UI components
- **Authentication**: Secure user authentication system
- **Dashboard**: Comprehensive job management interface
- **Batch Processing**: Support for bulk conversion operations

## 🛠 Tech Stack

- [Astro](https://astro.build) - Static Site Generator with SSR capabilities
- [React 19](https://react.dev) - UI Library
- [TypeScript](https://www.typescriptlang.org) - Type Safety
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Headless UI](https://headlessui.com) - Accessible Components
- [Heroicons](https://heroicons.com) - Icons
- [Axios](https://axios-http.com) - HTTP Client
- [Socket.IO](https://socket.io) - Real-time Communication

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running at `http://localhost:8000` (see [csfrace-scrape](https://github.com/zachatkinson/csfrace-scrape))

### Installation

```bash
# Clone the repository
git clone https://github.com/zachatkinson/csfrace-scrape-front.git
cd csfrace-scrape-front

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file:

```env
# Backend API Configuration
API_BASE_URL=http://localhost:8000
WS_BASE_URL=ws://localhost:8000

# Authentication (if using external providers)
AUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── ui/             # Base UI components (buttons, inputs)
│   ├── forms/          # Form components
│   ├── layout/         # Layout components (header, sidebar)
│   └── dashboard/      # Dashboard-specific components
├── pages/              # Astro pages (file-based routing)
│   ├── api/           # API endpoints
│   ├── auth/          # Authentication pages
│   └── dashboard/     # Dashboard pages
├── layouts/           # Page layouts
├── lib/               # Utility functions and API clients
├── hooks/             # React custom hooks
├── types/             # TypeScript type definitions
└── styles/            # Global styles and Tailwind config
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
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run astro        # Astro CLI commands
npm run type-check   # TypeScript type checking
npm run lint         # ESLint code linting
npm run format       # Prettier code formatting
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React hooks rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates

## 🔗 Related Repositories

- [csfrace-scrape](https://github.com/zachatkinson/csfrace-scrape) - Backend API and scraping engine

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:

- Create an [Issue](https://github.com/zachatkinson/csfrace-scrape-front/issues)
- Backend API issues: [csfrace-scrape Issues](https://github.com/zachatkinson/csfrace-scrape/issues)
