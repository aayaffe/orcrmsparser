# Complete Deployment Guide - From Development to Production

This guide covers the entire journey of your ORCMS Parser application from local development to production on GCP.

## 📚 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Testing Before Production](#testing-before-production)
3. [Preparing for GCP](#preparing-for-gcp)
4. [GCP Deployment](#gcp-deployment)
5. [Post-Deployment Setup](#post-deployment-setup)
6. [Maintenance](#maintenance)

---

## Local Development Setup

### Prerequisites on Windows

1. **Install Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Enable WSL 2 backend
   - Allocate 4GB+ RAM to Docker

2. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

### Quick Local Start

**Windows Users:**
```batch
# Run the batch script
setup-local.bat
```

**Mac/Linux Users:**
```bash
# Build and start
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f
```

### Access Local Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

### Local Development Commands

```bash
# View all running containers
docker-compose ps

# View real-time logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild images
docker-compose build --no-cache

# Execute command in container
docker-compose exec backend sh
docker-compose exec frontend sh
```

---

## Testing Before Production

### Functional Testing

1. **Test File Operations**
   - ✅ Upload ORCSC file
   - ✅ View file details
   - ✅ Edit file
   - ✅ Download file
   - ✅ Delete file

2. **Test Fleet Management**
   - ✅ Add boats
   - ✅ Edit boat details
   - ✅ Update sail numbers
   - ✅ Assign to classes

3. **Test Race Management**
   - ✅ Create races
   - ✅ Set start times
   - ✅ Assign scoring types
   - ✅ Manage classes

4. **Test API Endpoints**
   - ✅ GET /api/files
   - ✅ POST /api/files/upload
   - ✅ GET /api/files/get/{path}
   - ✅ POST /api/files/{path}/races
   - ✅ POST /api/files/{path}/boats

### Load Testing

```bash
# Use Apache Bench to test performance
ab -n 100 -c 10 http://localhost:8000/api/files

# Or use wrk
wrk -t4 -c100 -d30s http://localhost:8000/api/files
```

### Security Testing

```bash
# Test path traversal protection
curl "http://localhost:8000/api/files/get/../../etc/passwd"

# Test large file upload
# Should be rejected if > 10MB

# Test invalid XML
# Should be rejected with clear error
```

---

## Preparing for GCP

### 1. Create GCP Project

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
```

### 2. Configure Credentials

```bash
# Authenticate with GCP
gcloud auth login

# Set default zone
gcloud config set compute/zone us-central1-a
```

### 3. Generate SSH Key Pair

```bash
# Generate key pair (if not already done)
gcloud compute ssh-keys create my-key

# Or use existing key
gcloud compute ssh-keys list
```

### 4. Prepare Application

```bash
# Ensure all changes are committed
git status
git add .
git commit -m "Ready for GCP deployment"

# Tag the version
git tag v1.0.0
git push origin main --tags
```

---

## GCP Deployment

### Step 1: Create VM Instance

```bash
# Create VM with recommended specs
gcloud compute instances create orcms-parser \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-standard \
  --tags=web-server,orcms

# Alternative: using UI
# Navigate to Compute Engine > VM Instances > Create
```

### Step 2: Configure Firewall

```bash
# Allow traffic to frontend and backend
gcloud compute firewall-rules create allow-orcms-web \
  --allow=tcp:80,tcp:443,tcp:3000 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=orcms

# Optional: Restrict to specific IPs
gcloud compute firewall-rules create allow-orcms-api \
  --allow=tcp:8000 \
  --source-ranges=YOUR_IP/32 \
  --target-tags=orcms
```

### Step 3: Connect to VM

```bash
# SSH into the VM
gcloud compute ssh orcms-parser --zone=us-central1-a

# Or download gcloud key and use SSH directly
gcloud compute ssh orcms-parser --zone=us-central1-a -- -i ~/.ssh/my-key
```

### Step 4: Deploy Application

**Option A: Using Deployment Script (Recommended)**

```bash
# On the VM
curl -O https://raw.githubusercontent.com/aayaffe/orcrmsparser/master/deploy-gcp.sh
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

**Option B: Manual Deployment**

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/aayaffe/orcrmsparser.git
cd orcrmsparser

# Create necessary directories
mkdir -p orcsc/output orcsc/templates

# Start services
docker-compose -f docker-compose.gcp.yml up -d
```

### Step 5: Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose.gcp.yml ps

# Check logs
docker-compose -f docker-compose.gcp.yml logs

# Test endpoints
curl http://localhost:8000/docs
curl http://localhost:3000
```

---

## Post-Deployment Setup

### 1. Get VM Public IP

```bash
# From local machine
gcloud compute instances describe orcms-parser \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Or from VM itself
curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip \
  -H "Metadata-Flavor: Google"
```

### 2. Update Frontend API URL

If you're using a custom domain or IP, update the API URL:

```bash
# Modify docker-compose.gcp.yml
# In the frontend service, update VITE_API_URL

VITE_API_URL=http://<YOUR_PUBLIC_IP>:8000
```

### 3. Configure SSL/TLS (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure in nginx
# Update nginx.conf to use SSL certificates
```

### 4. Set Up Monitoring

```bash
# Enable Cloud Logging
gcloud logging sinks create orcms-sink \
  logging.googleapis.com/projects/YOUR_PROJECT_ID/logs/orcms

# View logs in Cloud Console
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=orcms-parser"
```

### 5. Configure Backups

```bash
# Create backup script
cat > ~/backup-orcsc.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
docker run --rm -v orcrmsparser_orcsc_output:/data \
  -v $BACKUP_DIR:/backup alpine \
  tar czf /backup/orcsc-backup-$(date +%Y%m%d-%H%M%S).tar.gz /data
EOF

# Make executable
chmod +x ~/backup-orcsc.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-orcsc.sh") | crontab -
```

---

## Maintenance

### Regular Tasks

#### Daily
```bash
# Check service health
docker-compose -f docker-compose.gcp.yml ps

# Monitor logs
docker-compose -f docker-compose.gcp.yml logs --tail=100
```

#### Weekly
```bash
# Backup data
~/backup-orcsc.sh

# Check disk usage
df -h
docker system df

# Review security logs
sudo journalctl -xe
```

#### Monthly
```bash
# Update OS packages
sudo apt-get update
sudo apt-get upgrade -y

# Update images
docker-compose -f docker-compose.gcp.yml pull
docker-compose -f docker-compose.gcp.yml build

# Clean up old images
docker image prune -a

# Verify backups
ls -lah ~/backups/
```

### Updating Application

```bash
# Pull latest code
cd ~/orcrmsparser
git pull

# Rebuild images
docker-compose -f docker-compose.gcp.yml build

# Update running services
docker-compose -f docker-compose.gcp.yml up -d

# Verify update
docker-compose -f docker-compose.gcp.yml ps
docker-compose -f docker-compose.gcp.yml logs
```

### Troubleshooting

See [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md#troubleshooting) for detailed troubleshooting steps.

---

## Scaling Considerations

For larger deployments:

1. **Increase VM Resources**
   - Use larger machine type (n1-standard-2 or higher)
   - Increase disk size

2. **Use Cloud Load Balancer**
   - Distribute traffic across multiple VMs
   - Better availability

3. **Use Cloud Storage**
   - Store files in Cloud Storage instead of VM disk
   - Better scalability

4. **Use Cloud SQL**
   - Move to managed database
   - Better reliability

5. **Use Cloud Run**
   - Serverless option for backend
   - Auto-scaling

---

## Cost Optimization

- **VM Sizing:** Use e2-medium for most use cases
- **Committed Use Discount:** Sign up for 1-year commitment
- **Preemptible VMs:** For non-critical workloads
- **Cloud Storage:** More cost-effective than VM disk for large files

---

## Security Checklist

- ✅ Firewall rules restricted
- ✅ SSH key-based authentication
- ✅ No root user for containers
- ✅ Regular security updates
- ✅ SSL/TLS certificates
- ✅ Regular backups
- ✅ Monitoring enabled
- ✅ Log aggregation
- ✅ Secrets in environment variables
- ✅ Regular security audits

---

## Support & Resources

- **GCP Documentation:** https://cloud.google.com/docs
- **Docker Documentation:** https://docs.docker.com/
- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **React Documentation:** https://react.dev/

---

## Next Steps

1. Follow the deployment steps above
2. Use the checklist in [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. Test thoroughly before going live
4. Set up monitoring and alerts
5. Plan disaster recovery procedures
6. Document your setup for your team

For quick reference, see [QUICK_START_GCP.md](QUICK_START_GCP.md)
