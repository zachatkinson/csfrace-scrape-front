# Frontend Dockerfile for Astro/React app
FROM node:latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]