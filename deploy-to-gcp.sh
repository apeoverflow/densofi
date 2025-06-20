#!/bin/bash

# DensoFi Backend GCP Deployment Script
# Run this script to deploy your backend to Google Cloud Platform

set -e  # Exit on any error

echo "🚀 Starting DensoFi Backend Deployment to GCP..."

# Configuration
PROJECT_ID=${1:-"densofi-project"}  # Replace with your GCP project ID
INSTANCE_NAME="densofi-backend"
ZONE="us-central1-a"
MACHINE_TYPE="e2-micro"  # Always Free tier
GITHUB_REPO=${2:-"https://github.com/0xkieranwilliams/densofi.git"}

echo "📋 Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Instance Name: $INSTANCE_NAME"
echo "   Zone: $ZONE"
echo "   Machine Type: $MACHINE_TYPE"
echo "   Repository: $GITHUB_REPO"
echo ""

# Step 1: Set up GCP project
echo "🔧 Setting up GCP project..."
gcloud config set project $PROJECT_ID
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Step 2: Create firewall rules
echo "🔥 Creating firewall rules..."
gcloud compute firewall-rules create allow-densofi-backend \
    --allow tcp:8000 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow access to DensoFi backend on port 8000" \
    --quiet || echo "Firewall rule already exists"

gcloud compute firewall-rules create allow-http-https \
    --allow tcp:80,tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP and HTTPS traffic" \
    --quiet || echo "HTTP/HTTPS firewall rules already exist"

# Step 3: Create the instance
echo "🖥️  Creating Compute Engine instance..."
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --network-tier=STANDARD \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-standard \
    --tags=http-server,https-server,densofi-backend \
    --metadata=startup-script='#!/bin/bash
    
    # Update system
    apt-get update && apt-get upgrade -y
    
    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
    
    # Install PM2 for process management
    npm install -g pm2
    
    # Install Git and other tools
    apt-get install -y git htop curl wget unzip
    
    # Create app directory
    mkdir -p /opt/densofi
    chown -R ubuntu:ubuntu /opt/densofi
    
    # Create log directory
    mkdir -p /var/log/densofi
    chown -R ubuntu:ubuntu /var/log/densofi
    
    echo "Instance setup completed" > /var/log/setup.log
    ' || echo "Instance already exists"

# Wait for instance to be ready
echo "⏳ Waiting for instance to be ready..."
sleep 30

# Step 4: Get instance external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="get(networkInterfaces[0].accessConfigs[0].natIP)")
echo "🌐 Instance external IP: $EXTERNAL_IP"

echo ""
echo "✅ Instance created successfully!"
echo ""
echo "🔑 Next steps - run these commands:"
echo ""

# Generate the deployment commands
cat << EOF
# 1. SSH into your instance:
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE

# 2. Once inside the instance, run these commands:

# Navigate to app directory
cd /opt/densofi

# Clone your repository
git clone $GITHUB_REPO .

# Navigate to backend
cd backend

# Install dependencies
npm install

# Build the application
npm run build

# Create production environment file
nano .env

# Add your environment variables (example):
# PORT=8000
# NODE_ENV=production
# MONGO_URL=your-existing-mongodb-connection-string
# MONGO_DB=densofi_domains
# ADMIN_API_KEY=your-secure-admin-key
# RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# CHAIN_ID=11155111
# DOMAIN_REGISTRATION_CONTRACT=0x640b66a1cd9D2e3c4F118B9Bb58479c0Ca439f42
# ENABLE_EVENT_LISTENERS=true
# POLLING_INTERVAL=60000
# EVENT_BATCH_SIZE=200
# PRIVATE_KEY=your-private-key-here

# Secure the environment file
chmod 600 .env

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'densofi-backend',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: '/var/log/densofi/error.log',
    out_file: '/var/log/densofi/out.log',
    log_file: '/var/log/densofi/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOL

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above

# Test the application
curl http://localhost:8000/health

EOF

echo ""
echo "🎯 Your backend will be accessible at: http://$EXTERNAL_IP:8000"
echo ""
echo "📊 Useful monitoring commands (run inside the instance):"
echo "   pm2 status                    # Check application status"
echo "   pm2 logs densofi-backend      # View application logs" 
echo "   pm2 restart densofi-backend   # Restart application"
echo "   htop                          # System resources"
echo "   df -h                         # Disk usage"
echo ""
echo "🔧 To connect to your instance later:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "💰 Estimated monthly cost: ~\$6.30 (e2-micro + 20GB disk)"
echo ""
echo "✨ Deployment preparation complete!" 