// systems/CombatSystem.ts - Handles attacks and hit probabilities
import { Entity } from '../entities/Entity';
import { Position } from '../types/Position';
import { AttackType } from '../types/AttackType';
import { Grid } from '../core/Grid';
import { Tile } from '../core/Tile';

export interface AttackResult {
  success: boolean;
  hit?: boolean;
  damage?: number;
  hitChance?: number;
  message: string;
  targetDefeated?: boolean;
}

export class CombatSystem {
  public resolveAttack(attacker: Entity, target: Entity, attackType: AttackType, grid: Grid): AttackResult {
    // Check if attack is possible
    if (attacker.actionPoints <= 0) {
      return { success: false, message: "Not enough action points" };
    }
    
    // Check range
    const distance = this.calculateDistance(attacker.position, target.position);
    
    if (!this.isInRange(attackType, attacker, distance)) {
      return { success: false, message: "Target out of range" };
    }
    
    // Check line of sight for ranged attacks
    if (attackType === AttackType.RANGED) {
      const lineOfSight = grid.getLineOfSight(attacker.position, target.position);
      
      if (this.isLineOfSightBlocked(lineOfSight)) {
        return { success: false, message: "Line of sight blocked" };
      }
    }
    
    // Calculate hit probability
    const hitChance = this.calculateHitChance(attacker, target, attackType, distance);
    
    // Roll for hit
    const rolled = Math.random() * 100;
    const hit = rolled <= hitChance;
    
    // Calculate damage if hit
    let damage = 0;
    if (hit) {
      damage = this.calculateDamage(attacker, target, attackType);
      
      // Use the takeDamage method instead of directly modifying health
      target.takeDamage(damage);
    }
    
    // Deduct action points
    attacker.actionPoints--;
    
    return {
      success: true,
      hit: hit,
      damage: damage,
      hitChance: hitChance,
      message: hit ? `Hit for ${damage} damage` : "Missed",
      targetDefeated: target.isDefeated
    };
  }
  
  public calculateDistance(a: Position, b: Position): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
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
  
  private isLineOfSightBlocked(lineOfSight: Tile[]): boolean {
    // Check if any tile blocks vision
    return lineOfSight.some(tile => !tile.isTransparent);
  }
  
  public calculateHitChance(attacker: Entity, target: Entity, attackType: AttackType, distance: number): number {
    let baseChance = 0;
    
    switch (attackType) {
      case AttackType.MELEE:
        baseChance = 85; // High base chance for melee
        break;
      case AttackType.RANGED:
        baseChance = 75 - (distance * 5); // Decreases with distance
        break;
      case AttackType.SPECIAL:
        baseChance = attacker.specialAttackAccuracy;
        break;
    }
    
    // Apply modifiers
    baseChance += attacker.accuracy;
    baseChance -= target.evasion;
    
    // Environmental modifiers (cover, elevation, etc.)
    // Would be implemented here
    
    // Clamp value
    return Math.max(5, Math.min(95, baseChance));
  }
  
  public calculateDamage(attacker: Entity, target: Entity, attackType: AttackType): number {
    let baseDamage = 0;
    
    switch (attackType) {
      case AttackType.MELEE:
        baseDamage = attacker.meleeAttackPower;
        break;
      case AttackType.RANGED:
        baseDamage = attacker.rangedAttackPower;
        break;
      case AttackType.SPECIAL:
        baseDamage = attacker.specialAttackPower;
        break;
    }
    
    // Apply damage modifiers
    const damageReduction = Math.min(75, target.armor);
    const damageMultiplier = (100 - damageReduction) / 100;
    
    // Add slight randomization
    const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
    
    return Math.max(1, Math.floor(baseDamage * damageMultiplier * randomFactor));
  }
  
  public calculatePotentialDamage(attacker: Entity, target: Entity, attackType: AttackType): { min: number, max: number } {
    let baseDamage = 0;
    
    switch (attackType) {
      case AttackType.MELEE:
        baseDamage = attacker.meleeAttackPower;
        break;
      case AttackType.RANGED:
        baseDamage = attacker.rangedAttackPower;
        break;
      case AttackType.SPECIAL:
        baseDamage = attacker.specialAttackPower;
        break;
    }
    
    const damageReduction = Math.min(75, target.armor);
    const damageMultiplier = (100 - damageReduction) / 100;
    
    const minDamage = Math.max(1, Math.floor(baseDamage * damageMultiplier * 0.9));
    const maxDamage = Math.max(1, Math.floor(baseDamage * damageMultiplier * 1.1));
    
    return { min: minDamage, max: maxDamage };
  }
} 