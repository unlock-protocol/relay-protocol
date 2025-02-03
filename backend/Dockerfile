# Build stage
FROM node:22.13.1-alpine3.21 AS builder

# Set working directory
WORKDIR /app

# Enable corepack and set yarn version
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY backend/package.json ./backend/

# Install dependencies
RUN yarn install --immutable

# Copy source files
COPY . .

# Build packages
RUN yarn build

# Production stage
FROM node:22.13.1-alpine3.21 AS runner

# Set working directory
WORKDIR /app

# Enable corepack and set yarn version
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
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