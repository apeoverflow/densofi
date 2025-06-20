#!/bin/bash

# DensoFi Backend Instance Setup Script
# Run this script INSIDE the GCP instance after SSH'ing in

set -e

echo "🔧 Setting up DensoFi Backend on GCP instance..."

# Configuration
GITHUB_REPO=${1:-"https://github.com/0xkieranwilliams/densofi.git"}

echo "📁 Using repository: $GITHUB_REPO"

# Navigate to app directory
cd /opt/densofi

# Clone repository
echo "📥 Cloning repository..."
git clone $GITHUB_REPO .

# Navigate to backend
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create environment file template
echo "📝 Creating environment file template..."
cat > .env << 'EOF'
# Server Configuration
PORT=8000
NODE_ENV=production

# MongoDB Configuration (use your existing MongoDB connection)
MONGO_URL=mongodb://your-existing-mongodb-connection-string
MONGO_DB=densofi_domains

# Authentication
ADMIN_API_KEY=your-secure-admin-key-generate-a-strong-one

# Blockchain Configuration
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CHAIN_ID=11155111

# Contract Addresses
DOMAIN_REGISTRATION_CONTRACT=0x640b66a1cd9D2e3c4F118B9Bb58479c0Ca439f42

# Event Listening Configuration
ENABLE_EVENT_LISTENERS=true
POLLING_INTERVAL=60000
EVENT_BATCH_SIZE=200

# Private Key (for blockchain interactions - keep this secure!)
PRIVATE_KEY=your-private-key-here
EOF

# Secure the environment file
chmod 600 .env

echo "⚠️  IMPORTANT: Edit the .env file with your actual values:"
echo "   nano .env"
echo ""
echo "🔑 You need to update these values in .env:"
echo "   - MONGO_URL (your existing MongoDB connection string)"
echo "   - ADMIN_API_KEY (generate a secure random key)"
echo "   - RPC_URL (get from Infura/Alchemy if needed)"
echo "   - PRIVATE_KEY (your blockchain private key)"
echo ""

read -p "Press Enter after you've updated the .env file..."

# Create PM2 ecosystem file  
echo "⚙️  Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
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

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
echo "🔄 Setting up PM2 to start on boot..."
pm2 startup
echo ""
echo "⚠️  IMPORTANT: Run the command that PM2 startup just showed you!"
echo "   It will look like: sudo env PATH=... pm2 startup systemd -u ubuntu --hp /home/ubuntu"
echo ""

read -p "Press Enter after you've run the PM2 startup command..."

# Test the application
echo "🧪 Testing the application..."
sleep 5

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo ""
    echo "📊 Application Status:"
    pm2 status
    echo ""
    echo "🌐 Your backend is accessible at:"
    EXTERNAL_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google")
    echo "   External: http://$EXTERNAL_IP:8000"
    echo "   Health Check: http://$EXTERNAL_IP:8000/health"
    echo ""
    echo "📈 Useful commands:"
    echo "   pm2 status                    # Check application status"
    echo "   pm2 logs densofi-backend      # View real-time logs"
    echo "   pm2 logs densofi-backend --lines 50  # View last 50 log lines"
    echo "   pm2 restart densofi-backend   # Restart application"
    echo "   pm2 stop densofi-backend      # Stop application"
    echo "   pm2 delete densofi-backend    # Remove application from PM2"
    echo ""
    echo "🔍 Log files location:"
    echo "   /var/log/densofi/error.log    # Error logs"
    echo "   /var/log/densofi/out.log      # Output logs"
    echo "   /var/log/densofi/combined.log # Combined logs"
    echo ""
    echo "✨ Setup completed successfully!"
else
    echo "❌ Application failed to start. Checking logs..."
    echo ""
    echo "PM2 Status:"
    pm2 status
    echo ""
    echo "Recent logs:"
    pm2 logs densofi-backend --lines 20
    echo ""
    echo "Environment file check:"
    echo "File exists: $(test -f .env && echo 'Yes' || echo 'No')"
    echo "File permissions: $(ls -la .env 2>/dev/null || echo 'File not found')"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check if .env file has correct values"
    echo "   2. Verify MongoDB connection string"
    echo "   3. Check if all required environment variables are set"
    echo "   4. View detailed logs: pm2 logs densofi-backend"
fi 