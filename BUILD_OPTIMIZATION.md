# Docker Build Optimization Guide

## Current Optimizations

The project includes several optimizations to speed up Docker builds:

### 1. **Layer Caching**
- Dependencies are installed in separate layers before copying source code
- This allows Docker to cache dependency layers and skip reinstallation when only source code changes

### 2. **Frontend (Node.js)**
- Using `npm ci` instead of `npm install` for faster, reproducible builds
- Added `--prefer-offline` flag to use cached packages when available
- Using Alpine-based Node.js image (smaller base layer)

### 3. **Backend (Python)**
- Using `--prefer-binary` flag with pip to use pre-compiled wheels
- `--no-cache-dir` removes pip cache to reduce image size
- Using slim Python image (smaller than full image)

### 4. .dockerignore
- Excludes unnecessary files (node_modules, .git, venv, __pycache__, etc.)
- Reduces data sent to Docker daemon

## Strategies for Even Faster Builds

### Option 1: Enable Docker BuildKit (Recommended)
BuildKit enables parallel builds and improved caching:

**Windows (PowerShell):**
```powershell
$env:DOCKER_BUILDKIT=1
docker-compose build
```

**Mac/Linux (Bash):**
```bash
export DOCKER_BUILDKIT=1
docker-compose build
```

### Option 2: Use Docker Buildx for Parallel Builds
```bash
docker buildx build --tag myapp:latest .
```

### Option 3: Build Only Specific Service
If you're only modifying frontend or backend:
```bash
# Frontend only
docker-compose build frontend

# Backend only
docker-compose build backend
```

### Option 4: Skip Unused Services
If you don't need all services, temporarily comment them in docker-compose.yml:
```yaml
services:
  backend:
    # ...
  frontend:
    # ...
  # nginx:
  #   # ... (commented out)
```

## Performance Tips

1. **First Build**: Will be slow (~5-10 minutes) - this is normal
2. **Subsequent Builds**: Much faster (~30 seconds) if only source code changes
3. **Dependency Changes**: Medium speed (~2-3 minutes) - rebuilds dependency layer
4. **Full Docker Restart**: May take longer due to service startup

## Build Time Estimates

- **Clean Build**: 5-10 minutes (first time)
- **Code Change Only**: 30-60 seconds
- **Dependency Change**: 2-3 minutes
- **Cached Full Build**: 1-2 minutes

## Monitoring Build Progress

```bash
# See detailed build output
docker-compose build --progress=plain

# Force rebuild (ignore cache)
docker-compose build --no-cache
```

## Environment-Specific Optimization

For development, consider using:
- `docker-compose.yml` - uses local volumes for live reloading
- `docker-compose.prod.yml` - optimized for production with caching

## Network Optimization

If builds are slow due to package downloads:
1. Check your internet connection speed
2. Consider using a local npm/pip cache proxy (advanced)
3. Use `npm ci --offline` with pre-cached packages (requires setup)

## Further Optimization (Advanced)

For enterprise deployments, consider:
- Pushing base images to private registry
- Using layer caching services
- Implementing kaniko or other container builders
