import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Player, Obstacle, Particle, SkinConfig, PhysicsConfig, ThemeType, PowerUp, PowerUpType } from '../types';
import { soundService } from '../services/soundService';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onScoreUpdate: (score: number) => void;
  skin: SkinConfig;
  triggerGravityFlip: number;
  physics: PhysicsConfig;
  theme: ThemeType;
}

interface ActiveEffect {
  type: PowerUpType;
  endTime: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  onScoreUpdate,
  skin,
  triggerGravityFlip,
  physics,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const canvasLogicalSize = useRef({ width: 0, height: 0 });

  // Mutable Game State Refs
  const playerRef = useRef<Player>({
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
    velocity: 0,
    radius: 15,
    color: skin.primaryColor,
    glow: skin.glowColor,
    isGravityInverted: false
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const activeEffectsRef = useRef<ActiveEffect[]>([]);

  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Parallax Offsets
  const bgOffset1Ref = useRef<number>(0);
  const bgOffset2Ref = useRef<number>(0);
  const bgOffset3Ref = useRef<number>(0);

  // Starfield for Space theme (generated once)
  const starsRef = useRef<{ x: number, y: number, size: number, speed: number }[]>([]);

  // Initialize stars if needed
  useEffect(() => {
    if (starsRef.current.length === 0) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < 100; i++) {
        starsRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.5 + 0.1
        });
      }
    }
  }, []);

  // Update skin refs when props change
  useEffect(() => {
    playerRef.current.color = skin.primaryColor;
    playerRef.current.glow = skin.glowColor;
  }, [skin]);

  // Handle Gravity Flip
  useEffect(() => {
    if (gameState === GameState.PLAYING && triggerGravityFlip > 0) {
      playerRef.current.isGravityInverted = !playerRef.current.isGravityInverted;
      soundService.playFlip();

      createParticles(
        100,
        playerRef.current.y,
        15,
        skin.secondaryColor
      );
    }
  }, [triggerGravityFlip, gameState, skin.secondaryColor]);

  const createParticles = (x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color: color
      });
    }
  };

  const resetGame = useCallback(() => {
    if (!canvasLogicalSize.current.height) return;

    playerRef.current = {
      y: canvasLogicalSize.current.height / 2,
      velocity: 0,
      radius: 15,
      color: skin.primaryColor,
      glow: skin.glowColor,
      isGravityInverted: false
    };
    obstaclesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    activeEffectsRef.current = [];
    scoreRef.current = 0;
    frameCountRef.current = 0;
    onScoreUpdate(0);
  }, [skin, onScoreUpdate]);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, speed: number, dt: number) => {
    // Increment offsets based on game speed (even if not playing, we can scroll slowly or stop)
    // Scale scroll by dt (Slow Mo support)
    const scrollSpeed = (gameState === GameState.PLAYING ? speed : 0.5) * dt;

    bgOffset1Ref.current = (bgOffset1Ref.current - scrollSpeed * 0.2) % width;
    bgOffset2Ref.current = (bgOffset2Ref.current - scrollSpeed * 0.5) % width;
    bgOffset3Ref.current = (bgOffset3Ref.current - scrollSpeed * 0.8) % width;

    if (theme === 'NEON_GRID') {
      // Dark Void
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, width, height);

      // Layer 1: Distant Grid (Slow)
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 1;
      const gridSize1 = 100;
      const off1 = bgOffset1Ref.current % gridSize1;

      ctx.beginPath();
      for (let x = off1; x < width; x += gridSize1) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize1) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Layer 2: Near Vertical Lines (Fast)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
      const gridSize2 = 50;
      const off2 = bgOffset2Ref.current % gridSize2;
      ctx.beginPath();
      for (let x = off2; x < width; x += gridSize2) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
      }
      ctx.stroke();
    }
    else if (theme === 'DEEP_SPACE') {
      // Deep Blue/Purple
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#020014');
      grad.addColorStop(1, '#090033');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Stars parallax
      ctx.fillStyle = '#ffffff';
      starsRef.current.forEach(star => {
        // Stars move relative to background
        const renderX = (star.x + bgOffset1Ref.current * star.speed * 2) % width;
        const finalX = renderX < 0 ? renderX + width : renderX;

        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.beginPath();
        ctx.arc(finalX, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Nebula clouds
      ctx.fillStyle = 'rgba(100, 0, 255, 0.05)';
      const cloudX = (bgOffset1Ref.current * 0.5) % width;
      ctx.beginPath();
      ctx.arc(cloudX + width / 2, height / 2, 300, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (theme === 'SUNSET_CITY') {
      // Synthwave Sunset
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#2b1055');
      grad.addColorStop(1, '#7597de');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Sun
      ctx.fillStyle = '#ffcc00';
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#ff6600';
      ctx.beginPath();
      ctx.arc(width * 0.7, height * 0.3, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cityscape Silhouette
      ctx.fillStyle = '#000000';
      const buildingWidth = 60;
      const numBuildings = Math.ceil(width / buildingWidth) + 2;
      const offset = bgOffset3Ref.current % buildingWidth;

      for (let i = 0; i < numBuildings; i++) {
        const h = 50 + Math.abs(Math.sin(i * 132.1)) * 150;
        const x = (i * buildingWidth) + offset - buildingWidth;
        ctx.fillRect(x, height - h, buildingWidth + 1, h);
      }
    }
  };

  const spawnPowerUp = (width: number, height: number) => {
    // 30% chance to spawn powerup relative to other events, but controlled by loop
    const types = [PowerUpType.SHIELD, PowerUpType.MULTIPLIER, PowerUpType.SLOW_MO, PowerUpType.MAGNET, PowerUpType.GHOST];
    const type = types[Math.floor(Math.random() * types.length)];
    const margin = 100;

    powerUpsRef.current.push({
      x: width,
      y: Math.random() * (height - margin * 2) + margin,
      type: type,
      radius: 12
    });
  };

  // Main Loop
  const update = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (lastTimeRef.current === 0) lastTimeRef.current = time;
    const realDt = (time - lastTimeRef.current) / 16.66; // Normalized to ~60fps
    lastTimeRef.current = time;

    // Use logical dimensions
    const { width, height } = canvasLogicalSize.current;
    if (width === 0 || height === 0) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    // --- Active Effects Logic ---
    const now = Date.now();
    activeEffectsRef.current = activeEffectsRef.current.filter(e => e.endTime > now);

    const hasSlowMo = activeEffectsRef.current.some(e => e.type === PowerUpType.SLOW_MO);
    const hasShield = activeEffectsRef.current.some(e => e.type === PowerUpType.SHIELD);
    const hasMultiplier = activeEffectsRef.current.some(e => e.type === PowerUpType.MULTIPLIER);
    const hasMagnet = activeEffectsRef.current.some(e => e.type === PowerUpType.MAGNET);
    const hasGhost = activeEffectsRef.current.some(e => e.type === PowerUpType.GHOST);

    const dt = hasSlowMo ? realDt * 0.5 : realDt; // Slow Motion Effect

    // --- Progressive Difficulty ---
    // Increase speed by 5% every 500 score
    const speedMultiplier = 1 + (Math.floor(scoreRef.current / 500) * 0.05);
    const currentSpeed = physics.speed * speedMultiplier;

    // --- Draw Parallax Background ---
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, width, height, currentSpeed, dt);

    if (gameState === GameState.PLAYING) {
      frameCountRef.current += dt;

      // --- Physics ---
      const player = playerRef.current;
      const gravityDirection = player.isGravityInverted ? -1 : 1;

      player.velocity += (physics.gravity * gravityDirection) * dt;
      player.velocity *= Math.pow(0.98, dt); // Damping adapted for dt

      // Clamp Velocity
      const MAX_VELOCITY = 8;
      if (player.velocity > MAX_VELOCITY) player.velocity = MAX_VELOCITY;
      if (player.velocity < -MAX_VELOCITY) player.velocity = -MAX_VELOCITY;

      player.y += player.velocity * dt;

      // --- Floor/Ceiling collision ---
      if (player.y - player.radius < 0 || player.y + player.radius > height) {
        if (hasShield) {
          // Shield saves the player
          soundService.playShieldBreak();
          activeEffectsRef.current = activeEffectsRef.current.filter(e => e.type !== PowerUpType.SHIELD);

          // Bounce player back to safe zone
          if (player.y < height / 2) {
            player.y = player.radius + 10;
            player.velocity = Math.abs(player.velocity) * 0.5;
          } else {
            player.y = height - player.radius - 10;
            player.velocity = -Math.abs(player.velocity) * 0.5;
          }
          createParticles(100, player.y, 30, '#00ffff');
        } else {
          soundService.playCrash();
          setGameState(GameState.GAME_OVER);
          createParticles(100, player.y, 50, '#ff0000');
          return;
        }
      }

      // --- Spawners ---
      // Scale spawn rates by dt check isn't trivial with float frames, using integer check on accumulated frames
      // Simple approximation: check if we crossed a threshold
      const prevFrame = Math.floor(frameCountRef.current - dt);
      const currFrame = Math.floor(frameCountRef.current);

      if (currFrame % physics.obstacleSpawnRate === 0 && currFrame !== prevFrame) {
        const minGapY = 50;
        const maxGapY = height - physics.gapSize - 50;
        const safeMaxGapY = Math.max(minGapY + 10, maxGapY);
        const gapTop = Math.random() * (safeMaxGapY - minGapY) + minGapY;

        obstaclesRef.current.push({
          x: width,
          width: 60,
          gapTop: gapTop,
          gapHeight: physics.gapSize,
          passed: false
        });
      }

      // Spawn Powerups (Less frequent, ~ every 3rd obstacle roughly)
      if (currFrame % (physics.obstacleSpawnRate * 3) === 0 && currFrame !== prevFrame) {
        spawnPowerUp(width, height);
      }

      // --- Update Obstacles ---
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= currentSpeed * dt;

        // Collision Detection
        const playerLeft = 100 - player.radius;
        const playerRight = 100 + player.radius;
        const playerTop = player.y - player.radius;
        const playerBottom = player.y + player.radius;
        const obsLeft = obs.x;
        const obsRight = obs.x + obs.width;

        if (playerRight > obsLeft && playerLeft < obsRight) {
          const inGap = playerTop > obs.gapTop && playerBottom < (obs.gapTop + obs.gapHeight);
          if (!inGap) {
            if (hasGhost) {
              // Ghost Mode: Pass through but flash player
              // Visual effect handled in draw
            } else if (hasShield) {
              // Shield saves from obstacle
              soundService.playShieldBreak();
              activeEffectsRef.current = activeEffectsRef.current.filter(e => e.type !== PowerUpType.SHIELD);
              // Destroy the obstacle so we don't hit it again next frame
              createParticles(obs.x + 30, player.y, 30, '#00ffff');
              obstaclesRef.current.splice(i, 1);
              continue;
            } else {
              soundService.playCrash();
              setGameState(GameState.GAME_OVER);
              createParticles(100, player.y, 50, '#ff0000');
            }
          }
        }

        // Scoring
        if (!obs.passed && playerLeft > obsRight) {
          obs.passed = true;
          const points = hasMultiplier ? 2 : 1;
          scoreRef.current += points;
          soundService.playScore();
          onScoreUpdate(scoreRef.current);
        }

        if (obs.x + obs.width < 0) {
          obstaclesRef.current.splice(i, 1);
        }
      }

      // --- Update PowerUps ---
      for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
        const p = powerUpsRef.current[i];

        // Magnet Effect
        if (hasMagnet) {
          const dx = player.y - p.y;
          const dy = 100 - p.x; // Player x is fixed at 100
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 400) { // Range
            p.x += (dy / dist) * 10 * dt;
            p.y += (dx / dist) * 10 * dt;
          } else {
            p.x -= currentSpeed * dt;
          }
        } else {
          p.x -= currentSpeed * dt;
        }

        // Collision with player (Circle vs Circle)
        const dx = p.x - 100;
        const dy = p.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + p.radius) {
          // Pickup!
          if (p.type === PowerUpType.MAGNET) soundService.playMagnet();
          else if (p.type === PowerUpType.GHOST) soundService.playGhost();
          else soundService.playPowerUp();
          // Add to active effects (Duration: 5 seconds)
          activeEffectsRef.current.push({
            type: p.type,
            endTime: Date.now() + 5000
          });

          powerUpsRef.current.splice(i, 1);
          createParticles(p.x, p.y, 20, '#ffffff');
        } else if (p.x < -50) {
          powerUpsRef.current.splice(i, 1);
        }
      }

      // --- Trail Effect ---
      if (currFrame % 3 === 0 && currFrame !== prevFrame) {
        particlesRef.current.push({
          x: 100 - 10,
          y: player.y,
          vx: -2 * dt,
          vy: 0,
          life: 0.5,
          color: skin.trailColor
        });
      }
    }

    // --- RENDER ---

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = theme === 'SUNSET_CITY' ? '#000' : '#ff0055';
      ctx.fillStyle = theme === 'SUNSET_CITY' ? '#000' : '#ff0055';

      ctx.fillRect(obs.x, 0, obs.width, obs.gapTop);
      ctx.fillRect(obs.x, obs.gapTop + obs.gapHeight, obs.width, height - (obs.gapTop + obs.gapHeight));

      ctx.shadowBlur = 0;
    });

    // Draw PowerUps
    powerUpsRef.current.forEach(p => {
      ctx.shadowBlur = 15;
      let color = '#fff';
      let label = '?';
      switch (p.type) {
        case PowerUpType.SHIELD: color = '#00ffff'; label = 'S'; break;
        case PowerUpType.MULTIPLIER: color = '#ffd700'; label = 'x2'; break;
        case PowerUpType.SLOW_MO: color = '#00ff00'; label = 'T'; break;
        case PowerUpType.MAGNET: color = '#ff00ff'; label = 'M'; break;
        case PowerUpType.GHOST: color = '#aaaaaa'; label = 'G'; break;
      }
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, p.x, p.y);
      ctx.shadowBlur = 0;
    });

    // Draw Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 0.02 * dt;

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Draw Player
    if (gameState !== GameState.GAME_OVER || (gameState === GameState.GAME_OVER && Math.floor(frameCountRef.current) % 10 < 5)) {
      const p = playerRef.current;

      ctx.save();
      ctx.translate(100, p.y);
      ctx.rotate(p.velocity * 0.1);

      // Draw Shield
      if (hasShield) {
        ctx.beginPath();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.arc(0, 0, p.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
      }

      // Draw Ghost Effect
      if (hasGhost) {
        ctx.globalAlpha = 0.5;
      }

      ctx.shadowBlur = 20;
      ctx.shadowColor = p.glow;
      ctx.fillStyle = p.color;

      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, 10);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.globalAlpha = 1.0;
    }

    // Draw Gravity Indicator
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const arrow = playerRef.current.isGravityInverted ? '↑' : '↓';
    ctx.fillText(arrow, width / 2, height / 2);

    // Draw Active Effect Status (Top Left)
    let statusY = 80;
    if (hasMultiplier) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('SCORE x2 ACTIVE', 20, statusY);
      statusY += 30;
    }
    if (hasSlowMo) {
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('SLOW MOTION', 20, statusY);
      statusY += 30;
    }
    if (hasMagnet) {
      ctx.fillStyle = '#ff00ff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('MAGNET', 20, statusY);
      statusY += 30;
    }
    if (hasGhost) {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('GHOST', 20, statusY);
    }

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, setGameState, onScoreUpdate, skin, physics, theme]);

  // Handle Resize and High DPI
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        canvasLogicalSize.current = { width: window.innerWidth, height: window.innerHeight };
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);

        // Regenerate stars if needed (simple approach: just ensure we have enough coverage or regenerate all)
        // For this simple game, regenerating on major resize is acceptable to prevent "empty" spots
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (starsRef.current.length > 0) {
          starsRef.current = []; // Clear and regenerate
          for (let i = 0; i < 100; i++) {
            starsRef.current.push({
              x: Math.random() * w,
              y: Math.random() * h,
              size: Math.random() * 2 + 0.5,
              speed: Math.random() * 0.5 + 0.1
            });
          }
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  const prevGameState = useRef<GameState>(gameState);
  useEffect(() => {
    if (gameState === GameState.PLAYING && prevGameState.current !== GameState.PLAYING) {
      resetGame();
    }
    prevGameState.current = gameState;
  }, [gameState, resetGame]);

  return <canvas ref={canvasRef} className="block w-full h-full absolute inset-0 z-0 touch-none" />;
};

export default GameCanvas;