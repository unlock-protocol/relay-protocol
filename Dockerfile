# *****************************************************************************
# This Dockerfile builds the monorepo by installing all workspace dependencies,
# then builds the backend package by executing its codegen. Finally, it sets the
# runtime directory to the backend folder for starting the application.
# *****************************************************************************

# Use Node.js 22 as the base image
FROM node:22.12.0

# Accept the Railway deployment ID as a build argument
ARG RAILWAY_DEPLOYMENT_ID

# Install system dependencies including curl for health checks
RUN apk add --no-cache python3 make g++ curl

# Set the working directory to the monorepo's root
WORKDIR /app

# -----------------------------------------------------------------------------
# COPY package files
# -----------------------------------------------------------------------------
# Copy the root package.json and yarn.lock so that we can install the monorepo
# dependencies via Yarn workspaces.
COPY package.json yarn.lock ./

# -----------------------------------------------------------------------------
# INSTALL DEPENDENCIES
# -----------------------------------------------------------------------------
# Run Yarn install to bootstrap the entire monorepo, including all workspaces.
RUN yarn install --frozen-lockfile

# -----------------------------------------------------------------------------
# COPY SOURCE CODE
# -----------------------------------------------------------------------------
# Copy the complete repository into the container.
COPY . .

# -----------------------------------------------------------------------------
# BUILD THE BACKEND PACKAGE
# -----------------------------------------------------------------------------
# Build the backend by running its codegen using Yarn workspaces.
RUN yarn workspace @relay-protocol/backend codegen

# -----------------------------------------------------------------------------
# SET ENVIRONMENT VARIABLES FOR PRODUCTION
# -----------------------------------------------------------------------------
ENV NODE_ENV=production
ENV PORT=42069
ENV SCHEMA=$RAILWAY_DEPLOYMENT_ID

# -----------------------------------------------------------------------------
# HEALTHCHECK
# -----------------------------------------------------------------------------
HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:42069/health || exit 1

# -----------------------------------------------------------------------------
# SET RUNTIME WORKING DIRECTORY & START APPLICATION
# -----------------------------------------------------------------------------
WORKDIR /app/backend

CMD yarn start --schema $SCHEMA