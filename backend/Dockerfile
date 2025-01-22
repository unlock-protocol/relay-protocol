# Use Node.js 20 as base image (satisfies both requirements)
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app/backend

# Copy backend package files first
COPY package.json ./

# Copy backend dependencies
COPY node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Expose the port (assuming Hono runs on 3000)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["yarn", "start"] 