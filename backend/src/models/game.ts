export interface GameXP {
  walletAddress: string;
  score: number;
  xpEarned: number;
  gameType: string;
  difficulty: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface GameXPDocument extends GameXP {
  _id?: string;
}

export interface PlayerStats {
  walletAddress: string;
  totalXP: number;
  gamesPlayed: number;
  highScore: number;
  averageScore: number;
  totalPlayTime: number; // in seconds
  achievementsUnlocked: number;
  lastPlayed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStatsDocument extends PlayerStats {
  _id?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  xpReward: number;
  requirements: {
    type: 'score' | 'games_played' | 'total_xp' | 'streak' | 'time_played';
    value: number;
    gameType?: string;
  };
}

export interface PlayerAchievement {
  walletAddress: string;
  achievementId: string;
  unlockedAt: Date;
  xpEarned: number;
}

export interface PlayerAchievementDocument extends PlayerAchievement {
  _id?: string;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalXP: number;
  gamesPlayed: number;
  highScore: number;
  lastPlayed: Date;
} 