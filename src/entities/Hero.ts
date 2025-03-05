// entities/Hero.ts - Player hero entity
import { Entity } from './Entity';
import { Position } from '../types/Position';
import { Faction } from '../types/Faction';
import { EntityType } from '../types/EntityType';

export class Hero extends Entity {
    constructor(position: Position) {
        super(position, Faction.PLAYER);
        
        // Set hero-specific properties
        this.maxHealth = 120;
        this.health = 120;
        this.maxActionPoints = 3;
        this.actionPoints = 3;
        this.sightRange = 10;
        
        // Combat stats
        this.accuracy = 15;
        this.evasion = 10;
        this.armor = 3;
        this.meleeAttackPower = 15;
        this.rangedAttackPower = 12;
        this.rangedAttackRange = 4;
        
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