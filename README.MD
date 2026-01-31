# ORC RMS Parser

A comprehensive web application for managing ORC sailing race events with file handling, fleet management, and scoring.

## Features

- 📁 **File Management** - Upload and manage ORCSC race files
- ⛵ **Fleet Management** - Add, edit, and manage boat entries
- 🏁 **Race Management** - Create and manage races and classes
- 📊 **Scoring** - Process race results and generate reports
- 🔒 **Security** - Path traversal protection, XXE prevention, input validation
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- ☁️ **Cloud Ready** - Designed for GCP and cloud platforms

## Quick Start - Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/aayaffe/orcrmsparser.git
cd orcrmsparser
```

2. Install Python dependencies
```bash
pip install -r requirements.txt
```

3. Install Frontend dependencies
```bash
cd orcrms-frontend
npm install
```

4. Start Backend
```bash
# From root directory
python -m uvicorn api:app --reload
```

5. Start Frontend (in new terminal)
```bash
cd orcrms-frontend
npm run dev
```

Access the application at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Docker Deployment

### Local Docker
```bash
docker-compose up -d
```

Access at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### GCP Deployment
See [QUICK_START_GCP.md](QUICK_START_GCP.md) for quick deployment guide.

For detailed instructions, see [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)

Quick deploy:
```bash
# On GCP VM
curl -O https://raw.githubusercontent.com/aayaffe/orcrmsparser/master/deploy-gcp.sh
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

## Project Structure

```
orcrmsparser/
├── api.py                       # FastAPI backend
├── requirements.txt             # Python dependencies
├── Dockerfile.backend           # Backend container
├── docker-compose.yml           # Local compose
├── docker-compose.gcp.yml       # GCP compose
├── orcrms-frontend/             # React frontend
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── orcsc/                       # ORC file handling
│   ├── output/                  # Generated files
│   └── templates/               # Race templates
├── GCP_DEPLOYMENT.md            # GCP guide
├── QUICK_START_GCP.md           # Quick start
└── DEPLOYMENT_CHECKLIST.md      # Deployment checklist
```

## Usage

### Download ORC Certificates
Update `settings.py` with your configuration, then:
```bash
python main.py --download
```

### Generate Target Time Files
```bash
python main.py --generate
```

## API Endpoints

- `GET /api/files` - List all files
- `POST /api/files/upload` - Upload ORCSC file
- `GET /api/files/get/{path}` - Get file details
- `POST /api/files/{path}/races` - Add races
- `POST /api/files/{path}/boats` - Add boats
- `POST /api/files/{path}/classes` - Add classes
- `GET /api/files/download/{filename}` - Download file
- `GET /api/files/{path}/history` - Get file history
- `POST /api/files/{path}/history/restore` - Restore from backup

See `/docs` for full API documentation.

## Security

- ✅ Path traversal protection
- ✅ XXE (XML External Entity) vulnerability prevention
- ✅ Input validation and sanitization
- ✅ File size limits
- ✅ CORS configuration
- ✅ Non-root Docker user
- ✅ Secure error handling

## Development

### Backend
- Framework: FastAPI
- Python: 3.11
- See `requirements.txt` for dependencies

### Frontend
- Framework: React 19
- Build Tool: Vite
- UI: Material-UI
- See `orcrms-frontend/package.json` for dependencies

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)

## Deployment Guides

- [Quick Start (GCP)](QUICK_START_GCP.md) - 5-minute deployment
- [Detailed GCP Guide](GCP_DEPLOYMENT.md) - Complete setup instructions
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Pre/post deployment checklist

## Support

For issues, questions, or contributions, please open an issue on GitHub.