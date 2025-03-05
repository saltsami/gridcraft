// entities/Spider.ts - Spider enemy entity
import { Entity } from './Entity';
import { Position } from '../types/Position';
import { Faction } from '../types/Faction';
import { EntityType } from '../types/EntityType';

export class Spider extends Entity {
    constructor(position: Position) {
        super(position, Faction.ENEMY);
        
        // Set spider-specific properties
        this.maxHealth = 60;
        this.health = 60;
        this.maxActionPoints = 3; // Faster movement
        this.actionPoints = 3;
        this.sightRange = 7;
        
        // Combat stats
        this.accuracy = 10;
        this.evasion = 10; // Hard to hit
        this.armor = 1;
        this.meleeAttackPower = 8;
        this.rangedAttackPower = 0;
        this.rangedAttackRange = 0;
        // Spider could have a poison ability as special attack
        this.specialAttackPower = 5;
        this.specialAttackRange = 1;
        this.specialAttackAccuracy = 15;
    }
    
    public getType(): EntityType {
        return EntityType.SPIDER;
    }
    
    public getName(): string {
        return "Spider";
    }
} 