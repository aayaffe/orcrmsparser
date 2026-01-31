#!/bin/bash

# ORCMS Parser - GCP Deployment Script
# This script automates the deployment process

set -e

echo "================================"
echo "ORCMS Parser - GCP Deployment"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on GCP VM
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}Warning: gcloud CLI not found. Make sure you're on a GCP VM with gcloud installed.${NC}"
fi

# Step 1: Update system
echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# Step 2: Install Docker
echo -e "${YELLOW}Step 2: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi
echo ""

# Step 3: Install Docker Compose
echo -e "${YELLOW}Step 3: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi
echo ""

# Step 4: Install Git
echo -e "${YELLOW}Step 4: Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
    echo -e "${GREEN}✓ Git installed${NC}"
else
    echo -e "${GREEN}✓ Git already installed${NC}"
fi
echo ""

# Step 5: Clone or update repository
echo -e "${YELLOW}Step 5: Setting up application...${NC}"
if [ -d "orcrmsparser" ]; then
    echo "Repository already exists. Updating..."
    cd orcrmsparser
    git pull
else
    echo "Cloning repository..."
    git clone https://github.com/aayaffe/orcrmsparser.git
    cd orcrmsparser
fi

# Create necessary directories
mkdir -p orcsc/output
mkdir -p orcsc/templates
mkdir -p logs

echo -e "${GREEN}✓ Application ready${NC}"
echo ""

# Step 6: Build images
echo -e "${YELLOW}Step 6: Building Docker images...${NC}"
docker-compose -f docker-compose.gcp.yml build
echo -e "${GREEN}✓ Images built${NC}"
echo ""

# Step 7: Start services
echo -e "${YELLOW}Step 7: Starting services...${NC}"
docker-compose -f docker-compose.gcp.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Step 8: Verify deployment
echo -e "${YELLOW}Step 8: Verifying deployment...${NC}"
docker-compose -f docker-compose.gcp.yml ps

if docker-compose -f docker-compose.gcp.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ All services are running${NC}"
else
    echo -e "${RED}✗ Some services failed to start${NC}"
    echo "Check logs with: docker-compose -f docker-compose.gcp.yml logs"
    exit 1
fi
echo ""

# Get public IP
echo -e "${YELLOW}Step 9: Getting VM information...${NC}"
VM_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2>/dev/null || echo "localhost")

echo ""
echo -e "${GREEN}================================"
echo "Deployment Complete!"
echo "================================${NC}"
echo ""
echo "Access the application at:"
echo -e "  Frontend: ${GREEN}http://${VM_IP}:3000${NC}"
echo -e "  Backend API: ${GREEN}http://${VM_IP}:8000${NC}"
echo -e "  API Documentation: ${GREEN}http://${VM_IP}:8000/docs${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:     docker-compose -f docker-compose.gcp.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.gcp.yml down"
echo "  Restart:       docker-compose -f docker-compose.gcp.yml restart"
echo ""
