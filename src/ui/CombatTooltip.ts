import { CombatOdds } from '../systems/CombatCalculator';
import { Entity } from '../entities/Entity';
import { Tooltip } from './Tooltip';
import { AttackType } from '../types/AttackType';

export class CombatTooltip {
    static showEntityStats(entity: Entity, x: number, y: number): void {
        let content = `
            <div class="tooltip entity-hover-tooltip">
                <div class="tooltip-title">${entity.getName()}</div>
                <div class="tooltip-section">
                    <div class="tooltip-row">
                        <span class="tooltip-label">Health:</span>
                        <span class="tooltip-value">${entity.health}/${entity.maxHealth}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Armor:</span>
                        <span class="tooltip-value">${entity.armor}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Melee Attack:</span>
                        <span class="tooltip-value">${entity.meleeAttackPower}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Accuracy:</span>
                        <span class="tooltip-value">${entity.accuracy}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Evasion:</span>
                        <span class="tooltip-value">${entity.evasion}</span>
                    </div>
                </div>
            </div>
        `;
        
        Tooltip.show(content, { x, y });
    }
    
    // Full detailed combat odds preview
    static showDetailedCombatOdds(
        attacker: Entity, 
        target: Entity, 
        combatOdds: CombatOdds,
        attackType: AttackType,
        x: number, 
        y: number
    ): void {
        // Get attack type name for display
        const attackTypeName = this.getAttackTypeName(attackType);
        
        // Round all percentage values to integers
        const hitChance = Math.round(combatOdds.hitChance);
        const criticalChance = Math.round(combatOdds.criticalChance);
        const grazeChance = Math.round(combatOdds.grazeChance);
        const missChance = Math.round(combatOdds.missChance);
        const killChance = Math.round(combatOdds.killChance);
        
        // Round damage values to integers
        const minDamage = Math.round(combatOdds.minDamage);
        const maxDamage = Math.round(combatOdds.maxDamage);
        const avgDamage = Math.round(combatOdds.avgDamage * 10) / 10; // Keep one decimal place
        
        // Round modifiers to integers
        const baseChance = Math.round(combatOdds.modifiers.baseChance);
        const accuracyMod = Math.round(combatOdds.modifiers.accuracyMod);
        const evasionMod = Math.round(combatOdds.modifiers.evasionMod);
        const distanceMod = Math.round(combatOdds.modifiers.distanceMod);
        const coverMod = Math.round(combatOdds.modifiers.coverMod);
        
        // Create a visual representation of hit chance
        const hitChanceBar = this.createProbabilityBar(
            criticalChance,
            hitChance - criticalChance - grazeChance,
            grazeChance,
            missChance
        );
        
        let content = `
            <div class="tooltip combat-hover-tooltip">
                <div class="tooltip-title">Combat Preview</div>
                <div class="tooltip-combat-header">
                    <div>${attacker.getName()} → ${target.getName()}</div>
                    <div class="tooltip-attack-type">${attackTypeName}</div>
                </div>
                
                <div class="tooltip-section">
                    <div class="tooltip-row">
                        <span class="tooltip-label">Hit Chance:</span>
                        <span class="tooltip-value">${hitChance}%</span>
                    </div>
                    <div class="tooltip-row probability-bar-container">
                        ${hitChanceBar}
                    </div>
                    <div class="tooltip-row tooltip-breakdown">
                        <span class="crit-marker">Crit: ${criticalChance}%</span>
                        <span class="hit-marker">Hit: ${hitChance - criticalChance - grazeChance}%</span>
                        <span class="graze-marker">Graze: ${grazeChance}%</span>
                    </div>
                    
                    <div class="tooltip-row">
                        <span class="tooltip-label">Damage:</span>
                        <span class="tooltip-value">${minDamage}-${maxDamage}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Expected Damage:</span>
                        <span class="tooltip-value">${avgDamage}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Kill Chance:</span>
                        <span class="tooltip-value">${killChance}%</span>
                    </div>
                </div>
                
                <div class="tooltip-section tooltip-modifiers">
                    <div class="tooltip-subheader">Hit Chance Modifiers:</div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Base Chance:</span>
                        <span class="tooltip-value">${baseChance}%</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Accuracy:</span>
                        <span class="tooltip-value ${accuracyMod >= 0 ? 'positive' : 'negative'}">${accuracyMod >= 0 ? '+' : ''}${accuracyMod}%</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Target Evasion:</span>
                        <span class="tooltip-value ${evasionMod >= 0 ? 'positive' : 'negative'}">${evasionMod >= 0 ? '+' : ''}${evasionMod}%</span>
                    </div>
                    ${distanceMod !== 0 ? `
                    <div class="tooltip-row">
                        <span class="tooltip-label">Distance:</span>
                        <span class="tooltip-value ${distanceMod >= 0 ? 'positive' : 'negative'}">${distanceMod >= 0 ? '+' : ''}${distanceMod}%</span>
                    </div>
                    ` : ''}
                    ${coverMod !== 0 ? `
                    <div class="tooltip-row">
                        <span class="tooltip-label">Cover:</span>
                        <span class="tooltip-value ${coverMod >= 0 ? 'positive' : 'negative'}">${coverMod >= 0 ? '+' : ''}${coverMod}%</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        Tooltip.show(content, { x, y });
    }
    
    // Simplified version for quick display of combat odds
    static showCombatOdds(odds: CombatOdds, x: number, y: number): void {
        // Round values for display
        const hitChance = Math.round(odds.hitChance);
        const minDamage = Math.round(odds.minDamage);
        const maxDamage = Math.round(odds.maxDamage);
        const avgDamage = Math.round(odds.avgDamage * 10) / 10; // Keep one decimal place
        
        // Create a simplified combat preview
        let content = `
            <div class="tooltip combat-hover-tooltip">
                <div class="tooltip-title">Combat Preview</div>
                <div class="tooltip-section">
                    <div class="tooltip-row">
                        <span class="tooltip-label">Hit Chance:</span>
                        <span class="tooltip-value">${hitChance}%</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Damage:</span>
                        <span class="tooltip-value">${minDamage}-${maxDamage}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Expected Damage:</span>
                        <span class="tooltip-value">${avgDamage}</span>
                    </div>
                </div>
            </div>
        `;
        
        Tooltip.show(content, { x, y });
    }
    
    static hide(): void {
        Tooltip.hide();
    }
    
    private static getAttackTypeName(attackType: AttackType): string {
        switch(attackType) {
            case AttackType.MELEE: return 'Melee Attack';
            case AttackType.RANGED: return 'Ranged Attack';
            case AttackType.SPECIAL: return 'Special Attack';
            default: return 'Attack';
        }
    }
    
    private static createProbabilityBar(
        critChance: number,
        hitChance: number,
        grazeChance: number,
        missChance: number
    ): string {
        return `
        <div class="probability-bar">
            <div class="crit-segment" style="width: ${critChance}%"></div>
            <div class="hit-segment" style="width: ${hitChance}%"></div>
            <div class="graze-segment" style="width: ${grazeChance}%"></div>
            <div class="miss-segment" style="width: ${missChance}%"></div>
        </div>
        `;
    }
} 