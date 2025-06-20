'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";
import { WalletAuthButton } from "@/components/WalletAuthButton";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import config from '@/lib/config';

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

interface GameState {
  dinoY: number;
  dinoVelocity: number;
  isJumping: boolean;
  hasDoubleJump: boolean;
  obstacles: Obstacle[];
  score: number;
  gameSpeed: number;
  isGameOver: boolean;
  isGameRunning: boolean;
}

const INITIAL_GAME_STATE: GameState = {
  dinoY: 0,
  dinoVelocity: 0,
  isJumping: false,
  hasDoubleJump: true,
  obstacles: [],
  score: 0,
  gameSpeed: 2,
  isGameOver: false,
  isGameRunning: false,
};

const DINO_SIZE = 50;
const OBSTACLE_WIDTH = 9;
const OBSTACLE_HEIGHT = 50;
const GAME_HEIGHT = 350;
const JUMP_FORCE = -17;
const GRAVITY = 0.75;
const OBSTACLE_SPEED = 6;
const SPAWN_RATE = 0.015;
const GROUND_HEIGHT = GAME_HEIGHT + 20;

export default function DinoGameClient() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { isAuthenticated, error: authError, isLoading: authLoading, sessionId, forceRefreshAuthState } = useWalletAuth();
  
  // Debug logging
  useEffect(() => {
    console.log('DinoGame auth state:', { isConnected, isAuthenticated, authError, authLoading });
  }, [isConnected, isAuthenticated, authError, authLoading]);
  const authenticatedFetch = useAuthenticatedFetch();
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [keys, setKeys] = useState<Set<string>>(new Set<string>());
  const [totalXP, setTotalXP] = useState(0);
  const [isClaimingXP, setIsClaimingXP] = useState(false);
  const [xpSubmissionResult, setXpSubmissionResult] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [currentRank, setCurrentRank] = useState<number | string>('Unranked');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [gameStats, setGameStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [playerHistory, setPlayerHistory] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteImageRef = useRef<HTMLImageElement | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const animationCounterRef = useRef(0);
  const [gameStartCountdown, setGameStartCountdown] = useState(0);
  const [backgroundOffset, setBackgroundOffset] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Load player stats from server when authenticated
  useEffect(() => {
    const loadPlayerStats = async () => {
      if (isAuthenticated && address && authenticatedFetch) {
        try {
          const response = await authenticatedFetch(`${config.apiUrl}/game/stats/${address}`, {
            method: 'GET',
            requireAuth: false // Try without strict auth requirement
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setPlayerStats(data.data);
              setTotalXP(data.data.totalXP);
              setCurrentRank(data.data.currentRank);
              return; // Successfully loaded from server
            }
          } else if (response.status === 404) {
            // Player hasn't played any games yet, use defaults
            console.log('Player has no stats yet - first time player');
            setTotalXP(0);
            setPlayerStats(null);
            setCurrentRank('Unranked');
            return;
          }
        } catch (error) {
          console.error('Failed to load player stats:', error);
        }
      }
      
      // Fallback to localStorage (not authenticated or error occurred)
      const storedXP = localStorage.getItem('densofi-game-xp');
      if (storedXP) {
        setTotalXP(parseInt(storedXP, 10) || 0);
      } else {
        setTotalXP(0);
      }
      setPlayerStats(null);
      setCurrentRank('Unranked');
    };

    loadPlayerStats();
  }, [isAuthenticated, address, authenticatedFetch]);

  // Save XP to localStorage as backup
  useEffect(() => {
    localStorage.setItem('densofi-game-xp', totalXP.toString());
  }, [totalXP]);

  // Load comprehensive game stats
  const loadComprehensiveStats = async () => {
    setStatsLoading(true);
    try {
      // Load overall game statistics (public endpoint)
      try {
        console.log('Loading overall stats...');
        const overallStatsResponse = await fetch(`${config.apiUrl}/game/stats`);
        console.log('Overall stats response status:', overallStatsResponse.status);
        
        if (overallStatsResponse.ok) {
          const overallData = await overallStatsResponse.json();
          console.log('Overall stats data:', overallData);
          
          if (overallData.success) {
            setGameStats(overallData.data);
          } else {
            console.error('Overall stats API returned success: false', overallData);
          }
        } else {
          console.error('Overall stats API failed with status:', overallStatsResponse.status);
          const errorText = await overallStatsResponse.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Failed to load overall stats:', error);
      }

      // Load leaderboard (public endpoint)
      try {
        console.log('Loading leaderboard...');
        const leaderboardResponse = await fetch(`${config.apiUrl}/game/leaderboard?limit=10`);
        console.log('Leaderboard response status:', leaderboardResponse.status);
        
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          console.log('Leaderboard data:', leaderboardData);
          
          if (leaderboardData.success) {
            setLeaderboard(leaderboardData.data.leaderboard || []);
            console.log('Leaderboard set:', leaderboardData.data.leaderboard);
          } else {
            console.error('Leaderboard API returned success: false', leaderboardData);
            setLeaderboard([]);
          }
        } else {
          console.error('Leaderboard API failed with status:', leaderboardResponse.status);
          const errorText = await leaderboardResponse.text();
          console.error('Error response:', errorText);
          setLeaderboard([]);
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        setLeaderboard([]);
      }

      // Load player history only if authenticated and address exists
      if (isAuthenticated && address && authenticatedFetch) {
        try {
                      const historyResponse = await authenticatedFetch(`${config.apiUrl}/game/history/${address}?limit=10`, {
              method: 'GET',
              requireAuth: false // Try without strict auth requirement first
            });
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            if (historyData.success) {
              setPlayerHistory(historyData.data.history);
            }
          } else {
            console.log('Player history not available or user not authenticated');
            setPlayerHistory([]);
          }
        } catch (error) {
          console.error('Failed to load player history:', error);
          setPlayerHistory([]);
        }
      } else {
        // Clear player history if not authenticated
        setPlayerHistory([]);
      }
    } catch (error) {
      console.error('Failed to load comprehensive stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load sprite image
  useEffect(() => {
    const img = new Image();
    img.src = '/running-sprite.png';
    img.onload = () => {
      spriteImageRef.current = img;
    };
  }, []);

  // Handle sprite animation - integrated with game loop
  const updateAnimation = useCallback(() => {
    if (gameState.isGameRunning && !gameState.isGameOver && !gameState.isJumping) {
      animationCounterRef.current += 1;
      if (animationCounterRef.current >= 8) { // Change frame every 8 game ticks for smooth animation
        setAnimationFrame(prev => (prev + 1) % 2); // Toggle between frame 0 and 1
        animationCounterRef.current = 0;
      }
    }
  }, [gameState.isGameRunning, gameState.isGameOver, gameState.isJumping]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        setKeys(prev => new Set(prev).add(e.code));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        setKeys(prev => {
          const newKeys = new Set(prev);
          newKeys.delete(e.code);
          return newKeys;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Jump logic with double jump
  const jump = useCallback(() => {
    setGameState(prev => {
      // First jump: when on ground
      if (!prev.isJumping && prev.dinoY === 0) {
        return {
          ...prev,
          isJumping: true,
          dinoVelocity: JUMP_FORCE,
          hasDoubleJump: true, // Enable double jump after first jump
        };
      }
      // Double jump: when in air and double jump is available
      else if (prev.isJumping && prev.hasDoubleJump && prev.dinoY < 0) {
        return {
          ...prev,
          dinoVelocity: JUMP_FORCE * 0.8, // Slightly weaker double jump
          hasDoubleJump: false, // Use up the double jump
        };
      }
      return prev;
    });
  }, []);

  // Handle jump input
  useEffect(() => {
    if (keys.has('Space') || keys.has('ArrowUp')) {
      if (gameState.isGameRunning && !gameState.isGameOver) {
        jump();
      }
    }
  }, [keys, gameState.isGameRunning, gameState.isGameOver, jump]);

  // Handle touch input for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (gameState.isGameRunning && !gameState.isGameOver) {
        jump();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      
      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
      };
    }
  }, [gameState.isGameRunning, gameState.isGameOver, jump]);

  // Handle mouse click for desktop/mobile
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      if (gameState.isGameRunning && !gameState.isGameOver) {
        jump();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      
      return () => {
        canvas.removeEventListener('click', handleClick);
      };
    }
  }, [gameState.isGameRunning, gameState.isGameOver, jump]);

  // Start game with countdown
  const startGame = useCallback(() => {
    console.log('startGame called with:', { isConnected, isAuthenticated });
    if (!isConnected || !isAuthenticated) {
      console.log('Cannot start game - wallet not connected or not authenticated');
      return;
    }
    
    setGameStartCountdown(3);
    setAnimationFrame(0);
    animationCounterRef.current = 0;
    setBackgroundOffset(0);
    
    // Countdown sequence
    const countdownInterval = setInterval(() => {
      setGameStartCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setGameState({
            ...INITIAL_GAME_STATE,
            isGameRunning: true,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isConnected, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is now authenticated, they should be able to start the game');
    }
  }, [isAuthenticated]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
    setAnimationFrame(0);
    animationCounterRef.current = 0;
    setGameStartCountdown(0);
    setBackgroundOffset(0);
  }, []);

  // Collision detection
  const checkCollision = useCallback((dino: { x: number; y: number; width: number; height: number }, obstacle: Obstacle) => {
    // Create obstacle rectangle coordinates
    const obstacleRect = {
      x: obstacle.x,
      y: GAME_HEIGHT - obstacle.height,
      width: obstacle.width,
      height: obstacle.height,
    };
    
    // Standard rectangle collision detection
    return (
      dino.x < obstacleRect.x + obstacleRect.width &&
      dino.x + dino.width > obstacleRect.x &&
      dino.y < obstacleRect.y + obstacleRect.height &&
      dino.y + dino.height > obstacleRect.y
    );
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameState.isGameRunning || gameState.isGameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const gameLoop = () => {
      setGameState(prev => {
        let newState = { ...prev };

        // Update dino physics
        if (newState.isJumping || newState.dinoY < 0) {
          newState.dinoVelocity += GRAVITY;
          newState.dinoY += newState.dinoVelocity;

          if (newState.dinoY >= 0) {
            newState.dinoY = 0;
            newState.dinoVelocity = 0;
            newState.isJumping = false;
            newState.hasDoubleJump = true; // Reset double jump when landing
          }
        }

        // Update obstacles
        newState.obstacles = newState.obstacles
          .map(obstacle => ({ ...obstacle, x: obstacle.x - OBSTACLE_SPEED }))
          .filter(obstacle => obstacle.x + obstacle.width > 0);

        // Spawn new obstacles
        if (Math.random() < SPAWN_RATE) {
          newState.obstacles.push({
            x: 800,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
          });
        }

        // Check collisions
        const dinoRect = {
          x: 100,
          y: GAME_HEIGHT - DINO_SIZE + newState.dinoY,
          width: DINO_SIZE - 5, // Slightly smaller hitbox for better gameplay
          height: DINO_SIZE - 5,
        };

        for (const obstacle of newState.obstacles) {
          if (checkCollision(dinoRect, obstacle)) {
            newState.isGameOver = true;
            newState.isGameRunning = false;
            break;
          }
        }

        // Update score and background (only while game is running and not game over)
        if (!newState.isGameOver && newState.isGameRunning) {
          newState.score += 1;
          // Increase game speed every 1000 points
          if (newState.score % 1000 === 0) {
            newState.gameSpeed += 0.2;
          }
        }

        // Call animation update
        updateAnimation();

        return newState;
      });

      // Update background offset for scrolling effect
      setBackgroundOffset(prev => prev + 2);

      // Continue the game loop
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    // Cleanup on unmount or when game stops
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isGameRunning, gameState.isGameOver, updateAnimation, checkCollision]);

  // Cloud drawing function
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 1.4, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.5, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.1, y - size * 0.3, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  };

  // Cactus drawing function
  const drawCactus = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    // Main body
    ctx.fillStyle = '#2d5a3d';
    ctx.fillRect(x, y, width, height);
    
    // Arms
    ctx.fillRect(x - width * 0.4, y + height * 0.3, width * 0.4, width * 0.8);
    ctx.fillRect(x + width, y + height * 0.5, width * 0.4, width * 0.6);
    
    // Highlights
    ctx.fillStyle = '#3d7a5d';
    ctx.fillRect(x + width * 0.35, y, width * 0.1, height);
    ctx.fillRect(x + width * 0.05, y + height * 0.25, width * 0.1, height * 0.3);
    ctx.fillRect(x + width * 0.75, y + height * 0.45, width * 0.1, height * 0.2);
  };

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw moving clouds
    drawCloud(ctx, 100 - backgroundOffset * 0.2, 40, 15);
    drawCloud(ctx, 300 - backgroundOffset * 0.15, 60, 12);
    drawCloud(ctx, 500 - backgroundOffset * 0.25, 35, 18);
    drawCloud(ctx, 700 - backgroundOffset * 0.1, 50, 14);
    drawCloud(ctx, 200 - backgroundOffset * 0.2 + 800, 45, 16);

    // Draw distant mountains
    ctx.fillStyle = 'rgba(100, 100, 150, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    ctx.lineTo(150 - backgroundOffset * 0.05, GAME_HEIGHT - 60);
    ctx.lineTo(300 - backgroundOffset * 0.05, GAME_HEIGHT - 40);
    ctx.lineTo(450 - backgroundOffset * 0.05, GAME_HEIGHT - 80);
    ctx.lineTo(600 - backgroundOffset * 0.05, GAME_HEIGHT - 30);
    ctx.lineTo(800 - backgroundOffset * 0.05, GAME_HEIGHT - 50);
    ctx.lineTo(canvas.width, GAME_HEIGHT);
    ctx.fill();

    // Draw ground
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, GAME_HEIGHT, canvas.width, 50);
    
    // Ground texture lines
    ctx.strokeStyle = '#C19A6B';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i - backgroundOffset % 20, GAME_HEIGHT);
      ctx.lineTo(i - backgroundOffset % 20, GAME_HEIGHT + 50);
      ctx.stroke();
    }

    if (gameState.isGameRunning || gameState.isGameOver || gameStartCountdown > 0) {
      // Draw dino using sprite
      const dinoY = GAME_HEIGHT - DINO_SIZE + gameState.dinoY;
      
      if (spriteImageRef.current) {
        // Calculate sprite frame (2 frames side by side)
        const spriteWidth = spriteImageRef.current.width / 2;
        const spriteHeight = spriteImageRef.current.height;
        const currentFrame = gameState.isJumping ? 0 : animationFrame;
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.ellipse(115, GAME_HEIGHT + 5, DINO_SIZE * 0.4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the current frame of the sprite
        ctx.drawImage(
          spriteImageRef.current,
          currentFrame * spriteWidth,
          0,
          spriteWidth,
          spriteHeight,
          100,
          dinoY,
          DINO_SIZE,
          DINO_SIZE
        );
      } else {
        // Fallback: Draw simple dino if sprite hasn't loaded
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(100, dinoY, DINO_SIZE, DINO_SIZE);
        
        // Draw dino eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(110, dinoY + 10, 4, 4);
        ctx.fillRect(120, dinoY + 10, 4, 4);
      }

      // Draw cool cactus obstacles
      gameState.obstacles.forEach(obstacle => {
        drawCactus(ctx, obstacle.x, GAME_HEIGHT - obstacle.height, obstacle.width, obstacle.height);
      });

      // Draw score with better styling
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(15, 15, 150, 35);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Score: ${gameState.score}`, 80, 38);
    }

    // Draw countdown
    if (gameStartCountdown > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(gameStartCountdown.toString(), canvas.width / 2, canvas.height / 2);
    }

    // Draw game over screen
    if (gameState.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
    }
  }, [gameState, animationFrame, gameStartCountdown, backgroundOffset]);

  // Claim XP function
  const claimXP = async () => {
    if (!isConnected || !address || gameState.score === 0) return;

    setIsClaimingXP(true);
    setXpSubmissionResult(null);
    
    try {
      if (!isAuthenticated) {
        alert('Please authenticate your wallet first!');
        return;
      }

      // Submit XP to backend
      if (!authenticatedFetch) {
        throw new Error('Authentication service not available');
      }

      const response = await authenticatedFetch('/api/game/submit-xp', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({
          score: gameState.score,
          gameType: 'dino-runner',
          difficulty: 'normal'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit XP');
      }

      const result = await response.json();
      
      if (result.success) {
        const { xpEarned, totalXP: newTotalXP, newHighScore } = result.data;
        
        // Update state with server data
        setTotalXP(newTotalXP);
        
        // Show enhanced success message
        let message = `Successfully earned ${xpEarned} XP! Total: ${newTotalXP}`;
        if (newHighScore) {
          message += ' 🎉 NEW HIGH SCORE!';
        }
        setXpSubmissionResult(message); 
        
        // Refresh player stats to get updated rank
        if (address && authenticatedFetch) {
          try {
            const statsResponse = await authenticatedFetch(`${config.apiUrl}/game/stats/${address}`, {
              method: 'GET',
              requireAuth: false
            });
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              if (statsData.success) {
                setPlayerStats(statsData.data);
                setCurrentRank(statsData.data.currentRank);
              }
            }
          } catch (error) {
            console.error('Failed to refresh player stats:', error);
          }
        }
        
        // Reset game after claiming
        resetGame();
      } else {
        throw new Error(result.error || 'Failed to submit XP');
      }
      
    } catch (error) {
      console.error('Failed to claim XP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim XP. Please try again.';
      setXpSubmissionResult(`Error: ${errorMessage}`);
    } finally {
      setIsClaimingXP(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-slate-900 via-slate-900/20 to-black overflow-hidden">
      <InteractiveBackground />
      
      {/* Static gradient overlay for depth and readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-black/60 pointer-events-none z-10"></div>
      
      {/* Animated background glows */}
      <div className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-5">
        <div className="absolute top-32 left-1/4 w-88 h-88 bg-gradient-to-r from-green-900/40 via-emerald-800/50 to-teal-900/45 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDuration: '6.5s' }}></div>
        <div className="absolute top-20 right-1/5 w-72 h-72 bg-gradient-to-l from-orange-900/35 via-amber-800/45 to-yellow-900/40 rounded-full blur-2xl animate-pulse opacity-45" style={{ animationDuration: '5.8s', animationDelay: '1s' }}></div>
        <div className="absolute top-48 left-1/2 transform -translate-x-1/2 w-[400px] h-[300px] bg-gradient-to-br from-purple-900/45 via-indigo-800/55 to-blue-900/50 rounded-full blur-3xl animate-pulse opacity-55" style={{ animationDuration: '7.5s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 left-10 w-64 h-64 bg-gradient-to-tr from-rose-900/30 via-pink-800/40 to-purple-900/35 rounded-full blur-2xl animate-pulse opacity-40" style={{ animationDuration: '5.3s', animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-20 right-10 w-76 h-76 bg-gradient-to-bl from-cyan-900/35 via-teal-800/45 to-green-900/40 rounded-full blur-3xl animate-pulse opacity-45" style={{ animationDuration: '6.2s', animationDelay: '3s' }}></div>
      </div>
      
      <main className="relative z-20 flex-grow flex flex-col">
        <div className="container mx-auto px-2 sm:px-4 max-w-5xl py-4 sm:py-6 lg:py-8">
          


          {/* Authentication Status Alert */}
          {authError && (
            <Alert className="mb-4 border-red-500/50 bg-red-900/20">
              <AlertDescription className="text-red-400">
                Authentication Error: {authError}
              </AlertDescription>
            </Alert>
          )}
          
          {xpSubmissionResult && (
            <Alert className={`mb-4 ${xpSubmissionResult.startsWith('Error:') 
              ? 'border-red-500/50 bg-red-900/20' 
              : 'border-green-500/50 bg-green-900/20'
            }`}>
              <AlertDescription className={xpSubmissionResult.startsWith('Error:') 
                ? 'text-red-400' 
                : 'text-green-400'
              }>
                {xpSubmissionResult}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Enhanced Stats Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-2 mt-2">
            <div className="relative group">
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 backdrop-blur-sm">
                <div className="relative z-10 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Total XP</p>
                  <p className="text-sm sm:text-base font-bold text-green-400">{totalXP}</p>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 backdrop-blur-sm">
                <div className="relative z-10 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Current Score</p>
                  <p className="text-sm sm:text-base font-bold text-orange-400">{gameState.score}</p>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm">
                <div className="relative z-10 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">High Score</p>
                  <p className="text-sm sm:text-base font-bold text-blue-400">{playerStats?.highScore || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-md p-2 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
                <div className="relative z-10 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Rank</p>
                  <p className="text-sm sm:text-base font-bold text-purple-400">#{currentRank}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Stats Row */}
          {playerStats && (
            <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2">
              <div className="relative group">
                <div className="relative bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-md p-1.5 border border-slate-700/30 backdrop-blur-sm">
                  <div className="relative z-10 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Games Played</p>
                    <p className="text-xs sm:text-sm font-bold text-cyan-400">{playerStats.gamesPlayed}</p>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <div className="relative bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-md p-1.5 border border-slate-700/30 backdrop-blur-sm">
                  <div className="relative z-10 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Average Score</p>
                    <p className="text-xs sm:text-sm font-bold text-yellow-400">{playerStats.averageScore}</p>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <div className="relative bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-md p-1.5 border border-slate-700/30 backdrop-blur-sm">
                  <div className="relative z-10 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Status</p>
                    <p className="text-xs sm:text-sm font-bold text-emerald-400">{isConnected ? (isAuthenticated ? 'Ready' : 'Auth Needed') : 'Connect Wallet'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Container with Overlay Title */}
          <div className="relative group flex-shrink-0">
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl sm:rounded-2xl p-2 sm:p-4 md:p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl sm:rounded-2xl opacity-50"></div>
            
              <div className="relative z-10">
                <div className="relative">
                  {/* Overlay Title - Shows when not playing */}
                  {(!gameState.isGameRunning && !gameState.isGameOver && gameStartCountdown === 0) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 rounded-lg sm:rounded-xl">
                      <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 text-center px-2">
                        <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
                          Desert Runner
                        </span>
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-300 mb-4 text-center max-w-md px-4">
                        Jump through the endless desert, collect XP, and prove your reflexes
                      </p>
                    </div>
                  )}
                  
                  <canvas 
                    ref={canvasRef}
                    width={800}
                    height={360}
                    className="w-full max-w-3xl mx-auto border border-slate-600/30 rounded-lg sm:rounded-xl bg-gradient-to-b from-blue-50 to-blue-100 shadow-lg touch-none"
                    style={{ height: '360px', minHeight: '200px' }}
                  />
                </div>
                
                <div className="mt-3 text-center text-white">
                  {!isConnected ? (
                    <div className="space-y-3">
                      <p className="text-gray-300 text-sm px-2">Connect your wallet to start playing!</p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                        <WalletConnectButton />
                        <Button 
                          onClick={() => setShowRulesModal(true)}
                          variant="outline"
                          className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                        >
                          📖 Rules
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowStatsModal(true);
                            loadComprehensiveStats();
                          }}
                          variant="outline"
                          className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                        >
                          📊 Stats
                        </Button>
                      </div>
                    </div>
                  ) : isConnected && !isAuthenticated ? (
                    <div className="space-y-3">
                      <p className="text-gray-300 text-sm px-2">Authenticate your wallet to play and earn XP!</p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                        <WalletAuthButton 
                          onAuthSuccess={() => {
                            console.log('Auth success callback triggered');
                            // Additional refresh after 1 second if needed
                            setTimeout(() => {
                              forceRefreshAuthState();
                            }, 1000);
                          }}
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setShowRulesModal(true)}
                            variant="outline"
                            className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                          >
                            📖 Rules
                          </Button>
                          <Button 
                            onClick={() => {
                              setShowStatsModal(true);
                              loadComprehensiveStats();
                            }}
                            variant="outline"
                            className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                          >
                            📊 Stats
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : isConnected && isAuthenticated && !gameState.isGameRunning && !gameState.isGameOver && gameStartCountdown === 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs sm:text-sm text-gray-400 px-2">TAP SCREEN, SPACE or ↑ to jump • Press again for DOUBLE JUMP</p>
                      <div className="text-xs text-center text-green-400 mb-2">
                        ✅ Wallet Connected & Authenticated - Ready to Play!
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                        <Button 
                          onClick={startGame}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 hover:shadow-lg hover:shadow-green-500/25 transition-all text-sm px-4 py-2"
                        >
                          🌵 Start Desert Run
                        </Button>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setShowRulesModal(true)}
                            variant="outline"
                            className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                          >
                            📖 Rules
                          </Button>
                          <Button 
                            onClick={() => {
                              setShowStatsModal(true);
                              loadComprehensiveStats();
                            }}
                            variant="outline"
                            className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                          >
                            📊 Stats
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : gameStartCountdown > 0 ? (
                    <div className="space-y-2">
                    </div>
                  ) : gameState.isGameOver ? (
                    <div className="space-y-3">
                      <p className="text-gray-300 text-sm px-2">
                        Game Over! You scored {gameState.score} points.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                        <Button 
                          onClick={resetGame}
                          variant="outline"
                          className="border-white/20 hover:bg-white/10 text-sm px-4 py-2"
                        >
                          Play Again
                        </Button>
                        {gameState.score > 0 && (
                          <Button 
                            onClick={claimXP}
                            disabled={isClaimingXP}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:brightness-110 hover:shadow-lg hover:shadow-purple-500/25 transition-all text-sm px-4 py-2"
                          >
                            {isClaimingXP ? 'Submitting...' : `Claim ${Math.floor(gameState.score / 100)} XP`}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 text-xs sm:text-sm px-2">TAP SCREEN, SPACE or ↑ to jump! Press again for double jump!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Game Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl p-6 md:p-8 border border-slate-700/50 backdrop-blur-md shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">📊 Game Statistics</h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {statsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading statistics...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Debug/Troubleshooting Info */}
                  {(!gameStats && !leaderboard.length) && !statsLoading && (
                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-6">
                      <h4 className="text-yellow-400 font-semibold mb-2">🔧 Troubleshooting</h4>
                      <p className="text-yellow-200 text-sm mb-2">
                        No game data found. This could mean:
                      </p>
                      <ul className="text-yellow-200 text-sm space-y-1 ml-4">
                        <li>• Backend server is not running</li>
                        <li>• MongoDB is not connected</li>
                        <li>• No games have been played yet</li>
                        <li>• API endpoints are not responding</li>
                      </ul>
                      <p className="text-yellow-200 text-xs mt-3">
                        Check the browser console for detailed error messages.
                      </p>
                    </div>
                  )}


                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Leaderboard */}
                    <div>
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        🏆 Top Players
                      </h4>
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                        <div className="max-h-80 overflow-y-auto">
                          {leaderboard.length > 0 ? (
                            <div className="divide-y divide-slate-700/50">
                              {leaderboard.map((player, index) => (
                                <div key={player.walletAddress} className="p-4 hover:bg-slate-700/30 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                      index === 1 ? 'bg-gray-400 text-gray-900' :
                                      index === 2 ? 'bg-amber-600 text-amber-900' :
                                      'bg-slate-600 text-slate-200'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white font-medium truncate">
                                        {player.walletAddress.slice(0, 6)}...{player.walletAddress.slice(-4)}
                                      </p>
                                      <p className="text-sm text-gray-400">
                                        {player.totalXP} XP • {player.gamesPlayed} games
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-green-400 font-bold">{player.highScore}</p>
                                      <p className="text-xs text-gray-500">High Score</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-gray-400">
                              <p className="mb-2">📊 No leaderboard data available</p>
                              <p className="text-sm text-gray-500">
                                {statsLoading ? 'Loading...' : 'Be the first to play and earn XP!'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Player Personal Stats & History */}
                    <div>
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        📈 {isAuthenticated ? 'Your Statistics' : 'Personal Stats'}
                      </h4>
                      
                      {isAuthenticated && playerStats ? (
                        <div className="space-y-4">
                          {/* Personal Stats Summary */}
                          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-700/50 p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-gray-400 text-sm">Total XP</p>
                                <p className="text-xl font-bold text-green-400">{playerStats.totalXP}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-sm">Rank</p>
                                <p className="text-xl font-bold text-purple-400">#{currentRank}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-sm">High Score</p>
                                <p className="text-xl font-bold text-blue-400">{playerStats.highScore}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-sm">Games Played</p>
                                <p className="text-xl font-bold text-orange-400">{playerStats.gamesPlayed}</p>
                              </div>
                            </div>
                          </div>

                          {/* Recent Game History */}
                          <div>
                            <h5 className="text-lg font-semibold text-white mb-3">Recent Games</h5>
                            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                              <div className="max-h-60 overflow-y-auto">
                                {playerHistory.length > 0 ? (
                                  <div className="divide-y divide-slate-700/50">
                                    {playerHistory.map((game, index) => (
                                      <div key={index} className="p-3 hover:bg-slate-700/30 transition-colors">
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <p className="text-white font-medium">Score: {game.score}</p>
                                            <p className="text-sm text-gray-400">
                                              {new Date(game.timestamp).toLocaleDateString()} • {game.gameType}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-green-400 font-bold">+{game.xpEarned} XP</p>
                                            <p className="text-xs text-gray-500">{game.difficulty}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-6 text-center text-gray-400">
                                    No game history available
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-700/50 p-8 text-center">
                          <p className="text-gray-400 mb-4">
                            {isAuthenticated ? 'Play your first game to see your statistics!' : 'Connect and authenticate your wallet to see your personal statistics and game history.'}
                          </p>
                          {!isAuthenticated && (
                            <WalletConnectButton />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl p-6 md:p-8 border border-slate-700/50 backdrop-blur-md shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">🌵 Desert Runner Guide</h3>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    🎮 Controls
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>TAP SCREEN, SPACE or ↑ to jump over cacti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>TAP/Press again in air for DOUBLE JUMP</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Avoid hitting the desert cacti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Speed increases every 1000 points</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    🏆 Rewards & Features
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Earn 1 XP per 100 points survived</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>XP submitted to authenticated backend</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Wallet authentication required to play</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Track your total XP and high scores</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <p className="text-center text-gray-400 text-sm">
                  🦘 Double jump mechanic adds strategic depth to your desert adventure!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 