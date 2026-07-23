FROM node:20-alpine

# Install netcat for database readiness check
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy backend source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to dist/
RUN npm run build

# Ensure entrypoint is executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
