#!/bin/bash

# Start production environment
# Usage: ./scripts/prod.sh

echo "🏭 Starting production environment..."
echo "🌐 Frontend: http://localhost (Nginx with built assets)"
echo "🔧 Backend: http://localhost:3000"
echo "📊 Redis: localhost:6379"
echo "🗄️  Database: localhost:5434"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start production services
docker compose up --build

echo ""
echo "🛑 Production environment stopped."