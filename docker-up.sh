#!/bin/bash
set -e

# Usage:
#   ./docker-up.sh                 # rebuild + start all services
#   ./docker-up.sh frontend        # rebuild + start only the frontend
#   ./docker-up.sh frontend -d     # rebuild + start frontend in background
#   ./docker-up.sh --no-cache frontend   # force a full no-cache rebuild
#
# Any unknown args (-d, --no-cache, service names) are passed straight to
# `docker compose up --build`, so you can use the full compose CLI surface.

# Auto-detect host User ID and Group ID
HOST_UID=$(id -u)
HOST_GID=$(id -g)

echo "Detecting host User ID ($HOST_UID) and Group ID ($HOST_GID)..."

# Ensure .env file exists
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

# Update PUID and PGID in .env automatically
if grep -q "^PUID=" .env; then
  sed -i.bak "s/^PUID=.*/PUID=${HOST_UID}/" .env && rm -f .env.bak
else
  echo "PUID=${HOST_UID}" >> .env
fi

if grep -q "^PGID=" .env; then
  sed -i.bak "s/^PGID=.*/PGID=${HOST_GID}/" .env && rm -f .env.bak
else
  echo "PGID=${HOST_GID}" >> .env
fi

echo "Configured .env with PUID=${HOST_UID} and PGID=${HOST_GID}."
echo "Starting Docker Compose (with --build so source changes are picked up)..."
exec docker compose up --build "$@"
