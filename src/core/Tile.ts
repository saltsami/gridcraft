// core/Tile.ts - Represents a single grid tile
import { TerrainType } from '../types/TerrainType';
import { ResourceType } from '../types/ResourceType';
import { Entity } from '../entities/Entity';

export class Tile {
  public readonly x: number;
  public readonly y: number;
  public terrainType: TerrainType;
  public resourceType: ResourceType | null = null;
  public resourceAmount: number = 0;
  public isEnemySpawnPoint: boolean = false;
  public isTransparent: boolean = true;
  
  constructor(x: number, y: number, terrainType: TerrainType) {
    this.x = x;
    this.y = y;
    this.terrainType = terrainType;
    
    // Set transparency based on terrain type
    this.isTransparent = terrainType !== TerrainType.STONE;
  }
  
  public isPassable(entity: Entity): boolean {
    // Water is impassable for most entities
    if (this.terrainType === TerrainType.WATER) {
      return false;
    }
    
    return true;
  }
  
  public isBuildable(): boolean {
    // Can't build on water or if there's a resource
    if (this.terrainType === TerrainType.WATER || this.resourceType !== null) {
      return false;
    }
    
    return true;
  }
  
  public hasResource(): boolean {
    return this.resourceType !== null && this.resourceAmount > 0;
  }
  
  public extractResource(amount: number): number {
    if (!this.hasResource()) {
      return 0;
    }
    
    const extractedAmount = Math.min(amount, this.resourceAmount);
    this.resourceAmount -= extractedAmount;
    
    if (this.resourceAmount <= 0) {
      this.resourceType = null;
    }
    
    return extractedAmount;
  }
} 