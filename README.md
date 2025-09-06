# Notes App - Full-Stack Multi-Service Docker Application

A complete full-stack note-taking application built to learn and demonstrate Docker concepts, featuring React frontend, Node.js API, and PostgreSQL database with multi-container orchestration.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Docker Host Machine                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────── Docker Network: app-network ──────────────────┐ │
│  │                                                                           │ │
│  │  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐       │ │
│  │  │                 │   │                 │   │                 │       │ │
│  │  │   React SPA     │──►│  Backend API    │──►│   PostgreSQL    │       │ │
│  │  │  (Nginx + JS)   │   │   (Node.js)     │   │   Database      │       │ │
│  │  │   Port: 80      │   │   Port: 3000    │   │   Port: 5434    │       │ │
│  │  │                 │   │                 │   │                 │       │ │
│  │  └─────────────────┘   └─────────────────┘   └────────┬────────┘       │ │
│  │          │                       │                     │                │ │
│  │          │                       │            ┌────────▼────────┐       │ │
│  │          │                       │            │  Volume:        │       │ │
│  │          │                       │            │  postgres_data  │       │ │
│  │          │                       │            └─────────────────┘       │ │
│  │          │              ┌────────▼─────────────┐                        │ │
│  │          │              │   API Proxy          │                        │ │
│  │          └─────────────►│  /api/* -> backend   │                        │ │
│  │                         │  /* -> React SPA     │                        │ │
│  │                         └──────────────────────┘                        │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  User accesses: http://localhost                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Phase 3: React Frontend with Nginx Reverse Proxy

This phase completes the full-stack application with a React frontend served by Nginx with API proxying.

### New Features
- React SPA with modern UI for notes management
- Multi-stage Docker build for optimized production images
- Nginx reverse proxy for API requests and static file serving
- Full CRUD operations through intuitive web interface
- Responsive design with clean, modern styling
- Client-side error handling and loading states
- Containerized frontend with health checks

### Complete Project Structure
```
notes-app/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main application component
│   │   ├── main.jsx            # React entry point
│   │   ├── index.css           # Global styles
│   │   └── components/
│   │       ├── NotesList.jsx   # Notes list container
│   │       ├── NoteForm.jsx    # Create/edit note form
│   │       └── NoteItem.jsx    # Individual note display
│   ├── public/                 # Static assets
│   ├── index.html             # HTML template
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── Dockerfile             # Multi-stage frontend build
│   ├── nginx.conf             # Nginx configuration
│   └── .dockerignore          # Docker ignore file
├── backend/
│   ├── src/
│   │   ├── index.js           # Express API server
│   │   └── db.js              # Database connection module
│   ├── package.json           # Node.js dependencies
│   ├── Dockerfile             # Backend container config
│   └── .dockerignore          # Docker ignore file
├── database/
│   └── init.sql               # Database initialization
├── docker-compose.yml         # Multi-service orchestration
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore file
└── README.md                 # This file
```

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Port 80 (frontend), 3000 (backend), and 5434 (database) available

### Running the Complete Application

#### Start all services
```bash
docker compose up --build
```

#### Start in background (detached mode)
```bash
docker compose up -d --build
```

#### Access the application
Open your browser and navigate to: **http://localhost**

The application will be fully functional with:
- React frontend accessible at port 80
- API requests automatically proxied to the backend
- All notes data persisted in PostgreSQL

## Application Features

### Web Interface
- **📝 Create Notes**: Add new notes with title and content
- **📋 View Notes**: Browse all notes with timestamps
- **✏️ Edit Notes**: Click "Edit" to modify existing notes in-place
- **🗑️ Delete Notes**: Remove notes with confirmation dialog
- **🔄 Real-time Updates**: Changes reflect immediately in the UI
- **📱 Responsive Design**: Works on desktop and mobile devices

### Technical Features
- **🚀 Fast Loading**: Optimized production builds with Vite
- **🔧 Error Handling**: User-friendly error messages and retry buttons
- **⏳ Loading States**: Visual feedback during API operations
- **🔒 Security**: CORS handling and security headers
- **📊 Health Checks**: Built-in health monitoring for all services

## API Endpoints (via Frontend Proxy)

All API requests are proxied through Nginx from the frontend:

### Direct API Access (for testing)
```bash
# Health check
curl http://localhost/api/health

# Get all notes
curl http://localhost/api/notes

# Get single note
curl http://localhost/api/notes/1

# Create note
curl -X POST http://localhost/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"New Note","content":"Created via API"}'

# Update note
curl -X PUT http://localhost/api/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Note","content":"Modified content"}'

# Delete note
curl -X DELETE http://localhost/api/notes/1
```

## Docker Commands Reference

### Multi-Service Operations
```bash
# Build and start all services
docker compose up --build

# View all running containers
docker compose ps

# View logs from all services
docker compose logs -f

# View logs from specific service
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db

# Stop all services
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v

# Rebuild specific service
docker compose build frontend
docker compose up -d --no-deps frontend
```

### Individual Service Management
```bash
# Execute commands in running containers
docker compose exec frontend sh
docker compose exec backend sh
docker compose exec db psql -U notesuser -d notesdb

# Scale services (if needed)
docker compose up --scale backend=2

# View resource usage
docker compose top
```

## Database Access

### Connect to PostgreSQL
```bash
# Using docker compose
docker compose exec db psql -U notesuser -d notesdb

# Using docker directly
docker exec -it notes-db psql -U notesuser -d notesdb
```

### Common PostgreSQL Commands
```sql
-- List all notes
SELECT * FROM notes ORDER BY created_at DESC;

-- Count notes
SELECT COUNT(*) FROM notes;

-- View table schema
\d notes

-- Exit psql
\q
```

## Environment Variables

The application supports the following environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | db | Database host (service name in Docker) |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | notesdb | Database name |
| DB_USER | notesuser | Database user |
| DB_PASSWORD | notespass | Database password |
| NODE_ENV | development | Node environment |

## Development Workflow

### Frontend Development
```bash
# Run frontend in development mode (outside Docker)
cd frontend
npm install
npm run dev
# Frontend available at http://localhost:5173

# Build for production
npm run build
```

### Backend Development
```bash
# Run backend in development mode (outside Docker)
cd backend
npm install
npm run dev
# API available at http://localhost:3000
```

### Database Development
```bash
# Connect to development database
docker compose exec db psql -U notesuser -d notesdb

# Reset database
docker compose down -v
docker compose up -d db
```

## What This Implementation Accomplishes

1. **Complete Full-Stack Application**: React frontend, Node.js backend, PostgreSQL database
2. **Multi-Stage Docker Builds**: Optimized production images with minimal size
3. **Reverse Proxy Pattern**: Nginx handles static files and API proxying
4. **Container Orchestration**: All services managed with Docker Compose
5. **Production-Ready Configuration**: Security headers, compression, caching
6. **Responsive Design**: Modern, clean UI that works on all devices
7. **Error Resilience**: Retry logic, health checks, graceful error handling
8. **Development Workflow**: Easy local development and container-based deployment

## Architecture Benefits

- **Separation of Concerns**: Frontend, backend, and database as independent services
- **Scalability**: Each service can be scaled independently
- **Security**: Nginx acts as a security layer with proper headers
- **Performance**: Static file caching, gzip compression, optimized builds
- **Maintainability**: Clean separation makes updates and debugging easier
- **Deployment Flexibility**: Can deploy to any container orchestration platform

## Troubleshooting

### Frontend Issues
- **Page not loading**: Check if port 80 is available
- **API errors**: Verify backend service is running (`docker compose ps`)
- **Build failures**: Check Node.js version compatibility

### Nginx Issues
- **502 Bad Gateway**: Backend service may not be ready
- **API proxy errors**: Check nginx.conf proxy configuration
- **Static files not loading**: Verify build output location

### Database Connection Issues
- **Backend can't connect**: Ensure database is healthy
- **Port conflicts**: Database exposed on 5434 (not 5432)
- **Data persistence**: Use `docker compose down -v` for fresh start

### General Debugging
```bash
# Check all service health
docker compose ps

# View service logs
docker compose logs -f [service-name]

# Inspect network connectivity
docker compose exec backend ping db
docker compose exec frontend ping backend

# Check container resources
docker compose top
```

## Next Steps

Future enhancements could include:
- Phase 4: Redis caching layer for improved performance
- Phase 5: Load balancer with multiple backend instances
- Phase 6: CI/CD pipeline with automated testing
- Phase 7: Kubernetes deployment configurations
- Phase 8: Monitoring and logging with Prometheus/Grafana

This full-stack application demonstrates enterprise-level container orchestration patterns and provides a solid foundation for learning Docker in real-world scenarios.