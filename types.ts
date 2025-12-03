export interface Point {
  x: number;
  y: number;
}

export interface CarState {
  x: number;
  y: number;
  heading: number; // radians
  velocity: number;
}

export interface TrackConfig {
  centerLine: Point[];
  width: number;
}

export enum Action {
  TurnLeft = 0,
  Straight = 1,
  TurnRight = 2,
}

export interface StepResult {
  nextState: number[]; // Normalized observations
  reward: number;
  done: boolean;
  info?: any;
}

export interface EpisodeStats {
  episode: number;
  totalReward: number;
  steps: number;
  epsilon: number;
}