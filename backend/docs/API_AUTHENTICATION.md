# API Authentication

This document describes the API key authentication system implemented for the DensoFi backend API.

## Overview

The API uses a simple API key authentication system to protect administrative endpoints. Some endpoints are public, while others require a valid API key in the authorization header.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
ADMIN_API_KEY=your-secure-api-key-here
```

**Important:** Use a strong, randomly generated API key. Keep this key secure and never commit it to version control.

## Usage

### Public Endpoints

These endpoints do not require authentication:

- `GET /api/domains` - Get all domains
- `GET /api/domains/:name` - Get domain by name
- `GET /api/domains/:name/status` - Check if domain is registered
- `GET /api/domains/:name/:walletAddress/verify` - Verify domain ownership via DNS
- `GET /api/status` - Get service connection status
- `GET /health` - Health check

### Protected Endpoints

These endpoints require a valid API key:

- `POST /api/process-pending` - Trigger manual processing of pending events
- `GET /api/event-listeners/status` - Get detailed event listener status

### Authentication Check

- `GET /api/auth/status` - Check authentication status (works with or without API key)

## How to Include API Key

Include the API key in the `Authorization` header of your HTTP requests. The system supports multiple formats:

### Option 1: Bearer Token Format
```bash
curl -H "Authorization: Bearer your-api-key-here" http://localhost:3000/api/process-pending
```

### Option 2: ApiKey Format
```bash
curl -H "Authorization: ApiKey your-api-key-here" http://localhost:3000/api/process-pending
```

### Option 3: Direct API Key
```bash
curl -H "Authorization: your-api-key-here" http://localhost:3000/api/process-pending
```

## Response Codes

### Authentication Success
- `200` - Request successful with valid API key

### Authentication Errors
- `401` - No authorization header provided
- `403` - Invalid API key
- `500` - Server configuration error (ADMIN_API_KEY not set)

### Example Error Responses

#### Missing Authorization Header
```json
{
  "success": false,
  "error": "Authorization header is required"
}
```

#### Invalid API Key
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

#### Server Configuration Error
```json
{
  "success": false,
  "error": "Server configuration error"
}
```

## Testing Authentication

### Check Authentication Status
```bash
# Without API key
curl http://localhost:3000/api/auth/status

# With API key
curl -H "Authorization: Bearer your-api-key-here" http://localhost:3000/api/auth/status
```

### Test Protected Endpoint
```bash
# This should fail without API key
curl -X POST http://localhost:3000/api/process-pending

# This should succeed with valid API key
curl -X POST -H "Authorization: Bearer your-api-key-here" http://localhost:3000/api/process-pending
```

## Security Considerations

1. **Keep API Key Secret**: Never expose your API key in client-side code or commit it to version control
2. **Use HTTPS**: Always use HTTPS in production to protect the API key in transit
3. **Rotate Keys**: Regularly rotate your API keys
4. **Monitor Access**: The system logs all authentication attempts for monitoring
5. **Environment-Specific Keys**: Use different API keys for different environments (development, staging, production)

## Implementation Details

The authentication system is implemented using Express middleware:

- `requireApiKey`: Requires valid API key, returns 401/403 for invalid attempts
- `optionalApiKey`: Adds authentication info if valid API key provided, but doesn't require it

The middleware logs all authentication attempts for security monitoring. 