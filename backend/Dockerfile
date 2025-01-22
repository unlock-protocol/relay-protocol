# Use Node.js 20 as base image (satisfies both requirements)
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy root package files first
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy backend package files
COPY backend/package.json ./backend/

# Install dependencies using yarn
RUN yarn install

# Copy backend source code
COPY backend ./backend

# Set working directory to backend
WORKDIR /app/backend

# Build the application
RUN yarn build

# Expose the port (assuming Hono runs on 3000)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["yarn", "start"] 