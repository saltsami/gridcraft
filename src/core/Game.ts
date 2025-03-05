// core/Game.ts - Main game controller
import { Grid } from './Grid';
import { ResourceManager, EntityManager, CombatSystem, FogOfWar } from '../systems';
import { Entity } from '../entities';
import { Hero } from '../entities/Hero';
import { Position, Faction, EntityType } from '../types';

export class Game {
  private grid: Grid;
  private playerTurn: boolean = true;
  private turnCount: number = 0;
  private dayPhase: boolean = true;
  private resourceManager: ResourceManager;
  private entityManager: EntityManager;
  private combatSystem: CombatSystem;
  private fogOfWar: FogOfWar;
  private selectedEntity: Entity | null = null;
  
  constructor(width: number, height: number) {
    this.grid = new Grid(width, height);
    this.resourceManager = new ResourceManager(this.grid);
    this.entityManager = new EntityManager();
    this.combatSystem = new CombatSystem();
    this.fogOfWar = new FogOfWar(width, height);
    
    // Initialize the game
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
    if (this.playerTurn) {
      // End player turn, begin enemy turn
      this.playerTurn = false;
      this.executeEnemyTurn();
    } else {
      // End enemy turn, begin player turn
      this.playerTurn = true;
      this.turnCount++;
      
      // Check if day/night cycle should change
      if (this.turnCount % 10 === 0) {
        this.dayPhase = !this.dayPhase;
        
        // If transitioning to night, spawn enemies
        if (!this.dayPhase) {
          this.spawnEnemies();
        }
      }
      
      // Reset action points for player entities
      this.entityManager.resetActionPointsForFaction(Faction.PLAYER);
      
      // Update fog of war
      this.updateFogOfWar();
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
    // Simple AI for enemies - move toward closest player entity and attack if possible
    // Implementation would depend on AI system
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
    // Create an enemy entity and add to entity manager
    // Implementation would depend on enemy types
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
    // Check if move is valid
    if (!this.grid.isValidMove(entity, position)) {
      return false;
    }
    
    // Update entity position
    entity.position = position;
    entity.actionPoints--;
    
    // Update fog of war if player entity
    if (entity.faction === Faction.PLAYER) {
      this.updateFogOfWar();
    }
    
    return true;
  }
  
  public getSelectedEntity(): Entity | null {
    // Implementation would depend on selection system
    return null;
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
} 