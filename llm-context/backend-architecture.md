# Backend Architecture and Routing Patterns

## Project Structure

The backend follows a modular architecture with clear separation of concerns:

```
src/
├── api/           # Express route handlers
│   ├── auth-routes.ts
│   ├── domain-routes.ts
│   ├── debug-routes.ts
│   ├── game-routes.ts
│   └── admin-routes.ts
├── controllers/   # Business logic controllers
│   ├── auth.controller.ts
│   ├── debug.controller.ts
│   └── game.controller.ts
├── services/      # Core business services
│   ├── wallet-auth-service.ts
│   ├── domain-service.ts
│   └── game-service.ts
├── config/        # Configuration files
│   ├── routes.ts
│   └── env.ts
├── middleware/    # Custom middleware
│   └── auth.ts
└── utils/         # Utility functions
    └── logger.ts
```

## Route Organization Pattern

### 1. Route Files Structure
Each route file follows this pattern:

```typescript
// Example: auth-routes.ts
import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireApiKey } from '../middleware/auth.js';

const router = express.Router();

// Define routes
router.get('/status', AuthController.getStatus);
router.post('/login', AuthController.login);

export default router;
```

### 2. Controller Pattern
Controllers handle business logic and are organized by feature:

```typescript
// Example: auth.controller.ts
import { Request, Response } from 'express';
import { WalletAuthService } from '../services/wallet-auth-service.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  static async getStatus(req: Request, res: Response) {
    try {
      const status = await WalletAuthService.getStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('Error getting status:', error);
      res.status(500).json({ success: false, error: 'Failed to get status' });
    }
  }
}
```

### 3. Service Layer
Services contain core business logic:

```typescript
// Example: wallet-auth-service.ts
export class WalletAuthService {
  static async getStatus() {
    // Business logic here
  }
}
```

## Adding New Routes

### 1. Create New Controller
1. Create a new controller file in `src/controllers/`:
   - Follow the pattern: `featureName.controller.ts`
   - Implement business logic methods
   - Handle error cases and logging

### 2. Create Route File
1. Create a new route file in `src/api/`:
   - Follow the pattern: `featureName-routes.ts`
   - Import the controller
   - Define routes using Express router
   - Add appropriate middleware

### 3. Update Routes Configuration
1. Add the route to `src/config/routes.ts`:
   ```typescript
   export const ROUTES = {
     // Add new route
     FEATURE_NAME: '/api/feature/path',
   };
   ```

2. Add route description:
   ```typescript
   export const ROUTE_DESCRIPTIONS = {
     [ROUTES.FEATURE_NAME]: 'Description of the route',
   };
   ```

### 4. Register Route in Server
1. Import the route in `src/server.ts`:
   ```typescript
   import featureRoutes from './api/feature-routes.js';
   ```

2. Register the route:
   ```typescript
   app.use('/api/feature', featureRoutes);
   ```

## Best Practices

1. **Error Handling**
   - Always wrap controller methods in try-catch blocks
   - Use consistent error response format
   - Log errors appropriately

2. **Documentation**
   - Add JSDoc comments for all endpoints
   - Document required/optional parameters
   - Document authentication requirements

3. **Security**
   - Use appropriate middleware for authentication
   - Validate input parameters
   - Sanitize user input
   - Follow principle of least privilege

4. **Code Organization**
   - Keep related functionality together
   - Follow consistent naming conventions
   - Maintain separation of concerns
   - Keep route handlers thin - move logic to controllers

5. **Debug Routes**
   - Keep debug routes separate from production routes
   - Prefix debug routes with `/debug/`
   - Document debug endpoints clearly
   - Add appropriate authentication for sensitive debug endpoints

## Blockchain Integration with Viem

The project uses Viem for Ethereum blockchain interactions. When adding new blockchain-related features:

1. **Smart Contract Interactions**
   - Use Viem's contract utilities for read/write operations
   - Implement proper error handling for blockchain operations
   - Handle gas estimation and transaction confirmation

2. **Account Abstraction**
   - Use Viem's ERC-4337 support for Smart Contract Accounts
   - Implement bundler and paymaster client interactions
   - Handle EIP-7702 authorization flows

3. **Event Handling**
   - Use Viem's event filtering and parsing utilities
   - Implement proper event listener patterns
   - Handle event confirmation and indexing

4. **Chain Support**
   - Support multiple EVM-compatible chains (OP Stack, ZKsync)
   - Implement chain-specific configurations
   - Handle cross-chain operations appropriately

## Example of Adding a New Feature

```typescript
// 1. Create controller (src/controllers/new-feature.controller.ts)
export class NewFeatureController {
  static async getFeatureData(req: Request, res: Response) {
    try {
      const data = await NewFeatureService.getData();
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting feature data:', error);
      res.status(500).json({ success: false, error: 'Failed to get feature data' });
    }
  }
}

// 2. Create routes (src/api/new-feature-routes.ts)
import express from 'express';
import { NewFeatureController } from '../controllers/new-feature.controller.js';

const router = express.Router();
router.get('/data', NewFeatureController.getFeatureData);
export default router;

// 3. Update routes config (src/config/routes.ts)
export const ROUTES = {
  NEW_FEATURE_DATA: '/api/new-feature/data',
};

export const ROUTE_DESCRIPTIONS = {
  [ROUTES.NEW_FEATURE_DATA]: 'Get feature data',
};

// 4. Register in server (src/server.ts)
import newFeatureRoutes from './api/new-feature-routes.js';
app.use('/api/new-feature', newFeatureRoutes);
```

## Common Patterns

1. **Authentication**
   - Use `requireApiKey` middleware for admin endpoints
   - Use `optionalApiKey` for optional auth
   - Use `optionalWalletAuth` for wallet-based auth

2. **Response Format**
   - Success: `{ success: true, data: ... }`
   - Error: `{ success: false, error: 'message' }`
   - Debug: `{ success: true, debug: { ... } }`

3. **Logging**
   - Use consistent logging format
   - Log errors appropriately
   - Include context in logs

4. **Error Handling**
   - Handle known errors specifically
   - Gracefully handle unexpected errors
   - Return appropriate HTTP status codes

## Blockchain-Specific Best Practices

1. **Transaction Management**
   - Always estimate gas before sending transactions
   - Implement transaction confirmation handling
   - Handle transaction failures gracefully
   - Use appropriate nonce management

2. **Smart Contract Interactions**
   - Use type-safe contract interfaces
   - Implement proper error handling for contract calls
   - Handle contract events properly
   - Use appropriate retry mechanisms

3. **Chain-Specific Configurations**
   - Maintain chain-specific configurations
   - Handle chain-specific errors
   - Implement chain switching logic
   - Use appropriate RPC endpoints

This architecture provides a scalable and maintainable way to organize our backend codebase while keeping it consistent and easy to understand. The integration with Viem makes blockchain interactions type-safe and reliable.
