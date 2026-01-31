# Quick Start Guide - GCP Deployment

## TLDR - Deploy in 5 minutes

### 1. Create GCP VM
```bash
gcloud compute instances create orcms-parser \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=debian-11 \
  --image-project=debian-cloud
```

### 2. SSH into VM
```bash
gcloud compute ssh orcms-parser --zone=us-central1-a
```

### 3. Run Deployment Script
```bash
# Download and run the deployment script
curl -O https://raw.githubusercontent.com/aayaffe/orcrmsparser/master/deploy-gcp.sh
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

### 4. Access Your App
- **Frontend:** http://<YOUR_VM_IP>:3000
- **Backend API:** http://<YOUR_VM_IP>:8000
- **API Docs:** http://<YOUR_VM_IP>:8000/docs

---

## What Gets Deployed

```
orcrmsparser/
├── Backend (FastAPI)
│   ├── Python 3.11
│   ├── Port: 8000
│   └── Handles: File uploads, XML processing, API endpoints
│
├── Frontend (React + Vite + Nginx)
│   ├── Node 18 (build time)
│   ├── Nginx (runtime)
│   ├── Port: 3000
│   └── Handles: User interface
│
└── Shared Volumes
    ├── orcsc/output - Generated files
    └── orcsc/templates - Template files
```

---

## Common Tasks After Deployment

### View Logs
```bash
# All services
docker-compose -f docker-compose.gcp.yml logs -f

# Specific service
docker-compose -f docker-compose.gcp.yml logs -f backend
docker-compose -f docker-compose.gcp.yml logs -f frontend
```

### Restart Services
```bash
# Restart specific service
docker-compose -f docker-compose.gcp.yml restart backend

# Restart all
docker-compose -f docker-compose.gcp.yml restart
```

### Stop/Start Services
```bash
# Stop
docker-compose -f docker-compose.gcp.yml down

# Start
docker-compose -f docker-compose.gcp.yml up -d
```

### Update Application
```bash
cd ~/orcrmsparser
git pull
docker-compose -f docker-compose.gcp.yml build
docker-compose -f docker-compose.gcp.yml up -d
```

### Check Status
```bash
docker-compose -f docker-compose.gcp.yml ps
```

---

## Firewall Rules

Allow traffic on ports:
```bash
gcloud compute firewall-rules create allow-orcms \
  --allow=tcp:80,tcp:443,tcp:8000,tcp:3000 \
  --source-ranges=0.0.0.0/0
```

Or more restrictively:
```bash
# Only HTTP/HTTPS to public
gcloud compute firewall-rules create allow-orcms-public \
  --allow=tcp:80,tcp:443 \
  --source-ranges=0.0.0.0/0

# API only to specific IP
gcloud compute firewall-rules create allow-orcms-api \
  --allow=tcp:8000 \
  --source-ranges=YOUR_IP/32
```

---

## Useful Links

- **GCP Console:** https://console.cloud.google.com
- **Compute Engine:** https://console.cloud.google.com/compute/instances
- **API Documentation:** http://<YOUR_VM_IP>:8000/docs
- **Repository:** https://github.com/aayaffe/orcrmsparser

---

## Troubleshooting Quick Fixes

### Port Already in Use
```bash
# Find what's using port 8000
lsof -i :8000
# Kill it
sudo kill -9 <PID>
```

### Containers won't start
```bash
docker-compose -f docker-compose.gcp.yml logs
docker-compose -f docker-compose.gcp.yml down
docker-compose -f docker-compose.gcp.yml build --no-cache
docker-compose -f docker-compose.gcp.yml up -d
```

### Can't connect to API
```bash
# Check backend is running
docker-compose -f docker-compose.gcp.yml ps

# Check logs
docker-compose -f docker-compose.gcp.yml logs backend

# Test API
curl http://localhost:8000/docs
```

### Frontend shows connection error
1. Check API URL in frontend (should match backend IP)
2. Verify backend is running and accessible
3. Check firewall rules allow port 8000

---

## SSH into VM

```bash
# Using gcloud CLI
gcloud compute ssh orcms-parser --zone=us-central1-a

# Or traditional SSH
ssh -i ~/.ssh/my-key your-user@<EXTERNAL_IP>
```

---

## VM Information

Get your VM's public IP:
```bash
gcloud compute instances describe orcms-parser --zone=us-central1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

Or inside the VM:
```bash
curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google"
```

---

## Estimated Costs (GCP)

- **VM (e2-medium):** ~$0.0335/hour (~$24/month)
- **Storage:** ~$0.02/GB/month
- **Network:** $0.12/GB egress

**Total:** ~$25-30/month for basic setup

---

## Next Steps

1. Test the application thoroughly
2. Configure custom domain if needed
3. Set up SSL/TLS certificate
4. Configure monitoring and alerting
5. Set up automated backups
6. Document your setup for team
7. Train team members on deployment
8. Plan disaster recovery procedures

For detailed information, see [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)
