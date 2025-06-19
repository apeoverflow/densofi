# Game XP System Documentation

## Overview

The Game XP System provides a comprehensive backend for managing player experience points, statistics, leaderboards, and game history. It's fully integrated with wallet authentication and MongoDB for persistent storage.

## Features

- **XP Tracking**: Store and calculate XP based on game scores
- **Player Statistics**: Track total XP, games played, high scores, averages
- **Leaderboards**: Real-time rankings of top players
- **Game History**: Complete history of player game sessions
- **High Score Tracking**: Automatic detection of new high scores
- **Authentication**: Secure wallet-based authentication required

## Database Collections

### `game_xp`
Stores individual game sessions and XP earnings:
```typescript
{
  walletAddress: string;     // Player's wallet address (lowercase)
  score: number;             // Game score achieved
  xpEarned: number;          // XP earned from this game
  gameType: string;          // Type of game (e.g., "dino-runner")
  difficulty: string;        // Difficulty level
  timestamp: Date;           // When the game was played
  ipAddress?: string;        // Player's IP address
  userAgent?: string;        // Browser/client info
}
```

### `player_stats`
Aggregated player statistics:
```typescript
{
  walletAddress: string;     // Player's wallet address (lowercase)
  totalXP: number;           // Total XP earned
  gamesPlayed: number;       // Number of games played
  highScore: number;         // Player's best score
  averageScore: number;      // Average score across all games
  totalPlayTime: number;     // Total play time in seconds
  achievementsUnlocked: number; // Number of achievements
  lastPlayed: Date;          // Last game timestamp
  createdAt: Date;           // When player first played
  updatedAt: Date;           // Last stats update
}
```

### `player_achievements`
Player achievement tracking (future enhancement):
```typescript
{
  walletAddress: string;     // Player's wallet address
  achievementId: string;     // Achievement identifier
  unlockedAt: Date;          // When achievement was unlocked
  xpEarned: number;          // XP bonus from achievement
}
```

## API Endpoints

### Submit Game XP
Submit a game score and earn XP.

**Endpoint:** `POST /api/game/submit-xp`  
**Authentication:** Required (Wallet)

**Request Body:**
```json
{
  "score": 1250,
  "gameType": "dino-runner",
  "difficulty": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x...",
    "score": 1250,
    "xpEarned": 12,
    "totalXP": 45,
    "newHighScore": true,
    "gameType": "dino-runner",
    "difficulty": "normal",
    "timestamp": "2024-01-15T10:30:00Z",
    "message": "Successfully earned 12 XP! Total: 45 (New High Score!)"
  }
}
```

### Get Leaderboard
Retrieve top players ranked by total XP.

**Endpoint:** `GET /api/game/leaderboard?limit=10`  
**Authentication:** None (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "walletAddress": "0x...",
        "totalXP": 2500,
        "gamesPlayed": 25,
        "highScore": 15400,
        "lastPlayed": "2024-01-15T10:30:00Z"
      }
    ],
    "totalPlayers": 156,
    "lastUpdated": "2024-01-15T12:00:00Z"
  }
}
```

### Get Player Stats
Get detailed statistics for a specific player.

**Endpoint:** `GET /api/game/stats/:address`  
**Authentication:** Required (Wallet or Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x...",
    "totalXP": 1250,
    "gamesPlayed": 15,
    "highScore": 8900,
    "averageScore": 593,
    "totalPlayTime": "2h 45m",
    "achievementsUnlocked": 3,
    "currentRank": 5,
    "lastPlayed": "2024-01-15T08:30:00Z",
    "createdAt": "2024-01-10T15:20:00Z"
  }
}
```

### Get Game History
Retrieve a player's game session history.

**Endpoint:** `GET /api/game/history/:address?limit=20&offset=0`  
**Authentication:** Required (Wallet or Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "score": 1250,
        "xpEarned": 12,
        "gameType": "dino-runner",
        "difficulty": "normal",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### Get Overall Game Statistics
Get system-wide game statistics.

**Endpoint:** `GET /api/game/stats`  
**Authentication:** None (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalXPAwarded": 45680,
    "totalGamesPlayed": 3421,
    "totalPlayers": 156,
    "averageXPPerGame": 13.35
  }
}
```

## XP Calculation

The XP system uses a simple calculation:
- **1 XP per 100 points scored**
- Minimum score of 100 points required to earn XP
- XP is rounded down (floor function)

Examples:
- Score 150 → 1 XP
- Score 999 → 9 XP  
- Score 1250 → 12 XP
- Score 99 → 0 XP (rejected)

## High Score Detection

The system automatically detects when a player achieves a new personal best:
- Compares current score with player's existing high score
- Updates the high score if current score is higher
- Returns `newHighScore: true` in the response
- First game is always considered a new high score

## Database Indexes

The following indexes are automatically created for optimal performance:

**game_xp collection:**
- `{ walletAddress: 1 }`
- `{ timestamp: -1 }`
- `{ gameType: 1 }`
- `{ walletAddress: 1, timestamp: -1 }`

**player_stats collection:**
- `{ walletAddress: 1 }` (unique)
- `{ totalXP: -1 }`
- `{ highScore: -1 }`
- `{ lastPlayed: -1 }`

## Error Handling

The system includes comprehensive error handling:

### Common Errors
- `401 Unauthorized`: Wallet authentication required
- `400 Bad Request`: Invalid score or missing parameters
- `403 Forbidden`: Cannot view other player's data without admin access
- `404 Not Found`: Player stats not found (play a game first)
- `500 Internal Server Error`: Database or system error

### Error Response Format
```json
{
  "success": false,
  "error": "Score too low: minimum 100 points required to earn XP"
}
```

## Testing

### Comprehensive Test Script
Run the complete test suite:
```bash
npm run test:game-xp
```

This test script covers:
- Wallet authentication
- XP submission for multiple players
- Player statistics retrieval
- Leaderboard generation
- Game history tracking
- Overall system statistics

### Manual Testing
1. Start the backend server
2. Ensure MongoDB is running and configured
3. Run the test script to see the full workflow
4. Use the API endpoints directly with authenticated requests

## Environment Variables

Required environment variables:
```bash
# MongoDB Configuration
MONGO_URL=mongodb://username:password@host:port/database
MONGO_DB=densofi_domains

# Or individual components
MONGOHOST=localhost
MONGOPORT=27017
MONGOUSER=username
MONGOPASSWORD=password
```

## Security Considerations

- All XP submission requires wallet authentication
- Player can only view their own stats (unless admin)
- IP addresses and user agents are logged for audit purposes
- All wallet addresses are normalized to lowercase
- Input validation prevents invalid scores or XP manipulation

## Future Enhancements

- **Achievement System**: Unlock achievements for milestones
- **Seasonal Leaderboards**: Time-based rankings
- **XP Multipliers**: Bonus XP events or difficulty modifiers
- **Tournament Mode**: Special competitive events
- **Player Profiles**: Extended player information
- **Social Features**: Friend systems and challenges

This system provides a robust foundation for gamification and player engagement while maintaining security and performance. 