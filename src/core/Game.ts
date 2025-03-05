// core/Game.ts - Main game controller
import { Grid } from './Grid';
import { ResourceManager } from '../systems/ResourceManager';
import { EntityManager } from '../systems/EntityManager';
import { CombatSystem } from '../systems/CombatSystem';
import { FogOfWar } from '../systems/FogOfWar';
import { Entity, Hero, Zombie, Skeleton, Spider, Creeper } from '../entities';
import { Position, Faction, EntityType, AttackType } from '../types';
import { Movement } from '../systems/Movement';

export class Game {
  private grid: Grid;
  private playerTurn: boolean = true;
  private turnCount: number = 0;
  private dayPhase: boolean = true;
  private resourceManager: ResourceManager;
  private entityManager: EntityManager;
  private combatSystem: CombatSystem;
  private fogOfWar: FogOfWar;
  private movement: Movement;
  private selectedEntity: Entity | null = null;
  
  constructor(width: number, height: number) {
    this.grid = new Grid(width, height);
    this.entityManager = new EntityManager();
    this.resourceManager = new ResourceManager(this.grid);
    this.combatSystem = new CombatSystem();
    this.fogOfWar = new FogOfWar(width, height);
    this.movement = new Movement(this.grid);
    
    this.initialize();
  }
  
  private initialize(): void {
    // Generate the terrain
    this.grid.generateTerrain();
    
    // Place the player's starting units
    const startingPosition = this.grid.getStartingPosition();
    this.createPlayerHero(startingPosition);
    
    // Initialize fog of war
    this.updateFogOfWar();
    
    // Resources are initialized in the ResourceManager constructor
  }
  
  private createPlayerHero(position: Position): void {
    // Create a hero using our concrete Hero class
    const hero = new Hero(position);
    
    // Add the hero to the entity manager
    this.entityManager.addEntity(hero);
    this.selectedEntity = hero; // Select the hero by default
    
    console.log(`Hero created at position (${position.x}, ${position.y})`);
  }
  
  public nextTurn(): void {
    console.log(`[Game] Next turn called, current turn: ${this.turnCount}, playerTurn: ${this.playerTurn}`);
    
    if (this.playerTurn) {
      // End player turn, begin enemy turn
      console.log(`[Game] Ending player turn, starting enemy turn`);
      this.playerTurn = false;
      
      // Mark defeated entities as dead
      this.markDeadEntities();
      
      // Execute enemy actions
      this.executeEnemyTurn();
    } else {
      // End enemy turn, begin player turn
      console.log(`[Game] Ending enemy turn, starting player turn`);
      this.playerTurn = true;
      this.turnCount++;
      
      console.log(`[Game] New turn: ${this.turnCount}, day phase: ${this.dayPhase}`);
      
      // Remove dead entities that have been dead for 1 turn
      this.removeDeadEntities();
      
      // Check if day/night cycle should change
      if (this.turnCount % 10 === 0) {
        this.dayPhase = !this.dayPhase;
        console.log(`[Game] Day/night cycle changed to: ${this.dayPhase ? 'Day' : 'Night'}`);
        
        // If transitioning to night, spawn enemies
        if (!this.dayPhase) {
          this.spawnEnemies();
        }
      }
      
      // Reset action points for player entities
      console.log(`[Game] Resetting action points for player entities`);
      this.entityManager.resetActionPointsForFaction(Faction.PLAYER);
      
      // Update fog of war
      this.updateFogOfWar();
      
      // If an entity is selected, refresh its movement options
      if (this.selectedEntity) {
        console.log(`[Game] Refreshing movement for selected entity: ${this.selectedEntity.getName()}`);
        this.movement.setSelectedEntity(this.selectedEntity);
      }
    }
  }
  
  private executeEnemyTurn(): void {
    // Move and attack with all enemy entities
    const enemies = this.entityManager.getEntitiesByFaction(Faction.ENEMY);
    
    for (const enemy of enemies) {
      this.processEnemyAction(enemy);
    }
    
    // End enemy turn automatically
    this.nextTurn();
  }
  
  private processEnemyAction(enemy: Entity): void {
    // Skip if the enemy is dead or has no action points
    if (enemy.isDead || enemy.actionPoints <= 0) {
      return;
    }
    
    // Find the nearest player entity
    const nearestPlayer = this.entityManager.getNearestEntity(enemy.position, Faction.PLAYER);
    
    if (!nearestPlayer) {
      // No player entities found, do nothing
      return;
    }
    
    // Calculate distance to the nearest player
    const getDistance = () => {
      const dx = nearestPlayer.position.x - enemy.position.x;
      const dy = nearestPlayer.position.y - enemy.position.y;
      return {
        distance: Math.sqrt(dx * dx + dy * dy),
        dx,
        dy
      };
    };
    
    let { distance, dx, dy } = getDistance();
    
    // Safety check for action points
    let actionPointsUsed = 0;
    const maxIterations = 10; // Prevent infinite loops
    let iterations = 0;
    
    // Process based on enemy type
    try {
      switch (enemy.getType()) {
        case EntityType.CREEPER:
          this.processCreeperAction(enemy, nearestPlayer, distance, dx, dy);
          break;
        case EntityType.SKELETON:
          this.processSkeletonAction(enemy, nearestPlayer, distance, dx, dy);
          break;
        case EntityType.SPIDER:
          this.processSpiderAction(enemy, nearestPlayer, distance, dx, dy);
          break;
        case EntityType.ZOMBIE:
          this.processZombieAction(enemy, nearestPlayer, distance, dx, dy);
          break;
        default:
          this.processDefaultEnemyAction(enemy, nearestPlayer, distance, dx, dy);
      }
    } catch (error) {
      console.error(`Error processing enemy action for ${enemy.getName()}:`, error);
      // Ensure the enemy's turn ends even if there's an error
      enemy.actionPoints = 0;
    }
  }

  private processCreeperAction(enemy: Entity, target: Entity, distance: number, dx: number, dy: number): void {
    if (!enemy || !target) return;
    
    // Creepers are suicide bombers - they try to get close and explode
    if (distance <= enemy.specialAttackRange) {
      // Use special explosive attack
      const attackResult = this.combatSystem.resolveAttack(enemy, target, AttackType.SPECIAL, this.grid);
      if (attackResult?.hit) {
        console.log(`${enemy.getName()} explodes near ${target.getName()} for ${attackResult.damage} damage!`);
        // Creeper dies after exploding
        enemy.health = 0;
        enemy.markAsDead(this.turnCount);
      }
      enemy.actionPoints = 0;
      return;
    }

    let iterations = 0;
    const maxIterations = enemy.maxActionPoints * 2; // Allow for some failed moves
    
    while (enemy.actionPoints > 0 && iterations < maxIterations) {
      iterations++;
      const moved = this.moveTowardTarget(enemy, target, true);
      if (!moved) break;
      
      // Recalculate distance after movement
      const newDx = target.position.x - enemy.position.x;
      const newDy = target.position.y - enemy.position.y;
      distance = Math.sqrt(newDx * newDx + newDy * newDy);
      
      // Check if we can now explode
      if (distance <= enemy.specialAttackRange) {
        const attackResult = this.combatSystem.resolveAttack(enemy, target, AttackType.SPECIAL, this.grid);
        if (attackResult?.hit) {
          console.log(`${enemy.getName()} explodes near ${target.getName()} for ${attackResult.damage} damage!`);
          enemy.health = 0;
          enemy.markAsDead(this.turnCount);
        }
        enemy.actionPoints = 0;
        break;
      }
    }
  }

  private processSkeletonAction(enemy: Entity, target: Entity, distance: number, dx: number, dy: number): void {
    if (!enemy || !target) return;
    
    const optimalRange = enemy.rangedAttackRange - 1;
    let iterations = 0;
    const maxIterations = enemy.maxActionPoints * 2;

    while (enemy.actionPoints > 0 && iterations < maxIterations) {
      iterations++;
      
      // Recalculate distance
      const newDx = target.position.x - enemy.position.x;
      const newDy = target.position.y - enemy.position.y;
      distance = Math.sqrt(newDx * newDx + newDy * newDy);
      
      if (distance <= enemy.rangedAttackRange) {
        // If too close, try to move away while maintaining range
        if (distance < optimalRange) {
          const moveAwayPos = {
            x: enemy.position.x - Math.sign(newDx),
            y: enemy.position.y - Math.sign(newDy)
          };
          if (this.grid.isValidMove(enemy, moveAwayPos) && this.moveEntity(enemy, moveAwayPos)) {
            continue;
          }
        }
        
        // Attack if in range
        const attackResult = this.combatSystem.resolveAttack(enemy, target, AttackType.RANGED, this.grid);
        if (attackResult?.hit) {
          console.log(`${enemy.getName()} shoots ${target.getName()} for ${attackResult.damage} damage!`);
        }
        break; // End turn after attacking
      } else {
        // Move closer if too far
        if (!this.moveTowardTarget(enemy, target, false)) {
          break; // End turn if can't move
        }
      }
    }
  }

  private processSpiderAction(enemy: Entity, target: Entity, distance: number, dx: number, dy: number): void {
    if (!enemy || !target) return;
    
    let iterations = 0;
    const maxIterations = enemy.maxActionPoints * 2;
    
    // Spiders are fast and try to flank the player
    while (enemy.actionPoints > 0 && iterations < maxIterations) {
      iterations++;
      
      // Recalculate distance after any movement
      const newDx = target.position.x - enemy.position.x;
      const newDy = target.position.y - enemy.position.y;
      distance = Math.sqrt(newDx * newDx + newDy * newDy);
      
      if (distance <= 1) {
        // Try special poison attack first
        if (enemy.specialAttackPower > 0) {
          const attackResult = this.combatSystem.resolveAttack(enemy, target, AttackType.SPECIAL, this.grid);
          if (attackResult?.hit) {
            console.log(`${enemy.getName()} poisons ${target.getName()} for ${attackResult.damage} damage!`);
            enemy.actionPoints = 0;
            return;
          }
        }
        
        // Regular attack if special failed or unavailable
        const attackResult = this.combatSystem.resolveAttack(enemy, target, AttackType.MELEE, this.grid);
        if (attackResult?.hit) {
          console.log(`${enemy.getName()} bites ${target.getName()} for ${attackResult.damage} damage!`);
          enemy.actionPoints = Math.max(0, enemy.actionPoints - 1);
        }
        break; // End turn after attacking
      } else {
        // Try to move to flanking position
        const flankingPositions = [
          { x: target.position.x + 1, y: target.position.y + 1 },
          { x: target.position.x - 1, y: target.position.y + 1 },
          { x: target.position.x + 1, y: target.position.y - 1 },
          { x: target.position.x - 1, y: target.position.y - 1 }
        ].filter(pos => this.grid.isValidMove(enemy, pos)); // Pre-filter invalid positions
        
        let moved = false;
        for (const pos of flankingPositions) {
          if (this.moveEntity(enemy, pos)) {
            moved = true;
            break;
          }
        }
        
        // If can't move to flanking position, move directly toward target
        if (!moved && !this.moveTowardTarget(enemy, target, true)) {
          break; // End turn if couldn't move at all
        }
      }
    }
    
    // Ensure turn ends
    if (enemy.actionPoints > 0) {
      console.log(`[Game] Spider ${enemy.getName()} ending turn with ${enemy.actionPoints} AP remaining`);
      enemy.actionPoints = 0;
    }
  }

  private processZombieAction(enemy: Entity, target: Entity, distance: number, dx: number, dy: number): void {
    if (!enemy || !target) return;
    
    let iterations = 0;
    const maxIterations = enemy.maxActionPoints * 2;
    
    // Zombies are relentless - they keep moving toward the player and attack when in range
    while (enemy.actionPoints > 0 && iterations < maxIterations) {
      iterations++;
      
      // Recalculate distance after any movement
      const newDx = target.position.x - enemy.position.x;
      const newDy = target.position.y - enemy.position.y;
      distance = Math.sqrt(newDx * newDx + newDy * newDy);
      
      if (distance <= 1) {
        const attackResult = this.combatSystem.resolveAttack(enemy, target, AttackType.MELEE, this.grid);
        if (attackResult?.hit) {
          console.log(`${enemy.getName()} slams ${target.getName()} for ${attackResult.damage} damage!`);
          enemy.actionPoints = Math.max(0, enemy.actionPoints - 1);
        }
        break; // End turn after attacking
      } else {
        // Zombies will try to break through obstacles to reach the player
        const moved = this.moveTowardTarget(enemy, target, true);
        if (!moved) {
          // If can't move, end turn to prevent infinite loop
          break;
        }
      }
    }
    
    // Ensure turn ends
    if (enemy.actionPoints > 0) {
      console.log(`[Game] Zombie ${enemy.getName()} ending turn with ${enemy.actionPoints} AP remaining`);
      enemy.actionPoints = 0;
    }
  }

  private processDefaultEnemyAction(enemy: Entity, target: Entity, distance: number, dx: number, dy: number): void {
    if (!enemy || !target) return;
    
    let iterations = 0;
    const maxIterations = enemy.maxActionPoints * 2;
    
    while (enemy.actionPoints > 0 && iterations < maxIterations) {
      iterations++;
      
      // Recalculate distance after any movement
      const newDx = target.position.x - enemy.position.x;
      const newDy = target.position.y - enemy.position.y;
      distance = Math.sqrt(newDx * newDx + newDy * newDy);
      
      let attacked = false;
      
      // Try to attack if in range
      if (distance <= 1 && enemy.meleeAttackPower > 0) {
        const attackResult = this.combatSystem.resolveAttack(enemy, target, AttackType.MELEE, this.grid);
        attacked = attackResult?.success || false;
      } else if (distance <= enemy.rangedAttackRange && enemy.rangedAttackPower > 0) {
        const attackResult = this.combatSystem.resolveAttack(enemy, target, AttackType.RANGED, this.grid);
        attacked = attackResult?.success || false;
      } else if (distance <= enemy.specialAttackRange && enemy.specialAttackPower > 0) {
        const attackResult = this.combatSystem.resolveAttack(enemy, target, AttackType.SPECIAL, this.grid);
        attacked = attackResult?.success || false;
      }
      
      if (attacked) {
        enemy.actionPoints = Math.max(0, enemy.actionPoints - 1);
        break; // End turn after successful attack
      }
      
      // If couldn't attack, try to move closer
      if (!this.moveTowardTarget(enemy, target, false)) {
        break; // End turn if couldn't move
      }
    }
    
    // Ensure turn ends
    if (enemy.actionPoints > 0) {
      console.log(`[Game] Enemy ${enemy.getName()} ending turn with ${enemy.actionPoints} AP remaining`);
      enemy.actionPoints = 0;
    }
  }

  private moveTowardTarget(entity: Entity, target: Entity, aggressive: boolean): boolean {
    if (!entity || !target) return false;
    
    const dx = target.position.x - entity.position.x;
    const dy = target.position.y - entity.position.y;
    
    // Prevent moving if already at 0 action points
    if (entity.actionPoints <= 0) return false;
    
    // Calculate primary and alternative move directions
    const moveX = dx !== 0 ? Math.sign(dx) : 0;
    const moveY = dy !== 0 ? Math.sign(dy) : 0;
    
    // Try direct movement first
    const directMove = {
      x: entity.position.x + moveX,
      y: entity.position.y + moveY
    };
    
    // Validate move is within grid bounds
    if (this.grid.isValidMove(entity, directMove) && this.moveEntity(entity, directMove)) {
      return true;
    }
    
    // If direct movement fails and we're being aggressive, try alternative paths
    if (aggressive) {
      const alternativeMoves = [
        { x: entity.position.x + moveX, y: entity.position.y },
        { x: entity.position.x, y: entity.position.y + moveY },
        { x: entity.position.x + (moveX !== 0 ? 0 : 1), y: entity.position.y + (moveY !== 0 ? 0 : 1) },
        { x: entity.position.x + (moveX !== 0 ? 0 : -1), y: entity.position.y + (moveY !== 0 ? 0 : -1) }
      ].filter(move => this.grid.isValidMove(entity, move)); // Pre-filter invalid moves
      
      for (const move of alternativeMoves) {
        if (this.moveEntity(entity, move)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  private spawnEnemies(): void {
    // Get valid spawn points
    const spawnPoints = this.grid.getEnemySpawnPoints();
    
    // Safety check - if no spawn points available, don't try to spawn
    if (!spawnPoints || spawnPoints.length === 0) {
      console.warn('[Game] No valid spawn points available for enemies');
      return;
    }

    // Calculate number of enemies to spawn based on turn count (difficulty)
    // Cap maximum enemies to prevent overwhelming spawns
    const baseEnemies = Math.floor(this.turnCount / 10) + 2;
    const maxEnemies = Math.min(spawnPoints.length, baseEnemies, 5); // Never spawn more than 5 enemies at once
    
    console.log(`[Game] Attempting to spawn ${maxEnemies} enemies on turn ${this.turnCount}`);
    
    // Keep track of used spawn points to prevent multiple enemies at same location
    const usedSpawnPoints = new Set<string>();
    
    for (let i = 0; i < maxEnemies; i++) {
      // Try to find an unused spawn point
      let attempts = 0;
      const maxAttempts = spawnPoints.length * 2;
      let validSpawnFound = false;
      
      while (attempts < maxAttempts && !validSpawnFound) {
        const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        const spawnKey = `${spawnPoint.x},${spawnPoint.y}`;
        
        // Check if spawn point is already used or if there's an entity there
        if (!usedSpawnPoints.has(spawnKey) && !this.entityManager.getEntityAtPosition(spawnPoint)) {
          try {
            const enemy = this.createEnemy(spawnPoint);
            if (enemy) {
              usedSpawnPoints.add(spawnKey);
              validSpawnFound = true;
              console.log(`[Game] Successfully spawned ${enemy.getName()} at (${spawnPoint.x}, ${spawnPoint.y})`);
            }
          } catch (error) {
            console.error(`[Game] Error spawning enemy at (${spawnPoint.x}, ${spawnPoint.y}):`, error);
          }
        }
        attempts++;
      }
      
      if (!validSpawnFound) {
        console.warn(`[Game] Failed to find valid spawn point after ${maxAttempts} attempts`);
        break; // Stop trying to spawn more enemies if we can't find valid positions
      }
    }
  }
  
  private createEnemy(position: Position): Entity | null {
    try {
      // Create a temporary zombie to check position validity
      const tempEntity = new Zombie(position);
      // Validate position before creating enemy
      if (!this.grid.isValidMove(tempEntity, position)) {
        console.warn(`[Game] Invalid spawn position: (${position.x}, ${position.y})`);
        return null;
      }
      
      // Random enemy type based on a weighted distribution and turn count
      const roll = Math.random();
      let enemy: Entity;
      
      // Adjust enemy type distribution based on turn count
      // Later turns have higher chances for stronger enemies
      const difficultyFactor = Math.min(this.turnCount / 20, 1); // Caps at turn 20
      
      if (roll < 0.4 - difficultyFactor * 0.2) {
        // Reduced chance for basic Zombie in later turns
        enemy = new Zombie(position);
      } else if (roll < 0.7 - difficultyFactor * 0.1) {
        // Slightly reduced chance for Skeleton
        enemy = new Skeleton(position);
      } else if (roll < 0.9) {
        // Consistent chance for Spider
        enemy = new Spider(position);
      } else {
        // Increased chance for Creeper in later turns
        enemy = new Creeper(position);
      }
      
      // Initialize enemy with proper stats
      enemy.health = enemy.maxHealth;
      enemy.actionPoints = enemy.maxActionPoints;
      
      // Add the enemy to the entity manager
      this.entityManager.addEntity(enemy);
      
      console.log(`[Game] Created ${enemy.getName()} at position (${position.x}, ${position.y})`);
      return enemy;
      
    } catch (error) {
      console.error(`[Game] Error creating enemy:`, error);
      return null;
    }
  }
  
  private updateFogOfWar(): void {
    // Update visible tiles based on player entities
    const playerEntities = this.entityManager.getEntitiesByFaction(Faction.PLAYER);
    
    // On first update, reveal a larger initial area
    if (this.turnCount === 0) {
      console.log("Initial fog of war setup");
      const startingPosition = this.grid.getStartingPosition();
      this.fogOfWar.revealInitialArea(startingPosition);
    } else {
      // Regular update - reset and reveal based on entities
      console.log(`Updating fog of war on turn ${this.turnCount}`);
      this.fogOfWar.reset();
      
      for (const entity of playerEntities) {
        console.log(`Revealing area around ${entity.getName()} at (${entity.position.x},${entity.position.y}) with sight range ${entity.sightRange}`);
        this.fogOfWar.revealArea(entity.position, entity.sightRange);
      }
    }
  }
  
  public moveEntity(entity: Entity, position: Position): boolean {
    console.log(`[Game] Moving ${entity.getName()} from (${entity.position.x}, ${entity.position.y}) to (${position.x}, ${position.y})`);
    console.log(`[Game] Entity has ${entity.actionPoints} action points`);
    
    // Use the movement system instead of direct position update
    if (this.movement.isReachable(position)) {
      console.log(`[Game] Position is reachable via movement system`);
      return this.movement.moveEntityAlongPath(entity, position);
    }
    
    console.log(`[Game] Position not reachable via movement system, falling back to basic movement`);
    // Fall back to old movement if not using advanced movement
    // Check if move is valid
    if (!this.grid.isValidMove(entity, position)) {
      console.log(`[Game] Move is invalid according to grid`);
      return false;
    }
    
    // Update entity position
    entity.position = position;
    entity.actionPoints--;
    console.log(`[Game] Entity moved. Remaining AP: ${entity.actionPoints}`);
    
    // Update fog of war if player entity
    if (entity.faction === Faction.PLAYER) {
      this.updateFogOfWar();
    }
    
    return true;
  }
  
  public getSelectedEntity(): Entity | null {
    return this.selectedEntity;
  }
  
  public getPlayerFaction(): Faction {
    return Faction.PLAYER;
  }
  
  // Added getter for turnCount
  public getTurnCount(): number {
    return this.turnCount;
  }
  
  // Added getter for dayPhase
  public isDayPhase(): boolean {
    return this.dayPhase;
  }
  
  // Getters for various systems
  public getGrid(): Grid {
    return this.grid;
  }
  
  public getResourceManager(): ResourceManager {
    return this.resourceManager;
  }
  
  public getEntityManager(): EntityManager {
    return this.entityManager;
  }
  
  public getCombatSystem(): CombatSystem {
    return this.combatSystem;
  }
  
  public getFogOfWar(): FogOfWar {
    return this.fogOfWar;
  }
  
  public setSelectedEntity(entity: Entity | null): void {
    console.log(`[Game] Setting selected entity: ${entity ? entity.getName() : 'null'}`);
    this.selectedEntity = entity;
    this.movement.setSelectedEntity(entity);
  }
  
  private markDeadEntities(): void {
    // Get all entities that are defeated but not yet marked as dead
    const entities = this.entityManager.getAllEntities();
    
    for (const entity of entities) {
      if (entity.isDefeated && !entity.isDead) {
        entity.markAsDead(this.turnCount);
        console.log(`${entity.getName()} has been defeated!`);
      }
    }
  }
  
  private removeDeadEntities(): void {
    // Get all dead entities
    const entities = this.entityManager.getAllEntities();
    const toRemove: Entity[] = [];
    
    for (const entity of entities) {
      if (entity.isDead && entity.deathTurn < this.turnCount) {
        // This entity has been dead for at least 1 turn, remove it
        toRemove.push(entity);
      }
    }
    
    // Remove the entities
    for (const entity of toRemove) {
      this.entityManager.removeEntity(entity);
      console.log(`${entity.getName()} has been removed from the game.`);
    }
  }
  
  // Add getter for the movement system
  public getMovement(): Movement {
    return this.movement;
  }
} 