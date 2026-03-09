FROM node:24-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and prisma schema first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install deps and generate Prisma client
RUN npm ci
RUN npx prisma generate

# Copy remaining source
COPY . .

EXPOSE 3002

CMD ["node", "src/index.js"]
