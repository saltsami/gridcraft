// entities/Creeper.ts - Creeper enemy entity
import { Entity } from './Entity';
import { Position } from '../types/Position';
import { Faction } from '../types/Faction';
import { EntityType } from '../types/EntityType';

export class Creeper extends Entity {
    constructor(position: Position) {
        super(position, Faction.ENEMY);
        
        // Set creeper-specific properties
        this.maxHealth = 40;
        this.health = 40;
        this.maxActionPoints = 2;
        this.actionPoints = 2;
        this.sightRange = 6;
        
        // Combat stats
        this.accuracy = 8;
        this.evasion = 4;
        this.armor = 0;
        this.meleeAttackPower = 0; // No melee attack
        this.rangedAttackPower = 0; // No ranged attack
        
        // Creeper has an explosive special attack
        this.specialAttackPower = 25; // High damage
        this.specialAttackRange = 2; // Area of effect
        this.specialAttackAccuracy = 100; // Always hits
    }
    
    public getType(): EntityType {
        return EntityType.CREEPER;
    }
    
    public getName(): string {
        return "Creeper";
    }
} 