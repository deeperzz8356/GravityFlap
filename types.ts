export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface Point {
  x: number;
  y: number;
}

export interface Player {
  y: number;
  velocity: number;
  radius: number;
  color: string;
  glow: string;
  isGravityInverted: boolean;
}

export interface Obstacle {
  x: number;
  width: number;
  gapTop: number;
  gapHeight: number;
  passed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export enum PowerUpType {
  SHIELD = 'SHIELD',
  MULTIPLIER = 'MULTIPLIER',
  SLOW_MO = 'SLOW_MO',
  MAGNET = 'MAGNET',
  GHOST = 'GHOST'
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  radius: number;
}

export interface SkinConfig {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  trailColor: string;
}

export interface PhysicsConfig {
  label: string;
  gravity: number;
  speed: number;
  obstacleSpawnRate: number; // Frames
  gapSize: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export type ThemeType = 'NEON_GRID' | 'DEEP_SPACE' | 'SUNSET_CITY';

export const THEMES: Record<string, { label: string, value: ThemeType }> = {
  NEON_GRID: { label: "Cyber Grid", value: 'NEON_GRID' },
  DEEP_SPACE: { label: "Deep Space", value: 'DEEP_SPACE' },
  SUNSET_CITY: { label: "Synth City", value: 'SUNSET_CITY' },
};

export const DIFFICULTIES: Record<string, PhysicsConfig> = {
  EASY: {
    label: "Zen (Slow)",
    gravity: 0.15, 
    speed: 2.5,   
    obstacleSpawnRate: 260,
    gapSize: 260,
  },
  NORMAL: {
    label: "Classic",
    gravity: 0.28,
    speed: 3.5,
    obstacleSpawnRate: 200,
    gapSize: 210,
  },
  HARD: {
    label: "Hyper",
    gravity: 0.5,
    speed: 6,
    obstacleSpawnRate: 130,
    gapSize: 170,
  }
};