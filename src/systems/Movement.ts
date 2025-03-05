// systems/Movement.ts - Handles entity movement with pathfinding and action points
import { Grid } from '../core/Grid';
import { Entity } from '../entities/Entity';
import { Position } from '../types/Position';

// Constants
const STRAIGHT_MOVE_COST = 1.0;
const DIAGONAL_MOVE_COST = 1.5;

// Direction vectors (8 directions)
const DIRECTIONS = [
  { x: 0, y: -1, cost: STRAIGHT_MOVE_COST },  // Up
  { x: 1, y: -1, cost: DIAGONAL_MOVE_COST },  // Up-Right
  { x: 1, y: 0, cost: STRAIGHT_MOVE_COST },   // Right
  { x: 1, y: 1, cost: DIAGONAL_MOVE_COST },   // Down-Right
  { x: 0, y: 1, cost: STRAIGHT_MOVE_COST },   // Down
  { x: -1, y: 1, cost: DIAGONAL_MOVE_COST },  // Down-Left
  { x: -1, y: 0, cost: STRAIGHT_MOVE_COST },  // Left
  { x: -1, y: -1, cost: DIAGONAL_MOVE_COST }, // Up-Left
];

export interface ReachableTile {
  position: Position;
  cost: number;
}

export class Movement {
  private grid: Grid;
  private reachableTiles: Map<string, ReachableTile> = new Map();
  private currentPath: Position[] = [];
  private selectedEntity: Entity | null = null;

  constructor(grid: Grid) {
    this.grid = grid;
    console.log('[Movement] Movement system initialized');
  }

  /**
   * Sets the currently selected entity and calculates reachable tiles
   */
  public setSelectedEntity(entity: Entity | null): void {
    console.log('[Movement] Setting selected entity:', entity ? entity.getName() : 'null');
    this.selectedEntity = entity;
    this.reachableTiles.clear();
    this.currentPath = [];

    if (entity) {
      console.log(`[Movement] Entity has ${entity.actionPoints}/${entity.maxActionPoints} action points`);
      // Make sure entity has action points before calculating reachable tiles
      if (entity.actionPoints > 0) {
        this.calculateReachableTiles(entity);
        console.log(`[Movement] Calculated ${this.reachableTiles.size} reachable tiles`);
      } else {
        console.log(`[Movement] Entity has no action points, skipping reachable tile calculation`);
      }
    }
  }

  /**
   * Calculates all tiles reachable by the entity with current action points
   */
  private calculateReachableTiles(entity: Entity): void {
    console.log(`[Movement] Calculating reachable tiles for ${entity.getName()} with ${entity.actionPoints} AP`);
    const queue: ReachableTile[] = [{ position: { ...entity.position }, cost: 0 }];
    const visited: Set<string> = new Set();
    this.reachableTiles.clear();

    // Always add the entity's current position as reachable with 0 cost
    const startPosKey = `${entity.position.x},${entity.position.y}`;
    this.reachableTiles.set(startPosKey, { position: { ...entity.position }, cost: 0 });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const posKey = `${current.position.x},${current.position.y}`;

      if (visited.has(posKey)) continue;
      visited.add(posKey);

      // Only consider tiles that can be reached with current action points
      if (current.cost <= entity.actionPoints) {
        this.reachableTiles.set(posKey, current);

        // Explore all 8 directions
        for (const dir of DIRECTIONS) {
          const newPos = {
            x: current.position.x + dir.x,
            y: current.position.y + dir.y
          };
          const newPosKey = `${newPos.x},${newPos.y}`;

          // Check if position is valid and not visited
          if (!visited.has(newPosKey) && this.isValidMovePosition(entity, newPos)) {
            queue.push({
              position: newPos,
              cost: current.cost + dir.cost
            });
          }
        }
      }
    }
    
    console.log(`[Movement] Found ${this.reachableTiles.size} reachable tiles from (${entity.position.x}, ${entity.position.y}) with ${entity.actionPoints} AP`);
  }

  /**
   * Checks if a move to the position is valid
   */
  private isValidMovePosition(entity: Entity, position: Position): boolean {
    return this.grid.isValidMove(entity, position);
  }

  /**
   * Check if a tile is reachable with current AP
   */
  public isReachable(position: Position): boolean {
    const key = `${position.x},${position.y}`;
    const isReachable = this.reachableTiles.has(key);
    console.log(`[Movement] Checking if (${position.x}, ${position.y}) is reachable: ${isReachable}`);
    return isReachable;
  }

  /**
   * Get movement cost to a specific tile
   */
  public getMovementCost(position: Position): number {
    const key = `${position.x},${position.y}`;
    return this.reachableTiles.get(key)?.cost || 0;
  }

  /**
   * Get all reachable tiles
   */
  public getReachableTiles(): ReachableTile[] {
    return Array.from(this.reachableTiles.values());
  }

  /**
   * Find path using A* algorithm
   */
  public findPath(start: Position, end: Position): Position[] {
    if (!this.isReachable(end)) return [];

    console.log(`[Movement] Finding path from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);

    const openSet: Array<{ 
      position: Position, 
      g: number, 
      h: number, 
      f: number 
    }> = [{ 
      position: { ...start }, 
      g: 0, 
      h: this.heuristic(start, end), 
      f: this.heuristic(start, end) 
    }];
    
    const closedSet: Set<string> = new Set();
    const cameFrom: Map<string, Position> = new Map();

    while (openSet.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet[currentIndex];
      openSet.splice(currentIndex, 1);

      // Check if reached the end
      if (current.position.x === end.x && current.position.y === end.y) {
        const path: Position[] = [];
        let currentPos = { ...current.position };
        while (cameFrom.has(`${currentPos.x},${currentPos.y}`)) {
          path.unshift(currentPos);
          currentPos = cameFrom.get(`${currentPos.x},${currentPos.y}`)!;
        }
        console.log(`[Movement] Path found with ${path.length} steps`);
        return path;
      }

      // Mark as processed
      const currentKey = `${current.position.x},${current.position.y}`;
      closedSet.add(currentKey);

      // Check neighbors in all 8 directions
      for (const dir of DIRECTIONS) {
        const neighbor = {
          x: current.position.x + dir.x,
          y: current.position.y + dir.y
        };
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        // Skip if already processed or not reachable
        if (closedSet.has(neighborKey) || !this.isReachable(neighbor)) {
          continue;
        }

        const gScore = current.g + dir.cost;

        // Check if this path to neighbor is better or if neighbor is not in openSet
        let inOpenSet = false;
        for (let i = 0; i < openSet.length; i++) {
          if (openSet[i].position.x === neighbor.x && openSet[i].position.y === neighbor.y) {
            inOpenSet = true;
            if (gScore < openSet[i].g) {
              // Found a better path
              openSet[i].g = gScore;
              openSet[i].f = gScore + openSet[i].h;
              cameFrom.set(neighborKey, current.position);
            }
            break;
          }
        }

        if (!inOpenSet) {
          // Add neighbor to openSet
          openSet.push({
            position: neighbor,
            g: gScore,
            h: this.heuristic(neighbor, end),
            f: gScore + this.heuristic(neighbor, end)
          });
          cameFrom.set(neighborKey, current.position);
        }
      }
    }

    console.log(`[Movement] No path found from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
    // No path found
    return [];
  }

  /**
   * Heuristic function for A* (Manhattan distance)
   */
  private heuristic(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Calculate and set the current path when hovering over a tile
   */
  public calculatePath(hoveredPosition: Position): void {
    if (!this.selectedEntity) {
      this.currentPath = [];
      return;
    }

    // Only calculate path if tile is reachable
    if (this.isReachable(hoveredPosition)) {
      const path = this.findPath(this.selectedEntity.position, hoveredPosition);
      this.currentPath = path;
      console.log(`[Movement] Path calculated to (${hoveredPosition.x}, ${hoveredPosition.y}): ${path.length} steps`);
    } else {
      this.currentPath = [];
    }
  }

  /**
   * Get the current calculated path
   */
  public getCurrentPath(): Position[] {
    return this.currentPath;
  }

  /**
   * Move entity along the current path, consuming action points
   */
  public moveEntityAlongPath(entity: Entity, endPosition: Position): boolean {
    console.log(`[Movement] Attempting to move entity to (${endPosition.x}, ${endPosition.y})`);
    
    if (!this.isReachable(endPosition)) {
      console.log(`[Movement] Destination is not reachable`);
      return false;
    }

    const cost = this.getMovementCost(endPosition);
    console.log(`[Movement] Movement cost: ${cost}, Entity AP before move: ${entity.actionPoints}`);
    
    // Update entity position
    entity.position = { ...endPosition };
    entity.actionPoints -= cost;
    
    console.log(`[Movement] Entity moved. Remaining AP: ${entity.actionPoints}`);

    // Recalculate reachable tiles if entity still has action points
    if (entity.actionPoints > 0) {
      this.calculateReachableTiles(entity);
      console.log(`[Movement] Recalculated ${this.reachableTiles.size} reachable tiles after move`);
    } else {
      console.log(`[Movement] No action points left, clearing reachable tiles`);
      this.reachableTiles.clear();
    }
    
    this.currentPath = [];
    return true;
  }
} 