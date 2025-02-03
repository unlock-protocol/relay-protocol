# Build stage
FROM node:22.13.1-alpine3.21 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source files
COPY . .

# Build packages
RUN yarn build

# Production stage
FROM node:22.13.1-alpine3.21 AS runner

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Copy built files from builder
COPY --from=builder /app/backend/generated ./backend/generated
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/relay

# Expose port
EXPOSE 3000

# Start the backend service
WORKDIR /app/backend
CMD ["yarn", "start"]