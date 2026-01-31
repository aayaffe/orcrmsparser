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

# Create self-signed certificate if not exists
if [ ! -f "nginx/certs/cert.pem" ]; then
  echo 'Creating self-signed SSL certificate...'
  mkdir -p nginx/certs
  openssl req -x509 -newkey rsa:4096 -keyout nginx/certs/key.pem -out nginx/certs/cert.pem -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=orc.avimarine.in"
fi

# Create docker-compose.prod.yml with variable substitution
cp docker-compose.prod.yml docker-compose.prod.yml.tmp
sed -i "s|aayaffe/orcrmsparser-backend:latest|$DOCKERHUB_USER/$PROJECT_NAME-backend:$TAG|g" docker-compose.prod.yml.tmp
sed -i "s|aayaffe/orcrmsparser-frontend:latest|$DOCKERHUB_USER/$PROJECT_NAME-frontend:$TAG|g" docker-compose.prod.yml.tmp
mv docker-compose.prod.yml.tmp docker-compose.prod.yml

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

# Ensure template exists in host volume (mount hides image templates)
if [ ! -f orcsc/templates/template.orcsc ]; then
  echo 'Copying template.orcsc from backend image...'
  TMP_CONTAINER=$(docker create $DOCKERHUB_USER/$PROJECT_NAME-backend:$TAG)
  docker cp "$TMP_CONTAINER:/app/orcsc/templates/template.orcsc" "orcsc/templates/template.orcsc" || true
  docker rm "$TMP_CONTAINER" >/dev/null
fi

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

# Setup firewall rules (only if not already set up)
Write-Host "Setting up firewall rules..." -ForegroundColor Yellow
$proj = if ($Project) { $Project } else { gcloud config get-value project 2>&1 }

# Check if firewall rules already exist
$existingRules = gcloud compute firewall-rules list --filter="name:(allow-http OR allow-https OR allow-app)" --project=$proj --format="value(name)" 2>&1

# Create HTTP rule if it doesn't exist
if (-not ($existingRules -contains "allow-http")) {
    Write-Host "Creating allow-http firewall rule..." -ForegroundColor Yellow
    gcloud compute firewall-rules create allow-http `
        --allow="tcp:80" `
        --source-ranges="0.0.0.0/0" `
        --project=$proj 2>&1 | Out-Null
} else {
    Write-Host "Firewall rule 'allow-http' already exists, skipping..." -ForegroundColor Gray
}

# Create HTTPS rule if it doesn't exist
if (-not ($existingRules -contains "allow-https")) {
    Write-Host "Creating allow-https firewall rule..." -ForegroundColor Yellow
    gcloud compute firewall-rules create allow-https `
        --allow="tcp:443" `
        --source-ranges="0.0.0.0/0" `
        --project=$proj 2>&1 | Out-Null
} else {
    Write-Host "Firewall rule 'allow-https' already exists, skipping..." -ForegroundColor Gray
}

# Create allow-app rule if it doesn't exist (for direct access to ports 3000 and 8000)
if (-not ($existingRules -contains "allow-app")) {
    Write-Host "Creating allow-app firewall rule..." -ForegroundColor Yellow
    gcloud compute firewall-rules create allow-app `
        --allow="tcp:3000,tcp:8000,tcp:8080" `
        --source-ranges="0.0.0.0/0" `
        --project=$proj 2>&1 | Out-Null
} else {
    Write-Host "Firewall rule 'allow-app' already exists, skipping..." -ForegroundColor Gray
}

Write-Host "`nTo access:" -ForegroundColor Cyan
Write-Host "  Domain: https://orc.avimarine.in (requires DNS configuration)" -ForegroundColor Cyan
Write-Host "  Get external IP: gcloud compute instances describe $Instance --zone=$Zone --format='get(networkInterfaces[0].accessConfigs[0].natIP)'" -ForegroundColor Cyan
Write-Host "`nDirect access (for troubleshooting):" -ForegroundColor Cyan
Write-Host "  Frontend: http://<EXTERNAL_IP>:3000" -ForegroundColor Cyan
Write-Host "  Backend:  http://<EXTERNAL_IP>:8000" -ForegroundColor Cyan
Write-Host "  Nginx Health: http://<EXTERNAL_IP>:8080/health" -ForegroundColor Cyan
Write-Host "`nNote: Ensure DNS 'orc.avimarine.in' points to your external IP." -ForegroundColor Yellow
Write-Host "`nTo SSH: gcloud compute ssh $Instance --zone=$Zone"
Write-Host "To view logs: docker logs orcrmsparser-backend"
Write-Host "To stop: docker-compose -f docker-compose.prod.yml down`n" -ForegroundColor Cyan
