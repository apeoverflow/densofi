# GCP Cloud Run Deployment (Serverless Alternative)

## Why Cloud Run?
- **Pay only for usage** (requests and CPU time)
- **Auto-scaling** from 0 to 1000+ instances
- **No server management** required
- **Even lower costs** for development/low traffic

## Cost Comparison

### Cloud Run Pricing (Pay-per-use)
```
- CPU: $0.00002400 per vCPU-second
- Memory: $0.00000250 per GiB-second
- Requests: $0.40 per million requests
- Free Tier: 2 million requests, 400,000 GiB-seconds per month

Estimated monthly cost for low traffic:
- 10,000 requests/month: ~$1-3
- High traffic (100k requests): ~$10-15
```

## Setup Instructions

### 1. Prepare Application for Cloud Run

Create a Dockerfile in your backend directory:

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 8000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
```

### 2. Create .gcloudignore

```bash
# .gcloudignore
node_modules/
npm-debug.log
.git/
.gitignore
README.md
.env
.env.*
coverage/
.DS_Store
*.log
```

### 3. Deploy to Cloud Run

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Deploy the service
gcloud run deploy densofi-backend \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8000 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8000
```

### 4. Set Environment Variables

```bash
# Set all environment variables
gcloud run services update densofi-backend \
    --region us-central1 \
    --set-env-vars "MONGO_URL=mongodb+srv://..." \
    --set-env-vars "MONGO_DB=densofi_domains" \
    --set-env-vars "ADMIN_API_KEY=your-key" \
    --set-env-vars "RPC_URL=https://sepolia.infura.io/v3/..." \
    --set-env-vars "CHAIN_ID=11155111" \
    --set-env-vars "DOMAIN_REGISTRATION_CONTRACT=0x640..." \
    --set-env-vars "ENABLE_EVENT_LISTENERS=true" \
    --set-env-vars "POLLING_INTERVAL=60000"
```

### 5. Handle Event Listeners (Challenge with Serverless)

**Problem:** Cloud Run containers shut down when not receiving requests, which breaks continuous event listeners.

**Solutions:**

#### Option A: Cloud Scheduler + Cloud Run Jobs
```bash
# Create a Cloud Run Job for event processing
gcloud run jobs create densofi-event-processor \
    --image gcr.io/YOUR_PROJECT/densofi-backend \
    --region us-central1 \
    --memory 512Mi \
    --cpu 1 \
    --max-retries 3 \
    --parallelism 1 \
    --task-count 1

# Create a Cloud Scheduler job to trigger every 5 minutes
gcloud scheduler jobs create http densofi-event-scheduler \
    --schedule "*/5 * * * *" \
    --uri "https://densofi-backend-xxx-uc.a.run.app/api/process-pending" \
    --http-method POST \
    --headers "Authorization=Bearer $(gcloud auth print-identity-token)"
```

#### Option B: Separate Compute Engine for Event Listeners
Keep event listeners on a small e2-micro instance, API on Cloud Run:

```bash
# Deploy API to Cloud Run (without event listeners)
gcloud run services update densofi-backend \
    --region us-central1 \
    --set-env-vars "ENABLE_EVENT_LISTENERS=false"

# Deploy event listener service to Compute Engine
# (Use the previous Compute Engine setup but only for event processing)
```

### 6. Monitoring Cloud Run

```bash
# View logs
gcloud run services logs tail densofi-backend --region us-central1

# Check service status
gcloud run services describe densofi-backend --region us-central1

# Monitor costs
gcloud billing budgets list --billing-account=YOUR_BILLING_ACCOUNT
```

## **Hybrid Architecture (Recommended)**

For your specific use case with event listeners, I recommend a **hybrid approach**:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloud Run     │    │  Compute Engine  │    │  MongoDB Atlas  │
│   (API Server)  │    │ (Event Listener) │    │   (Database)    │
│                 │    │                  │    │                 │
│ - REST API      │    │ - Blockchain     │    │ - M0 Free Tier  │
│ - Wallet Auth   │    │   Event Polling  │    │ - 512MB RAM     │
│ - Game XP API   │    │ - Domain Events  │    │ - 5GB Storage   │
│ - Domain Lookup │    │ - NFT Events     │    │                 │
│                 │    │                  │    │                 │
│ Cost: ~$3/month │    │ Cost: ~$6/month  │    │ Cost: FREE      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Total Hybrid Cost: ~$9/month**

## Setup Commands for Hybrid Architecture

### 1. Deploy API to Cloud Run (Event Listeners Disabled)
```bash
gcloud run deploy densofi-api \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8000 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5 \
    --set-env-vars "ENABLE_EVENT_LISTENERS=false" \
    --set-env-vars "NODE_ENV=production"
```

### 2. Deploy Event Processor to Compute Engine
```bash
# Create smaller instance just for event processing
gcloud compute instances create densofi-events \
    --zone=us-central1-a \
    --machine-type=e2-micro \
    --network-tier=STANDARD \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=10GB \
    --boot-disk-type=pd-standard

# SSH and setup only event listener service
# (Copy only the event processing parts of your code)
```

### 3. Environment Configuration for Hybrid Setup

**Cloud Run (.env):**
```bash
ENABLE_EVENT_LISTENERS=false
PORT=8000
MONGO_URL=mongodb+srv://...
# ... other API-related configs
```

**Compute Engine (.env):**
```bash
ENABLE_EVENT_LISTENERS=true
POLLING_INTERVAL=30000
MONGO_URL=mongodb+srv://...
RPC_URL=https://sepolia.infura.io/v3/...
# ... event processing configs
```

This hybrid approach gives you:
- ✅ **Ultra-low cost** API hosting with Cloud Run
- ✅ **Reliable event processing** with Compute Engine
- ✅ **Free database** with MongoDB Atlas
- ✅ **Auto-scaling** API for traffic spikes
- ✅ **Always-on** blockchain event monitoring

Would you like me to help you implement either the full Compute Engine setup or the hybrid Cloud Run + Compute Engine architecture? 