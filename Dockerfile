# Modern Dockerfile following Docker best practices
# Single stage with environment-variable driven behavior
# Based on official Docker recommendations for 2024+

# CRITICAL: lightningcss ARM64 workaround (still required as of 2025)
# Using build arg instead of hardcoded platform to satisfy Docker linting
# Default to linux/amd64 to fix lightningcss native binary issues on ARM64 Macs
# See: https://github.com/parcel-bundler/lightningcss/issues/335
ARG BUILDPLATFORM=linux/amd64
FROM --platform=${BUILDPLATFORM} node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S astro -u 1001

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies based on NODE_ENV
# Docker best practice: Use build args with defaults
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Install dependencies conditionally based on NODE_ENV
# lightningcss-wasm is installed from optionalDependencies in package.json
RUN if [ "$NODE_ENV" = "development" ]; then \
        pnpm install --frozen-lockfile; \
    else \
        pnpm install --frozen-lockfile --production=false && \
        pnpm run build && \
        pnpm prune --production; \
    fi

# CRITICAL LIGHTNINGCSS FIX: Create pkg directory and copy WASM files
# Fixes ARM64 Docker + lightningcss incompatibility (missing ../pkg directory)
# lightningcss-wasm is already installed from package.json optionalDependencies
# Using pnpm directory structure: .pnpm/package@version/node_modules/package
RUN mkdir -p node_modules/.pnpm/lightningcss@1.30.1/node_modules/lightningcss/pkg && \
    cp -r node_modules/.pnpm/lightningcss-wasm@1.30.2/node_modules/lightningcss-wasm/* \
          node_modules/.pnpm/lightningcss@1.30.1/node_modules/lightningcss/pkg/ 2>/dev/null || true

# Copy source code and ensure proper ownership
COPY --chown=astro:nodejs . .

# Ensure the astro user has write permissions to the entire app directory
RUN chown -R astro:nodejs /app

# Build only in production (when not already built above)
RUN if [ "$NODE_ENV" = "production" ] && [ ! -d "dist" ]; then \
        pnpm run build; \
    fi

# Switch to non-root user
USER astro

# Set default environment variables
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check that works for both dev and prod
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application based on NODE_ENV
# Docker best practice: Use exec form for better signal handling
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then pnpm run dev --host 0.0.0.0 --port 3000; else pnpm run preview --host 0.0.0.0 --port 3000; fi"]