// ui/CombatUI.ts - Handles displaying attack information
import { Game } from '../core/Game';
import { Entity } from '../entities/Entity';
import { AttackType } from '../types/AttackType';
import { Position } from '../types/Position';

interface TargetInfo {
  targetName: string;
  hitChance: number;
  minDamage: number;
  maxDamage: number;
  killChance: number;
}

export class CombatUI {
  private game: Game;
  private selectedAttackType: AttackType | null = null;
  
  constructor(game: Game) {
    this.game = game;
  }
  
  public showAttackOptions(attacker: Entity): void {
    // Display available attack types
    const options = [];
    
    if (attacker.meleeAttackPower > 0) {
      options.push(AttackType.MELEE);
    }
    
    if (attacker.rangedAttackPower > 0 && attacker.rangedAttackRange > 0) {
      options.push(AttackType.RANGED);
    }
    
    if (attacker.specialAttackPower > 0 && attacker.specialAttackRange > 0) {
      options.push(AttackType.SPECIAL);
    }
    
    // Render options to UI
    // Implementation specific to UI framework
  }
  
  public selectAttackType(type: AttackType): void {
    this.selectedAttackType = type;
    this.showAttackPreview();
  }
  
  public showAttackPreview(): void {
    if (!this.selectedAttackType) return;
    
    const attacker = this.game.getSelectedEntity();
    if (!attacker) return;
    
    // Show range indicator for the selected attack type
    let range = 0;
    
    switch (this.selectedAttackType) {
      case AttackType.MELEE:
        range = 1.5;
        break;
      case AttackType.RANGED:
        range = attacker.rangedAttackRange;
        break;
      case AttackType.SPECIAL:
        range = attacker.specialAttackRange;
        break;
    }
    
    // Show tiles within range
    this.highlightTilesInRange(attacker.position, range);
  }
  
  private highlightTilesInRange(position: Position, range: number): void {
    // Implementation would depend on rendering system
  }
  
  public showTargetInfo(attacker: Entity, target: Entity): void {
    if (!this.selectedAttackType) return;
    
    // Calculate hit chance and expected damage
    const distance = this.calculateDistance(attacker.position, target.position);
    const hitChance = this.calculateHitChance(attacker, target, this.selectedAttackType, distance);
    const potentialDamage = this.calculatePotentialDamage(attacker, target, this.selectedAttackType);
    
    // Display to UI
    this.renderTargetInfo({
      targetName: target.getName(),
      hitChance: hitChance,
      minDamage: potentialDamage.min,
      maxDamage: potentialDamage.max,
      killChance: target.health <= potentialDamage.max ? ((target.health <= potentialDamage.min ? 100 : 50) * hitChance / 100) : 0
    });
  }
  
  private renderTargetInfo(info: TargetInfo): void {
    // Implementation would depend on UI framework
  }
  
  private calculateDistance(a: Position, b: Position): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }
  
  private calculateHitChance(attacker: Entity, target: Entity, attackType: AttackType, distance: number): number {
    // Same logic as in CombatSystem, but for preview purposes
    // This could call into CombatSystem directly to avoid duplication
    let baseChance = 0;
    
    switch (attackType) {
      case AttackType.MELEE:
        baseChance = 85;
        break;
      case AttackType.RANGED:
        baseChance = 75 - (distance * 5);
        break;
      case AttackType.SPECIAL:
        baseChance = attacker.specialAttackAccuracy;
        break;
    }
    
    baseChance += attacker.accuracy;
    baseChance -= target.evasion;
    
    return Math.max(5, Math.min(95, baseChance));
  }
  
  private calculatePotentialDamage(attacker: Entity, target: Entity, attackType: AttackType): { min: number, max: number } {
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