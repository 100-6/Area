# Docker Development Guide

**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Development Setup](#development-setup)
4. [Running the Backend](#running-the-backend)
5. [Mobile Development with Docker](#mobile-development-with-docker)
6. [Common Commands](#common-commands)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Mirror Area project uses Docker to provide a consistent development environment for the backend services. The mobile application connects to the backend API running in Docker containers.

### Architecture

```
┌─────────────────┐
│  Mobile App     │
│  (Flutter)      │
└────────┬────────┘
         │ HTTP/HTTPS
         ▼
┌─────────────────┐
│  Backend API    │
│  (Docker)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  (PostgreSQL)   │
└─────────────────┘
```

---

## Prerequisites

### Required Software

1. **Docker Desktop**
   - [Download for macOS](https://docs.docker.com/desktop/install/mac-install/)
   - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
   - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)

2. **Docker Compose**
   - Included with Docker Desktop
   - Linux: `sudo apt-get install docker-compose`

3. **Flutter SDK** (for mobile development)
   - [Installation Guide](https://docs.flutter.dev/get-started/install)

### Verify Installation

```bash
# Check Docker version
docker --version
# Output: Docker version 24.0.0, build ...

# Check Docker Compose version
docker-compose --version
# Output: Docker Compose version v2.20.0

# Check Docker is running
docker ps
# Should show running containers or empty list
```

---

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/mirror-area.git
cd mirror-area
```

### 2. Environment Configuration

Create environment files for the backend:

**`.env` (root directory):**

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mirror_area
DATABASE_URL=postgresql://postgres:postgres@db:5432/mirror_area

# API
API_PORT=8080
API_HOST=0.0.0.0
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# OAuth (Optional - for testing OAuth flows)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Frontend URL (for OAuth callbacks)
FRONTEND_URL=http://localhost:3000
MOBILE_REDIRECT_SCHEME=autoarea
```

### 3. Mobile API Configuration

Update the mobile app to point to the Docker backend:

**`mobile/lib/core/constants/api_constants.dart`:**

```dart
class ApiConstants {
  // Development - Docker on same machine
  static const String baseUrl = 'http://localhost:8080';

  // Development - Docker on network (use machine IP)
  // static const String baseUrl = 'http://192.168.1.100:8080';

  // Production
  // static const String baseUrl = 'https://api.mirrorarea.com';
}
```

**Important for Android emulators:**

Android emulators can't reach `localhost` of the host machine. Use:

```dart
// For Android emulator
static const String baseUrl = 'http://10.0.2.2:8080';
```

---

## Running the Backend

### Start All Services

```bash
# Navigate to project root
cd mirror-area

# Start services in background
docker-compose up -d

# Or start with logs visible
docker-compose up
```

### Verify Services are Running

```bash
docker-compose ps
```

Expected output:

```
NAME                COMMAND                  SERVICE             STATUS              PORTS
mirror-area-api-1   "npm start"              api                 running             0.0.0.0:8080->8080/tcp
mirror-area-db-1    "docker-entrypoint.s…"   db                  running             5432/tcp
```

### Check API Health

```bash
curl http://localhost:8080/health
# Expected: {"status": "ok"}
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

### Stop Services

```bash
# Stop but keep data
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```

---

## Mobile Development with Docker

### Complete Development Workflow

#### 1. Start Backend Services

```bash
cd mirror-area
docker-compose up -d
```

#### 2. Run Mobile App

**For iOS Simulator:**

```bash
cd mobile
flutter run
```

The app will connect to `http://localhost:8080`.

**For Android Emulator:**

1. Update API URL in `api_constants.dart`:

```dart
static const String baseUrl = 'http://10.0.2.2:8080';
```

2. Run the app:

```bash
flutter run
```

**For Physical Device:**

1. Find your computer's IP address:

```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

2. Update API URL:

```dart
static const String baseUrl = 'http://192.168.1.100:8080';
```

3. Ensure device is on same network
4. Run the app:

```bash
flutter run
```

### Testing OAuth Flows

OAuth flows require accessible callback URLs:

1. **Update backend environment:**

```env
FRONTEND_URL=http://192.168.1.100:8080
MOBILE_REDIRECT_SCHEME=autoarea
```

2. **Restart backend:**

```bash
docker-compose restart api
```

3. **Test OAuth:**
   - Open mobile app
   - Navigate to Services screen
   - Click "Connect" on any OAuth service
   - Complete OAuth flow in browser
   - App should receive callback via deep link

---

## Common Commands

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild services
docker-compose up -d --build

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec api sh

# Remove all containers and volumes
docker-compose down -v
```

### Database Commands

```bash
# Access PostgreSQL shell
docker-compose exec db psql -U postgres -d mirror_area

# Run SQL file
docker-compose exec -T db psql -U postgres -d mirror_area < backup.sql

# Create database backup
docker-compose exec db pg_dump -U postgres mirror_area > backup.sql

# View database tables
docker-compose exec db psql -U postgres -d mirror_area -c "\dt"
```

### API Container Commands

```bash
# Access API container shell
docker-compose exec api sh

# Install npm packages
docker-compose exec api npm install

# Run migrations
docker-compose exec api npm run migrate

# View API logs
docker-compose logs -f api

# Restart API only
docker-compose restart api
```

### Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything
docker system prune -a --volumes
```

---

## Troubleshooting

### Issue: "Cannot connect to Docker daemon"

**Cause**: Docker Desktop not running

**Solution**:
```bash
# Start Docker Desktop application
# Wait for it to fully start
docker ps
```

### Issue: "Port 8080 already in use"

**Cause**: Another service using port 8080

**Solution**:
```bash
# Find process using port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process or change port in docker-compose.yml
ports:
  - "8081:8080"  # Use port 8081 instead
```

### Issue: "Database connection failed"

**Cause**: Database not ready or incorrect credentials

**Solution**:
```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Verify connection
docker-compose exec db psql -U postgres -d mirror_area
```

### Issue: "Mobile app cannot reach backend"

**Cause**: Incorrect API URL or network configuration

**Solution**:

1. **Check backend is running:**
```bash
curl http://localhost:8080/health
```

2. **For iOS Simulator:**
```dart
// Use localhost
static const String baseUrl = 'http://localhost:8080';
```

3. **For Android Emulator:**
```dart
// Use special Android emulator address
static const String baseUrl = 'http://10.0.2.2:8080';
```

4. **For Physical Device:**
```dart
// Use computer's network IP
static const String baseUrl = 'http://192.168.1.100:8080';
```

### Issue: "OAuth callback not working"

**Cause**: Backend redirect URL misconfigured

**Solution**:

1. **Update backend environment:**
```env
MOBILE_REDIRECT_SCHEME=autoarea
FRONTEND_URL=http://your-ip:8080
```

2. **Restart backend:**
```bash
docker-compose restart api
```

3. **Verify deep link config** in mobile app (see [OAuth Integration](OAUTH_INTEGRATION.md))

### Issue: "Container keeps restarting"

**Cause**: Application error or missing dependencies

**Solution**:
```bash
# Check logs for errors
docker-compose logs api

# Check container status
docker-compose ps

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Issue: "Database migrations not applied"

**Cause**: Migrations not run after database creation

**Solution**:
```bash
# Run migrations manually
docker-compose exec api npm run migrate

# Or recreate database
docker-compose down -v
docker-compose up -d
```

---

## Best Practices

### Development

1. **Always use docker-compose** for starting/stopping services
2. **Check logs regularly** for errors and warnings
3. **Use environment variables** for configuration
4. **Keep .env file secure** and never commit it to git
5. **Use volumes** for persistent data

### Performance

1. **Use Docker Desktop's resource settings** to allocate appropriate CPU/Memory
2. **Clean up unused images/containers** regularly
3. **Use .dockerignore** to exclude unnecessary files
4. **Restart containers** after significant changes

### Security

1. **Change default passwords** in production
2. **Use secrets management** for sensitive data
3. **Don't expose unnecessary ports**
4. **Keep Docker updated** to latest stable version
5. **Scan images** for vulnerabilities

---

## Docker Compose Configuration

**Example `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: mirror-area-db
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mirror-area-api
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: ${NODE_ENV}
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

---

**See also:**
- [Quick Start Guide](QUICK_START_AREA_MOBILE.md)
- [Mobile Build Guide](MOBILE_BUILD.md)
- [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
