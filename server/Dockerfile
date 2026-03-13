FROM node:24-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy prisma schema and generate client (always fresh)
COPY prisma ./prisma
RUN npx prisma generate

# Copy source
COPY src ./src

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
