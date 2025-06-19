# Wallet Authentication System

This document describes the wallet authentication system that enables secure wallet-based user authentication while tracking IP addresses for security monitoring.

## Overview

The wallet authentication system allows users to authenticate using their Web3 wallet by signing a message. It provides:

- **Secure Authentication**: Message signing without gas fees
- **IP Tracking**: Associates wallet addresses with IP addresses
- **Suspicious Activity Detection**: Monitors for potential abuse patterns
- **Admin Monitoring**: Comprehensive tracking and analytics

## Authentication Flow

### 1. Request Message to Sign
```
POST /api/auth/request-message
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Welcome to DensoFi!\n\nThis request will not trigger a blockchain transaction...",
    "nonce": "abc123...",
    "expiresAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. Sign Message (Frontend)
User signs the message with their wallet using their preferred Web3 library (wagmi, ethers, etc.)

### 3. Verify Signature
```
POST /api/auth/verify-signature
```

**Request:**
```json
{
  "nonce": "abc123...",
  "signature": "0x1234...",
  "walletAddress": "0x742d35Cc6634C0532925a3b8C11d1C8b9F2b9c5A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet authenticated successfully",
  "data": {
    "walletAddress": "0x742d35cc6634c0532925a3b8c11d1c8b9f2b9c5a",
    "ipAddress": "192.168.1.100",
    "isNewWallet": true,
    "signInCount": 1,
    "firstSeen": "2024-01-01T12:00:00.000Z",
    "lastSeen": "2024-01-01T12:00:00.000Z",
    "suspiciousActivity": null
  }
}
```

## API Endpoints

### Public Endpoints

#### Get Wallet Information
```
GET /api/auth/wallet/:address
```
Returns authentication information for a specific wallet address.

#### Get IP Wallet Associations
```
GET /api/auth/ip/:ip/wallets
```
Returns all wallets associated with a specific IP address.

#### Get Authentication Statistics
```
GET /api/auth/stats
```
Returns overall authentication statistics including current IP information.

### Admin Endpoints (Require API Key)

#### Get Wallet Authentication Statistics
```
GET /api/admin/wallet-auth-stats
```
Returns comprehensive wallet authentication analytics including suspicious activity.

#### Get All Verified Wallets
```
GET /api/admin/wallets?page=1&limit=50&sortBy=lastSeen&order=desc
```
Returns paginated list of all verified wallets with detailed information.

#### Get Wallet Details
```
GET /api/admin/wallets/:address
```
Returns detailed information for a specific wallet including IP associations and suspicious activity analysis.

## Integration Examples

### Frontend Integration (React + wagmi)

```typescript
import { useSignMessage } from 'wagmi'

export function WalletAuth() {
  const { signMessageAsync } = useSignMessage()
  
  const authenticate = async () => {
    try {
      // 1. Request message to sign
      const messageResponse = await fetch('/api/auth/request-message', {
        method: 'POST'
      })
      const { data } = await messageResponse.json()
      
      // 2. Sign message with wallet
      const signature = await signMessageAsync({
        message: data.message
      })
      
      // 3. Verify signature
      const verifyResponse = await fetch('/api/auth/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nonce: data.nonce,
          signature,
          walletAddress: address // from wagmi useAccount
        })
      })
      
      const result = await verifyResponse.json()
      if (result.success) {
        console.log('Authenticated!', result.data)
        // User is now authenticated
      }
    } catch (error) {
      console.error('Authentication failed:', error)
    }
  }
  
  return (
    <button onClick={authenticate}>
      Sign In with Wallet
    </button>
  )
}
```

### Backend Integration (Express Middleware)

```typescript
import { walletAuthStore } from '../services/wallet-auth-service.js'

// Middleware to check wallet authentication
export const requireWalletAuth = (req: Request, res: Response, next: NextFunction) => {
  const walletAddress = req.headers['x-wallet-address'] as string
  const signature = req.headers['x-wallet-signature'] as string
  
  if (!walletAddress) {
    return res.status(401).json({
      success: false,
      error: 'Wallet authentication required'
    })
  }
  
  const walletInfo = walletAuthStore.getWalletInfo(walletAddress)
  if (!walletInfo) {
    return res.status(401).json({
      success: false,
      error: 'Wallet not authenticated'
    })
  }
  
  // Add wallet info to request
  req.wallet = walletInfo
  next()
}
```

## Security Features

### Suspicious Activity Detection

The system automatically flags suspicious activity based on:

1. **Multi-IP Usage**: Wallet used from >5 different IP addresses
2. **Multi-Wallet IPs**: IP address associated with >10 different wallets  
3. **Rapid Sign-ins**: Multiple sign-ins within 1 minute

### Rate Limiting

- **Message Requests**: General API rate limiting (100/15min)
- **Signature Verification**: Strict rate limiting (10/15min)
- **Admin Endpoints**: Strict rate limiting with API key authentication

### Session Security

- **Nonce Expiration**: Messages expire after 10 minutes
- **Single Use**: Each nonce can only be used once
- **Automatic Cleanup**: Expired sessions are automatically removed

## Data Storage

### Wallet Information Stored
- Wallet address (normalized to lowercase)
- Associated IP addresses
- First seen timestamp
- Last seen timestamp
- Sign-in count
- User agent string
- Suspicious activity flags

### IP Tracking
- IP to wallet mappings
- Wallet to IP mappings
- Historical associations

## Monitoring and Analytics

### Admin Dashboard Data

```bash
curl -H "X-API-Key: your-readonly-key" \
     http://localhost:3000/api/admin/wallet-auth-stats
```

**Response includes:**
- Total authenticated wallets
- Active wallets (24h/7d)
- New wallets (24h)
- Suspicious wallet count
- Top active wallets
- Detailed suspicious activity analysis

### Real-time Monitoring

Monitor authentication events through server logs:
```
[INFO] Wallet authentication successful: {"walletAddress":"0x...","ipAddress":"192.168.1.100"}
[WARN] Suspicious wallet authentication attempt: {"reasons":["Wallet used from 6 different IP addresses"]}
```

## Production Considerations

### Scalability
- Current implementation uses in-memory storage
- For production, consider Redis or database storage
- Implement session clustering for load balancing

### Security Enhancements
- Implement CAPTCHA for repeated authentication attempts
- Add geolocation tracking for IP addresses
- Implement wallet reputation scoring
- Add time-based authentication restrictions

### Privacy Compliance
- Consider GDPR implications of IP address storage
- Implement data retention policies
- Provide user data export/deletion capabilities

## Configuration

### Environment Variables
```bash
# Rate limiting (optional - uses defaults if not set)
RATE_LIMIT_API_MAX=100
RATE_LIMIT_STRICT_MAX=10

# Suspicious activity thresholds (optional)
WALLET_MAX_IPS=5           # Max IPs per wallet before flagging
IP_MAX_WALLETS=10          # Max wallets per IP before flagging
RAPID_SIGNIN_THRESHOLD=60  # Seconds between sign-ins to flag
```

### Admin Access
All admin endpoints require API key authentication. See [Rate Limiting Documentation](./RATE_LIMITING.md) for API key setup.

## Testing

Run the test suite:
```bash
node examples/test-wallet-auth.js
```

This tests:
- Message request/response flow
- Signature verification (with mock data)
- Wallet information retrieval
- IP association lookups
- Admin endpoints with authentication

## Error Handling

### Common Error Responses

#### Invalid Signature
```json
{
  "success": false,
  "error": "Invalid signature or expired nonce"
}
```

#### Rate Limited
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many requests from this IP, please try again later."
}
```

#### Wallet Not Found
```json
{
  "success": false,
  "error": "Wallet not found or never authenticated"
}
```

## Best Practices

### Frontend Integration
1. **Handle Network Errors**: Implement retry logic for network failures
2. **User Feedback**: Show clear signing instructions and progress
3. **Session Management**: Store authentication state appropriately
4. **Error Handling**: Provide user-friendly error messages

### Backend Integration
1. **Verify Signatures**: Always verify signatures server-side
2. **Rate Limiting**: Implement appropriate rate limits
3. **Logging**: Log all authentication events for security monitoring
4. **Validation**: Validate all input parameters

### Security
1. **HTTPS Only**: Always use HTTPS in production
2. **API Keys**: Secure admin API keys properly
3. **Monitoring**: Set up alerts for suspicious activity
4. **Updates**: Keep dependencies updated regularly 