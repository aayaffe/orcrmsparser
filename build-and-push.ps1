# Build and push Docker images to Docker Hub
# Usage: .\build-and-push.ps1 [tag]
# Example: .\build-and-push.ps1 latest
#          .\build-and-push.ps1 v1.0

param(
    [string]$tag = "latest",
    [string]$envFile = ".env.docker"
)

$PROJECT_NAME = "orcrmsparser"

# Load environment variables from .env.docker file
if (Test-Path $envFile) {
    Write-Host "Loading credentials from $envFile..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^=]+)=(.+)$") {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value)
        }
    }
} else {
    Write-Host "WARNING: $envFile not found. Using default credentials or manual input." -ForegroundColor Yellow
}

$DOCKERHUB_USER = [Environment]::GetEnvironmentVariable("DOCKER_HUB_USER") -or "aayaffe"
$DOCKERHUB_PAT = [Environment]::GetEnvironmentVariable("DOCKER_HUB_PAT")

Write-Host "Building and pushing images to Docker Hub as $DOCKERHUB_USER/$PROJECT_NAME" -ForegroundColor Cyan
Write-Host "Tag: $tag" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker version | Out-Null
} catch {
    Write-Host "ERROR: Docker daemon is not running!" -ForegroundColor Red
    exit 1
}

# Login to Docker Hub
Write-Host "Logging in to Docker Hub..." -ForegroundColor Yellow
if ($DOCKERHUB_PAT) {
    Write-Host "Using PAT from environment..." -ForegroundColor Yellow
    echo $DOCKERHUB_PAT | docker login -u $DOCKERHUB_USER --password-stdin
} else {
    Write-Host "No PAT found. Manual login required..." -ForegroundColor Yellow
    docker login -u $DOCKERHUB_USER
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to login to Docker Hub" -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "Building backend image..." -ForegroundColor Yellow
$backendImage = "$DOCKERHUB_USER/$PROJECT_NAME-backend:$tag"
docker build -f Dockerfile.backend -t $backendImage .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build backend image" -ForegroundColor Red
    exit 1
}

# Build frontend
Write-Host ""
Write-Host "Building frontend image..." -ForegroundColor Yellow
$frontendImage = "$DOCKERHUB_USER/$PROJECT_NAME-frontend:$tag"
docker build -f orcrms-frontend/Dockerfile -t $frontendImage ./orcrms-frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build frontend image" -ForegroundColor Red
    exit 1
}

# Push backend
Write-Host ""
Write-Host "Pushing backend image..." -ForegroundColor Yellow
docker push $backendImage
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to push backend image" -ForegroundColor Red
    exit 1
}

# Push frontend
Write-Host ""
Write-Host "Pushing frontend image..." -ForegroundColor Yellow
docker push $frontendImage
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to push frontend image" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "SUCCESS! Images pushed to Docker Hub:" -ForegroundColor Green
Write-Host "  Backend:  $backendImage" -ForegroundColor Green
Write-Host "  Frontend: $frontendImage" -ForegroundColor Green
Write-Host ""
Write-Host "To pull these images on your GCP VM, use:" -ForegroundColor Cyan
Write-Host "  docker pull $backendImage" -ForegroundColor Cyan
Write-Host "  docker pull $frontendImage" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or update docker-compose.yml with these image names." -ForegroundColor Cyan
