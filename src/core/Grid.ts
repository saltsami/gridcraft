// core/Grid.ts - Grid and terrain system
import { Tile } from './Tile';
import { TerrainType } from '../types';
import { ResourceType } from '../types';
import { Position } from '../types';
import { Entity } from '../entities';

export class Grid {
    private width: number;
    private height: number;
    private tiles: Tile[][];
    
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.tiles = Array(height).fill(null).map(() => Array(width).fill(null));
      
      // Initialize tiles with default terrain
      this.initializeTiles();
    }
    
    private initializeTiles(): void {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          this.tiles[y][x] = new Tile(x, y, TerrainType.GRASS);
        }
      }
    }
    
    public getWidth(): number {
      return this.width;
    }
    
    public getHeight(): number {
      return this.height;
    }
    
    public generateTerrain(): void {
      // First pass: Generate base terrain using noise
      this.generateBaseTerrain();
      
      // Second pass: Create water bodies (lakes and rivers)
      this.generateWaterBodies();
      
      // Third pass: Create forest clusters
      this.generateForestClusters();
      
      // Add resource nodes
      this.placeResources();
      
      // Add enemy spawn points
      this.placeEnemySpawnPoints();
      
      console.log("Terrain generation complete");
    }
    
    private generateBaseTerrain(): void {
      // Initialize all tiles as grass first
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          this.tiles[y][x] = new Tile(x, y, TerrainType.GRASS);
        }
      }
      
      // Add some random stone and dirt
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const value = Math.random();
          if (value < 0.15) {
            this.tiles[y][x].terrainType = TerrainType.DIRT;
          } else if (value < 0.25) {
            this.tiles[y][x].terrainType = TerrainType.STONE;
          }
        }
      }
    }
    
    private generateWaterBodies(): void {
      const waterPercentage = 0.2 + Math.random() * 0.2; // 20-40% water coverage
      const totalTiles = this.width * this.height;
      const waterTilesTarget = Math.floor(totalTiles * waterPercentage);
      
      // Start with 3-5 water seeds
      const numWaterSeeds = 3 + Math.floor(Math.random() * 3);
      const waterSeeds: Position[] = [];
      
      // Create random water seeds, avoiding center area (player start)
      for (let i = 0; i < numWaterSeeds; i++) {
        let x, y;
        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);
        const safeRadius = 10; // Keep water away from center
        
        do {
          x = Math.floor(Math.random() * this.width);
          y = Math.floor(Math.random() * this.height);
        } while (Math.abs(x - centerX) < safeRadius && Math.abs(y - centerY) < safeRadius);
        
        waterSeeds.push({ x, y });
        this.tiles[y][x].terrainType = TerrainType.WATER;
      }
      
      // Grow water outward from seeds
      let waterTiles = numWaterSeeds;
      let attempts = 0;
      const maxAttempts = totalTiles * 10; // Prevent infinite loop
      
      while (waterTiles < waterTilesTarget && attempts < maxAttempts) {
        attempts++;
        
        // Pick a random existing water tile
        const randomSeedIndex = Math.floor(Math.random() * waterSeeds.length);
        const seed = waterSeeds[randomSeedIndex];
        
        // Try to expand in a random direction
        const directions = [
          { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
          { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
        ];
        
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        const newX = seed.x + randomDir.dx;
        const newY = seed.y + randomDir.dy;
        
        // Check if the new position is valid and not already water
        if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
          if (this.tiles[newY][newX].terrainType !== TerrainType.WATER) {
            // Make it water and add to seeds
            this.tiles[newY][newX].terrainType = TerrainType.WATER;
            waterSeeds.push({ x: newX, y: newY });
            waterTiles++;
          }
        }
      }
      
      console.log(`Generated water bodies: ${waterTiles} tiles (${(waterTiles / totalTiles * 100).toFixed(2)}% coverage)`);
    }
    
    private generateForestClusters(): void {
      // Mark grass tiles as "forest" by setting them as potential wood resource areas
      const forestPercentage = 0.15 + Math.random() * 0.15; // 15-30% forest coverage
      const totalTiles = this.width * this.height;
      const forestTilesTarget = Math.floor(totalTiles * forestPercentage);
      
      // Start with 5-8 forest seeds
      const numForestSeeds = 5 + Math.floor(Math.random() * 4);
      const forestSeeds: Position[] = [];
      
      // Create random forest seeds on grass
      for (let i = 0; i < numForestSeeds; i++) {
        let x, y;
        let attempts = 0;
        
        do {
          x = Math.floor(Math.random() * this.width);
          y = Math.floor(Math.random() * this.height);
          attempts++;
          // Try to find a grass tile, but don't get stuck in an infinite loop
        } while (this.tiles[y][x].terrainType !== TerrainType.GRASS && attempts < 100);
        
        forestSeeds.push({ x, y });
        // Mark this tile as a forest (will be converted to resources later)
        this.tiles[y][x].resourceType = ResourceType.WOOD;
        this.tiles[y][x].resourceAmount = this.getInitialResourceAmount(ResourceType.WOOD);
      }
      
      // Grow forests outward from seeds
      let forestTiles = numForestSeeds;
      let attempts = 0;
      const maxAttempts = totalTiles * 10; // Prevent infinite loop
      
      while (forestTiles < forestTilesTarget && attempts < maxAttempts) {
        attempts++;
        
        // Pick a random existing forest tile
        const randomSeedIndex = Math.floor(Math.random() * forestSeeds.length);
        const seed = forestSeeds[randomSeedIndex];
        
        // Try to expand in a random direction (4 directions only for forests)
        const directions = [
          { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        const newX = seed.x + randomDir.dx;
        const newY = seed.y + randomDir.dy;
        
        // Check if the new position is valid, grass, and not already forest
        if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
          const tile = this.tiles[newY][newX];
          if (tile.terrainType === TerrainType.GRASS && tile.resourceType === null) {
            // Make it forest and add to seeds
            tile.resourceType = ResourceType.WOOD;
            tile.resourceAmount = this.getInitialResourceAmount(ResourceType.WOOD);
            forestSeeds.push({ x: newX, y: newY });
            forestTiles++;
          }
        }
      }
      
      console.log(`Generated forest clusters: ${forestTiles} tiles (${(forestTiles / totalTiles * 100).toFixed(2)}% coverage)`);
    }
    
    private calculateTerrainType(x: number, y: number): TerrainType {
      // This method is kept for backward compatibility but isn't used in the new generation approach
      const value = Math.random();
      
      if (value < 0.6) return TerrainType.GRASS;
      if (value < 0.8) return TerrainType.DIRT;
      if (value < 0.9) return TerrainType.STONE;
      return TerrainType.WATER;
    }
    
    private placeResources(): void {
      // Place remaining resource types (stone, iron, food)
      const resourceTypesToPlace = [ResourceType.STONE, ResourceType.IRON, ResourceType.FOOD];
      
      // We already placed WOOD resources in forest generation
      const resourceCount = Math.floor(this.width * this.height * 0.05); // 5% of tiles for other resources
      
      for (let i = 0; i < resourceCount; i++) {
        const x = Math.floor(Math.random() * this.width);
        const y = Math.floor(Math.random() * this.height);
        const tile = this.tiles[y][x];
        
        // Only place resources on empty grass or dirt tiles
        if ((tile.terrainType === TerrainType.GRASS || tile.terrainType === TerrainType.DIRT) 
            && tile.resourceType === null) {
          const resourceType = resourceTypesToPlace[Math.floor(Math.random() * resourceTypesToPlace.length)];
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