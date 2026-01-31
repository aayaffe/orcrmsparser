# Docker Hub Build & Deploy Workflow

## Overview
Build Docker images locally on your machine, push them to Docker Hub, then deploy pre-built images on your GCP VM (zero build overhead).

## Setup (One-time)

### 1. Create Docker Hub Account
- Go to https://hub.docker.com and create a free account
- Your username: `aayaffe` (already set in scripts)

### 2. Create Personal Access Token (PAT)
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name it: `orcrmsparser-build`
4. Copy the token (save securely)

### 3. Add to .env.docker (Skip Password Input)
```bash
# Copy template
cp .env.docker.example .env.docker

# Edit .env.docker
DOCKER_HUB_USER=aayaffe
DOCKER_HUB_PAT=your_token_here
```

**DO NOT commit .env.docker to Git!** It contains secrets.

### 4. Ensure Docker is Running
- **Windows**: Start Docker Desktop
- **Mac/Linux**: Ensure Docker daemon is running

## Workflow

### Step 1: Build & Push Images from Local Machine

**Windows (PowerShell):**
```powershell
cd c:\programing\orcrmsparser
.\build-and-push.ps1 latest
# Automatically uses credentials from .env.docker (no password prompt)
```

**Mac/Linux (Bash):**
```bash
cd ~/orcrmsparser
chmod +x build-and-push.sh
./build-and-push.sh latest
# Automatically uses credentials from .env.docker (no password prompt)
```

**With Version Tag:**
```bash
./build-and-push.sh v1.0  # Creates aayaffe/orcrmsparser-backend:v1.0
```

**Without .env.docker** (manual login):
```bash
./build-and-push.sh latest
# Prompts for username/password (or PAT)
```

### Step 2: What Happens
1. Docker builds `orcrmsparser-backend` image
2. Docker builds `orcrmsparser-frontend` image
3. Both images are tagged with your Docker Hub username
4. Both images are pushed to Docker Hub
5. Output shows image names for deployment

### Step 3: Deploy on GCP VM (Zero CPU Load)

**SSH into GCP VM:**
```bash
gcloud compute ssh [INSTANCE_NAME] --zone [ZONE]
```

**Pull & Run Prebuilt Images:**
```bash
cd /home/[USERNAME]/orcrmsparser
docker login -u aayaffe
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

**That's it!** No building on the VM. Images downloaded (if not cached) and started.

### Step 4: Update to New Version

**On Local Machine:**
```bash
./build-and-push.sh v1.1
```

**On GCP VM:**
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## File Structure

```
orcrmsparser/
├── build-and-push.ps1        # Windows build & push script
├── build-and-push.sh         # Mac/Linux build & push script
├── docker-compose.yml        # Local dev (with build)
├── docker-compose.prod.yml   # Production (prebuilt images)
├── Dockerfile.backend        # Backend image definition
└── orcrms-frontend/
    └── Dockerfile            # Frontend image definition
```

## Troubleshooting

### "Command not found: build-and-push.sh"
**Mac/Linux:** Run `chmod +x build-and-push.sh` first

### "Docker daemon is not running"
- **Windows**: Start Docker Desktop
- **Mac**: Start Docker from Applications
- **Linux**: `sudo systemctl start docker`

### "Failed to login to Docker Hub"
- Verify username is correct
- Check password (or use personal access token)
- Ensure Docker is running

### "Image not found on GCP VM"
- Verify image was pushed: `docker search aayaffe/orcrmsparser-backend`
- Check typo in `docker-compose.prod.yml`
- Verify Docker Hub repository is public (or use credentials)

## Benefits

✅ **Zero CPU on GCP VM** - No building, just pulling pre-built images  
✅ **Faster Deployments** - Download vs compile  
✅ **Version Control** - Tag images with version numbers (v1.0, v1.1, etc.)  
✅ **Rollback** - Easy to revert to previous version  
✅ **CI/CD Ready** - Can automate with GitHub Actions later  

## Next Steps (Optional)

- Automate with GitHub Actions (push triggers build & deploy)
- Use image digests for reproducible deployments
- Set up private Docker Hub repositories for security
