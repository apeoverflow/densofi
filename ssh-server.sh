#!/bin/bash

# Quick SSH script for DensoFi Backend Server
# Just run: ./ssh-server.sh

echo "🔑 Connecting to DensoFi Backend Server..."
echo "📍 Instance: densofi-backend"
echo "🌍 Zone: us-central1-a"
echo ""

gcloud compute ssh densofi-backend --zone=us-central1-a --project=densofi 