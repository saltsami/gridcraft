// systems/CombatCalculator.ts - Handles combat probability calculations
import { Entity } from '../entities/Entity';
import { AttackType } from '../types/AttackType';
import { Grid } from '../core/Grid';
import { CombatSystem } from './CombatSystem';

export interface CombatOdds {
    hitChance: number;       // Overall chance to hit (0-100)
    criticalChance: number;  // Chance for a critical hit (0-100)
    grazeChance: number;     // Chance for a graze (weaker hit) (0-100)
    missChance: number;      // Chance to miss (0-100)
    
    minDamage: number;       // Minimum possible damage
    maxDamage: number;       // Maximum possible damage
    avgDamage: number;       // Average expected damage
    
    killChance: number;      // Chance the attack will defeat the target (0-100)
    
    // Detailed breakdown of modifiers that affected the calculation
    modifiers: {
        baseChance: number;
        accuracyMod: number;
        evasionMod: number;
        distanceMod: number;
        coverMod: number;
        otherMods: Record<string, number>;
    };
}

export class CombatCalculator {
    private combatSystem: CombatSystem;
    private grid: Grid;
    
    constructor(combatSystem: CombatSystem, grid: Grid) {
        this.combatSystem = combatSystem;
        this.grid = grid;
    }
    
    public calculateCombatOdds(
        attacker: Entity,
        target: Entity,
        attackType: AttackType
    ): CombatOdds | null {
        // Check if attack is even possible (range, etc.)
        const distance = this.combatSystem.calculateDistance(attacker.position, target.position);
        
        // Check if in range based on attack type
        if (!this.isInRange(attackType, attacker, distance)) {
            return null; // Out of range
        }
        
        // Get base hit chance from combat system
        const hitChance = this.combatSystem.calculateHitChance(attacker, target, attackType, distance);
        
        // Calculate damage range
        const damageRange = this.combatSystem.calculatePotentialDamage(attacker, target, attackType);
        
        // Add critical hit mechanics (not in original system - we'll enhance it)
        const criticalChance = this.calculateCriticalChance(attacker, target, attackType);
        
        // Add graze mechanics (hits that do less damage, like in XCOM)
        const grazeChance = this.calculateGrazeChance(attacker, target, attackType, hitChance);
        
        // The "true" hit chance is now the regular hit chance minus the critical and graze portions
        const regularHitChance = Math.max(0, hitChance - criticalChance - grazeChance);
        const missChance = 100 - hitChance;
        
        // Calculate damage possibilities
        const criticalDamageMultiplier = 1.5;
        const grazeDamageMultiplier = 0.5;
        
        const criticalMinDamage = Math.round(damageRange.min * criticalDamageMultiplier);
        const criticalMaxDamage = Math.round(damageRange.max * criticalDamageMultiplier);
        
        const grazeMinDamage = Math.round(damageRange.min * grazeDamageMultiplier);
        const grazeMaxDamage = Math.round(damageRange.max * grazeDamageMultiplier);
        
        // Overall min/max damage considering all possibilities
        const minDamage = grazeMinDamage;
        const maxDamage = criticalMaxDamage;
        
        // Calculate average expected damage
        const avgCritDamage = (criticalMinDamage + criticalMaxDamage) / 2;
        const avgRegularDamage = (damageRange.min + damageRange.max) / 2;
        const avgGrazeDamage = (grazeMinDamage + grazeMaxDamage) / 2;
        
        const avgDamage = (
            (criticalChance * avgCritDamage) + 
            (regularHitChance * avgRegularDamage) + 
            (grazeChance * avgGrazeDamage)
        ) / 100;
        
        // Calculate kill chance
        const killChance = this.calculateKillChance(
            target,
            criticalChance, criticalMinDamage, criticalMaxDamage,
            regularHitChance, damageRange.min, damageRange.max,
            grazeChance, grazeMinDamage, grazeMaxDamage
        );
        
        // Compile modifier breakdown
        const modifiers = this.getHitChanceModifiers(attacker, target, attackType, distance);
        
        return {
            hitChance: hitChance,
            criticalChance: criticalChance,
            grazeChance: grazeChance,
            missChance: missChance,
            
            minDamage: minDamage,
            maxDamage: maxDamage,
            avgDamage: avgDamage,
            
            killChance: killChance,
            
            modifiers: modifiers
        };
    }
    
    private isInRange(attackType: AttackType, attacker: Entity, distance: number): boolean {
        switch (attackType) {
            case AttackType.MELEE:
                return distance <= 1.5; // Allow diagonal
            case AttackType.RANGED:
                return distance <= attacker.rangedAttackRange;
            case AttackType.SPECIAL:
                return distance <= attacker.specialAttackRange;
            default:
                return false;
        }
    }
    
    private calculateCriticalChance(attacker: Entity, target: Entity, attackType: AttackType): number {
        // Simple implementation - in a full game this would be more complex
        const baseCritChance = 10; // 10% base chance
        const accuracyFactor = attacker.accuracy / 5; // High accuracy increases crit chance
        
        return Math.min(30, Math.max(0, baseCritChance + accuracyFactor));
    }
    
    private calculateGrazeChance(
        attacker: Entity,
        target: Entity,
        attackType: AttackType,
        hitChance: number
    ): number {
        // Graze happens at the edges of hit probability
        // Higher evasion increases graze chance
        const baseGrazeChance = 15;
        const evasionFactor = target.evasion / 3;
        
        // Makes it more likely to graze if hit chance is low
        const hitFactor = Math.max(0, (70 - hitChance) / 3);
        
        return Math.min(40, Math.max(0, baseGrazeChance + evasionFactor + hitFactor));
    }
    
    private calculateKillChance(
        target: Entity,
        critChance: number, critMinDmg: number, critMaxDmg: number,
        hitChance: number, hitMinDmg: number, hitMaxDmg: number,
        grazeChance: number, grazeMinDmg: number, grazeMaxDmg: number
    ): number {
        // If target health is less than minimal damage, it's guaranteed kill on any hit
        if (target.health <= grazeMinDmg) {
            return critChance + hitChance + grazeChance;
        }
        
        let totalKillChance = 0;
        
        // Calculate kill chance from critical hits
        if (critMinDmg >= target.health) {
            totalKillChance += critChance;
        } else if (critMaxDmg > target.health) {
            // Partial chance based on the damage distribution
            const killRatio = (critMaxDmg - target.health) / (critMaxDmg - critMinDmg);
            totalKillChance += critChance * killRatio;
        }
        
        // Calculate kill chance from regular hits
        if (hitMinDmg >= target.health) {
            totalKillChance += hitChance;
        } else if (hitMaxDmg > target.health) {
            // Partial chance based on the damage distribution
            const killRatio = (hitMaxDmg - target.health) / (hitMaxDmg - hitMinDmg);
            totalKillChance += hitChance * killRatio;
        }
        
        // Calculate kill chance from grazing hits
        if (grazeMinDmg >= target.health) {
            totalKillChance += grazeChance;
        } else if (grazeMaxDmg > target.health) {
            // Partial chance based on the damage distribution
            const killRatio = (grazeMaxDmg - target.health) / (grazeMaxDmg - grazeMinDmg);
            totalKillChance += grazeChance * killRatio;
        }
        
        return Math.min(100, totalKillChance);
    }
    
    private getHitChanceModifiers(
        attacker: Entity,
        target: Entity,
        attackType: AttackType,
        distance: number
    ): {
        baseChance: number;
        accuracyMod: number;
        evasionMod: number;
        distanceMod: number;
        coverMod: number;
        otherMods: Record<string, number>;
    } {
        // Determine base hit chance by attack type
        let baseChance = 0;
        let distanceMod = 0;
        
        switch (attackType) {
            case AttackType.MELEE:
                baseChance = 85;
                break;
            case AttackType.RANGED:
                baseChance = 75;
                distanceMod = -(distance * 5);
                break;
            case AttackType.SPECIAL:
                baseChance = 70;
                break;
        }
        
        const accuracyMod = attacker.accuracy;
        const evasionMod = -target.evasion;
        
        // We don't have cover in the current implementation,
        // but adding it as a placeholder for future enhancement
        const coverMod = 0;
        
        return {
            baseChance,
            accuracyMod,
            evasionMod,
            distanceMod,
            coverMod,
            otherMods: {}
        };
    }
} 