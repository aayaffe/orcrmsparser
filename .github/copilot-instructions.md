# AI Coding Agent Instructions for ORC RMS Parser

## Project Overview
ORC RMS Parser is a web application for managing sailing race events. It features a **FastAPI backend** (Python) managing XML-based ORCSC race files and a **React 19 + TypeScript frontend** for user interactions. The stack includes Docker Compose for containerization, Material-UI for UI, and strict security hardening against path traversal and XXE attacks.

## Architecture

### Component Structure
- **Backend** (`api.py`): FastAPI server handling file operations, race/class/boat management on ORCSC XML files
- **Frontend** (`orcrms-frontend/`): React SPA with Material-UI, routes: `/` (home, file list) and `/view/:filePath` (file editor)
- **Shared Data Model**: XML-based ORCSC files stored in `orcsc/output/` with hierarchical structure: Event → Classes → Races → Fleet
- **File History**: Automatic backups in `orcsc/output/.history/` managed by `FileHistory` class

### Data Flow
1. User uploads/creates `.orcsc` XML file via frontend
2. Backend validates via `validate_file_path()` (path traversal prevention) and `DefusedET.parse()` (XXE prevention)
3. Frontend fetches file structure via `GET /api/files/get/{filePath}`
4. User modifies races/classes/boats; frontend calls specialized endpoints (`/races`, `/classes`, `/boats`)
5. Backend uses `orcsc.orcsc_file_editor` module to modify XML, auto-saves backups
6. File history tracking enables restore from backups

## Critical Development Patterns

### Security-First File Handling
**Critical Function**: `validate_file_path(file_path, base_dir="orcsc/output")` in `api.py:28-57`
- Converts backslashes to forward slashes (cross-platform compatibility)
- Extracts filename only to eliminate traversal vectors
- Uses `Path().resolve()` for safe boundary checking
- **Always use this function** before any file operation: `validated_path = validate_file_path(file_path)`
- Frontend also sanitizes filenames in `orcscApi.ts:createFromTemplate()` (removes `..` and separators)

### XXE Prevention
- Backend: Uses `from defusedxml import ElementTree as DefusedET` instead of standard `xml.etree`
- Replace any `ET.parse()` with `DefusedET.parse()` for XML parsing
- Frontend: No direct XML parsing (backend handles all XML operations)

### Frontend API Communication Pattern
In `orcscApi.ts`, all file operations use `encodeURIComponent()` on paths:
```typescript
await api.post(`/api/files/${encodeURIComponent(filePath)}/races`, { races })
```
This URL-encodes file paths to prevent special characters from breaking routes.

### Component State Refresh Pattern
After API mutations (add race, update boat, etc.), explicitly call `fetchFile()`:
```typescript
await orcscApi.addRaces(filePath, races);
fetchFile(); // Refresh UI with updated data
```
See `ViewFile.tsx` lines 310-340 for full example.

## Build & Development Workflow

### Local Development
```bash
# Terminal 1: Backend
python -m uvicorn api:app --reload

# Terminal 2: Frontend
cd orcrms-frontend
npm run frontend
```

### Docker Build
```bash
# Enable BuildKit for parallel builds (faster)
$env:DOCKER_BUILDKIT=1
docker-compose build

# Or build specific services only
docker-compose build frontend
docker-compose build backend
```
**Key Optimizations** (in Dockerfiles):
- Frontend: `npm ci --prefer-offline` (not `npm install`) - faster, reproducible
- Backend: `pip install --prefer-binary` - uses pre-compiled wheels
- Both: Dependencies in separate Docker layers for caching

### Frontend Build Issues
- Requires **Node.js 20.19+ or 22.12+** (Vite v7 requirement)
- Dockerfile uses `node:22-alpine` base
- TypeScript build via `tsc -b && vite build`

## Key Files & Their Purposes

| File | Purpose | Key Functions |
|------|---------|---|
| `api.py` | Main backend; FastAPI endpoints | `validate_file_path()`, all `/api/` routes |
| `orcsc/orcsc_file_editor.py` | XML manipulation logic | `add_races()`, `add_fleets()`, `update_fleet()` |
| `orcrms-frontend/src/api/orcscApi.ts` | HTTP client wrapper | `createNewFile()`, `uploadFile()`, `addRaces()` |
| `orcrms-frontend/src/types/orcsc.ts` | Frontend type definitions | `OrcscFile`, `RaceData`, `FleetData` interfaces |
| `.github/copilot-instructions.md` | This file | AI agent guidance |
| `requirements.txt` | Python dependencies | Must include `defusedxml~=0.4`, `python-multipart~=0.0.6` |

## Common Tasks for AI Agents

### Adding a New Backend Endpoint
1. Define Pydantic request model in `api.py` (see `AddRacesRequest` at line 116)
2. Use `@app.post()` or `@app.get()` decorator with `validate_file_path()` for file path param
3. Use `DefusedET.parse()` if parsing XML
4. Return generic error messages to clients; log details server-side
5. Update frontend API wrapper in `orcscApi.ts` with corresponding method
6. Test via Swagger UI at `http://localhost:8000/docs`

### Fixing Frontend TypeScript Errors
- Check `orcrms-frontend/src/types/orcsc.ts` for data structure definitions
- Use `encodeURIComponent()` on file paths in API calls
- Ensure unused variables are removed (ESLint strict mode enforced)
- Build locally: `npm run build` before pushing

### Modifying ORCSC XML Structure
1. Test against sample files in `jsons/` or `Template.json`
2. Use `orcsc.orcsc_file_editor` functions for all modifications
3. Always call `file_history.backup()` before writes (backend does auto-backup)
4. Run full cycle: backend edit → frontend refresh → verify in UI

## File Size & Security Constraints
- **Max upload**: 10MB
- **Max file operations**: 50MB
- **Allowed CORS origins**: `localhost:3000`, `localhost:5173`, `localhost:5174` (dev/prod)
- **Allowed HTTP methods**: GET, POST, PUT, DELETE, OPTIONS (no HEAD, PATCH, etc.)
- **Allowed file extension**: `.orcsc` only (validated in both frontend & backend)

## Testing & Validation
- No automated test suite currently; manual UI testing required
- FastAPI Swagger docs: `http://localhost:8000/docs` (self-documenting API)
- Frontend build validation: `npm run build` (catches TypeScript errors)
- Docker health checks configured: backend checks `/docs` endpoint every 30s

## Deployment Notes
- **Local**: `setup-local.bat` (Windows) or `docker-compose up`
- **GCP**: Refer to `GCP_DEPLOYMENT.md` for cloud setup scripts
- **Production**: Use `docker-compose.gcp.yml` for resource limits & health checks
- Backend runs with 4 uvicorn workers in production

## When to Ask for Clarification
- ORCSC XML schema changes (consult existing `Template.json` or `ISR_ORC.json`)
- CORS origin additions (impacts `api.py:64` and Docker env vars)
- New file type support (currently `.orcsc` only—path validation must be updated)
- Performance optimizations for large race files (XML parsing bottleneck)
