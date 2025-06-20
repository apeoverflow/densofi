#!/bin/bash

# DensoFi Backend Update Script
# Run this locally to update your GCP instance with latest code changes

set -e

# Configuration
PROJECT_ID=${1:-"densofi"}
INSTANCE_NAME="densofi-backend"
ZONE="us-central1-a"
BRANCH=${2:-"main"}

echo "🚀 Updating DensoFi Backend on GCP..."
echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Instance: $INSTANCE_NAME"
echo "   Zone: $ZONE"
echo "   Branch: $BRANCH"
echo ""

# Check if instance is running
echo "🔍 Checking instance status..."
INSTANCE_STATUS=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="get(status)" --project=$PROJECT_ID)

if [ "$INSTANCE_STATUS" != "RUNNING" ]; then
    echo "❌ Instance is not running (Status: $INSTANCE_STATUS)"
    echo "Starting instance..."
    gcloud compute instances start $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID
    echo "⏳ Waiting for instance to start..."
    sleep 30
fi

echo "✅ Instance is running"

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="get(networkInterfaces[0].accessConfigs[0].natIP)" --project=$PROJECT_ID)
echo "🌐 Instance IP: $EXTERNAL_IP"

# Create update commands
echo "📦 Preparing update commands..."

# Create a temporary script to run on the server
UPDATE_SCRIPT=$(cat << 'EOF'
#!/bin/bash

set -e

echo "🔄 Starting server update process..."

# Navigate to app directory
cd /opt/densofi

# Check current status
echo "📊 Current status:"
pm2 status densofi-backend || echo "PM2 not running"

# Backup current version (in case we need to rollback)
echo "💾 Creating backup..."
if [ -d "backend/dist" ]; then
    cp -r backend/dist backend/dist.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
fi

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git fetch origin
git reset --hard origin/BRANCH_PLACEHOLDER
git clean -fd

echo "✅ Code updated to latest version"

# Navigate to backend
cd backend

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed"

# Restart PM2 application
echo "🔄 Restarting application..."
if pm2 describe densofi-backend > /dev/null 2>&1; then
    pm2 restart densofi-backend
    echo "✅ Application restarted"
else
    echo "⚠️  PM2 app not found, starting fresh..."
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
        pm2 save
        echo "✅ Application started"
    else
        echo "❌ ecosystem.config.js not found. Manual setup required."
        exit 1
    fi
fi

# Wait a moment for app to start
sleep 5

# Test the application
echo "🧪 Testing application..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
    echo "🎯 Update successful!"
    
    # Show current status
    echo ""
    echo "📊 Current application status:"
    pm2 status densofi-backend
    
    echo ""
    echo "📝 Recent logs:"
    pm2 logs densofi-backend --lines 10
    
else
    echo "❌ Application health check failed"
    echo "📝 Checking logs..."
    pm2 logs densofi-backend --lines 20
    
    echo ""
    echo "🔧 Troubleshooting tips:"
    echo "   1. Check environment variables in .env"
    echo "   2. Verify MongoDB connection"
    echo "   3. Check for any breaking changes in latest code"
    echo "   4. Manual restart: pm2 restart densofi-backend"
    
    exit 1
fi

echo ""
echo "🎉 Server update completed successfully!"
echo "🌐 Your backend is accessible at: http://$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google"):8000"

EOF
)

# Replace branch placeholder
UPDATE_SCRIPT=$(echo "$UPDATE_SCRIPT" | sed "s/BRANCH_PLACEHOLDER/$BRANCH/g")

# Execute the update script on the remote server
echo "🚀 Executing update on server..."
echo ""

gcloud compute ssh $INSTANCE_NAME \
    --zone=$ZONE \
    --project=$PROJECT_ID \
    --command="$UPDATE_SCRIPT"

echo ""
echo "✅ Update process completed!"
echo ""
echo "🎯 Your updated backend is accessible at: http://$EXTERNAL_IP:8000"
echo "🔍 Health check: http://$EXTERNAL_IP:8000/health"
echo ""
echo "📊 Useful commands to monitor:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID"
echo "   # Then inside the server:"
echo "   pm2 status"
echo "   pm2 logs densofi-backend"
echo "   curl http://localhost:8000/health"
echo ""
echo "💡 To rollback if needed:"
echo "   # SSH into server and restore backup from backend/dist.backup.*" 