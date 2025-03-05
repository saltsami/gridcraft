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
    // Skip if the enemy has dead or has no action points
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
    const dx = nearestPlayer.position.x - enemy.position.x;
    const dy = nearestPlayer.position.y - enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Special handling for Creepers - they are more aggressive
    if (enemy.getType() === EntityType.CREEPER) {
      // Creepers will always try to get close to the player
      // If within special attack range, they'll use their explosive attack
      if (distance <= enemy.specialAttackRange) {
        // Use special attack
        const attackResult = this.combatSystem.resolveAttack(enemy, nearestPlayer, AttackType.SPECIAL, this.grid);
        
        if (attackResult.hit) {
          console.log(`${enemy.getName()} explodes near ${nearestPlayer.getName()} for ${attackResult.damage} damage!`);
        } else {
          console.log(`${enemy.getName()} tried to explode but somehow missed.`);
        }
        
        // Creeper uses all action points for special attack
        enemy.actionPoints = 0;
        return;
      } 
      // If within melee range, use melee attack
      else if (distance <= 1) {
        const attackResult = this.combatSystem.resolveAttack(enemy, nearestPlayer, AttackType.MELEE, this.grid);
        
        if (attackResult.hit) {
          console.log(`${enemy.getName()} attacks ${nearestPlayer.getName()} for ${attackResult.damage} damage!`);
        } else {
          console.log(`${enemy.getName()} missed ${nearestPlayer.getName()}`);
        }
        
        // Use an action point
        enemy.actionPoints--;
      }
      
      // Creepers will use all remaining action points to move toward the player
      while (enemy.actionPoints > 0) {
        // Calculate move direction toward player
        const moveX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
        const moveY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
        
        const newPosition = {
          x: enemy.position.x + moveX,
          y: enemy.position.y + moveY
        };
        
        // Try to move to the new position
        const moved = this.moveEntity(enemy, newPosition);
        if (moved) {
          console.log(`${enemy.getName()} aggressively moved toward ${nearestPlayer.getName()}`);
          enemy.actionPoints--;
        } else {
          // If we can't move directly toward the player, try alternative paths
          const alternativeMoves = [
            { x: enemy.position.x + moveX, y: enemy.position.y },
            { x: enemy.position.x, y: enemy.position.y + moveY },
            { x: enemy.position.x + (moveX !== 0 ? 0 : 1), y: enemy.position.y + (moveY !== 0 ? 0 : 1) },
            { x: enemy.position.x + (moveX !== 0 ? 0 : -1), y: enemy.position.y + (moveY !== 0 ? 0 : -1) }
          ];
          
          let foundAlternative = false;
          for (const altMove of alternativeMoves) {
            if (this.moveEntity(enemy, altMove)) {
              console.log(`${enemy.getName()} found path around obstacle toward ${nearestPlayer.getName()}`);
              enemy.actionPoints--;
              foundAlternative = true;
              break;
            }
          }
          
          if (!foundAlternative) {
            // If we can't move at all, just end turn
            enemy.actionPoints = 0;
          }
        }
      }
      return; // End processing for Creeper
    }
    
    // Regular enemy AI for other enemy types
    // Check if we can attack
    let canAttack = false;
    
    // If we have a melee attack and are adjacent to the player
    if (enemy.meleeAttackPower > 0 && distance <= 1) {
      canAttack = true;
      // Attack the player
      const attackResult = this.combatSystem.resolveAttack(enemy, nearestPlayer, AttackType.MELEE, this.grid);
      
      if (attackResult.hit) {
        console.log(`${enemy.getName()} attacks ${nearestPlayer.getName()} for ${attackResult.damage} damage!`);
      } else {
        console.log(`${enemy.getName()} missed ${nearestPlayer.getName()}`);
      }
      
      // Use an action point
      enemy.actionPoints--;
    } 
    // If we have a ranged attack and are within range
    else if (enemy.rangedAttackPower > 0 && distance <= enemy.rangedAttackRange) {
      canAttack = true;
      // Attack the player
      const attackResult = this.combatSystem.resolveAttack(enemy, nearestPlayer, AttackType.RANGED, this.grid);
      
      if (attackResult.hit) {
        console.log(`${enemy.getName()} shoots ${nearestPlayer.getName()} for ${attackResult.damage} damage!`);
      } else {
        console.log(`${enemy.getName()} shot at ${nearestPlayer.getName()} but missed`);
      }
      
      // Use an action point
      enemy.actionPoints--;
    }
    // If we have a special attack and are within range
    else if (enemy.specialAttackPower > 0 && distance <= enemy.specialAttackRange) {
      canAttack = true;
      // Use special attack
      const attackResult = this.combatSystem.resolveAttack(enemy, nearestPlayer, AttackType.SPECIAL, this.grid);
      
      if (attackResult.hit) {
        console.log(`${enemy.getName()} uses special attack on ${nearestPlayer.getName()} for ${attackResult.damage} damage!`);
      } else {
        console.log(`${enemy.getName()}'s special attack missed ${nearestPlayer.getName()}`);
      }
      
      // Use all action points
      enemy.actionPoints = 0;
    }
    
    // If we can't attack, try to move toward the player
    if (!canAttack && enemy.actionPoints > 0) {
      // Simple movement: move one step toward the player
      const moveX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
      const moveY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
      
      const newPosition = {
        x: enemy.position.x + moveX,
        y: enemy.position.y + moveY
      };
      
      // Try to move to the new position
      const moved = this.moveEntity(enemy, newPosition);
      if (moved) {
        console.log(`${enemy.getName()} moved toward ${nearestPlayer.getName()}`);
        enemy.actionPoints--;
      }
    }
  }
  
  private spawnEnemies(): void {
    // Spawn enemies at spawn points based on turn count (difficulty)
    const spawnPoints = this.grid.getEnemySpawnPoints();
    const enemyCount = Math.min(spawnPoints.length, Math.floor(this.turnCount / 10) + 2);
    
    for (let i = 0; i < enemyCount; i++) {
      const spawnPoint = spawnPoints[i % spawnPoints.length];
      this.createEnemy(spawnPoint);
    }
  }
  
  private createEnemy(position: Position): void {
    // Random enemy type based on a weighted distribution
    const roll = Math.random();
    let enemy: Entity;
    
    if (roll < 0.4) {
      // 40% chance for Zombie
      enemy = new Zombie(position);
    } else if (roll < 0.7) {
      // 30% chance for Skeleton
      enemy = new Skeleton(position);
    } else if (roll < 0.9) {
      // 20% chance for Spider
      enemy = new Spider(position);
    } else {
      // 10% chance for Creeper
      enemy = new Creeper(position);
    }
    
    // Add the enemy to the entity manager
    this.entityManager.addEntity(enemy);
    console.log(`${enemy.getName()} spawned at position (${position.x}, ${position.y})`);
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