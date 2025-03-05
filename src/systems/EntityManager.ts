// systems/EntityManager.ts - Handles entity creation and management
import { Entity } from '../entities/Entity';
import { Position } from '../types/Position';
import { Faction } from '../types/Faction';
import { EntityType } from '../types/EntityType';

export class EntityManager {
  private entities: Entity[] = [];
  private nextEntityId: number = 1;
  
  public addEntity(entity: Entity): void {
    this.entities.push(entity);
  }
  
  public removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }
  
  public getEntitiesAtPosition(position: Position): Entity[] {
    return this.entities.filter(entity => 
      entity.position.x === position.x && entity.position.y === position.y
    );
  }
  
  public getEntityAtPosition(position: Position): Entity | null {
    const entitiesAtPosition = this.getEntitiesAtPosition(position);
    return entitiesAtPosition.length > 0 ? entitiesAtPosition[0] : null;
  }
  
  public getEntitiesByFaction(faction: Faction): Entity[] {
    return this.entities.filter(entity => entity.faction === faction);
  }
  
  public getEntitiesByType(type: EntityType): Entity[] {
    return this.entities.filter(entity => entity.getType() === type);
  }
  
  public resetActionPointsForFaction(faction: Faction): void {
    console.log(`[EntityManager] Resetting action points for faction: ${faction}`);
    const entities = this.entities.filter(entity => entity.faction === faction);
    console.log(`[EntityManager] Found ${entities.length} entities to reset`);
    
    entities.forEach(entity => {
      console.log(`[EntityManager] Resetting action points for ${entity.getName()}`);
      entity.resetActionPoints();
    });
  }
  
  public getNearestEntity(position: Position, faction: Faction): Entity | null {
    const factionEntities = this.getEntitiesByFaction(faction);
    
    if (factionEntities.length === 0) {
      return null;
    }
    
    let nearestEntity = factionEntities[0];
    let shortestDistance = this.calculateDistance(position, nearestEntity.position);
    
    for (let i = 1; i < factionEntities.length; i++) {
      const entity = factionEntities[i];
      const distance = this.calculateDistance(position, entity.position);
      
      if (distance < shortestDistance) {
        nearestEntity = entity;
        shortestDistance = distance;
      }
    }
    
    return nearestEntity;
  }
  
  public getEntitiesInRange(position: Position, range: number): Entity[] {
    return this.entities.filter(entity => {
      const distance = this.calculateDistance(position, entity.position);
      return distance <= range;
    });
  }
  
  private calculateDistance(a: Position, b: Position): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }
  
  public generateEntityId(): number {
    return this.nextEntityId++;
  }
  
  public getAllEntities(): Entity[] {
    return [...this.entities];
  }
} 