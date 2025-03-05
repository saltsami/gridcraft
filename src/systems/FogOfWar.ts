// systems/FogOfWar.ts - Handles visibility and fog of war
import { Position } from '../types/Position';
import { Entity } from '../entities/Entity';

export enum VisibilityState {
  UNEXPLORED = 'unexplored',
  EXPLORED = 'explored',
  VISIBLE = 'visible'
}

export class FogOfWar {
  private width: number;
  private height: number;
  private visibilityGrid: VisibilityState[][];
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.visibilityGrid = Array(height).fill(null).map(() => 
      Array(width).fill(VisibilityState.UNEXPLORED)
    );
    
    // Add console log for debugging
    console.log(`FogOfWar initialized with dimensions: ${width}x${height}`);
  }
  
  public reset(): void {
    // Reset all visible tiles to explored
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.visibilityGrid[y][x] === VisibilityState.VISIBLE) {
          this.visibilityGrid[y][x] = VisibilityState.EXPLORED;
        }
      }
    }
  }
  
  public revealArea(center: Position, radius: number): void {
    // Add logging for debugging
    console.log(`Revealing area at (${center.x},${center.y}) with radius ${radius}`);
    
    // Make tiles within radius visible
    for (let y = Math.max(0, center.y - radius); y <= Math.min(this.height - 1, center.y + radius); y++) {
      for (let x = Math.max(0, center.x - radius); x <= Math.min(this.width - 1, center.x + radius); x++) {
        // Calculate distance from center
        const distance = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
        
        if (distance <= radius) {
          // Update visibility (using line of sight would be more accurate)
          this.visibilityGrid[y][x] = VisibilityState.VISIBLE;
        }
      }
    }
  }
  
  // New method to reveal a square area (simpler calculation than circle)
  public revealSquareArea(center: Position, radius: number): void {
    console.log(`Revealing square area at (${center.x},${center.y}) with radius ${radius}`);
    
    for (let y = Math.max(0, center.y - radius); y <= Math.min(this.height - 1, center.y + radius); y++) {
      for (let x = Math.max(0, center.x - radius); x <= Math.min(this.width - 1, center.x + radius); x++) {
        this.visibilityGrid[y][x] = VisibilityState.VISIBLE;
      }
    }
  }
  
  // New method to reveal a larger initial area
  public revealInitialArea(center: Position): void {
    // Reveal a larger area initially to make the game more playable
    this.revealSquareArea(center, 15);
    
    // Mark a larger area as at least explored
    for (let y = Math.max(0, center.y - 20); y <= Math.min(this.height - 1, center.y + 20); y++) {
      for (let x = Math.max(0, center.x - 20); x <= Math.min(this.width - 1, center.x + 20); x++) {
        if (this.visibilityGrid[y][x] === VisibilityState.UNEXPLORED) {
          this.visibilityGrid[y][x] = VisibilityState.EXPLORED;
        }
      }
    }
    
    console.log("Initial area revealed");
  }
  
  public isTileVisible(position: Position): boolean {
    // Check if position is within grid boundaries
    if (position.x < 0 || position.x >= this.width || position.y < 0 || position.y >= this.height) {
      return false;
    }
    
    return this.visibilityGrid[position.y][position.x] === VisibilityState.VISIBLE;
  }
  
  public isTileExplored(position: Position): boolean {
    // Check if position is within grid boundaries
    if (position.x < 0 || position.x >= this.width || position.y < 0 || position.y >= this.height) {
      return false;
    }
    
    const state = this.visibilityGrid[position.y][position.x];
    return state === VisibilityState.EXPLORED || state === VisibilityState.VISIBLE;
  }
  
  public getVisibilityState(position: Position): VisibilityState {
    // Check if position is within grid boundaries
    if (position.x < 0 || position.x >= this.width || position.y < 0 || position.y >= this.height) {
      return VisibilityState.UNEXPLORED;
    }
    
    return this.visibilityGrid[position.y][position.x];
  }

  // Method to match the one used in GridRenderer
  public getTileVisibility(position: Position): 'visible' | 'explored' | 'unexplored' {
    const state = this.getVisibilityState(position);
    
    switch (state) {
      case VisibilityState.VISIBLE:
        return 'visible';
      case VisibilityState.EXPLORED:
        return 'explored';
      default:
        return 'unexplored';
    }
  }
} 