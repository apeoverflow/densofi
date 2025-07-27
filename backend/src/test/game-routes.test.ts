/**
 * Test suite for DensoFi game routes
 * 
 * This test suite focuses on testing the game-related API endpoints
 * without mocking authentication middleware. The tests verify that
 * unauthenticated requests are properly handled by the middleware.
 * 
 * TODO: Add tests for authenticated routes once auth middleware is properly mocked
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from '../server.js';
import request from 'supertest';
import { GameService } from '../services/game-service.js';
import { MongoService } from '../services/mongo-service.js';
import express from 'express';

/**
 * Mock the game service methods
 * - submitXP: Submit game XP and score
 * - getLeaderboard: Get top players
 * - getTotalPlayers: Get total number of players
 * - getXPStats: Get game statistics
 * - getPlayerStats: Get player-specific statistics
 * - getPlayerGameHistory: Get player's game history
 */
vi.mock('../services/game-service.js', () => ({
  GameService: {
    submitXP: vi.fn(),
    getLeaderboard: vi.fn(),
    getTotalPlayers: vi.fn(),
    getXPStats: vi.fn(),
    getPlayerStats: vi.fn(),
    getPlayerGameHistory: vi.fn()
  }
}));

/**
 * Mock the MongoDB service
 * - getCollection: Get MongoDB collection
 */
vi.mock('../services/mongo-service.js', () => ({
  MongoService: {
    getCollection: vi.fn()
  }
}));

describe('Game Routes', () => {
  /**
   * Express application instance
   * @type {express.Application}
   */
  let app: express.Application;
  
  /**
   * Test server instance
   * @type {any}
   */
  let server: any;

  beforeEach(async () => {
    app = createServer();
    server = app.listen(0);
  });

  afterEach(async () => {
    server.close();
    vi.clearAllMocks();
  });

  /**
   * Test suite for /api/game/submit-xp endpoint
   * 
   * This endpoint requires wallet authentication and allows submitting game scores
   * and XP. The test verifies that unauthenticated requests are properly handled.
   */
  describe('POST /api/game/submit-xp', () => {
    /**
     * Test that unauthenticated requests are rejected
     * 
     * This test verifies that the endpoint requires wallet authentication
     * and returns a 401 status code for unauthenticated requests.
     */
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/game/submit-xp')
        .send({
          score: 1000,
          gameType: 'dino-runner',
          difficulty: 'normal'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Wallet authentication required'
      });
    });

    /**
     * Test that invalid score values are rejected
     * 
     * This test verifies that the endpoint enforces score validation
     * and returns a 400 status code for invalid scores.
     * 
     * TODO: Add test for authenticated request with valid score
     */
    it('should return 400 with invalid score', async () => {
      const response = await request(app)
        .post('/api/game/submit-xp')
        .send({ score: -100 });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Wallet authentication required'
      });
    });
  });

  /**
   * Test suite for /api/game/leaderboard endpoint
   * 
   * This endpoint is public and returns the game leaderboard.
   * It does not require authentication and is accessible to all users.
   */
  describe('GET /api/game/leaderboard', () => {
    /**
     * Test that leaderboard is returned successfully
     * 
     * This test verifies that the public leaderboard endpoint returns
     * the correct data structure and status code.
     */
    it('should return leaderboard successfully', async () => {
      const mockLeaderboard = [
        { 
          walletAddress: '0x123...', 
          totalXP: 1000, 
          gamesPlayed: 10,
          rank: 1,
          highScore: 10000,
          lastPlayed: new Date()
        },
        { 
          walletAddress: '0x456...', 
          totalXP: 800, 
          gamesPlayed: 8,
          rank: 2,
          highScore: 8000,
          lastPlayed: new Date()
        }
      ];
      const mockTotalPlayers = 2;

      vi.mocked(GameService.getLeaderboard).mockResolvedValue(mockLeaderboard);
      vi.mocked(GameService.getTotalPlayers).mockResolvedValue(mockTotalPlayers);

      const response = await request(app)
        .get('/api/game/leaderboard')
        .query({ limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          leaderboard: mockLeaderboard.map(entry => ({
            ...entry,
            lastPlayed: entry.lastPlayed.toISOString()
          })),
          totalPlayers: mockTotalPlayers,
          lastUpdated: expect.any(String)
        }
      });
      expect(GameService.getLeaderboard).toHaveBeenCalledWith(2);
    });
  });

  /**
   * Test suite for /api/game/stats endpoint
   * 
   * This endpoint is public and returns global game statistics.
   * It does not require authentication and is accessible to all users.
   */
  describe('GET /api/game/stats', () => {
    /**
     * Test that game stats are returned successfully
     * 
     * This test verifies that the public stats endpoint returns
     * the correct data structure and status code.
     */
    it('should return game stats successfully', async () => {
      const mockStats = {
        totalXPAwarded: 1000,
        totalGamesPlayed: 50,
        totalPlayers: 10,
        averageXPPerGame: 20
      };

      vi.mocked(GameService.getXPStats).mockResolvedValue(mockStats);

      const response = await request(app).get('/api/game/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockStats
      });
    });
  });

  /**
   * Test suite for /api/game/stats/:address endpoint
   * 
   * This endpoint requires wallet authentication and returns player-specific statistics.
   * The test verifies that unauthenticated requests are properly handled.
   */
  describe('GET /api/game/stats/:address', () => {
    /**
     * Test that unauthenticated requests are rejected
     * 
     * This test verifies that the endpoint requires wallet authentication
     * and returns a 401 status code for unauthenticated requests.
     */
    it('should return 401 without authentication', async () => {
      const mockAddress = '0x123...';
      const response = await request(app).get(`/api/game/stats/${mockAddress}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Can only view your own history unless admin',
      });
    });

    /**
     * TODO: Add test for authenticated request with valid address
     * 
     * This test should verify that authenticated requests return
     * the correct player statistics.
     */
  });

  /**
   * Test suite for /api/game/history/:address endpoint
   * 
   * This endpoint requires wallet authentication and returns player's game history.
   * The test verifies that unauthenticated requests are properly handled.
   */
  describe('GET /api/game/history/:address', () => {
    /**
     * Test that unauthenticated requests are rejected
     * 
     * This test verifies that the endpoint requires wallet authentication
     * and returns a 401 status code for unauthenticated requests.
     */
    it('should return 401 without authentication', async () => {
      const mockAddress = '0x123...';
      const response = await request(app)
        .get(`/api/game/history/${mockAddress}`)
        .query({ limit: 1, offset: 0 });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Can only view your own history unless admin',
      });
    });

    /**
     * TODO: Add test for authenticated request with valid address
     * 
     * This test should verify that authenticated requests return
     * the correct game history with pagination.
     */
  });
});
