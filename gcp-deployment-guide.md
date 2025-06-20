# GCP Deployment Guide for DensoFi Backend

## Prerequisites
- Google Cloud Account with billing enabled
- Google Cloud SDK installed locally
- Domain name (optional, for custom domain)

## Step 1: Initial GCP Setup

```bash
# Install Google Cloud SDK (if not already installed)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Step 2: Create Compute Engine Instance

```bash
# Create the instance
gcloud compute instances create densofi-backend \
    --zone=us-central1-a \
    --machine-type=e2-micro \
    --network-tier=STANDARD \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-standard \
    --tags=http-server,https-server \
    --metadata=startup-script='#!/bin/bash
    
    # Update system
    apt-get update && apt-get upgrade -y
    
    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
    
    # Install PM2 for process management
    npm install -g pm2
    
    # Install Git
    apt-get install -y git
    
    # Create app directory
    mkdir -p /opt/densofi
    chown -R $USER:$USER /opt/densofi
    '

# Create firewall rules
gcloud compute firewall-rules create allow-densofi-backend \
    --allow tcp:8000 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow access to DensoFi backend"
```

## Step 3: Deploy Application

```bash
# SSH into the instance
gcloud compute ssh densofi-backend --zone=us-central1-a

# Clone your repository (replace with your repo)
cd /opt/densofi
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Install dependencies
cd backend
npm install

# Build the application
npm run build
```

## Step 4: Environment Configuration

Create a production environment file:

```bash
# Create .env file
cat > .env << EOF
# Server Configuration
PORT=8000
NODE_ENV=production

# MongoDB Configuration (using MongoDB Atlas)
MONGO_URL=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/
MONGO_DB=densofi_domains

# Authentication
ADMIN_API_KEY=your-secure-admin-key-here

# Blockchain Configuration
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CHAIN_ID=11155111

# Contract Addresses
DOMAIN_REGISTRATION_CONTRACT=0x640b66a1cd9D2e3c4F118B9Bb58479c0Ca439f42

# Event Listening Configuration
ENABLE_EVENT_LISTENERS=true
POLLING_INTERVAL=60000
EVENT_BATCH_SIZE=200

# Private Key (for blockchain interactions)
PRIVATE_KEY=your-private-key-here
EOF

# Secure the environment file
chmod 600 .env
```

## Step 5: Setup PM2 Process Manager

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
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
EOF

# Create log directory
sudo mkdir -p /var/log/densofi
sudo chown -R $USER:$USER /var/log/densofi

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 6: Setup Nginx (Optional - for SSL and domain)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/densofi << EOF
server {
    listen 80;
    server_name YOUR_DOMAIN.com;  # Replace with your domain
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/densofi /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 7: Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d YOUR_DOMAIN.com

# Setup auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 8: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free M0 cluster
3. Create a database user
4. Whitelist your GCP instance IP
5. Get the connection string
6. Update your `.env` file with the connection string

## Step 9: Monitoring Setup

```bash
# Install monitoring script
cat > /opt/densofi/monitor.sh << EOF
#!/bin/bash
# Simple health check script

ENDPOINT="http://localhost:8000/health"
RESPONSE=\$(curl -s -o /dev/null -w "%{http_code}" \$ENDPOINT)

if [ \$RESPONSE -eq 200 ]; then
    echo "\$(date): Service is healthy"
else
    echo "\$(date): Service is down (HTTP \$RESPONSE), restarting..."
    pm2 restart densofi-backend
fi
EOF

chmod +x /opt/densofi/monitor.sh

# Add to crontab for monitoring every 5 minutes
crontab -e
# Add this line:
# */5 * * * * /opt/densofi/monitor.sh >> /var/log/densofi/monitor.log 2>&1
```

## Step 10: Backup Strategy

```bash
# Create backup script for logs and data
cat > /opt/densofi/backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

mkdir -p \$BACKUP_DIR

# Backup logs
tar -czf \$BACKUP_DIR/logs_\$DATE.tar.gz /var/log/densofi/

# Backup configuration
cp .env \$BACKUP_DIR/env_\$DATE.backup

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find \$BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

chmod +x /opt/densofi/backup.sh

# Schedule daily backups
crontab -e
# Add this line:
# 0 2 * * * /opt/densofi/backup.sh >> /var/log/densofi/backup.log 2>&1
```

## Cost Optimization Tips

1. **Use MongoDB Atlas M0 (Free)** for development
2. **Enable autoscaling** only when needed
3. **Use preemptible instances** for non-critical workloads (-80% cost)
4. **Monitor usage** with GCP billing alerts
5. **Use Cloud Storage** instead of persistent disks for backups
6. **Shutdown instances** during development downtime

## Scaling Considerations

### Horizontal Scaling (Multiple Instances)
```bash
# Create instance group
gcloud compute instance-groups managed create densofi-backend-group \
    --base-instance-name=densofi-backend \
    --template=densofi-backend-template \
    --size=2 \
    --zone=us-central1-a

# Setup load balancer
gcloud compute backend-services create densofi-backend-service \
    --protocol=HTTP \
    --port-name=http \
    --health-checks=densofi-health-check \
    --global
```

### Vertical Scaling (Larger Instance)
```bash
# Stop instance
gcloud compute instances stop densofi-backend --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type densofi-backend \
    --machine-type=e2-small \
    --zone=us-central1-a

# Start instance
gcloud compute instances start densofi-backend --zone=us-central1-a
```

## Maintenance Commands

```bash
# View application logs
pm2 logs densofi-backend

# Check application status
pm2 status

# Restart application
pm2 restart densofi-backend

# Update application
cd /opt/densofi/backend
git pull origin main
npm install
npm run build
pm2 restart densofi-backend

# Check system resources
htop
df -h
free -h

# Check GCP costs
gcloud billing accounts list
gcloud billing budgets list --billing-account=YOUR_BILLING_ACCOUNT
```

## Security Checklist

- [ ] Environment variables secured (chmod 600 .env)
- [ ] Firewall rules properly configured
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Automatic security updates enabled
- [ ] MongoDB IP whitelist configured
- [ ] SSL certificate installed (if using domain)
- [ ] Admin API key secured
- [ ] Private keys secured

## Troubleshooting

### Common Issues:

1. **Out of Memory**
   ```bash
   # Check memory usage
   free -h
   # Increase swap space or upgrade instance
   ```

2. **Application Won't Start**
   ```bash
   # Check PM2 logs
   pm2 logs densofi-backend --lines 50
   ```

3. **Database Connection Issues**
   ```bash
   # Test MongoDB connection
   mongo "mongodb+srv://your-connection-string"
   ```

4. **Firewall Issues**
   ```bash
   # Check firewall rules
   gcloud compute firewall-rules list
   ```

This setup provides a robust, cost-effective deployment of your DensoFi backend on Google Cloud Platform with monitoring, backups, and scaling capabilities. 