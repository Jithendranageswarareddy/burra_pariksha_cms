# Multi-stage production build for Burra Pariksha CMS
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend and compile Express server to dist/server.cjs
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production package.json and install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled assets from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start compiled standalone production server
CMD ["node", "dist/server.cjs"]
