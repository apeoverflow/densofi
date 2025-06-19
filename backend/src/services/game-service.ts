import { Collection, ObjectId } from 'mongodb';
import { MongoService } from './mongo-service.js';
import { logger } from '../utils/logger.js';
import type { 
  GameXP, 
  GameXPDocument, 
  PlayerStats,
  PlayerStatsDocument,
  LeaderboardEntry,
  Achievement,
  PlayerAchievement,
  PlayerAchievementDocument
} from '../models/game.js';

export class GameService {
  private static gameXPCollection: Collection<GameXPDocument> | null = null;
  private static playerStatsCollection: Collection<PlayerStatsDocument> | null = null;
  private static playerAchievementsCollection: Collection<PlayerAchievementDocument> | null = null;

  /**
   * Initialize the game service and ensure collections exist
   */
  static async initialize(): Promise<void> {
    try {
      this.gameXPCollection = MongoService.getCollection<GameXPDocument>('game_xp');
      this.playerStatsCollection = MongoService.getCollection<PlayerStatsDocument>('player_stats');
      this.playerAchievementsCollection = MongoService.getCollection<PlayerAchievementDocument>('player_achievements');

      // Create indexes for better performance
      await this.createIndexes();
      
      logger.info('Game service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize game service:', error);
      throw error;
    }
  }

  /**
   * Create database indexes for better performance
   */
  private static async createIndexes(): Promise<void> {
    if (!this.gameXPCollection || !this.playerStatsCollection || !this.playerAchievementsCollection) {
      throw new Error('Collections not initialized');
    }

    try {
      // Game XP collection indexes
      await this.gameXPCollection.createIndex({ walletAddress: 1 });
      await this.gameXPCollection.createIndex({ timestamp: -1 });
      await this.gameXPCollection.createIndex({ gameType: 1 });
      await this.gameXPCollection.createIndex({ walletAddress: 1, timestamp: -1 });

      // Player stats collection indexes
      await this.playerStatsCollection.createIndex({ walletAddress: 1 }, { unique: true });
      await this.playerStatsCollection.createIndex({ totalXP: -1 });
      await this.playerStatsCollection.createIndex({ highScore: -1 });
      await this.playerStatsCollection.createIndex({ lastPlayed: -1 });

      // Player achievements collection indexes
      await this.playerAchievementsCollection.createIndex({ walletAddress: 1 });
      await this.playerAchievementsCollection.createIndex({ achievementId: 1 });
      await this.playerAchievementsCollection.createIndex({ walletAddress: 1, achievementId: 1 }, { unique: true });
      
      logger.info('Game service database indexes created successfully');
    } catch (error) {
      logger.error('Error creating game service database indexes:', error);
    }
  }

  /**
   * Submit XP for a player and update their stats
   */
  static async submitXP(
    walletAddress: string,
    score: number,
    gameType: string = 'dino-runner',
    difficulty: string = 'normal',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ xpEarned: number; totalXP: number; newHighScore: boolean }> {
    if (!this.gameXPCollection || !this.playerStatsCollection) {
      throw new Error('Game service not initialized');
    }

    try {
      // Calculate XP based on score (1 XP per 100 points)
      const xpEarned = Math.floor(score / 100);
      
      if (xpEarned === 0) {
        throw new Error('Score too low: minimum 100 points required to earn XP');
      }

      const timestamp = new Date();

      // Store the XP submission
      const gameXP: GameXP = {
        walletAddress: walletAddress.toLowerCase(),
        score,
        xpEarned,
        gameType,
        difficulty,
        timestamp,
        ipAddress,
        userAgent
      };

      await this.gameXPCollection.insertOne(gameXP as GameXPDocument);

      // Update player stats
      const result = await this.updatePlayerStats(walletAddress, score, xpEarned, timestamp);

      logger.info(`XP submitted successfully: ${walletAddress} earned ${xpEarned} XP (score: ${score})`, {
        walletAddress,
        score,
        xpEarned,
        gameType,
        difficulty,
        totalXP: result.totalXP,
        newHighScore: result.newHighScore
      });

      return { ...result, xpEarned };
    } catch (error) {
      logger.error('Error submitting XP:', error);
      throw error;
    }
  }

  /**
   * Update player statistics
   */
  private static async updatePlayerStats(
    walletAddress: string,
    score: number,
    xpEarned: number,
    timestamp: Date
  ): Promise<{ totalXP: number; newHighScore: boolean }> {
    if (!this.playerStatsCollection) {
      throw new Error('Player stats collection not initialized');
    }

    const normalizedAddress = walletAddress.toLowerCase();

    try {
      // Get current player stats
      const existingStats = await this.playerStatsCollection.findOne({ walletAddress: normalizedAddress });

      let newHighScore = false;
      let totalXP = xpEarned;
      let gamesPlayed = 1;
      let totalScore = score;
      let highScore = score;

      if (existingStats) {
        totalXP = existingStats.totalXP + xpEarned;
        gamesPlayed = existingStats.gamesPlayed + 1;
        totalScore = (existingStats.averageScore * existingStats.gamesPlayed) + score;
        highScore = Math.max(existingStats.highScore, score);
        newHighScore = score > existingStats.highScore;
      } else {
        newHighScore = true; // First game is always a new high score
      }

      const averageScore = Math.floor(totalScore / gamesPlayed);

      // Update or create player stats
      await this.playerStatsCollection.updateOne(
        { walletAddress: normalizedAddress },
        {
          $set: {
            walletAddress: normalizedAddress,
            totalXP,
            gamesPlayed,
            highScore,
            averageScore,
            lastPlayed: timestamp,
            updatedAt: timestamp,
            ...(existingStats ? {} : { 
              totalPlayTime: 0,
              achievementsUnlocked: 0,
              createdAt: timestamp 
            })
          }
        },
        { upsert: true }
      );

      return { totalXP, newHighScore };
    } catch (error) {
      logger.error('Error updating player stats:', error);
      throw error;
    }
  }

  /**
   * Get player statistics
   */
  static async getPlayerStats(walletAddress: string): Promise<PlayerStatsDocument | null> {
    if (!this.playerStatsCollection) {
      throw new Error('Game service not initialized');
    }

    try {
      const stats = await this.playerStatsCollection.findOne({ 
        walletAddress: walletAddress.toLowerCase() 
      });
      return stats;
    } catch (error) {
      logger.error('Error getting player stats:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard (top players by total XP)
   */
  static async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!this.playerStatsCollection) {
      throw new Error('Game service not initialized');
    }

    try {
      const players = await this.playerStatsCollection
        .find({})
        .sort({ totalXP: -1 })
        .limit(limit)
        .toArray();

      const leaderboard: LeaderboardEntry[] = players.map((player, index) => ({
        rank: index + 1,
        walletAddress: player.walletAddress,
        totalXP: player.totalXP,
        gamesPlayed: player.gamesPlayed,
        highScore: player.highScore,
        lastPlayed: player.lastPlayed
      }));

      return leaderboard;
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get total number of players
   */
  static async getTotalPlayers(): Promise<number> {
    if (!this.playerStatsCollection) {
      throw new Error('Game service not initialized');
    }

    try {
      return await this.playerStatsCollection.countDocuments({});
    } catch (error) {
      logger.error('Error getting total players count:', error);
      throw error;
    }
  }

  /**
   * Get player's game history
   */
  static async getPlayerGameHistory(
    walletAddress: string, 
    limit: number = 20,
    offset: number = 0
  ): Promise<GameXPDocument[]> {
    if (!this.gameXPCollection) {
      throw new Error('Game service not initialized');
    }

    try {
      const history = await this.gameXPCollection
        .find({ walletAddress: walletAddress.toLowerCase() })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      return history;
    } catch (error) {
      logger.error('Error getting player game history:', error);
      throw error;
    }
  }

  /**
   * Get total XP statistics
   */
  static async getXPStats(): Promise<{
    totalXPAwarded: number;
    totalGamesPlayed: number;
    totalPlayers: number;
    averageXPPerGame: number;
  }> {
    if (!this.gameXPCollection || !this.playerStatsCollection) {
      throw new Error('Game service not initialized');
    }

    try {
      const [totalXPResult, totalGamesResult, totalPlayers] = await Promise.all([
        this.gameXPCollection.aggregate([
          { $group: { _id: null, totalXP: { $sum: '$xpEarned' } } }
        ]).toArray(),
        this.gameXPCollection.countDocuments({}),
        this.playerStatsCollection.countDocuments({})
      ]);

      const totalXPAwarded = totalXPResult[0]?.totalXP || 0;
      const totalGamesPlayed = totalGamesResult;
      const averageXPPerGame = totalGamesPlayed > 0 ? totalXPAwarded / totalGamesPlayed : 0;

      return {
        totalXPAwarded,
        totalGamesPlayed,
        totalPlayers,
        averageXPPerGame: Math.round(averageXPPerGame * 100) / 100
      };
    } catch (error) {
      logger.error('Error getting XP stats:', error);
      throw error;
    }
  }
} 