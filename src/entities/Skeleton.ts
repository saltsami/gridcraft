// entities/Skeleton.ts - Skeleton enemy entity
import { Entity } from './Entity';
import { Position } from '../types/Position';
import { Faction } from '../types/Faction';
import { EntityType } from '../types/EntityType';

export class Skeleton extends Entity {
    constructor(position: Position) {
        super(position, Faction.ENEMY);
        
        // Set skeleton-specific properties
        this.maxHealth = 80;
        this.health = 80;
        this.maxActionPoints = 2;
        this.actionPoints = 2;
        this.sightRange = 8;
        
        // Combat stats
        this.accuracy = 12;
        this.evasion = 6;
        this.armor = 1;
        this.meleeAttackPower = 6;
        this.rangedAttackPower = 10;
        this.rangedAttackRange = 4;
    }
    
    public getType(): EntityType {
        return EntityType.SKELETON;
    }
    
    public getName(): string {
        return "Skeleton";
    }
} 