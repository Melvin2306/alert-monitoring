# syntax=docker.io/docker/dockerfile:1

# ============================================
# Next.js frontend application for ChangeDetection.io
# This Dockerfile follows a multi-stage build process:
# 1. Install dependencies 
# 2. Build the Next.js application
# 3. Create a production-ready image
# ============================================

FROM node:24-alpine AS base
# Base image setup complete

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN echo "🔧 Installing system dependencies..." && \
    apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
RUN echo "📦 Preparing to install Node.js dependencies..."
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN echo "📦 Installing Node.js dependencies..." && \
    if [ -f yarn.lock ]; then echo "🧶 Using Yarn package manager..." && yarn; \
    elif [ -f package-lock.json ]; then echo "📦 Using NPM package manager..." && npm install; \
    elif [ -f pnpm-lock.yaml ]; then echo "🚀 Using PNPM package manager..." && corepack enable pnpm && pnpm install; \
    else echo "📦 No lockfile found, defaulting to NPM..." && npm install; \
    fi && echo "✅ Dependencies installed successfully!"


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
RUN echo "🏗️ Setting up build environment..."
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN echo "📋 Source code copied, preparing to build..."

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN echo "🚀 Building Next.js application..." && \
    if [ -f yarn.lock ]; then echo "🧶 Building with Yarn..." && yarn run build; \
    elif [ -f package-lock.json ]; then echo "📦 Building with NPM..." && npm run build; \
    elif [ -f pnpm-lock.yaml ]; then echo "🚀 Building with PNPM..." && corepack enable pnpm && pnpm run build; \
    else echo "❌ Error: Lockfile not found. Cannot proceed with build." && exit 1; \
    fi && echo "✅ Next.js build completed successfully!"

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
RUN echo "🚢 Preparing production image..."

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Install curl for health checks and bash for startup script
RUN echo "🔧 Installing production utilities (curl, bash)..." && \
    apk add --no-cache curl bash

RUN echo "👤 Setting up user permissions..." && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN echo "📂 Copying production assets..."
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
RUN echo "📦 Copying optimized Next.js build..."
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create startup script to handle environment variables
RUN echo "📜 Setting up startup script..."
COPY --chown=nextjs:nodejs startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# Create .env file directory and set permissions
RUN echo "📄 Creating .env file with proper permissions..."
RUN mkdir -p /app && \
    touch /app/.env && \
    chown -R nextjs:nodejs /app && \
    chmod 755 /app && \
    chmod 644 /app/.env

RUN echo "🔒 Switching to non-root user for security..."
USER nextjs

EXPOSE 3000
RUN echo "🔌 Exposing port 3000 for the Next.js application"

ENV PORT=3000
# SMTP environment variables with defaults
RUN echo "📧 Setting up email configuration environment variables..."
ENV SMTP_HOST="smtp.gmail.com"
ENV SMTP_PORT="587"
ENV SMTP_USER=""
ENV SMTP_PASSWORD=""
ENV SMTP_FROM=""
ENV SMTP_SECURE="false"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
RUN echo "✅ Container setup complete! Starting application on next run."
CMD ["/app/startup.sh"]