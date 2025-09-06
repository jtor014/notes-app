# Production Deployment Guide

## Overview

This guide covers deploying the Notes API to production with comprehensive security hardening, monitoring, and operational excellence.

## Quick Start

1. **Environment Setup**
   ```bash
   cp .env.production.example .env
   # Edit .env with your production values
   ```

2. **Deploy Services**
   ```bash
   docker-compose up -d
   ```

3. **Verify Deployment**
   ```bash
   curl http://localhost/health/ready
   curl http://localhost/metrics
   ```

## Architecture

### Services

- **Frontend**: Nginx serving React SPA (Port 80)
- **Backend**: Node.js Express API (Port 3000) 
- **Database**: PostgreSQL 15 (Port 5434)
- **Cache**: Redis 7 (Port 6379)

### Network

- All services run on isolated `notes_network`
- Only frontend exposed externally on port 80
- Inter-service communication on private network

### Storage

- **PostgreSQL**: Persistent volume `notes_postgres_data`
- **Redis**: Persistent volume `notes_redis_data` with AOF

## Security Features

### API Security

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Helmet.js with CSP, HSTS, and other protections
- **Input Validation**: Comprehensive validation and sanitization
- **Error Handling**: Production-safe error messages
- **Request Tracking**: Unique request IDs for distributed tracing

### Container Security

- **Resource Limits**: CPU and memory constraints on all containers
- **Health Checks**: Liveness and readiness probes
- **Graceful Shutdown**: Proper signal handling and cleanup

### Data Security

- **Connection Pooling**: PostgreSQL connection management
- **Data Validation**: Server-side input sanitization
- **SQL Injection Protection**: Parameterized queries

## Monitoring & Observability

### Health Endpoints

| Endpoint | Purpose | Details |
|----------|---------|---------|
| `/health` | Basic health check | Service status |
| `/health/live` | Liveness probe | Process running |
| `/health/ready` | Readiness probe | Dependencies available |

### Metrics Endpoints

| Endpoint | Purpose | Format |
|----------|---------|--------|
| `/metrics` | Prometheus metrics | Text format |
| `/api/stats` | Cache statistics | JSON |

### Logging

- **Structured Logging**: JSON format in production
- **Request Tracing**: Unique IDs for request correlation
- **Performance Monitoring**: Response time tracking
- **Error Tracking**: Comprehensive error logging with stack traces

### Key Metrics

- **System**: Memory usage, uptime, CPU utilization
- **Database**: Connection status, query performance
- **Cache**: Hit/miss ratios, key counts
- **API**: Response times, error rates, request volumes

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database hostname | `db` | ✅ |
| `DB_PORT` | Database port | `5432` | ✅ |
| `DB_NAME` | Database name | `notesdb` | ✅ |
| `DB_USER` | Database user | `notesuser` | ✅ |
| `DB_PASSWORD` | Database password | - | ✅ |
| `REDIS_HOST` | Redis hostname | `redis` | ✅ |
| `REDIS_PORT` | Redis port | `6379` | ✅ |
| `CACHE_TTL` | Cache TTL (seconds) | `60` | ❌ |
| `NODE_ENV` | Environment mode | `production` | ❌ |
| `LOG_LEVEL` | Logging level | `info` | ❌ |
| `RATE_LIMIT_MAX` | Rate limit per window | `100` | ❌ |

### Resource Limits

| Service | CPU Limit | Memory Limit | Memory Reservation |
|---------|-----------|--------------|-------------------|
| Frontend | 0.25 cores | 128MB | 64MB |
| Backend | 0.5 cores | 512MB | 256MB |
| Database | 0.5 cores | 1GB | 512MB |
| Cache | 0.25 cores | 256MB | 128MB |

## Deployment Procedures

### Initial Deployment

1. **Prepare Environment**
   ```bash
   # Create production environment file
   cp .env.production.example .env
   
   # Set secure passwords
   export DB_PASSWORD=$(openssl rand -base64 32)
   echo "DB_PASSWORD=$DB_PASSWORD" >> .env
   ```

2. **Deploy Services**
   ```bash
   # Pull latest images
   docker-compose pull
   
   # Start services
   docker-compose up -d
   
   # Verify health
   docker-compose ps
   ```

3. **Verify Deployment**
   ```bash
   # Check all services are healthy
   curl -f http://localhost/health/ready || exit 1
   
   # Test API functionality
   curl -X POST http://localhost/api/notes \
        -H "Content-Type: application/json" \
        -d '{"title":"Test Note","content":"Production test"}'
   ```

### Updates & Maintenance

1. **Rolling Updates**
   ```bash
   # Pull new images
   docker-compose pull
   
   # Restart services with zero downtime
   docker-compose up -d --no-deps backend
   docker-compose up -d --no-deps frontend
   ```

2. **Database Maintenance**
   ```bash
   # Backup before maintenance
   docker-compose exec db pg_dump -U notesuser notesdb > backup.sql
   
   # Maintenance window procedures
   docker-compose stop backend
   # Perform maintenance
   docker-compose start backend
   ```

## Monitoring Setup

### Prometheus Configuration

```yaml
scrape_configs:
  - job_name: 'notes-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Grafana Dashboards

Key metrics to monitor:
- API response times (`notes_api_response_time`)
- Error rates (`notes_api_errors_total`)
- Memory usage (`notes_api_memory_usage_bytes`)
- Database connection status (`notes_api_database_status`)
- Cache hit rates (`notes_api_cache_hit_rate`)

### Log Aggregation

Configure log shipping for:
- Application logs (structured JSON)
- Access logs (HTTP requests)
- Error logs (exceptions and stack traces)
- Performance metrics (response times)

## Security Checklist

### Pre-Production

- [ ] Change all default passwords
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Review and test all endpoints
- [ ] Verify rate limiting configuration
- [ ] Test input validation
- [ ] Confirm error handling doesn't leak information

### Post-Deployment

- [ ] Set up monitoring and alerting
- [ ] Configure log rotation
- [ ] Set up regular database backups
- [ ] Review and test disaster recovery procedures
- [ ] Perform security audit and penetration testing
- [ ] Verify all health checks are working
- [ ] Test graceful shutdown procedures

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   docker-compose logs backend
   
   # Verify dependencies
   curl http://localhost/health/ready
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Test connectivity
   docker-compose exec backend nc -z db 5432
   ```

3. **Cache Issues**
   ```bash
   # Check Redis status
   docker-compose logs redis
   
   # Clear cache if needed
   curl -X POST http://localhost/api/cache/clear
   ```

### Performance Tuning

1. **Database Optimization**
   - Monitor connection pool usage
   - Adjust `DB_POOL_MIN` and `DB_POOL_MAX`
   - Enable query logging with `ENABLE_SQL_LOGGING=true`

2. **Cache Optimization**
   - Monitor hit/miss ratios via `/api/stats`
   - Adjust `CACHE_TTL` based on usage patterns
   - Scale Redis if memory usage is high

3. **Resource Scaling**
   - Monitor container resource usage
   - Adjust CPU/memory limits in `docker-compose.yml`
   - Scale horizontally by adding more backend instances

## Backup & Recovery

### Database Backups

```bash
# Daily backup script
docker-compose exec db pg_dump -U notesuser notesdb | gzip > "backup-$(date +%Y%m%d).sql.gz"

# Restore from backup
gunzip -c backup-20231201.sql.gz | docker-compose exec -T db psql -U notesuser -d notesdb
```

### Disaster Recovery

1. **Service Recovery**
   ```bash
   # Stop all services
   docker-compose down
   
   # Restore from backup
   docker-compose up -d db
   # Restore database
   docker-compose up -d
   ```

2. **Data Recovery**
   - Database backups stored with 30-day retention
   - Redis data persisted with AOF
   - Application state is stateless (easily recoverable)

## Performance Benchmarks

### Expected Performance

- **API Response Times**: < 100ms (95th percentile)
- **Database Queries**: < 50ms average
- **Cache Hit Rate**: > 80%
- **Memory Usage**: < 400MB per service
- **CPU Usage**: < 50% under normal load

### Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 http://localhost/api/notes

# Monitor during testing
watch curl -s http://localhost/api/stats
```

## Support & Maintenance

### Regular Tasks

- **Daily**: Monitor logs and metrics
- **Weekly**: Review performance trends
- **Monthly**: Security updates and patches
- **Quarterly**: Disaster recovery testing

### Emergency Contacts

- System Administrator: [Contact Info]
- Database Administrator: [Contact Info]
- Security Team: [Contact Info]