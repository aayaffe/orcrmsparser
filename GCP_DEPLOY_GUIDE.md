# GCP Deployment Guide

Complete end-to-end workflow: build locally → push to Docker Hub → deploy to GCP VM

## Prerequisites

### On Local Machine
- Docker installed and running
- `.env.docker` configured with Docker Hub PAT
- `build-and-push.ps1` (or `.sh` on Mac/Linux)

### On GCP
- Google Cloud account with billing enabled
- Compute Engine VM created (e2-micro recommended)
- `gcloud` CLI installed and authenticated
- VM has Docker and Docker Compose installed

## Step 1: Build & Push Images to Docker Hub

**Windows:**
```powershell
cd c:\programing\orcrmsparser
.\build-and-push.ps1 latest
# Or with version: .\build-and-push.ps1 v1.0
```

**Mac/Linux:**
```bash
cd ~/orcrmsparser
./build-and-push.sh latest
# Or with version: ./build-and-push.sh v1.0
```

Output shows:
```
SUCCESS! Images pushed to Docker Hub:
  Backend:  aayaffe/orcrmsparser-backend:latest
  Frontend: aayaffe/orcrmsparser-frontend:latest
```

## Step 2: Deploy to GCP VM

### Find Your VM Details
```bash
gcloud compute instances list
# Note the INSTANCE_NAME and ZONE
```

### Deploy (Windows PowerShell)
```powershell
.\deploy-to-gcp.ps1 -Instance myvm-1 -Zone us-central1-a
# With project: .\deploy-to-gcp.ps1 -Instance myvm-1 -Zone us-central1-a -Project myproject
# With version: .\deploy-to-gcp.ps1 -Instance myvm-1 -Zone us-central1-a -Tag v1.0
```

### Deploy (Mac/Linux Bash)
```bash
chmod +x deploy-to-gcp.sh
./deploy-to-gcp.sh -i myvm-1 -z us-central1-a
# With project: ./deploy-to-gcp.sh -i myvm-1 -z us-central1-a -p myproject
# With version: ./deploy-to-gcp.sh -i myvm-1 -z us-central1-a -t v1.0
```

## What Happens During Deployment

1. ✅ Connects to GCP VM via `gcloud compute ssh`
2. ✅ Creates `docker-compose.prod.yml` (pulls prebuilt images, no building)
3. ✅ Pulls latest images from Docker Hub
4. ✅ Starts containers with `docker-compose up -d`
5. ✅ Shows container status and access URLs

## Troubleshooting

### "gcloud CLI is not installed"
Install: https://cloud.google.com/sdk/docs/install

### "ERROR: (gcloud.compute.ssh) Could not fetch resource"
- Verify instance name: `gcloud compute instances list`
- Verify zone is correct
- Check billing is enabled on project

### "Cannot connect to Docker daemon"
SSH into VM and check:
```bash
sudo systemctl status docker
sudo systemctl start docker
```

### "docker-compose: command not found"
Install on VM:
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### Images pull but container doesn't start
Check logs:
```bash
docker logs orcrmsparser-backend
docker logs orcrmsparser-frontend
```

## Access Your App

After deployment succeeds, output shows:
```
Access your app:
  Frontend: http://35.192.x.x:3000
  Backend:  http://35.192.x.x:8000
  API Docs: http://35.192.x.x:8000/docs
```

Replace `35.192.x.x` with your VM's external IP address.

## Update to New Version

**Workflow:**
1. Make code changes locally
2. Build & push new version:
   ```bash
   ./build-and-push.ps1 v1.1
   ```
3. Deploy to VM:
   ```bash
   ./deploy-to-gcp.ps1 -Instance myvm-1 -Zone us-central1-a -Tag v1.1
   ```

VM automatically pulls new images and restarts containers.

## VM Management Commands

SSH into VM:
```bash
gcloud compute ssh myvm-1 --zone=us-central1-a
```

Check running containers:
```bash
docker ps
```

View logs:
```bash
docker logs orcrmsparser-backend -f
```

Stop app:
```bash
docker-compose -f docker-compose.prod.yml down
```

Restart app:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

Restart single container:
```bash
docker restart orcrmsparser-backend
```

## Workflow Summary

```
Local Machine              Docker Hub              GCP VM
─────────────              ──────────              ──────
Code Changes
    ↓
Build Images ─────────→ Store Images
    ↓                       
Deploy Script ─────────→ Pull & Run (No Build!)
                            
Instant deployment ✅
Zero CPU on VM ✅
Easy rollback (tag versions) ✅
```

## Files Reference

| File | Purpose |
|------|---------|
| `build-and-push.ps1` | Build & push to Docker Hub (Windows) |
| `build-and-push.sh` | Build & push to Docker Hub (Mac/Linux) |
| `deploy-to-gcp.ps1` | Connect to VM and deploy (Windows) |
| `deploy-to-gcp.sh` | Connect to VM and deploy (Mac/Linux) |
| `docker-compose.prod.yml` | Production config (pulls prebuilt images) |
| `.env.docker` | Docker Hub credentials (git ignored) |
