#!/bin/bash
set -e

echo "🔄 Waiting for database to be ready..."
until pg_isready -h postgres -U postgres; do
  echo "⏳ Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running database migrations..."
npm run db:migrate

echo "🚀 Starting application..."
exec npm run dev
