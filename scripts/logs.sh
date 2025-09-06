#!/bin/bash

# View logs for development environment
# Usage: ./scripts/logs.sh [service]

SERVICE=${1:-}

if [ -n "$SERVICE" ]; then
    echo "📋 Viewing logs for service: $SERVICE"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "$SERVICE"
else
    echo "📋 Viewing logs for all services"
    echo "💡 Tip: Use './scripts/logs.sh [service]' to view specific service logs"
    echo "Services: frontend, backend, db, redis"
    echo ""
    docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
fi