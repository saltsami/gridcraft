import { Entity } from './Entity';
import { Position } from '../types/Position';
import { Faction } from '../types/Faction';
import { EntityType } from '../types/EntityType';

export enum EnemyType {
    ZOMBIE = 'ZOMBIE',
    SKELETON = 'SKELETON',
    SPIDER = 'SPIDER',
    CREEPER = 'CREEPER'
}

export class Enemy extends Entity {
    type: EnemyType;

    constructor(position: Position, type: EnemyType) {
        super(position, Faction.ENEMY);
        this.type = type;
        this.initializeStats();
    }

    getType(): EntityType {
        switch (this.type) {
            case EnemyType.ZOMBIE:
                return EntityType.ZOMBIE;
            case EnemyType.SKELETON:
                return EntityType.SKELETON;
            case EnemyType.SPIDER:
                return EntityType.SPIDER;
            case EnemyType.CREEPER:
                return EntityType.CREEPER;
            default:
                throw new Error(`Unknown enemy type: ${this.type}`);
        }
    }

    getName(): string {
        return this.type.toLowerCase();
    }

    protected initializeStats() {
        switch (this.type) {
            case EnemyType.ZOMBIE:
                this.maxHealth = 40;
                this.health = 40;
                this.accuracy = 8;
                this.evasion = 5;
                this.armor = 2;
                this.meleeAttackPower = 12;
                this.rangedAttackPower = 0;
                this.rangedAttackRange = 0;
                break;
            case EnemyType.SKELETON:
                this.maxHealth = 30;
                this.health = 30;
                this.accuracy = 12;
                this.evasion = 8;
                this.armor = 1;
                this.meleeAttackPower = 8;
                this.rangedAttackPower = 10;
                this.rangedAttackRange = 4;
                break;
            case EnemyType.SPIDER:
                this.maxHealth = 25;
                this.health = 25;
                this.accuracy = 10;
                this.evasion = 12;
                this.armor = 1;
                this.meleeAttackPower = 10;
                this.rangedAttackPower = 0;
                this.rangedAttackRange = 0;
                break;
            case EnemyType.CREEPER:
                this.maxHealth = 20;
                this.health = 20;
                this.accuracy = 10;
                this.evasion = 6;
                this.armor = 0;
                this.meleeAttackPower = 25; // High damage but dies after attacking
                this.rangedAttackPower = 0;
                this.rangedAttackRange = 0;
                break;
        }
        this.maxActionPoints = 2;
        this.actionPoints = 2;
        this.sightRange = 8;
    }
} 