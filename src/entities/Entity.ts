// entities/Entity.ts - Base class for all game entities
import { Position } from '../types/Position';
import { Faction } from '../types/Faction';
import { EntityType } from '../types/EntityType';

export abstract class Entity {
    public position: Position;
    public faction: Faction;
    public health: number;
    public maxHealth: number;
    public actionPoints: number;
    public maxActionPoints: number;
    public isDefeated: boolean = false;
    public isDead: boolean = false;
    public deathTurn: number = -1;
    public sightRange: number = 5;
    
    // Combat stats
    public accuracy: number = 0;
    public evasion: number = 0;
    public armor: number = 0;
    public meleeAttackPower: number = 0;
    public rangedAttackPower: number = 0;
    public rangedAttackRange: number = 0;
    public specialAttackPower: number = 0;
    public specialAttackRange: number = 0;
    public specialAttackAccuracy: number = 0;
    
    // Resource gathering
    public canGatherResources: boolean = false;
    
    constructor(position: Position, faction: Faction) {
      this.position = position;
      this.faction = faction;
      this.health = 100;
      this.maxHealth = 100;
      this.actionPoints = 2;
      this.maxActionPoints = 2;
    }
    
    public abstract getType(): EntityType;
    
    public resetActionPoints(): void {
      console.log(`[Entity] Resetting action points for ${this.getName()} from ${this.actionPoints} to ${this.maxActionPoints}`);
      this.actionPoints = this.maxActionPoints;
    }
    
    public abstract getName(): string;
    
    public takeDamage(amount: number): void {
      this.health = Math.max(0, this.health - amount);
      if (this.health === 0) {
        this.isDefeated = true;
      }
    }
    
    public markAsDead(turnNumber: number): void {
      if (this.health <= 0) {
        this.isDead = true;
        this.deathTurn = turnNumber;
      }
    }
}