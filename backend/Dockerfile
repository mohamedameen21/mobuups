FROM node:20-alpine

# Install netcat for DB readiness check and shadow for user/group management
RUN apk add --no-cache netcat-openbsd shadow su-exec

ARG PUID=1000
ARG PGID=1000

# Configure custom user and group matching host UID/GID
RUN getent group ${PGID} || addgroup -g ${PGID} appgroup && \
    getent passwd ${PUID} || adduser -D -u ${PUID} -G appgroup appuser

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

# Ensure entrypoint is executable and set directory permissions
RUN chmod +x docker-entrypoint.sh && \
    mkdir -p /app/uploads && \
    chown -R ${PUID}:${PGID} /app /app/uploads

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
