# Environment Variables Configuration

This document describes the environment variables needed for the DensoFi frontend application.

## Backend Service Configuration

### Required Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```bash
# Backend Service URL
NEXT_PUBLIC_BACKEND_SERVICE_URL=http://localhost:8000
```

### Environment-Specific Values

#### Development
```bash
NEXT_PUBLIC_BACKEND_SERVICE_URL=http://localhost:8000
```

#### Production
```bash
NEXT_PUBLIC_BACKEND_SERVICE_URL=https://api.densofi.com
```

### Backend Service API Endpoint

The frontend will make a POST request to the following endpoint:
```
POST {NEXT_PUBLIC_BACKEND_SERVICE_URL}/api/validate-user
```

#### Request Body
```json
{
  "address": "0x...",
  "timestamp": 1234567890
}
```

#### Expected Response
```json
{
  "success": true,
  "message": "User validated successfully"
}
```

### Setup Instructions

1. Copy the environment variables to your `.env.local` file
2. Start your backend service on the specified URL
3. Ensure the `/api/validate-user` endpoint is implemented
4. The frontend will automatically call this endpoint during the domain token creation flow

### Usage in Application

The backend validation step occurs after wallet connection and before domain registration in the create-token flow:

1. **Connect Wallet** - User connects their wallet
2. **Backend Validation** - Frontend validates user with backend service ✨ (NEW)
3. **Register Domain** - User registers their domain
4. **Mint NFT** - Domain NFT is minted
5. **Create Token** - Domain token is created 