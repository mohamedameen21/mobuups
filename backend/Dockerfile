FROM node:20-alpine

# Install netcat for DB readiness check and shadow/su-exec for permission management
RUN apk add --no-cache netcat-openbsd shadow su-exec

ARG PUID=1000
ARG PGID=1000

# Dynamically handle existing host GID/UID (such as GID 20 dialout on Alpine)
RUN EXISTING_GROUP=$(getent group ${PGID} | cut -d: -f1) && \
    if [ -z "$EXISTING_GROUP" ]; then \
      addgroup -g ${PGID} appgroup && EXISTING_GROUP=appgroup; \
    fi && \
    getent passwd ${PUID} >/dev/null || adduser -D -u ${PUID} -G "$EXISTING_GROUP" appuser

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

# Ensure entrypoint is executable and uploads directory is writable
RUN chmod +x docker-entrypoint.sh && \
    mkdir -p /app/uploads && \
    chown -R ${PUID}:${PGID} /app /app/uploads || chmod 777 /app/uploads

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
