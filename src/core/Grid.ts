// core/Grid.ts - Grid and terrain system
import { Tile } from './Tile';
import { TerrainType } from '../types/TerrainType';
import { ResourceType } from '../types/ResourceType';
import { Position } from '../types/Position';
import { Entity } from '../entities/Entity';

export class Grid {
    private width: number;
    private height: number;
    private tiles: Tile[][];
    
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.tiles = Array(height).fill(null).map(() => Array(width).fill(null));
    }
    
    public getWidth(): number {
      return this.width;
    }
    
    public getHeight(): number {
      return this.height;
    }
    
    public generateTerrain(): void {
      // Use procedural generation to fill the grid with terrain
      // This would include placing different tile types, resources, etc.
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          this.tiles[y][x] = this.generateTile(x, y);
        }
      }
      
      // Add resource nodes
      this.placeResources();
      
      // Add enemy spawn points
      this.placeEnemySpawnPoints();
    }
    
    private generateTile(x: number, y: number): Tile {
      // Use perlin noise or other algorithm to determine terrain type
      const terrainType = this.calculateTerrainType(x, y);
      return new Tile(x, y, terrainType);
    }
    
    private calculateTerrainType(x: number, y: number): TerrainType {
      // Simplified example - would use noise functions in real implementation
      const value = Math.random();
      
      if (value < 0.6) return TerrainType.GRASS;
      if (value < 0.8) return TerrainType.DIRT;
      if (value < 0.9) return TerrainType.STONE;
      return TerrainType.WATER;
    }
    
    private placeResources(): void {
      // Place resource nodes like trees, ore, etc.
      const resourceCount = Math.floor(this.width * this.height * 0.1); // 10% of tiles
      
      for (let i = 0; i < resourceCount; i++) {
        const x = Math.floor(Math.random() * this.width);
        const y = Math.floor(Math.random() * this.height);
        const tile = this.tiles[y][x];
        
        if (tile.terrainType !== TerrainType.WATER) {
          const resourceType = this.getRandomResourceType();
          tile.resourceType = resourceType;
          tile.resourceAmount = this.getInitialResourceAmount(resourceType);
        }
      }
    }
    
    private getRandomResourceType(): ResourceType {
      const types = [ResourceType.WOOD, ResourceType.STONE, ResourceType.IRON, ResourceType.FOOD];
      return types[Math.floor(Math.random() * types.length)];
    }
    
    private getInitialResourceAmount(type: ResourceType): number {
      switch (type) {
        case ResourceType.WOOD: return 5 + Math.floor(Math.random() * 5);
        case ResourceType.STONE: return 3 + Math.floor(Math.random() * 4);
        case ResourceType.IRON: return 2 + Math.floor(Math.random() * 3);
        case ResourceType.FOOD: return 3 + Math.floor(Math.random() * 3);
        default: return 1;
      }
    }
    
    private placeEnemySpawnPoints(): void {
      // Place spawn points along the edges of the map
      const spawnPointCount = 4; // One on each side
      
      // North
      this.tiles[0][Math.floor(this.width / 2)].isEnemySpawnPoint = true;
      
      // East
      this.tiles[Math.floor(this.height / 2)][this.width - 1].isEnemySpawnPoint = true;
      
      // South
      this.tiles[this.height - 1][Math.floor(this.width / 2)].isEnemySpawnPoint = true;
      
      // West
      this.tiles[Math.floor(this.height / 2)][0].isEnemySpawnPoint = true;
    }
    
    public getStartingPosition(): Position {
      // Return center of map as starting position
      return {
        x: Math.floor(this.width / 2),
        y: Math.floor(this.height / 2)
      };
    }
    
    public getEnemySpawnPoints(): Position[] {
      const spawnPoints: Position[] = [];
      
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.tiles[y][x].isEnemySpawnPoint) {
            spawnPoints.push({ x, y });
          }
        }
      }
      
      return spawnPoints;
    }
    
    public isValidMove(entity: Entity, position: Position): boolean {
      // Check if position is within grid bounds
      if (position.x < 0 || position.x >= this.width || 
          position.y < 0 || position.y >= this.height) {
        return false;
      }
      
      // Check if entity has action points
      if (entity.actionPoints <= 0) {
        return false;
      }
      
      // Check if destination tile is passable
      const tile = this.tiles[position.y][position.x];
      
      if (!tile.isPassable(entity)) {
        return false;
      }
      
      // Check if destination is occupied by another entity
      // (This would check against the EntityManager in practice)
      
      return true;
    }
    
    public canBuildAt(position: Position): boolean {
      // Check if position is within grid bounds
      if (position.x < 0 || position.x >= this.width || 
          position.y < 0 || position.y >= this.height) {
        return false;
      }
      
      // Check if tile is buildable
      const tile = this.tiles[position.y][position.x];
      
      if (!tile.isBuildable()) {
        return false;
      }
      
      return true;
    }
    
    public getLineOfSight(from: Position, to: Position): Tile[] {
      // Bresenham's line algorithm to get tiles between positions
      // Used for ranged attacks and line-of-sight calculations
      const tiles: Tile[] = [];
      
      const dx = Math.abs(to.x - from.x);
      const dy = -Math.abs(to.y - from.y);
      const sx = from.x < to.x ? 1 : -1;
      const sy = from.y < to.y ? 1 : -1;
      let err = dx + dy;
      
      let x = from.x;
      let y = from.y;
      
      while (true) {
        // Skip starting position
        if (!(x === from.x && y === from.y)) {
          // Check if we're in bounds
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            tiles.push(this.tiles[y][x]);
          }
        }
        
        // Check if we've reached the target
        if (x === to.x && y === to.y) {
          break;
        }
        
        // Otherwise continue the line
        const e2 = 2 * err;
        if (e2 >= dy) {
          if (x === to.x) break;
          err += dy;
          x += sx;
        }
        if (e2 <= dx) {
          if (y === to.y) break;
          err += dx;
          y += sy;
        }
      }
      
      return tiles;
    }
    
    public getTile(position: Position): Tile | null {
      if (position.x < 0 || position.x >= this.width || 
          position.y < 0 || position.y >= this.height) {
        return null;
      }
      
      return this.tiles[position.y][position.x];
    }
  }