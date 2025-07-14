FROM node:18-alpine AS base

# 1. Install dependencies
FROM base AS deps
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY package.json npm-lock.yaml* ./
RUN corepack enable && npm install --frozen-lockfile

# 2. Build the application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm build

# 3. Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Set the correct user
USER nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npm", "start"]