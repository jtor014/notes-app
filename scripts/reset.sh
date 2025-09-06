#!/bin/bash

# Clean reset - removes all containers, volumes, and images
# Usage: ./scripts/reset.sh

echo "🧹 Performing clean reset..."
echo "⚠️  This will remove all containers, volumes, and built images."
echo ""

read -p "Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled."
    exit 1
fi

echo "🛑 Stopping all services..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

echo "🗑️  Removing volumes..."
docker compose down -v

echo "🧽 Removing built images..."
docker rmi notes-app-backend notes-app-frontend 2>/dev/null || true

echo "🔄 Pruning Docker system..."
docker system prune -f

echo ""
echo "✅ Clean reset completed. Run ./scripts/dev.sh or ./scripts/prod.sh to restart."