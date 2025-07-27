# Route File Organization Pattern

## File Structure

1. Imports at the top:
   - express
   - controller imports
   - middleware imports

2. Router creation

3. Route definitions using controller methods directly

4. Default export

## Route Definition Pattern

```typescript
import express from 'express';
import { ControllerName } from '../controllers/controller-name.js';
import { middleware } from '../middleware/middleware-name.js';

const router = express.Router();

router.method('/path', middleware, ControllerName.methodName);

export default router;
```

## Key Principles

- No separate route handler exports
- Direct use of controller methods
- Minimal documentation (only essential comments)
- Consistent import order
- Consistent spacing and formatting
- Only necessary middleware used

## Route File Naming

- Use kebab-case (e.g., game-routes.ts)
- Group related routes together
- Keep debug routes in separate file
- Maintain clear separation between domain routes and other routes

## Best Practices

- Keep route files focused on routing logic only
- Move business logic to controllers
- Use middleware for cross-cutting concerns
- Keep route handlers simple and focused
- Use TypeScript types consistently
- Document only when necessary for clarity
