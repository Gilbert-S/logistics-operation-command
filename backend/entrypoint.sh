#!/bin/sh

echo "Running database migrations..."
npm run db:migrate --prefix /app/backend/

echo "Starting application..."
cd /app/backend
node index.ts