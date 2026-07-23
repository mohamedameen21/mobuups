#!/bin/sh
set -e

echo "Waiting for PostgreSQL database on db:5432..."
until nc -z -v -w30 db 5432; do
  echo "Database connection not ready yet. Retrying in 2s..."
  sleep 2
done

echo "Database is ready! Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database with 200 products & local images..."
npx prisma db seed || true

echo "Starting Backend Express API server..."
exec "$@"
