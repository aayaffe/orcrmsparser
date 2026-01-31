# GCP VM Deployment Guide

This guide explains how to deploy the ORCMS Parser application (backend + frontend) to a Google Cloud Platform VM.

## Prerequisites

1. **GCP Account** with a project created
2. **Google Cloud SDK** installed locally
3. **VM Instance** created (Compute Engine)
4. **SSH Access** to the VM

## Step 1: Create a GCP VM Instance

```bash
# Using gcloud CLI
gcloud compute instances create orcms-parser \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --boot-disk-size=20GB
```

**Recommended VM Configuration:**
- **Machine Type:** e2-medium or n1-standard-1 (2 vCPU, 4GB RAM minimum)
- **OS:** Debian 11 or Ubuntu 20.04+
- **Disk:** 20GB+
- **Region:** Choose closest to your users

## Step 2: Configure Firewall Rules

Allow HTTP and HTTPS traffic:

```bash
gcloud compute firewall-rules create allow-http-https \
  --allow=tcp:80,tcp:443,tcp:8000 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=web-server

# Tag your instance
gcloud compute instances add-tags orcms-parser \
  --tags=web-server \
  --zone=us-central1-a
```

## Step 3: SSH into the VM

```bash
gcloud compute ssh orcms-parser --zone=us-central1-a
```

## Step 4: Install Docker and Docker Compose

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Step 5: Clone and Deploy Application

```bash
# Clone the repository
git clone https://github.com/aayaffe/orcrmsparser.git
cd orcrmsparser

# Create necessary directories
mkdir -p orcsc/output
mkdir -p orcsc/templates

# Copy docker-compose to GCP version (see next step)
cp docker-compose.yml docker-compose.gcp.yml
```

## Step 6: Create GCP-Specific Docker Compose

Create `docker-compose.gcp.yml` with production settings:

```bash
# See docker-compose.gcp.yml file in this repo
```

## Step 7: Update Frontend API Configuration

Update the frontend to use the GCP VM's public IP:

```typescript
// In src/api/orcscApi.ts
const API_BASE_URL = 'http://<YOUR_GCP_VM_PUBLIC_IP>:8000';
```

Or use environment variables:

```bash
# Create .env file
VITE_API_URL=http://<YOUR_GCP_VM_PUBLIC_IP>:8000
```

## Step 8: Build and Deploy

```bash
# Start the application
docker-compose -f docker-compose.gcp.yml up -d

# View logs
docker-compose -f docker-compose.gcp.yml logs -f

# Stop the application
docker-compose -f docker-compose.gcp.yml down
```

## Step 9: Access the Application

- **Frontend:** http://<YOUR_GCP_VM_PUBLIC_IP>:3000
- **Backend API:** http://<YOUR_GCP_VM_PUBLIC_IP>:8000
- **API Docs:** http://<YOUR_GCP_VM_PUBLIC_IP>:8000/docs

## Step 10: (Optional) Set Up SSL/TLS with Nginx

For production, use Nginx as a reverse proxy with SSL:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf to use SSL
```

## Persistence and Data Management

### Volumes

The docker-compose creates named volumes for:
- `orcsc_output`: Stores generated files
- `orcsc_templates`: Stores template files

View volumes:
```bash
docker volume ls
docker volume inspect orcrmsparser_orcsc_output
```

### Backup

To backup data:
```bash
docker run --rm -v orcrmsparser_orcsc_output:/data \
  -v $(pwd):/backup alpine tar czf /backup/orcsc-backup.tar.gz /data
```

## Monitoring and Maintenance

### Check Container Status
```bash
docker-compose -f docker-compose.gcp.yml ps
```

### View Logs
```bash
# Backend logs
docker-compose -f docker-compose.gcp.yml logs backend

# Frontend logs
docker-compose -f docker-compose.gcp.yml logs frontend

# Real-time logs
docker-compose -f docker-compose.gcp.yml logs -f
```

### Restart Services
```bash
# Restart specific service
docker-compose -f docker-compose.gcp.yml restart backend

# Restart all
docker-compose -f docker-compose.gcp.yml restart
```

### Update Application

To deploy new changes:
```bash
cd orcrmsparser
git pull
docker-compose -f docker-compose.gcp.yml build
docker-compose -f docker-compose.gcp.yml up -d
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :8000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Container Won't Start
```bash
# Check logs for errors
docker-compose -f docker-compose.gcp.yml logs backend

# Rebuild and restart
docker-compose -f docker-compose.gcp.yml down
docker-compose -f docker-compose.gcp.yml build --no-cache
docker-compose -f docker-compose.gcp.yml up -d
```

### Connection Refused
- Check firewall rules allow ports 80, 3000, 8000
- Verify containers are running: `docker ps`
- Check backend is accessible from within frontend container

## Performance Optimization

1. **Enable Gzip Compression** in nginx.conf
2. **Set resource limits** in docker-compose
3. **Use Cloud Storage** for file uploads if scaling
4. **Enable Cloud CDN** for static assets
5. **Use Cloud Load Balancer** for multiple instances

## Security Best Practices

1. ✅ Run containers as non-root user
2. ✅ Use environment variables for sensitive data
3. ✅ Enable SSL/TLS
4. ✅ Restrict firewall to specific IPs if possible
5. ✅ Keep system and packages updated
6. ✅ Use Cloud Armor for DDoS protection
7. ✅ Regular backups of data volumes

## Next Steps

- Set up automated backups
- Configure monitoring with Cloud Logging
- Set up alert policies with Cloud Monitoring
- Consider using Cloud Run for serverless deployment
- Set up CI/CD with Cloud Build
