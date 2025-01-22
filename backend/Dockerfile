# Use Node.js 20 as base image (satisfies both requirements)
FROM node:20-alpine

# Accept Railway deployment ID as build argument
ARG RAILWAY_DEPLOYMENT_ID

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files from root and backend
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN cd backend && yarn codegen

# Set working directory to backend
WORKDIR /app/backend

# Expose the port (Ponder typically runs on 42069)
EXPOSE 42069

# Set environment variables
ENV NODE_ENV=production
ENV PORT=42069
ENV SCHEMA=$RAILWAY_DEPLOYMENT_ID

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:42069/health || exit 1

# Start the application with schema
CMD ["yarn", "start", "--schema", "$RAILWAY_DEPLOYMENT_ID"] 