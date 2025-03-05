// entities/Zombie.ts - Zombie enemy entity
import { Entity } from './Entity';
import { Position } from '../types/Position';
import { Faction } from '../types/Faction';
import { EntityType } from '../types/EntityType';

export class Zombie extends Entity {
    constructor(position: Position) {
        super(position, Faction.ENEMY);
        
        // Set zombie-specific properties
        this.maxHealth = 120;
        this.health = 120;
        this.maxActionPoints = 2;
        this.actionPoints = 2;
        this.sightRange = 6;
        
        // Combat stats
        this.accuracy = 8;
        this.evasion = 3;
        this.armor = 3;
        this.meleeAttackPower = 12;
        this.rangedAttackPower = 0;
        this.rangedAttackRange = 0;
    }
    
    public getType(): EntityType {
        return EntityType.ZOMBIE;
    }
    
    public getName(): string {
        return "Zombie";
    }
} 