// entities/Hero.ts - Player hero entity
import { Entity } from './Entity';
import { Position } from '../types/Position';
import { Faction } from '../types/Faction';
import { EntityType } from '../types/EntityType';

export class Hero extends Entity {
    constructor(position: Position) {
        super(position, Faction.PLAYER);
        
        // Set hero-specific properties
        this.maxHealth = 100;
        this.health = 100;
        this.maxActionPoints = 3;
        this.actionPoints = 3;
        this.sightRange = 10;
        
        // Combat stats
        this.accuracy = 10;
        this.evasion = 5;
        this.armor = 2;
        this.meleeAttackPower = 10;
        this.rangedAttackPower = 8;
        this.rangedAttackRange = 3;
        
        // Hero can gather resources
        this.canGatherResources = true;
    }
    
    public getType(): EntityType {
        return EntityType.HERO;
    }
    
    public getName(): string {
        return "Player Hero";
    }
    
    // Hero-specific methods can be added here
    public gatherResource(position: Position): boolean {
        // This would be implemented to gather resources
        if (this.actionPoints > 0) {
            this.actionPoints--;
            return true;
        }
        return false;
    }
} 