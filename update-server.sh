#!/bin/bash

# Configuration - Update these variables to match your setup
INSTANCE_NAME="densofi-backend"
ZONE="us-central1-a"
PROJECT_PATH="/opt/densofi/backend"
PM2_PROCESS_NAME="densofi-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment to server...${NC}"

# SSH into server using gcloud and run deployment commands
gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --project=densofi --ssh-flag="-T" << 'ENDSSH'

# Exit on any error
set -e

echo "📂 Navigating to project directory..."
cd /opt/densofi/backend

echo "📥 Fetching latest changes..."
git fetch origin

echo "🔄 Resetting to latest main branch..."
git reset --hard origin/main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "🔄 Reloading PM2 process..."
pm2 reload densofi-backend --update-env

echo "✅ Checking PM2 status..."
pm2 status

echo "📋 Recent logs (last 10 lines)..."
pm2 logs densofi-backend --lines 10 --nostream

echo "🎉 Deployment completed successfully!"

ENDSSH

# Check if gcloud command was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi
