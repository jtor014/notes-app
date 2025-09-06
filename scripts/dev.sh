#!/bin/bash

# Start development environment with hot-reload
# Usage: ./scripts/dev.sh

echo "🚀 Starting development environment with hot-reload..."
echo "📝 Frontend: http://localhost:5173 (with HMR)"
echo "🔧 Backend: http://localhost:3000 (with nodemon)"
echo "🐛 Debug port: localhost:9229 (Node.js inspector)"
echo "📊 Redis: localhost:6379"
echo "🗄️  Database: localhost:5434"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start development services
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

echo ""
echo "🛑 Development environment stopped."