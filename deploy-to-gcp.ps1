# Deploy to GCP VM - simplified version
# Usage: .\deploy-to-gcp.ps1 -Instance myinstance -Zone us-central1-a [-Project myproject] [-Tag v1.0]

param(
    [Parameter(Mandatory=$true)][string]$Instance,
    [Parameter(Mandatory=$true)][string]$Zone,
    [string]$Project,
    [string]$Tag = "latest",
    [string]$AppDir = "~/orcrmsparser"
)

$DOCKERHUB_USER = "aayaffe"
$PROJECT_NAME = "orcrmsparser"

Write-Host "Deploying $PROJECT_NAME to GCP VM" -ForegroundColor Cyan
Write-Host "  Instance: $Instance | Zone: $Zone | Tag: $Tag`n" -ForegroundColor Cyan

# Build deployment script inline
$deployScript = @'
#!/bin/bash
set -e

DOCKERHUB_USER="DOCKERHUB_USER_PLACEHOLDER"
PROJECT_NAME="PROJECT_NAME_PLACEHOLDER"
TAG="TAG_PLACEHOLDER"
APP_DIR="APP_DIR_PLACEHOLDER"

echo -e '\033[36mDeploying $DOCKERHUB_USER/$PROJECT_NAME:$TAG\033[0m'

# Expand ~ if used
APP_DIR="${APP_DIR/#~/$HOME}"

mkdir -p "$APP_DIR" && cd "$APP_DIR"

# Determine external IP for CORS (fallback to internal IP)
PUBLIC_IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip || true)
if [ -z "$PUBLIC_IP" ]; then
  PUBLIC_IP=$(hostname -I | awk '{print $1}')
fi

# Create docker-compose.prod.yml (always overwrite to update CORS)
cat > docker-compose.prod.yml << DOCKER_COMPOSE
services:
  backend:
    image: DOCKERHUB_USER_PLACEHOLDER/PROJECT_NAME_PLACEHOLDER-backend:TAG_PLACEHOLDER
    container_name: orcrmsparser-backend
    ports:
      - "8000:8000"
    volumes:
      - ./orcsc/output:/app/orcsc/output
      - ./orcsc/templates:/app/orcsc/templates
    environment:
      - CORS_ORIGINS=http://$PUBLIC_IP:3000
    command: ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/docs"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: DOCKERHUB_USER_PLACEHOLDER/PROJECT_NAME_PLACEHOLDER-frontend:TAG_PLACEHOLDER
    container_name: orcrmsparser-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
DOCKER_COMPOSE

# Install docker-compose if needed
if ! command -v docker-compose &> /dev/null; then
    echo 'Installing docker-compose...'
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Pull and run
echo 'Pulling images...'
docker-compose -f docker-compose.prod.yml pull
mkdir -p orcsc/{output,templates}
sudo chown -R 1000:1000 orcsc || true

echo 'Stopping old containers...'
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

echo 'Starting containers...'
docker-compose -f docker-compose.prod.yml up -d

echo -e '\033[32mDEPLOYMENT COMPLETE!\033[0m'
docker-compose -f docker-compose.prod.yml ps

echo -e '\033[36mAccess your app:\033[0m'
IP=$(hostname -I | awk '{print $1}')
echo "  Frontend: http://$IP:3000"
echo "  Backend:  http://$IP:8000"
echo "  API Docs: http://$IP:8000/docs"
'@

$deployScript = $deployScript -replace 'DOCKERHUB_USER_PLACEHOLDER', $DOCKERHUB_USER
$deployScript = $deployScript -replace 'PROJECT_NAME_PLACEHOLDER', $PROJECT_NAME
$deployScript = $deployScript -replace 'TAG_PLACEHOLDER', $Tag
$deployScript = $deployScript -replace 'APP_DIR_PLACEHOLDER', $AppDir

# Save to temp file with proper line endings
$tempFile = "$env:TEMP\deploy_$([guid]::NewGuid()).sh"
$bytes = [System.Text.Encoding]::UTF8.GetBytes(($deployScript -replace "`r`n", "`n"))
[System.IO.File]::WriteAllBytes($tempFile, $bytes)

# Build gcloud args
$sshArgs = @("compute", "ssh", $Instance, "--zone=$Zone", "--quiet")
$scpArgs = @("compute", "scp", $tempFile, "$($Instance):/tmp/deploy.sh", "--zone=$Zone", "--quiet")
if ($Project) {
    $sshArgs += "--project=$Project"
    $scpArgs += "--project=$Project"
}

# Deploy
Write-Host "Copying script..." -ForegroundColor Yellow
gcloud @scpArgs
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Failed to copy script"; exit 1 }

Write-Host "Executing deployment..." -ForegroundColor Yellow
$sshArgs += "--command", "bash /tmp/deploy.sh"
gcloud @sshArgs
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Deployment failed"; exit 1 }

# Cleanup & firewall
Remove-Item $tempFile -Force
Write-Host "`nSUCCESS! App deployed to $Instance" -ForegroundColor Green

# Setup firewall
Write-Host "Setting up firewall..." -ForegroundColor Yellow
$proj = if ($Project) { $Project } else { gcloud config get-value project 2>&1 }
gcloud compute firewall-rules create allow-app --allow="tcp:3000,tcp:8000" --source-ranges="0.0.0.0/0" --project=$proj 2>&1 | Out-Null

Write-Host "`nTo access:" -ForegroundColor Cyan
Write-Host "  Get external IP: gcloud compute instances describe $Instance --zone=$Zone --format='get(networkInterfaces[0].accessConfigs[0].natIP)'"
Write-Host "  Frontend: http://<EXTERNAL_IP>:3000"
Write-Host "`nTo SSH: gcloud compute ssh $Instance --zone=$Zone"
Write-Host "To view logs: docker logs orcrmsparser-backend"
Write-Host "To stop: docker-compose -f docker-compose.prod.yml down`n" -ForegroundColor Cyan
