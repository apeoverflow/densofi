# 🚀 Quick Deployment Guide

## Prerequisites
1. **Google Cloud SDK** installed and configured
2. **GCP Project** created with billing enabled  
3. **MongoDB** connection string ready
4. **GitHub repository** with your code

## Step 1: Run Local Deployment Script

```bash
# Replace with your actual project ID
./deploy-to-gcp.sh YOUR_GCP_PROJECT_ID https://github.com/0xkieranwilliams/densofi.git
```

This script will:
- ✅ Create GCP Compute Engine instance (e2-micro)
- ✅ Set up firewall rules
- ✅ Install Node.js, PM2, and dependencies
- ✅ Give you the instance IP and SSH command

## Step 2: SSH into Instance

```bash
# The script will show you this command
gcloud compute ssh densofi-backend --zone=us-central1-a
```

## Step 3: Run Instance Setup

```bash
# Inside the GCP instance, run:
cd /opt/densofi
# Upload the setup script or run commands manually
wget https://raw.githubusercontent.com/0xkieranwilliams/densofi/main/setup-instance.sh
chmod +x setup-instance.sh
./setup-instance.sh https://github.com/0xkieranwilliams/densofi.git
```

**OR run manually:**

```bash
cd /opt/densofi
git clone https://github.com/0xkieranwilliams/densofi.git .
cd backend
npm install
npm run build

# Create .env file with your MongoDB connection
nano .env
# Add your environment variables (see template below)

chmod 600 .env

# Create PM2 config and start
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Follow PM2 startup instructions

# Test
curl http://localhost:8000/health
```

## Environment Variables Template (.env)

```bash
PORT=8000
NODE_ENV=production

# Your existing MongoDB
MONGO_URL=mongodb://your-existing-mongodb-connection-string
MONGO_DB=densofi_domains

# Generate a secure key
ADMIN_API_KEY=your-secure-admin-key-here

# Blockchain config
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CHAIN_ID=11155111
DOMAIN_REGISTRATION_CONTRACT=0x640b66a1cd9D2e3c4F118B9Bb58479c0Ca439f42

# Event listeners
ENABLE_EVENT_LISTENERS=true
POLLING_INTERVAL=60000
EVENT_BATCH_SIZE=200

# Your private key
PRIVATE_KEY=your-private-key-here
```

## Useful Commands

```bash
# Application management
pm2 status                    # Check status
pm2 logs densofi-backend      # View logs
pm2 restart densofi-backend   # Restart app
pm2 stop densofi-backend      # Stop app

# System monitoring
htop                          # CPU/Memory usage
df -h                         # Disk usage
free -h                       # Memory usage

# Update application
cd /opt/densofi/backend
git pull origin main
npm install
npm run build
pm2 restart densofi-backend
```

## Cost Estimate
- **e2-micro instance**: ~$5.50/month
- **20GB standard disk**: ~$0.80/month
- **Total**: ~$6.30/month

## Your Backend Endpoints
After deployment, your backend will be available at:
- **Health Check**: `http://YOUR_INSTANCE_IP:8000/health`
- **API Base**: `http://YOUR_INSTANCE_IP:8000/api`
- **Domain Routes**: `http://YOUR_INSTANCE_IP:8000/api/domains`

## Troubleshooting

### Application won't start
```bash
pm2 logs densofi-backend --lines 50
# Check environment variables
cat .env
# Verify MongoDB connection
```

### Can't access from outside
```bash
# Check firewall rules
gcloud compute firewall-rules list | grep densofi
# Verify instance is running
gcloud compute instances list
```

### Memory issues
```bash
# Check memory usage
free -h
# Restart with memory limit
pm2 restart densofi-backend --max-memory-restart 400M
```

## Security Notes
- ✅ Environment file is secured (chmod 600)
- ✅ Private keys are not logged
- ⚠️ Consider using Cloud Secret Manager for production
- ⚠️ Set up SSL/HTTPS for production domains

## Next Steps for Production
1. **Domain setup**: Point your domain to the instance IP
2. **SSL certificate**: Set up Let's Encrypt with Nginx
3. **Monitoring**: Set up Cloud Monitoring alerts
4. **Backups**: Configure automated backups
5. **Scaling**: Consider upgrading to e2-small for higher traffic 