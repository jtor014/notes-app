# Notes App - Full-Stack Multi-Service Docker Application

A complete full-stack note-taking application built to learn and demonstrate Docker concepts, featuring React frontend, Node.js API, PostgreSQL database, and Redis caching with multi-container orchestration.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Docker Host Machine                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────── Docker Network: app-network ─────────────────────────┐ │
│  │                                                                              │ │
│  │  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │ │
│  │  │                 │   │                 │   │                 │           │ │
│  │  │   React SPA     │──►│  Backend API    │──►│   PostgreSQL    │           │ │
│  │  │  (Nginx + JS)   │   │   (Node.js)     │   │   Database      │           │ │
│  │  │   Port: 80      │   │   Port: 3000    │   │   Port: 5434    │           │ │
│  │  │                 │   │        │        │   │                 │           │ │
│  │  └─────────────────┘   └────────┼────────┘   └────────┬────────┘           │ │
│  │          │                      │                     │                    │ │
│  │          │                      │             ┌────────▼────────┐           │ │
│  │          │                      │             │  Volume:        │           │ │
│  │          │                      │             │  postgres_data  │           │ │
│  │          │                      │             └─────────────────┘           │ │
│  │          │                      │                                           │ │
│  │          │                      │    ┌─────────────────┐                   │ │
│  │          │                      └───►│  Redis Cache    │                   │ │
│  │          │                           │  (In-Memory)    │                   │ │
│  │          │                           │  Port: 6379     │                   │ │
│  │          │                           │                 │                   │ │
│  │          │                           └────────┬────────┘                   │ │
│  │          │                                    │                            │ │
│  │          │                           ┌────────▼────────┐                   │ │
│  │          │                           │  Volume:        │                   │ │
│  │          │                           │  redis_data     │                   │ │
│  │          │                           └─────────────────┘                   │ │
│  │          │              ┌────────────────────────────┐                     │ │
│  │          │              │      API Proxy             │                     │ │
│  │          └─────────────►│  /api/* -> backend         │                     │ │
│  │                         │  /* -> React SPA           │                     │ │
│  │                         └────────────────────────────┘                     │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  User accesses: http://localhost                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Phase 4: Redis Caching Layer for Enhanced Performance

This phase adds Redis as a caching layer to dramatically improve API response times and reduce database load.

### Caching Strategy Features
- **Smart Caching**: GET requests cached with appropriate TTLs (60s for lists, 300s for individual notes)
- **Cache Invalidation**: Automatic invalidation on write operations (POST/PUT/DELETE)
- **Graceful Degradation**: Application continues to work if Redis is unavailable
- **Performance Monitoring**: Built-in cache hit/miss statistics and response time tracking
- **Cache Management**: Admin endpoints for cache clearing and statistics viewing

## Phase 3: React Frontend with Nginx Reverse Proxy

A React frontend served by Nginx with API proxying for the complete full-stack experience.

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
- Port 80 (frontend), 3000 (backend), 5434 (database), and 6379 (Redis) available

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
- Redis caching for enhanced performance

## Application Features

### Web Interface
- **📝 Create Notes**: Add new notes with title and content
- **📋 View Notes**: Browse all notes with timestamps
- **✏️ Edit Notes**: Click "Edit" to modify existing notes in-place
- **🗑️ Delete Notes**: Remove notes with confirmation dialog
- **🔄 Real-time Updates**: Changes reflect immediately in the UI
- **📱 Responsive Design**: Works on desktop and mobile devices

### Technical Features
- **🚀 Fast Loading**: Optimized production builds with Vite and Redis caching
- **🔧 Error Handling**: User-friendly error messages and retry buttons
- **⏳ Loading States**: Visual feedback during API operations
- **🔒 Security**: CORS handling and security headers
- **📊 Health Checks**: Built-in health monitoring for all services
- **⚡ Performance Caching**: Redis-powered response caching with smart invalidation
- **📈 Performance Monitoring**: Cache hit rates and response time analytics

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

# Get performance statistics
curl http://localhost/api/stats

# Clear cache (admin endpoint)
curl -X POST http://localhost/api/cache/clear
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
docker compose logs -f redis

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
docker compose exec redis redis-cli

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
| REDIS_HOST | redis | Redis host (service name in Docker) |
| REDIS_PORT | 6379 | Redis port |
| CACHE_TTL | 60 | Default cache TTL in seconds |
| NODE_ENV | development | Node environment |

## Development Workflow

This project supports both **development** and **production** modes with different configurations optimized for each use case.

### Quick Start for Development

```bash
# Start development environment with hot-reload
./scripts/dev.sh

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Development vs Production Comparison

| Feature | Development Mode | Production Mode |
|---------|------------------|-----------------|
| **Frontend** | Vite dev server with HMR | Nginx serving built assets |
| **Backend** | Nodemon with auto-restart | Node.js direct execution |
| **Ports** | Frontend: 5173, Backend: 3000 | Frontend: 80, Backend: 3000 |
| **Code Changes** | ⚡ Instant reload | 🔄 Requires rebuild |
| **Debugging** | ✅ Debug port 9229 exposed | ❌ No debugging |
| **Logging** | 📝 Verbose (debug level) | 📄 Production level |
| **Caching** | 🕐 Short TTL (10s) | 🕐 Normal TTL (60s) |
| **SQL Logging** | ✅ All queries logged | ❌ Minimal logging |
| **File Watching** | ✅ Live code sync | ❌ Static builds |

### Development Environment Features

**🔥 Hot-Reload Capabilities:**
- **Frontend**: Vite HMR updates React components without page refresh
- **Backend**: Nodemon restarts server automatically on file changes
- **Volume Mounting**: Live code synchronization between host and containers

**🐛 Debugging Support:**
- Node.js inspector on port 9229 for backend debugging
- VSCode launch configuration for easy debugging
- Chrome DevTools for frontend debugging
- Detailed error messages and stack traces

**📊 Enhanced Development Experience:**
- Reduced cache TTL for faster development iterations
- Verbose logging for all database queries
- Development-specific environment variables
- Cross-platform helper scripts

### Using Helper Scripts

```bash
# Start development environment
./scripts/dev.sh

# Start production environment  
./scripts/prod.sh

# View logs (all services or specific service)
./scripts/logs.sh
./scripts/logs.sh backend

# Clean reset (removes all containers/volumes)
./scripts/reset.sh
```

### Manual Development Commands

```bash
# Development mode (recommended)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production mode
docker-compose up --build

# View development logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### Development Ports & URLs

**Development Mode:**
- 🌐 **Frontend**: http://localhost:5173 (Vite dev server with HMR)
- 🔧 **Backend API**: http://localhost:3000 (Nodemon with auto-restart)
- 🐛 **Debug Port**: localhost:9229 (Node.js inspector)
- 📊 **Redis**: localhost:6379
- 🗄️ **Database**: localhost:5434

**Production Mode:**
- 🌐 **Application**: http://localhost (Nginx proxy)
- 🔧 **Backend API**: http://localhost:3000 (direct access)

### VSCode Integration

**🚀 Pre-configured debugging:**
1. Install recommended extensions when prompted
2. Start development environment: `./scripts/dev.sh`
3. Press `F5` or use "Run and Debug" panel
4. Choose "Attach to Backend (Docker)" to debug Node.js
5. Choose "Debug Frontend (Chrome)" to debug React

**⚙️ Configured features:**
- Automatic formatting on save
- Docker syntax highlighting
- Path intellisense
- ESLint integration
- Tailwind CSS support

### Hot-Reload Testing

**Test Backend Hot-Reload:**
```bash
# 1. Start development environment
./scripts/dev.sh

# 2. Edit backend/src/index.js - add console.log
# 3. Watch terminal - server should restart automatically
# 4. Check logs to see your changes
```

**Test Frontend Hot-Reload:**
```bash
# 1. Start development environment  
./scripts/dev.sh

# 2. Edit frontend/src/App.jsx - change some text
# 3. Browser should update without refresh
# 4. React components update instantly
```

### Database & Redis Development

```bash
# Connect to development database
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec db psql -U notesuser -d notesdb

# View database logs (with SQL queries)
./scripts/logs.sh db

# Connect to Redis for debugging
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec redis redis-cli

# Common Redis commands
KEYS *              # List all keys
GET notes:list      # Get cached notes list
FLUSHALL           # Clear all cache

# Reset everything for fresh start
./scripts/reset.sh
```

### Environment Variables for Development

See `.env.example` for all available configuration options:

```bash
# Copy and customize environment variables
cp .env.example .env

# Key development variables:
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SQL_LOGGING=true
CACHE_TTL=10
VITE_API_BASE_URL=http://localhost:3000
```

### Troubleshooting Development Issues

**Common Issues:**
- **Port conflicts**: Make sure ports 5173, 3000, 9229 are available
- **File changes not detected**: Try `./scripts/reset.sh` and restart
- **Docker permissions**: Ensure Docker has access to project directory
- **Cache issues**: Clear browser cache or disable caching with `CACHE_ENABLED=false`

**Debug Commands:**
```bash
# Check service health
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

# View all logs
./scripts/logs.sh

# Inspect containers
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend sh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec frontend sh

# Test API connectivity
curl http://localhost:3000/health
curl http://localhost:5173/api/health  # Proxied through Vite
```

## What This Implementation Accomplishes

1. **Complete Full-Stack Application**: React frontend, Node.js backend, PostgreSQL database, Redis cache
2. **Multi-Stage Docker Builds**: Optimized production images with minimal size
3. **Reverse Proxy Pattern**: Nginx handles static files and API proxying
4. **Container Orchestration**: Four-service architecture managed with Docker Compose
5. **Production-Ready Configuration**: Security headers, compression, Redis caching
6. **Responsive Design**: Modern, clean UI that works on all devices
7. **Error Resilience**: Retry logic, health checks, graceful error handling
8. **Performance Optimization**: Redis caching with intelligent invalidation strategies
9. **Monitoring & Analytics**: Built-in performance metrics and cache statistics
10. **Development Workflow**: Easy local development and container-based deployment

## Architecture Benefits

- **Separation of Concerns**: Frontend, backend, database, and cache as independent services
- **Scalability**: Each service can be scaled independently
- **Security**: Nginx acts as a security layer with proper headers
- **Performance**: Multi-layer caching (Redis + static files), gzip compression, optimized builds
- **Reliability**: Graceful degradation when cache is unavailable
- **Observability**: Built-in performance monitoring and cache analytics
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

### Redis Cache Issues
- **Cache not working**: Check Redis service health (`docker compose ps`)
- **Performance not improving**: Verify cache hit rates at `/api/stats`
- **Cache errors**: Application continues working, check Redis logs
- **Memory usage**: Monitor Redis memory with `docker compose exec redis redis-cli info memory`

### General Debugging
```bash
# Check all service health
docker compose ps

# View service logs
docker compose logs -f [service-name]

# Inspect network connectivity
docker compose exec backend ping db
docker compose exec backend ping redis
docker compose exec frontend ping backend

# Check container resources
docker compose top
```

## Redis Caching Implementation Details

### Cache Strategy
- **GET /api/notes**: Cached for 60 seconds (frequently changing list)
- **GET /api/notes/:id**: Cached for 300 seconds (individual notes change less often)
- **POST/PUT/DELETE**: Automatic cache invalidation to maintain data consistency

### Performance Features
- Cache hit/miss tracking with statistics
- Average response time monitoring
- Exponential moving average for response time calculations
- Cache key pattern management for efficient invalidation
- X-Cache headers for debugging (HIT/MISS)
- X-Response-Time headers for performance monitoring

### Monitoring Endpoints
- **GET /api/stats**: Cache statistics, hit rates, response times
- **POST /api/cache/clear**: Admin endpoint to flush all cache
- **GET /health**: Overall system health including cache status

## Next Steps

Future enhancements could include:
- Phase 5: Load balancer with multiple backend instances
- Phase 6: CI/CD pipeline with automated testing
- Phase 7: Kubernetes deployment configurations
- Phase 8: Monitoring and logging with Prometheus/Grafana
- Phase 9: Advanced caching strategies (Redis Cluster, cache warming)

This full-stack application demonstrates enterprise-level container orchestration patterns and provides a solid foundation for learning Docker in real-world scenarios.