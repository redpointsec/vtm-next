# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Native build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Seed the database (baked into the image — resets on each container start)
RUN npm run seed

# Build Next.js — outputs to .next/
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app

# Copy Next.js build output, seeded database, node_modules (for better-sqlite3
# native addon + next runtime), and the public assets / package.json that
# `next start` expects.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/data ./data
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["npm", "start"]
