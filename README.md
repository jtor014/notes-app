# Notes App - Multi-Service Docker Application

A multi-service note-taking application built to learn and demonstrate Docker concepts, progressing from a simple containerized API to a full multi-container application with database persistence.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Host Machine                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               Docker Network: app-network             │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌─────────────────┐       │  │
│  │  │                 │      │                 │       │  │
│  │  │  Backend API    │◄────►│   PostgreSQL    │       │  │
│  │  │  (Node.js)      │      │   Database      │       │  │
│  │  │  Port: 3000     │      │   Port: 5432    │       │  │
│  │  │                 │      │                 │       │  │
│  │  └─────────────────┘      └────────┬────────┘       │  │
│  │                                     │                │  │
│  │                            ┌────────▼────────┐       │  │
│  │                            │  Volume:        │       │  │
│  │                            │  postgres_data  │       │  │
│  │                            └─────────────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Phase 2: PostgreSQL Integration with Docker Compose

This phase adds PostgreSQL database integration using Docker Compose for multi-container orchestration.

### New Features
- PostgreSQL database for persistent storage
- Docker Compose orchestration
- Database connection with retry logic
- Full CRUD operations on notes
- Data persistence with Docker volumes
- Environment variable configuration
- Service health checks

### Project Structure
```
notes-app/
├── backend/
│   ├── src/
│   │   ├── index.js       # Express API server with database integration
│   │   └── db.js          # Database connection module
│   ├── package.json       # Node.js dependencies (including pg)
│   ├── Dockerfile         # Docker configuration
│   └── .dockerignore      # Docker ignore file
├── database/
│   └── init.sql          # Database initialization script
├── docker-compose.yml     # Docker Compose configuration
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file
└── README.md             # This file
```

## Quick Start with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- Port 3000 and 5432 available

### Environment Setup
1. Copy the environment example file (optional - defaults will work):
```bash
cp .env.example .env
```

### Running the Application

#### Start all services
```bash
docker-compose up
```

#### Start in background (detached mode)
```bash
docker-compose up -d
```

#### View logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f db
```

#### Stop all services
```bash
docker-compose down
```

#### Stop and remove all data (fresh start)
```bash
docker-compose down -v
```

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```
Response includes database connection status:
```json
{
  "status": "ok",
  "timestamp": "2025-01-06T...",
  "database": "connected"
}
```

### Get All Notes
```bash
curl http://localhost:3000/api/notes
```

### Get Single Note
```bash
curl http://localhost:3000/api/notes/1
```

### Create a Note
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"New Note","content":"This is a new note"}'
```

### Update a Note
```bash
curl -X PUT http://localhost:3000/api/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Note","content":"This is updated content"}'
```

### Delete a Note
```bash
curl -X DELETE http://localhost:3000/api/notes/1
```

## Database Access

### Connect to PostgreSQL directly
```bash
# Using docker-compose exec
docker-compose exec db psql -U notesuser -d notesdb

# Using docker exec
docker exec -it notes-db psql -U notesuser -d notesdb
```

### Common PostgreSQL commands
```sql
-- List all notes
SELECT * FROM notes;

-- Count notes
SELECT COUNT(*) FROM notes;

-- Exit psql
\q
```

## Docker Commands Reference

### Docker Compose
```bash
# Build/rebuild services
docker-compose build

# View running containers
docker-compose ps

# Execute command in running container
docker-compose exec backend sh
docker-compose exec db psql -U notesuser -d notesdb

# View resource usage
docker-compose top
```

### Individual Docker Commands (Phase 1)
```bash
# Build the backend image alone
docker build -t notes-api ./backend

# Run backend alone (without database)
docker run -p 3000:3000 notes-api
```

## Environment Variables

The application uses the following environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | db | Database host (service name in Docker) |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | notesdb | Database name |
| DB_USER | notesuser | Database user |
| DB_PASSWORD | notespass | Database password |
| NODE_ENV | development | Node environment |

## What This Phase Accomplishes

1. **Multi-Container Orchestration**: Uses Docker Compose to manage multiple services
2. **Container Networking**: Services communicate via Docker network using service names
3. **Data Persistence**: PostgreSQL data persists in Docker volumes between restarts
4. **Connection Resilience**: Backend retries database connection with exponential backoff
5. **Environment Configuration**: Proper separation of configuration from code
6. **Health Monitoring**: Health endpoint reports database connectivity status
7. **Database Initialization**: Automatic schema creation and seed data on first run

## Troubleshooting

### Backend can't connect to database
- Ensure both services are in the same network
- Check that database is healthy: `docker-compose ps`
- View backend logs: `docker-compose logs backend`
- Database takes a few seconds to initialize on first run

### Port already in use
- Change ports in docker-compose.yml
- Or stop conflicting services

### Permission issues
- Ensure Docker daemon is running
- Check user is in docker group: `groups`

### Reset everything
```bash
# Stop containers and remove volumes
docker-compose down -v

# Remove all project images
docker rmi notes-backend postgres:15-alpine

# Start fresh
docker-compose up --build
```

## Next Steps

Future phases will add:
- Phase 3: Frontend application (React/Vue)
- Phase 4: Redis caching layer
- Phase 5: Nginx reverse proxy
- Phase 6: Production configurations