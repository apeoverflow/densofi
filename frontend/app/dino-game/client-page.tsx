'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";
import { WalletAuthButton } from "@/components/WalletAuthButton";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthErrorHandler } from "@/components/AuthErrorHandler";
import config from '@/lib/config';

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

interface Fireball {
  x: number;
  y: number;
  collected: boolean;
  type: 'single' | 'bundle5' | 'bundle10';
  value: number;
}

interface Kangaroo {
  x: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
  width: number;
  height: number;
}

interface Projectile {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  targetKangarooIndex?: number; // Index of kangaroo this projectile will kill
}

interface PowerUp {
  x: number;
  y: number;
  type: 'triple_jump';
  collected: boolean;
}

interface GameState {
  dinoY: number;
  dinoVelocity: number;
  isJumping: boolean;
  hasDoubleJump: boolean;
  hasTripleJump: boolean;
  tripleJumpCharges: number; // Number of triple jumps available
  obstacles: Obstacle[];
  fireballs: Fireball[];
  kangaroos: Kangaroo[];
  projectiles: Projectile[];
  powerUps: PowerUp[];
  fireballCount: number;
  score: number;
  gameSpeed: number;
  isGameOver: boolean;
  isGameRunning: boolean;
  animationFrame: number;
  animationCounter: number;
}

const INITIAL_GAME_STATE: GameState = {
  dinoY: 0,
  dinoVelocity: 0,
  isJumping: false,
  hasDoubleJump: true,
  hasTripleJump: false,
  tripleJumpCharges: 0,
  obstacles: [],
  fireballs: [],
  kangaroos: [],
  projectiles: [],
  powerUps: [],
  fireballCount: 0, // Start with 0 fireballs, get them after unlock
  score: 0,
  gameSpeed: 6, // Changed from 2 to 6 to match OBSTACLE_SPEED
  isGameOver: false,
  isGameRunning: false,
  animationFrame: 0,
  animationCounter: 0,
};

const DINO_SIZE = 50;
const OBSTACLE_WIDTH = 9;
const OBSTACLE_HEIGHT = 50;
const GAME_HEIGHT = 350;
const JUMP_FORCE = -17;
const GRAVITY = 0.75;
const OBSTACLE_SPEED = 6; // This will now be controlled by gameState.gameSpeed
const SPAWN_RATE = 0.015;
const GROUND_HEIGHT = GAME_HEIGHT + 20;
const FIREBALL_SIZE = 20;
const KANGAROO_WIDTH = 40;
const KANGAROO_HEIGHT = 45;
const KANGAROO_JUMP_FORCE = -12;
const KANGAROO_GRAVITY = 0.6;
const PROJECTILE_SPEED = 15;
const FIREBALL_SPAWN_RATE = 0.004; // Reduced from 0.008
const KANGAROO_SPAWN_RATE = 0.006; // Reduced from 0.012
const POWERUP_SPAWN_RATE = 0.005; // Reduced spawn rate for one-use power-ups
const POWERUP_SIZE = 25;
const ADVANCED_FEATURES_SCORE_THRESHOLD = 1000; // Score needed to unlock kangaroos and fireballs

// Helper component for pixel icons
const PixelIcon = ({ src, alt, size = 16 }: { src: string; alt: string; size?: number }) => (
  <Image src={`/pixel/${src}`} alt={alt} width={size} height={size} />
);

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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [currentRank, setCurrentRank] = useState<number | string>('Unranked');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [gameStats, setGameStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [playerHistory, setPlayerHistory] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteImageRef = useRef<HTMLImageElement | null>(null);
  const kangarooImageRef = useRef<HTMLImageElement | null>(null);
  const [gameStartCountdown, setGameStartCountdown] = useState(0);
  const [backgroundOffset, setBackgroundOffset] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
          console.log('Failed to load player stats:', error);
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
          console.log('Failed to load player history:', error);
          setPlayerHistory([]);
        }
      } else {
        // Clear player history if not authenticated
        setPlayerHistory([]);
      }
    } catch (error) {
      console.log('Failed to load comprehensive stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load sprite images
  useEffect(() => {
    // Load dino sprite
    const dinoImg = new window.Image();
    dinoImg.src = '/running-sprite.png';
    dinoImg.onload = () => {
      spriteImageRef.current = dinoImg;
    };

    // Load kangaroo sprite
    const kangarooImg = new window.Image();
    kangarooImg.src = '/pixel/kangaroo-pixel.png';
    kangarooImg.onload = () => {
      kangarooImageRef.current = kangarooImg;
    };
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyZ') {
        e.preventDefault();
        setKeys(prev => new Set(prev).add(e.code));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyZ') {
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

  // Jump logic with double and triple jump
  const jump = useCallback(() => {
    setGameState(prev => {
      // First jump: when on ground
      if (!prev.isJumping && prev.dinoY === 0) {
        return {
          ...prev,
          isJumping: true,
          dinoVelocity: JUMP_FORCE,
          hasDoubleJump: true, // Enable double jump after first jump
          hasTripleJump: prev.tripleJumpCharges > 0, // Enable triple jump if charges available
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
      // Triple jump: when in air and triple jump is available
      else if (prev.isJumping && !prev.hasDoubleJump && prev.hasTripleJump && prev.dinoY < 0 && prev.tripleJumpCharges > 0) {
        return {
          ...prev,
          dinoVelocity: JUMP_FORCE * 0.6, // Weaker triple jump
          hasTripleJump: false, // Use up the triple jump
          tripleJumpCharges: prev.tripleJumpCharges - 1, // Consume one charge
        };
      }
      return prev;
    });
  }, []);

  // Shoot fireball logic
  const shootFireball = useCallback(() => {
    setGameState(prev => {
      if (prev.fireballCount > 0) {
        const dinoX = 150;
        const dinoY = GAME_HEIGHT - DINO_SIZE + prev.dinoY + DINO_SIZE / 2;
        
        // Find the nearest kangaroo
        let nearestKangarooIndex = -1;
        let nearestDistance = Infinity;
        
        for (let i = 0; i < prev.kangaroos.length; i++) {
          const kangaroo = prev.kangaroos[i];
          const kangarooCenterX = kangaroo.x + kangaroo.width / 2;
          const kangarooCenterY = kangaroo.y + kangaroo.height / 2;
          
          // Only target kangaroos that are ahead of the dino
          if (kangarooCenterX > dinoX) {
            const distance = Math.sqrt(
              Math.pow(kangarooCenterX - dinoX, 2) + 
              Math.pow(kangarooCenterY - dinoY, 2)
            );
            
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestKangarooIndex = i;
            }
          }
        }
        
        let newState = { ...prev };
        
        // If there's a nearest kangaroo, create a targeted projectile
        if (nearestKangarooIndex !== -1) {
          const targetKangaroo = newState.kangaroos[nearestKangarooIndex];
          const targetX = targetKangaroo.x + targetKangaroo.width / 2;
          const targetY = targetKangaroo.y + targetKangaroo.height / 2;
          
          // Create a targeted projectile that will kill the kangaroo on impact
          const deltaX = targetX - dinoX;
          const deltaY = targetY - dinoY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          const velocityX = (deltaX / distance) * PROJECTILE_SPEED * 1.5; // Slightly faster
          const velocityY = (deltaY / distance) * PROJECTILE_SPEED * 1.5;
          
          const targetedProjectile: Projectile = {
            x: dinoX,
            y: dinoY,
            velocityX: velocityX,
            velocityY: velocityY,
            targetKangarooIndex: nearestKangarooIndex, // Mark which kangaroo to kill
          };
          
          newState.projectiles = [...newState.projectiles, targetedProjectile];
        } else {
          // No kangaroos to target, shoot straight ahead as before
          const normalProjectile: Projectile = {
            x: dinoX,
            y: dinoY,
            velocityX: PROJECTILE_SPEED,
            velocityY: 0,
          };
          
          newState.projectiles = [...newState.projectiles, normalProjectile];
        }
        
        // Always consume fireball
        newState.fireballCount = newState.fireballCount - 1;
        
        return newState;
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

  // Handle shooting input
  useEffect(() => {
    if (keys.has('KeyZ')) {
      if (gameState.isGameRunning && !gameState.isGameOver) {
        shootFireball();
      }
    }
  }, [keys, gameState.isGameRunning, gameState.isGameOver, shootFireball]);

  // Handle touch input for mobile (only on canvas)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only handle touches on the canvas itself, not on buttons
      const canvas = canvasRef.current;
      if (canvas && e.target === canvas) {
        e.preventDefault();
        if (gameState.isGameRunning && !gameState.isGameOver) {
          jump();
        }
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
    setBackgroundOffset(0);
    lastTimeRef.current = null;
    
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
    setGameStartCountdown(0);
    setBackgroundOffset(0);
    lastTimeRef.current = null;
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
        lastTimeRef.current = null;
      }
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      const dt = deltaTime / (1000 / 60); // Normalize to 60fps

      setGameState(prev => {
        let newState = { ...prev };

        // Update dino physics
        if (newState.isJumping || newState.dinoY < 0) {
          newState.dinoVelocity += GRAVITY * dt;
          newState.dinoY += newState.dinoVelocity * dt;

          if (newState.dinoY >= 0) {
            newState.dinoY = 0;
            newState.dinoVelocity = 0;
            newState.isJumping = false;
            newState.hasDoubleJump = true; // Reset double jump when landing
            newState.hasTripleJump = newState.tripleJumpCharges > 0; // Reset triple jump if charges available
          }
        }

        // Update obstacles
        newState.obstacles = newState.obstacles
          .map(obstacle => ({ ...obstacle, x: obstacle.x - newState.gameSpeed * dt }))
          .filter(obstacle => obstacle.x + obstacle.width > 0);

        // Spawn new obstacles
        if (Math.random() < SPAWN_RATE) {
          newState.obstacles.push({
            x: 800,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
          });
        }

        // Update fireballs
        newState.fireballs = newState.fireballs
          .map(fireball => ({ ...fireball, x: fireball.x - newState.gameSpeed * dt }))
          .filter(fireball => fireball.x + FIREBALL_SIZE > 0 && !fireball.collected);

        // Spawn new fireballs (only after score threshold)
        if (newState.score >= ADVANCED_FEATURES_SCORE_THRESHOLD && Math.random() < FIREBALL_SPAWN_RATE) {
          // Determine fireball type based on random chance
          const rand = Math.random();
          let fireballType: 'single' | 'bundle5' | 'bundle10';
          let fireballValue: number;
          
          if (rand < 0.65) {
            fireballType = 'single';
            fireballValue = 1;
          } else if (rand < 0.85) {
            fireballType = 'bundle5';
            fireballValue = 5;
          } else {
            fireballType = 'bundle10';
            fireballValue = 10;
          }
          
          newState.fireballs.push({
            x: 800,
            y: GAME_HEIGHT - 60 - Math.random() * 100, // Random height
            collected: false,
            type: fireballType,
            value: fireballValue,
          });
        }

        // Update kangaroos
        newState.kangaroos = newState.kangaroos
          .map(kangaroo => {
            let updatedKangaroo = { ...kangaroo };
            updatedKangaroo.x -= newState.gameSpeed * dt;
            
            // Kangaroo jumping physics
            if (updatedKangaroo.isJumping || updatedKangaroo.y < GAME_HEIGHT - updatedKangaroo.height) {
              updatedKangaroo.velocityY += KANGAROO_GRAVITY * dt;
              updatedKangaroo.y += updatedKangaroo.velocityY * dt;

              if (updatedKangaroo.y >= GAME_HEIGHT - updatedKangaroo.height) {
                updatedKangaroo.y = GAME_HEIGHT - updatedKangaroo.height;
                updatedKangaroo.velocityY = KANGAROO_JUMP_FORCE; // Bounce back up
                updatedKangaroo.isJumping = true;
              }
            }
            
            return updatedKangaroo;
          })
          .filter(kangaroo => kangaroo.x + kangaroo.width > 0);

        // Spawn new kangaroos (only after score threshold)
        if (newState.score >= ADVANCED_FEATURES_SCORE_THRESHOLD && Math.random() < KANGAROO_SPAWN_RATE) {
          newState.kangaroos.push({
            x: 800,
            y: GAME_HEIGHT - KANGAROO_HEIGHT,
            velocityY: KANGAROO_JUMP_FORCE,
            isJumping: true,
            width: KANGAROO_WIDTH,
            height: KANGAROO_HEIGHT,
          });
        }

        // Update projectiles
        newState.projectiles = newState.projectiles
          .map(projectile => ({
            ...projectile,
            x: projectile.x + projectile.velocityX * dt,
            y: projectile.y + projectile.velocityY * dt,
          }))
          .filter(projectile => projectile.x < 800);

        // Update power-ups
        newState.powerUps = newState.powerUps
          .map(powerUp => ({ ...powerUp, x: powerUp.x - newState.gameSpeed * dt }))
          .filter(powerUp => powerUp.x + POWERUP_SIZE > 0 && !powerUp.collected);

        // Spawn new power-ups (commonly throughout the game)
        if (Math.random() < POWERUP_SPAWN_RATE) {
          newState.powerUps.push({
            x: 800,
            y: GAME_HEIGHT - 80 - Math.random() * 120, // Random height
            type: 'triple_jump',
            collected: false,
          });
        }

        // Dino rectangle for collisions
        const dinoRect = {
          x: 100 + 8, // Move hitbox 8px to the right (narrower on left side)
          y: GAME_HEIGHT - DINO_SIZE + newState.dinoY,
          width: DINO_SIZE - 16, // Make width much narrower (remove 16px total)
          height: DINO_SIZE - 5,
        };

        // Check fireball collection with precise collision detection
        for (let index = 0; index < newState.fireballs.length; index++) {
          const fireball = newState.fireballs[index];
          if (fireball.collected) continue;
          
          const fireballRect = {
            x: fireball.x + 2, // Slightly smaller hitbox for more generous collection
            y: fireball.y + 2,
            width: FIREBALL_SIZE - 4,
            height: FIREBALL_SIZE - 4,
          };
          
          // Direct rectangle collision check without using the flawed checkCollision function
          const isColliding = (
            dinoRect.x < fireballRect.x + fireballRect.width &&
            dinoRect.x + dinoRect.width > fireballRect.x &&
            dinoRect.y < fireballRect.y + fireballRect.height &&
            dinoRect.y + dinoRect.height > fireballRect.y
          );
          
          if (isColliding) {
            newState.fireballs[index].collected = true;
            newState.fireballCount += fireball.value; // Add the value based on type
          }
        }

        // Check power-up collection with precise collision detection
        // Filter out already collected power-ups first to prevent double processing
        newState.powerUps = newState.powerUps.filter(powerUp => {
          if (powerUp.collected) return false; // Remove collected power-ups
          
          const powerUpRect = {
            x: powerUp.x + 3, // Tighter hitbox for more precise collection
            y: powerUp.y + 3,
            width: POWERUP_SIZE - 6,
            height: POWERUP_SIZE - 6,
          };
          
          // Direct rectangle collision check without using the flawed checkCollision function
          const isColliding = (
            dinoRect.x < powerUpRect.x + powerUpRect.width &&
            dinoRect.x + dinoRect.width > powerUpRect.x &&
            dinoRect.y < powerUpRect.y + powerUpRect.height &&
            dinoRect.y + dinoRect.height > powerUpRect.y
          );
          
          if (isColliding) {
            if (powerUp.type === 'triple_jump') {
              const oldCharges = newState.tripleJumpCharges;
              newState.tripleJumpCharges += 1; // Add one triple jump charge
              console.log(`Triple jump collected! Old charges: ${oldCharges}, New charges: ${newState.tripleJumpCharges}`);
              
              // Always update triple jump availability when we have charges
              // If currently jumping and don't have double jump, enable triple jump
              if (newState.isJumping && !newState.hasDoubleJump && !newState.hasTripleJump) {
                newState.hasTripleJump = true;
              }
              // If on ground, make sure triple jump is available for next jump
              if (!newState.isJumping) {
                newState.hasTripleJump = newState.tripleJumpCharges > 0;
              }
            }
            return false; // Remove the collected power-up
          }
          
          return true; // Keep the power-up
        });

        // Check projectile-kangaroo collisions with special handling for targeted projectiles
        newState.projectiles.forEach((projectile, projIndex) => {
          // Handle targeted projectiles (guaranteed hits)
          if (projectile.targetKangarooIndex !== undefined) {
            const targetIndex = projectile.targetKangarooIndex;
            
            // Check if target kangaroo still exists
            if (targetIndex < newState.kangaroos.length) {
              const targetKangaroo = newState.kangaroos[targetIndex];
              
              // Calculate distance to target
              const targetCenterX = targetKangaroo.x + targetKangaroo.width / 2;
              const targetCenterY = targetKangaroo.y + targetKangaroo.height / 2;
              const distanceToTarget = Math.sqrt(
                Math.pow(projectile.x - targetCenterX, 2) + 
                Math.pow(projectile.y - targetCenterY, 2)
              );
              
              // If projectile is close enough to target, kill the kangaroo
              if (distanceToTarget <= 35) { // 35px hit radius for more reliable hits
                newState.projectiles.splice(projIndex, 1);
                newState.kangaroos.splice(targetIndex, 1);
                newState.score += 50; // Bonus points for killing kangaroo
                
                // Update target indices for other projectiles since we removed a kangaroo
                newState.projectiles.forEach(proj => {
                  if (proj.targetKangarooIndex !== undefined && proj.targetKangarooIndex > targetIndex) {
                    proj.targetKangarooIndex--;
                  }
                });
              }
            } else {
              // Target kangaroo no longer exists, remove projectile
              newState.projectiles.splice(projIndex, 1);
            }
          } else {
            // Handle normal projectiles with regular collision detection
            newState.kangaroos.forEach((kangaroo, kangIndex) => {
              const projectileRect = {
                x: projectile.x,
                y: projectile.y,
                width: 8,
                height: 8,
              };
              
              // Make kangaroo hitbox more forgiving for projectiles
              const kangarooRect = {
                x: kangaroo.x, // No reduction for projectile hits
                y: kangaroo.y,
                width: kangaroo.width,
                height: kangaroo.height,
              };
              
              // Additional check: projectile center must be within kangaroo bounds (more forgiving)
              const projectileCenterX = projectile.x + 4;
              const projectileCenterY = projectile.y + 4;
              
              const isWithinKangarooBounds = (
                projectileCenterX >= kangaroo.x - 5 && // Expand bounds by 5px
                projectileCenterX <= kangaroo.x + kangaroo.width + 5 &&
                projectileCenterY >= kangaroo.y - 5 &&
                projectileCenterY <= kangaroo.y + kangaroo.height + 5
              );
              
              // Direct rectangle collision check
              const isColliding = (
                projectileRect.x < kangarooRect.x + kangarooRect.width &&
                projectileRect.x + projectileRect.width > kangarooRect.x &&
                projectileRect.y < kangarooRect.y + kangarooRect.height &&
                projectileRect.y + projectileRect.height > kangarooRect.y
              );
              
              if (isColliding && isWithinKangarooBounds) {
                // Remove both projectile and kangaroo
                newState.projectiles.splice(projIndex, 1);
                newState.kangaroos.splice(kangIndex, 1);
                newState.score += 50; // Bonus points for killing kangaroo
              }
            });
          }
        });

        // Check dino-obstacle collisions
        for (const obstacle of newState.obstacles) {
          if (checkCollision(dinoRect, obstacle)) {
            newState.isGameOver = true;
            newState.isGameRunning = false;
            break;
          }
        }

        // Check dino-kangaroo collisions with precise detection
        if (!newState.isGameOver) {
          for (const kangaroo of newState.kangaroos) {
            const kangarooRect = {
              x: kangaroo.x + 12, // Even bigger border for more forgiving collision
              y: kangaroo.y + 12,
              width: kangaroo.width - 24,
              height: kangaroo.height - 24,
            };
            
            // Direct rectangle collision check without using the flawed checkCollision function
            const isColliding = (
              dinoRect.x < kangarooRect.x + kangarooRect.width &&
              dinoRect.x + dinoRect.width > kangarooRect.x &&
              dinoRect.y < kangarooRect.y + kangarooRect.height &&
              dinoRect.y + dinoRect.height > kangarooRect.y
            );
            
            if (isColliding) {
              newState.isGameOver = true;
              newState.isGameRunning = false;
              break;
            }
          }
        }

        // Update score and background (only while game is running and not game over)
        if (!newState.isGameOver && newState.isGameRunning) {
          newState.score += 1 * dt;
          
          // Give initial fireballs when reaching threshold
          if (newState.score >= ADVANCED_FEATURES_SCORE_THRESHOLD && newState.fireballCount === 0) {
            newState.fireballCount = 20; // Give 20 fireballs when unlocking
          }
          
          // Increase game speed every 1000 points
          const scoreForSpeed = Math.floor(newState.score / 1000);
          const oldScoreForSpeed = Math.floor(prev.score / 1000);
          if (scoreForSpeed > oldScoreForSpeed) {
            newState.gameSpeed += 0.2 * (scoreForSpeed - oldScoreForSpeed);
          }
        }

        // Call animation update
        if (newState.isGameRunning && !newState.isGameOver && !newState.isJumping) {
            newState.animationCounter += dt;
            if (newState.animationCounter >= 8) {
                newState.animationFrame = (newState.animationFrame + 1) % 2;
                newState.animationCounter -= 8;
            }
        }

        return newState;
      });

      // Update background offset for scrolling effect
      setBackgroundOffset(prev => prev + (gameState.gameSpeed / 3) * (deltaTime / (1000/60)));

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
  }, [gameState.isGameRunning, gameState.isGameOver, checkCollision]);

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

  // Fireball drawing function
  const drawFireball = (ctx: CanvasRenderingContext2D, x: number, y: number, type: 'single' | 'bundle5' | 'bundle10' = 'single') => {
    const size = FIREBALL_SIZE;
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    // Different colors and effects based on type
    if (type === 'single') {
      // Regular fireball
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
      gradient.addColorStop(0, '#ff6b35');
      gradient.addColorStop(0.5, '#ff8500');
      gradient.addColorStop(1, 'rgba(255, 69, 0, 0.3)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner core
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(centerX, centerY, size/4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'bundle5') {
      // 5x bundle - larger with blue tint
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.8);
      gradient.addColorStop(0, '#4169E1');
      gradient.addColorStop(0.5, '#ff6b35');
      gradient.addColorStop(1, 'rgba(65, 105, 225, 0.4)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner core
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, size/3, 0, Math.PI * 2);
      ctx.fill();
      
      // "5x" text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('5x', centerX, centerY + 3);
    } else if (type === 'bundle10') {
      // 10x bundle - largest with purple tint
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
      gradient.addColorStop(0, '#8A2BE2');
      gradient.addColorStop(0.5, '#ff6b35');
      gradient.addColorStop(1, 'rgba(138, 43, 226, 0.5)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner core
      ctx.fillStyle = '#FF00FF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      // "10x" text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('10x', centerX, centerY + 3);
    }
  };

  // Kangaroo drawing function
  const drawKangaroo = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    if (kangarooImageRef.current) {
      // Save the current context state
      ctx.save();
      
      // Flip horizontally to make kangaroo face left (towards dino)
      ctx.scale(-1, 1);
      
      // Draw the kangaroo pixel image (flipped)
      ctx.drawImage(
        kangarooImageRef.current,
        -(x + KANGAROO_WIDTH), // Adjust x position for flip
        y,
        KANGAROO_WIDTH,
        KANGAROO_HEIGHT
      );
      
      // Restore the context state
      ctx.restore();
    } else {
      // Fallback: Draw simple kangaroo if image hasn't loaded
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x + 8, y + 15, 20, 25);
      
      // Head
      ctx.fillRect(x + 5, y + 5, 15, 15);
      
      // Ears
      ctx.fillRect(x + 6, y, 3, 8);
      ctx.fillRect(x + 16, y, 3, 8);
      
      // Tail (on left side since we're facing left)
      ctx.fillRect(x, y + 20, 8, 15);
      
      // Legs
      ctx.fillRect(x + 10, y + 35, 6, 10);
      ctx.fillRect(x + 20, y + 35, 6, 10);
      
      // Arms
      ctx.fillRect(x + 5, y + 20, 5, 12);
      ctx.fillRect(x + 25, y + 20, 5, 12);
      
      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 8, y + 8, 2, 2);
      ctx.fillRect(x + 15, y + 8, 2, 2);
      
      // Highlights
      ctx.fillStyle = '#CD853F';
      ctx.fillRect(x + 10, y + 18, 2, 8);
      ctx.fillRect(x + 7, y + 7, 1, 3);
    }
  };

  // Projectile drawing function  
  const drawProjectile = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Trail effect
    ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
    ctx.fillRect(x - 10, y + 2, 10, 4);
    
    // Main projectile
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(x + 4, y + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Core
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x + 4, y + 4, 2, 0, Math.PI * 2);
    ctx.fill();
  };

  // Power-up drawing function
  const drawPowerUp = (ctx: CanvasRenderingContext2D, x: number, y: number, type: 'triple_jump') => {
    const size = POWERUP_SIZE;
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    if (type === 'triple_jump') {
      // Outer glow effect
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
      gradient.addColorStop(0.7, 'rgba(0, 191, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 191, 255, 0.2)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
      ctx.fill();
      
      // Main crystal/gem shape
      ctx.fillStyle = '#00BFFF';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size/3);
      ctx.lineTo(centerX + size/4, centerY);
      ctx.lineTo(centerX, centerY + size/3);
      ctx.lineTo(centerX - size/4, centerY);
      ctx.closePath();
      ctx.fill();
      
      // Inner highlight
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size/5);
      ctx.lineTo(centerX + size/6, centerY);
      ctx.lineTo(centerX, centerY + size/5);
      ctx.lineTo(centerX - size/6, centerY);
      ctx.closePath();
      ctx.fill();
      
      // Triple jump indicator (three small arrows)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('3x', centerX, centerY + 2);
    }
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
        const currentFrame = gameState.isJumping ? 0 : gameState.animationFrame;
        
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

      // Draw fireballs
      gameState.fireballs.forEach(fireball => {
        if (!fireball.collected) {
          drawFireball(ctx, fireball.x, fireball.y, fireball.type);
        }
      });

      // Draw kangaroos
      gameState.kangaroos.forEach(kangaroo => {
        drawKangaroo(ctx, kangaroo.x, kangaroo.y);
      });

      // Draw projectiles
      gameState.projectiles.forEach(projectile => {
        drawProjectile(ctx, projectile.x, projectile.y);
      });

      // Draw power-ups
      gameState.powerUps.forEach(powerUp => {
        if (!powerUp.collected) {
          drawPowerUp(ctx, powerUp.x, powerUp.y, powerUp.type);
        }
      });

      // Draw completely static overlaid UI - all positions are FIXED
      const hasAdvancedFeatures = gameState.score >= ADVANCED_FEATURES_SCORE_THRESHOLD;
      
      // Save canvas state and reset all transformations
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity matrix
      ctx.textAlign = 'left'; // Ensure consistent text alignment
      ctx.textBaseline = 'alphabetic'; // Ensure consistent baseline
      
      // Set up shadows for all text
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;
      
      // FIXED POSITION 1: Score (always visible)
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 35);
      
      // FIXED POSITION 2: Fireball count (always reserve space)
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 3;
      
      // Always draw fireball icon (grayed out if locked)
      ctx.fillStyle = hasAdvancedFeatures ? '#ff6b35' : '#666';
      ctx.beginPath();
      ctx.arc(40, 60, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hasAdvancedFeatures ? '#ffff00' : '#999';
      ctx.beginPath();
      ctx.arc(40, 60, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Always show fireball count (0 if locked)
      ctx.fillStyle = hasAdvancedFeatures ? '#fff' : '#999';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`x ${hasAdvancedFeatures ? gameState.fireballCount : 0}`, 55, 65);
      
      // FIXED POSITION 3: Triple jump (always reserve space)
      // Always draw crystal icon (grayed out if no charges)
      const hasCharges = gameState.tripleJumpCharges > 0;
      ctx.fillStyle = hasCharges ? '#00BFFF' : '#666';
      ctx.beginPath();
      ctx.moveTo(35, 85);
      ctx.lineTo(43, 90);
      ctx.lineTo(35, 95);
      ctx.lineTo(27, 90);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = hasCharges ? '#87CEEB' : '#999';
      ctx.beginPath();
      ctx.moveTo(35, 87);
      ctx.lineTo(41, 90);
      ctx.lineTo(35, 93);
      ctx.lineTo(29, 90);
      ctx.closePath();
      ctx.fill();
      
      // Always show triple jump count
      ctx.fillStyle = hasCharges ? '#fff' : '#999';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Triple Jumps: ${gameState.tripleJumpCharges}`, 50, 95);
      
      // Reset shadow for other elements
      ctx.shadowColor = 'transparent';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
      
      // Show unlock message when approaching threshold
      if (gameState.score >= 800 && gameState.score < ADVANCED_FEATURES_SCORE_THRESHOLD) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.fillRect(250, 15, 180, 30);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(ADVANCED_FEATURES_SCORE_THRESHOLD - gameState.score)} - Fireballs! (press z)`, 340, 35);
        ctx.textAlign = 'left';
      }
      
      // // Show unlock notification
      // if (gameState.score >= ADVANCED_FEATURES_SCORE_THRESHOLD && gameState.score < ADVANCED_FEATURES_SCORE_THRESHOLD + 100) {
      //   ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
      //   ctx.fillRect(275, 10, 175, 40);
      //   ctx.fillStyle = '#000';
      //   ctx.font = 'bold 14px Arial';
      //   ctx.textAlign = 'center';
      //   ctx.fillText('Fireballs and Kangaroos Unlocked!', 350, 35);
      //   ctx.textAlign = 'left';
      // }
      
      // Restore canvas state
      ctx.restore();
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
  }, [gameState, gameStartCountdown, backgroundOffset]);

  // Claim XP function
  const claimXP = async () => {
    if (!isConnected || !address || gameState.score === 0) return;

    setIsClaimingXP(true);
    setToast(null);
    
    try {
      if (!isAuthenticated) {
        setToast({ message: 'Please authenticate your wallet to claim XP!', type: 'error' });
        setIsClaimingXP(false);
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
        let message = `Successfully earned ${xpEarned} XP!`;
        if (newHighScore) {
          message += ' 🎉 NEW HIGH SCORE!';
        }
        setToast({ message, type: 'success' }); 
        
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
            console.log('Failed to refresh player stats:', error);
          }
        }
        
        // Reset game after claiming
        resetGame();
      } else {
        throw new Error(result.error || 'Failed to submit XP');
      }
      
    } catch (error) {
      console.log('Failed to claim XP:', error);
      
      // Handle authentication errors
      if (error instanceof Error && (
        error.message.includes('Authentication') || 
        error.message.includes('401') ||
        error.message.includes('JWT token') ||
        error.message.includes('Wallet authentication required')
      )) {
        console.log('Auth error detected in game - clearing localStorage');
        localStorage.removeItem('wallet-auth');
        setToast({ message: 'Authentication expired. Please re-authenticate your wallet to continue.', type: 'error' });
        // Force page refresh to show authenticate button
        window.location.reload();
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to claim XP. Please try again.';
        setToast({ message: errorMessage, type: 'error' });
      }
    } finally {
      setIsClaimingXP(false);
    }
  };

  return (
    <div className="relative w-full h-[85vh] flex flex-col bg-gradient-to-b from-slate-900 via-slate-900/20 to-black overflow-hidden">
      <InteractiveBackground />
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className={`
            text-center
            rounded-xl p-4 border backdrop-blur-sm shadow-2xl flex items-center gap-3
            transition-all duration-300 animate-in fade-in slide-in-from-top-10
            ${toast.type === 'success' ? 'bg-green-900/80 border-green-500/50 text-green-300' : 'bg-red-900/80 border-red-500/50 text-red-300'}
          `}>
            {toast.type === 'success' && <PixelIcon src="trophey-pixel.png" alt="Success" size={24} />}
            {toast.type === 'error' && <PixelIcon src="spanner-pixel.png" alt="Error" size={24} />}
            <p className="font-bold flex-1">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Static gradient overlay for depth and readability */}
      <div className="absolute h-screen inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-black/60 pointer-events-none z-10"></div>
      
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
          


          {/* Authentication Status Alert with Reset Option */}
          <AuthErrorHandler error={authError} />
          
          
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
                  <p className="text-sm sm:text-base font-bold text-orange-400">{Math.floor(gameState.score)}</p>
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
                          Denso Runner
                        </span>
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-300 mb-4 text-center max-w-md px-4">
                        Jump and survive! Advanced features unlock at 1000 points!
                      </p>
                    </div>
                  )}
                  
                  <canvas 
                    ref={canvasRef}
                    width={800}
                    height={360}
                    className="w-full max-w-3xl mx-auto border border-slate-600/30 rounded-lg sm:rounded-xl bg-gradient-to-b from-blue-50 to-blue-100 shadow-lg touch-none"
                    style={{ 
                      height: 'min(360px, 45vw)', 
                      minHeight: '200px',
                      maxHeight: '360px'
                    }}
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
                          <img src="/pixel/book-pixel.png" alt="Book" className="w-4 h-4 mr-1" />
                          Rules
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowStatsModal(true);
                            loadComprehensiveStats();
                          }}
                          variant="outline"
                          className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                        >
                          <img src="/pixel/graph-pixel.png" alt="Stats" className="w-4 h-4 mr-1" />
                          Stats
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
                            <span className="flex items-center gap-1">
                              <PixelIcon src="book-pixel.png" alt="Rules" />
                              Rules
                            </span>
                          </Button>
                          <Button 
                            onClick={() => {
                              setShowStatsModal(true);
                              loadComprehensiveStats();
                            }}
                            variant="outline"
                            className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                          >
                            <span className="flex items-center gap-1">
                              <PixelIcon src="graph-pixel.png" alt="Stats" />
                              Stats
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : isConnected && isAuthenticated && !gameState.isGameRunning && !gameState.isGameOver && gameStartCountdown === 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs sm:text-sm text-gray-400 px-2">JUMP: TAP/SPACE/↑ • DOUBLE JUMP: Press again in air. Press Z to shoot fireballs!</p>
                      <div className="text-xs text-center text-green-400 mb-2">
                        <span className="flex items-center justify-center gap-1">
                          <Image src="/pixel/tick-pixel.png" alt="Success" width={16} height={16} />
                          Wallet Connected & Authenticated - Ready to Play!
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                        <Button 
                          onClick={startGame}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 hover:shadow-lg hover:shadow-green-500/25 transition-all text-sm px-4 py-2"
                        >
                          <span className="flex items-center gap-1">
                            <Image src="/pixel/cactus-pixel.png" alt="Cactus" width={16} height={16} />
                            Start Denso Run
                          </span>
                        </Button>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setShowRulesModal(true)}
                            variant="outline"
                            className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                          >
                            <span className="flex items-center gap-1">
                              <PixelIcon src="book-pixel.png" alt="Rules" />
                              Rules
                            </span>
                          </Button>
                          <Button 
                            onClick={() => {
                              setShowStatsModal(true);
                              loadComprehensiveStats();
                            }}
                            variant="outline"
                            className="border-white/20 hover:bg-white/10 text-xs sm:text-sm px-3 py-2"
                          >
                            <span className="flex items-center gap-1">
                              <PixelIcon src="graph-pixel.png" alt="Stats" />
                              Stats
                            </span>
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
                        Game Over! You scored {Math.floor(gameState.score)} points.
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
                    <div className="space-y-2">
                      <p className="text-gray-300 text-xs sm:text-sm px-2">JUMP: TAP/SPACE/↑ • DOUBLE JUMP: Press again in air • SHOOT: Z key!</p>
                      
                      {/* Floating Mobile Controls */}
                      {gameState.isGameRunning && !gameState.isGameOver && (
                        <>
                          {/* Mobile Control Buttons - Under the game */}
                          <div className="flex w-full mt-4 gap-2 sm:hidden">
                            {/* Jump Button - Left Half */}
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Jump button clicked', { isGameRunning: gameState.isGameRunning, isGameOver: gameState.isGameOver });
                                if (gameState.isGameRunning && !gameState.isGameOver) {
                                  jump();
                                }
                              }}
                              onTouchStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Jump button touched', { isGameRunning: gameState.isGameRunning, isGameOver: gameState.isGameOver });
                                if (gameState.isGameRunning && !gameState.isGameOver) {
                                  jump();
                                }
                              }}
                              className="flex-1 h-16 bg-gradient-to-r from-green-500/80 to-emerald-600/80 hover:brightness-110 text-white px-4 rounded-xl shadow-2xl active:scale-95 transition-all touch-none select-none border-2 border-white/20 backdrop-blur-sm flex items-center justify-center gap-3"
                            >
                              <Image src="/pixel/kangaroo-pixel.png" alt="Jump" width={40} height={40} className="drop-shadow-lg" />
                              <span className="text-xl font-bold">JUMP</span>
                            </Button>

                            {/* Shoot Button - Right Half */}
                            {gameState.score >= ADVANCED_FEATURES_SCORE_THRESHOLD ? (
                              <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Shoot button clicked', { isGameRunning: gameState.isGameRunning, isGameOver: gameState.isGameOver, fireballCount: gameState.fireballCount });
                                  if (gameState.isGameRunning && !gameState.isGameOver && gameState.fireballCount > 0) {
                                    shootFireball();
                                  }
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Shoot button touched', { isGameRunning: gameState.isGameRunning, isGameOver: gameState.isGameOver, fireballCount: gameState.fireballCount });
                                  if (gameState.isGameRunning && !gameState.isGameOver && gameState.fireballCount > 0) {
                                    shootFireball();
                                  }
                                }}
                                disabled={gameState.fireballCount === 0}
                                className="flex-1 h-16 bg-gradient-to-r from-orange-500/80 to-red-600/80 hover:brightness-110 text-white px-4 rounded-xl shadow-2xl active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-none select-none border-2 border-white/20 backdrop-blur-sm flex items-center justify-center gap-3 relative"
                              >
                                <Image src="/pixel/rocket-pixel.png" alt="Shoot" width={40} height={40} className="drop-shadow-lg" />
                                <span className="text-xl font-bold">SHOOT</span>
                                {gameState.fireballCount > 0 && (
                                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white">
                                    {gameState.fireballCount}
                                  </div>
                                )}
                              </Button>
                            ) : (
                              <div className="flex-1 h-16 bg-gray-400/50 px-4 rounded-xl border-2 border-gray-300/20 backdrop-blur-sm flex items-center justify-center gap-3">
                                <Image src="/pixel/rocket-pixel.png" alt="Shoot" width={40} height={40} className="drop-shadow-lg opacity-50" />
                                <span className="text-xl font-bold text-gray-300">LOCKED</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
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
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <PixelIcon src="graph-pixel.png" alt="Statistics" size={24} />
                  Game Statistics
                </h3>
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
                      <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                        <PixelIcon src="spanner-pixel.png" alt="Troubleshooting" />
                        Troubleshooting
                      </h4>
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
                            <PixelIcon src="trophey-pixel.png" alt="Trophy" />
                            Top Players
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
                              <p className="mb-2 flex items-center justify-center gap-1">
                                <PixelIcon src="graph-pixel.png" alt="Stats" />
                                No leaderboard data available
                              </p>
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
                        <PixelIcon src="line-graph-pixel.png" alt="Statistics" />
                        {isAuthenticated ? 'Your Statistics' : 'Personal Stats'}
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
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <PixelIcon src="cactus-pixel.png" alt="Cactus" size={24} />
                  Denso Runner Guide
                </h3>
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
                    <PixelIcon src="game-pixel.png" alt="Controls" />
                    Controls
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
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>Collect blue crystals for one-use TRIPLE JUMP charges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>Reach 1000 points to unlock advanced features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Press Z to shoot fireballs (after 1000 points)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>Collect fireballs: Singles (+1), Blue bundles (+5), Purple bundles (+10)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>Avoid cacti and bouncing kangaroos (appear after 1000 points)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Shoot kangaroos for bonus points (+50)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Speed increases every 1000 points</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <PixelIcon src="trophey-pixel.png" alt="Rewards" />
                    Rewards & Features
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Start with 20 fireballs ready to shoot</span>
                    </li>
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
                  <span className="flex items-center justify-center gap-1">
                    <PixelIcon src="rocket-pixel.png" alt="Jump" />
                    Master jumping, shooting, and timing to survive the enhanced desert adventure!
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 