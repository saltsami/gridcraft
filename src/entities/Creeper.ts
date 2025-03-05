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
        this.maxActionPoints = 3;
        this.actionPoints = 3;
        this.sightRange = 8;
        
        // Combat stats
        this.accuracy = 8;
        this.evasion = 4;
        this.armor = 0;
        this.meleeAttackPower = 15;
        this.rangedAttackPower = 0;
        
        // Creeper has an explosive special attack
        this.specialAttackPower = 25;
        this.specialAttackRange = 2;
        this.specialAttackAccuracy = 100;
    }
    
    public getType(): EntityType {
        return EntityType.CREEPER;
    }
    
    public getName(): string {
        return "Creeper";
    }
} 