# Use Node.js 20 as base image
FROM node:20-alpine

# Accept Railway deployment ID as build argument
ARG RAILWAY_DEPLOYMENT_ID

# Install system dependencies including curl for health checks
RUN apk add --no-cache python3 make g++ curl

# Set working directory
WORKDIR /app

# Copy root package files and backend package manifest for dependency installation
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Install dependencies for both root and backend
RUN yarn install --frozen-lockfile

# Copy entire source code into the container
COPY . .

# Build the backend application
RUN cd backend && yarn codegen

# Expose the port (Ponder typically runs on 42069)
EXPOSE 42069

# Set environment variables
ENV NODE_ENV=production
ENV PORT=42069
ENV SCHEMA=$RAILWAY_DEPLOYMENT_ID

# Health check to ensure the application is running
HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:42069/health || exit 1

# Change working directory to the backend folder for runtime
WORKDIR /app/backend

# Start the application using the SCHEMA environment variable
CMD yarn start:backend --schema $SCHEMA