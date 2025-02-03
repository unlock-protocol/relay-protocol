# Build stage
FROM node:22.13.1-alpine3.21 AS builder

# Set working directory
WORKDIR /app

# Enable corepack and set yarn version
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy root workspace files first
COPY package.json yarn.lock .yarnrc.yml ./

# Copy yarn configuration
COPY .yarn ./.yarn

# Copy all workspace packages
COPY packages ./packages
COPY backend/package.json ./backend/
COPY smart-contracts/package.json ./smart-contracts/

# Install dependencies
RUN yarn install --mode=skip-build

# Copy all source files
COPY . .

# Generate Ponder files and build packages
RUN yarn build

# Production stage
FROM node:22.13.1-alpine3.21 AS runner

# Set working directory
WORKDIR /app

# Enable corepack and set yarn version
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy all files from builder
COPY --from=builder /app .

# Install production dependencies
RUN yarn install --mode=skip-build

# Set environment variables
ENV NODE_ENV=production

# Add Railway specific ARGs
ARG RAILWAY_DEPLOYMENT_ID
ARG DATABASE_URL
ENV RAILWAY_DEPLOYMENT_ID=$RAILWAY_DEPLOYMENT_ID
ENV DATABASE_URL=$DATABASE_URL

# Expose port
EXPOSE 3000

# Start the backend service using workspace command with Railway deployment ID
CMD ["sh", "-c", "yarn backend:start --schema $RAILWAY_DEPLOYMENT_ID"]