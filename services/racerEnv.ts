import { CarState, TrackConfig, Action, StepResult, Point } from '../types';
import { distance, getIntersection } from './mathUtils';

// Constants
const DT = 0.1;
const MAX_SPEED = 5.0;
const TURN_RATE = 0.15;
const NUM_RAYS = 5;
const RAY_LENGTH = 100;
const FOV = Math.PI / 2; // 90 degrees

export class RacingEnv {
  car: CarState;
  track: TrackConfig;
  steps: number;
  maxSteps: number;
  currentCheckpointIdx: number;

  constructor(track: TrackConfig) {
    this.track = track;
    this.steps = 0;
    this.maxSteps = 1000;
    this.currentCheckpointIdx = 0;
    this.car = { x: 0, y: 0, heading: 0, velocity: 0 };
    this.reset();
  }

  reset(): number[] {
    // Start at index 0, facing index 1
    const p1 = this.track.centerLine[0];
    const p2 = this.track.centerLine[1];
    
    this.car = {
      x: p1.x,
      y: p1.y,
      heading: Math.atan2(p2.y - p1.y, p2.x - p1.x),
      velocity: 0 // Start stopped, agent learns to accelerate or we give constant speed
    };
    
    this.steps = 0;
    this.currentCheckpointIdx = 0;
    
    // For this simple demo, we assume constant speed after reset
    this.car.velocity = MAX_SPEED; 

    return this.getObservations();
  }

  step(action: Action): StepResult {
    this.steps++;

    // 1. Update Physics
    // Action 0: Left, 1: Straight, 2: Right
    let steer = 0;
    if (action === Action.TurnLeft) steer = -TURN_RATE;
    if (action === Action.TurnRight) steer = TURN_RATE;

    this.car.heading += steer;
    this.car.x += this.car.velocity * Math.cos(this.car.heading) * DT;
    this.car.y += this.car.velocity * Math.sin(this.car.heading) * DT;

    // 2. Check Collisions (Off-track)
    const { distToCenter, isOffTrack } = this.checkTrackStatus();
    
    // 3. Calculate Reward
    let reward = 0;
    let done = false;

    if (isOffTrack) {
      reward = -10; // Crash penalty
      done = true;
    } else {
      // Reward for staying alive
      reward += 0.1;
      
      // Reward for progress
      const progress = this.calculateProgress();
      reward += progress * 1.5;

      // Penalty for being far from center (encourages safe driving initially)
      reward -= (distToCenter / (this.track.width / 2)) * 0.1;
    }

    if (this.steps >= this.maxSteps) {
      done = true;
    }

    // Lap complete check (simplified: passed last checkpoint)
    if (this.currentCheckpointIdx >= this.track.centerLine.length - 2) {
       reward += 50; // Lap bonus
       done = true;
    }

    return {
      nextState: this.getObservations(),
      reward,
      done,
    };
  }

  // --- Helpers ---

  private checkTrackStatus(): { distToCenter: number, isOffTrack: boolean } {
    // Find closest segment
    let minDist = Infinity;
    
    // Check all segments (expensive but okay for JS with < 100 points)
    for (let i = 0; i < this.track.centerLine.length - 1; i++) {
        const p1 = this.track.centerLine[i];
        const p2 = this.track.centerLine[i+1];
        const d = this.pointLineDistance(this.car, p1, p2);
        if (d < minDist) minDist = d;
    }

    return {
        distToCenter: minDist,
        isOffTrack: minDist > (this.track.width / 2)
    };
  }

  private calculateProgress(): number {
    // Determine if we moved closer to the next checkpoint
    const nextCpIdx = (this.currentCheckpointIdx + 1) % this.track.centerLine.length;
    const nextCp = this.track.centerLine[nextCpIdx];
    
    const dist = distance(this.car, nextCp);
    const prevDist = distance({x: this.car.x - Math.cos(this.car.heading)*this.car.velocity*DT, y: this.car.y - Math.sin(this.car.heading)*this.car.velocity*DT}, nextCp);

    // If we are close enough to checkpoint, increment
    if (dist < this.track.width) {
        this.currentCheckpointIdx = nextCpIdx;
        return 2.0; // Bonus for hitting checkpoint
    }

    return prevDist - dist; // Positive if getting closer
  }

  // Raycasting for observations
  public getObservations(): number[] {
    const readings: number[] = [];
    
    for (let i = 0; i < NUM_RAYS; i++) {
        const angle = this.car.heading - (FOV / 2) + (FOV / (NUM_RAYS - 1)) * i;
        const rayEnd = {
            x: this.car.x + Math.cos(angle) * RAY_LENGTH,
            y: this.car.y + Math.sin(angle) * RAY_LENGTH
        };

        // Intersect with track boundaries
        // Simplification: We just return normalized distance to nearest centerline, 
        // but for a real "sensor" look we intersect with track width walls.
        // Let's do a mock sensor that detects distance to "off track" boundary.
        
        // This is a simplified "virtual" sensor for the specific demo
        const reading = this.castRay(this.car, rayEnd);
        readings.push(reading);
    }
    
    // Add velocity and normalized heading relative to track?
    // For simplicity, just sensors is often enough for simple obstacle avoidance/track following
    return readings; 
  }

  private castRay(start: Point, end: Point): number {
    // Approximate raycast by stepping along the ray
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const p = {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
        };
        
        // Check distance to centerline at this point
        let minDist = Infinity;
        for (let j = 0; j < this.track.centerLine.length - 1; j++) {
            const d = this.pointLineDistance(p, this.track.centerLine[j], this.track.centerLine[j+1]);
            if (d < minDist) minDist = d;
        }

        if (minDist > this.track.width / 2) {
            return t; // Normalized distance to wall (0 to 1)
        }
    }
    return 1.0; // No wall found within range
  }

  private pointLineDistance(p: Point, a: Point, b: Point): number {
    const A = p.x - a.x;
    const B = p.y - a.y;
    const C = b.x - a.x;
    const D = b.y - a.y;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = a.x;
      yy = a.y;
    } else if (param > 1) {
      xx = b.x;
      yy = b.y;
    } else {
      xx = a.x + param * C;
      yy = a.y + param * D;
    }

    const dx = p.x - xx;
    const dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}