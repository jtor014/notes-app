# Notes App - Multi-Service Docker Application

A multi-service note-taking application built to learn and demonstrate Docker concepts, progressing from a simple containerized API to a full multi-container application.

## Phase 1: Basic Dockerized Node.js API

This phase establishes the foundation with a simple Express.js API containerized using Docker.

### Features
- Health check endpoint for monitoring
- Mock notes API endpoint
- Dockerized Node.js application using Alpine Linux
- Multi-stage build for optimized image size
- Non-root user execution for security

### Project Structure
```
notes-app/
├── backend/
│   ├── src/
│   │   └── index.js       # Express API server
│   ├── package.json       # Node.js dependencies
│   ├── Dockerfile         # Docker configuration
│   └── .dockerignore      # Docker ignore file
├── .gitignore             # Git ignore file
└── README.md              # This file
```

### Quick Start

#### Build the Docker Image
```bash
docker build -t notes-api ./backend
```

#### Run the Container
```bash
docker run -p 3000:3000 notes-api
```

### Testing the API

#### Test Health Endpoint
```bash
curl http://localhost:3000/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-06T..."
}
```

#### Test Notes Endpoint
```bash
curl http://localhost:3000/api/notes
```
Expected response:
```json
[
  {
    "id": 1,
    "title": "Sample Note",
    "content": "This is a test"
  }
]
```

### What This Phase Accomplishes

1. **Containerization Basics**: Demonstrates how to containerize a Node.js application using Docker
2. **Best Practices**: Implements Docker best practices including:
   - Multi-stage builds for smaller image size
   - Layer caching optimization
   - Running as non-root user
   - Proper .dockerignore configuration
3. **Foundation**: Establishes the backend service that will be extended in future phases with:
   - Database integration (PostgreSQL)
   - Frontend application
   - Redis caching
   - Docker Compose orchestration

### Next Steps

Phase 2 will integrate PostgreSQL database for persistent note storage, introducing multi-container communication and data persistence concepts.