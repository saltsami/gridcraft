// ui/UIManager.ts - Manages the game's user interface
import { Game } from '../core/Game';
import { Position } from '../types';
import { Entity } from '../entities';
import { ResourceType } from '../types';
import { AttackType } from '../types';

export class UIManager {
    private game: Game;
    private selectedEntity: Entity | null = null;
    private targetEntity: Entity | null = null;
    
    // UI element references
    private woodElement: HTMLElement | null;
    private stoneElement: HTMLElement | null;
    private ironElement: HTMLElement | null;
    private foodElement: HTMLElement | null;
    private turnInfoElement: HTMLElement | null;
    private selectedEntityElement: HTMLElement | null;
    private actionsPanelElement: HTMLElement | null;
    
    constructor(game: Game) {
        this.game = game;
        
        // Cache UI elements
        this.woodElement = document.getElementById('resource-wood');
        this.stoneElement = document.getElementById('resource-stone');
        this.ironElement = document.getElementById('resource-iron');
        this.foodElement = document.getElementById('resource-food');
        this.turnInfoElement = document.getElementById('turn-info');
        this.selectedEntityElement = document.getElementById('selected-entity-info');
        this.actionsPanelElement = document.getElementById('actions-panel');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Create UI elements
        this.createCombatActionPanel();
        
        // Initial UI update
        this.update();
    }
    
    private setupEventListeners(): void {
        // Setup end turn button
        const endTurnButton = document.getElementById('end-turn-button');
        if (endTurnButton) {
            console.log('[UIManager] Setting up end turn button');
            endTurnButton.addEventListener('click', () => {
                console.log('[UIManager] End turn button clicked');
                this.endTurn();
            });
        } else {
            console.log('[UIManager] Creating end turn button');
            // Create end turn button if it doesn't exist
            this.createEndTurnButton();
        }
    }
    
    private createEndTurnButton(): void {
        const container = document.getElementById('ui-container');
        if (!container) {
            console.error('[UIManager] UI container not found');
            return;
        }
        
        const endTurnButton = document.createElement('button');
        endTurnButton.id = 'end-turn-button';
        endTurnButton.textContent = 'End Turn';
        endTurnButton.className = 'ui-button end-turn-button';
        endTurnButton.style.position = 'absolute';
        endTurnButton.style.bottom = '20px';
        endTurnButton.style.right = '20px';
        endTurnButton.style.padding = '10px 20px';
        endTurnButton.style.backgroundColor = '#4CAF50';
        endTurnButton.style.color = 'white';
        endTurnButton.style.border = 'none';
        endTurnButton.style.borderRadius = '5px';
        endTurnButton.style.fontSize = '16px';
        endTurnButton.style.cursor = 'pointer';
        
        endTurnButton.addEventListener('click', () => {
            console.log('[UIManager] End turn button clicked');
            this.endTurn();
        });
        
        container.appendChild(endTurnButton);
    }
    
    private endTurn(): void {
        console.log('[UIManager] Ending player turn');
        
        // If there's a selected entity, refresh its action points
        if (this.selectedEntity) {
            console.log(`[UIManager] Refreshing action points for ${this.selectedEntity.getName()}`);
            this.selectedEntity.resetActionPoints();
            
            // Recalculate reachable tiles
            this.game.getMovement().setSelectedEntity(this.selectedEntity);
        }
        
        // Advance game turn
        this.game.nextTurn();
        
        // Update UI
        this.update();
    }

    private createCombatActionPanel(): void {
        // Create and add the combat action panel if it doesn't exist
        let actionPanel = document.getElementById('combat-actions');
        if (!actionPanel) {
            actionPanel = document.createElement('div');
            actionPanel.id = 'combat-actions';
            actionPanel.className = 'combat-actions-panel';
            actionPanel.style.display = 'none';
            
            // Add to action panel if it exists, otherwise to the body
            const container = this.actionsPanelElement || document.body;
            container.appendChild(actionPanel);
        }
    }
    
    public update(): void {
        this.updateResourceDisplay();
        this.updateTurnInfo();
        this.updateSelectedEntityInfo();
        this.updateCombatActions();
    }
    
    private updateResourceDisplay(): void {
        const resourceManager = this.game.getResourceManager();
        
        if (this.woodElement) {
            this.woodElement.textContent = `Wood: ${resourceManager.getResourceAmount(ResourceType.WOOD)}`;
        }
        
        if (this.stoneElement) {
            this.stoneElement.textContent = `Stone: ${resourceManager.getResourceAmount(ResourceType.STONE)}`;
        }
        
        if (this.ironElement) {
            this.ironElement.textContent = `Iron: ${resourceManager.getResourceAmount(ResourceType.IRON)}`;
        }
        
        if (this.foodElement) {
            this.foodElement.textContent = `Food: ${resourceManager.getResourceAmount(ResourceType.FOOD)}`;
        }
    }
    
    private updateTurnInfo(): void {
        if (this.turnInfoElement) {
            const turnCount = this.game.getTurnCount();
            const isDayPhase = this.game.isDayPhase();
            
            this.turnInfoElement.textContent = `${isDayPhase ? 'Day' : 'Night'} ${Math.floor(turnCount / 2) + 1}`;
        }
    }
    
    private updateSelectedEntityInfo(): void {
        // Update UI to show selected entity info
        if (this.selectedEntityElement) {
            if (this.selectedEntity) {
                // Format detailed entity information
                const name = this.selectedEntity.getName();
                const hp = this.selectedEntity.health;
                const maxHp = this.selectedEntity.maxHealth;
                const ap = this.selectedEntity.actionPoints;
                const maxAp = this.selectedEntity.maxActionPoints;
                
                // Create health bar HTML
                const healthPercent = Math.max(0, Math.min(100, Math.floor((hp / maxHp) * 100)));
                const healthBarClass = healthPercent <= 25 ? 'danger' : healthPercent <= 50 ? 'warning' : 'good';
                
                this.selectedEntityElement.innerHTML = `
                    <div>Selected: <strong>${name}</strong></div>
                    <div class="entity-stats">
                        <div>HP: ${hp}/${maxHp} 
                            <div class="mini-health-bar-container">
                                <div class="mini-health-bar ${healthBarClass}" style="width: ${healthPercent}%"></div>
                            </div>
                        </div>
                        <div>AP: ${ap}/${maxAp}</div>
                    </div>
                `;
                this.selectedEntityElement.style.display = 'block';
                this.selectedEntityElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                this.selectedEntityElement.style.padding = '8px';
                this.selectedEntityElement.style.borderRadius = '4px';
                this.selectedEntityElement.style.border = '1px solid #666';
            } else {
                // Get the player's entity for displaying stats even when no entity is selected
                const playerEntities = this.game.getEntityManager().getEntitiesByFaction(this.game.getPlayerFaction());
                const playerHero = playerEntities.find(entity => entity.getType() === 'hero');
                
                if (playerHero) {
                    const hp = playerHero.health;
                    const maxHp = playerHero.maxHealth;
                    const ap = playerHero.actionPoints;
                    const maxAp = playerHero.maxActionPoints;
                    
                    // Create health bar HTML
                    const healthPercent = Math.max(0, Math.min(100, Math.floor((hp / maxHp) * 100)));
                    const healthBarClass = healthPercent <= 25 ? 'danger' : healthPercent <= 50 ? 'warning' : 'good';
                    
                    this.selectedEntityElement.innerHTML = `
                        <div>No entity selected</div>
                        <div class="entity-stats">
                            <div>Player HP: ${hp}/${maxHp} 
                                <div class="mini-health-bar-container">
                                    <div class="mini-health-bar ${healthBarClass}" style="width: ${healthPercent}%"></div>
                                </div>
                            </div>
                            <div>Player AP: ${ap}/${maxAp}</div>
                        </div>
                    `;
                } else {
                    this.selectedEntityElement.innerHTML = 'No entity selected';
                }
                
                // Always display the element with a visible background even when no entity is selected
                this.selectedEntityElement.style.display = 'block';
                this.selectedEntityElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                this.selectedEntityElement.style.padding = '8px';
                this.selectedEntityElement.style.borderRadius = '4px';
                this.selectedEntityElement.style.border = '1px solid #666';
            }
        }
    }
    
    private updateCombatActions(): void {
        const actionPanel = document.getElementById('combat-actions');
        if (!actionPanel) return;
        
        // Only show combat actions if we have both a selected entity and a target entity
        if (this.selectedEntity && this.targetEntity && 
            this.selectedEntity.faction !== this.targetEntity.faction && 
            this.selectedEntity.actionPoints > 0) {
            
            // Calculate best attack type
            const attackType = this.determineBestAttackType(this.selectedEntity, this.targetEntity);
            
            if (attackType) {
                // Clear existing content
                actionPanel.innerHTML = '';
                
                // Create attack button
                const attackButton = document.createElement('button');
                attackButton.className = 'attack-button';
                attackButton.textContent = `Attack ${this.targetEntity.getName()} (${this.getAttackTypeName(attackType)})`;
                
                // Ensure button has proper sizing
                attackButton.style.width = '100%';
                attackButton.style.padding = '10px 20px'; // Larger padding for easier clicking
                attackButton.style.margin = '5px';
                attackButton.style.fontSize = '16px';
                attackButton.style.cursor = 'pointer';
                
                // Add click handler for attack
                attackButton.addEventListener('click', () => {
                    console.log(`[UIManager] Attack button clicked. ${this.selectedEntity?.getName()} attacking ${this.targetEntity?.getName()}`);
                    this.executeAttack(this.selectedEntity!, this.targetEntity!, attackType!);
                });
                
                actionPanel.appendChild(attackButton);
                actionPanel.style.display = 'flex';
            } else {
                actionPanel.style.display = 'none';
            }
        } else {
            actionPanel.style.display = 'none';
        }
    }
    
    private getAttackTypeName(attackType: AttackType): string {
        switch(attackType) {
            case AttackType.MELEE: return 'Melee';
            case AttackType.RANGED: return 'Ranged';
            case AttackType.SPECIAL: return 'Special';
            default: return 'Attack';
        }
    }
    
    private executeAttack(attacker: Entity, target: Entity, attackType: AttackType): void {
        // Execute attack using combat system
        const result = this.game.getCombatSystem().resolveAttack(
            attacker, 
            target, 
            attackType,
            this.game.getGrid()
        );
        
        if (result.success) {
            let message = '';
            if (result.hit) {
                message = `${attacker.getName()} hits ${target.getName()} for ${result.damage} damage!`;
                
                // If the target is defeated, mark it as dead immediately for visual feedback
                if (target.health <= 0) {
                    target.markAsDead(this.game.getTurnCount());
                    message += ` ${target.getName()} is defeated!`;
                }
            } else {
                message = `${attacker.getName()} missed ${target.getName()}!`;
            }
            
            // Show attack result
            this.showAttackResult(message);
            
            // Update UI
            this.targetEntity = null;
            this.update();
        }
    }
    
    private showAttackResult(message: string): void {
        // Create a floating message at the center of the screen
        const messageElement = document.createElement('div');
        messageElement.className = 'attack-result-message';
        messageElement.textContent = message;
        document.body.appendChild(messageElement);
        
        // Remove the message after a delay
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(messageElement);
            }, 500);
        }, 1500);
    }
    
    private determineBestAttackType(attacker: Entity, target: Entity): AttackType | null {
        // Calculate distance
        const dx = target.position.x - attacker.position.x;
        const dy = target.position.y - attacker.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check melee attack first (adjacent)
        if (distance <= 1.5 && attacker.meleeAttackPower > 0) {
            return AttackType.MELEE;
        }
        
        // Check ranged attack next
        if (distance <= attacker.rangedAttackRange && attacker.rangedAttackPower > 0) {
            return AttackType.RANGED;
        }
        
        // Check special attack last
        if (distance <= attacker.specialAttackRange && attacker.specialAttackPower > 0) {
            return AttackType.SPECIAL;
        }
        
        // No valid attack type
        return null;
    }

    public handleGridClick(position: Position): void {
        console.log(`[UIManager] Grid clicked at (${position.x}, ${position.y})`);
        // Check if there's an entity at the position
        const entity = this.game.getEntityManager().getEntityAtPosition(position);
        
        if (entity) {
            console.log(`[UIManager] Entity found at clicked position: ${entity.getName()}`);
            // Ignore interactions with dead entities
            if (entity.isDead) {
                console.log(`[UIManager] Entity is dead, ignoring click`);
                return;
            }
            
            if (entity.faction === this.game.getPlayerFaction()) {
                console.log(`[UIManager] Selecting player entity: ${entity.getName()}`);
                // If it's a player entity, select it
                this.selectEntity(entity);
                this.targetEntity = null;
            } else if (this.selectedEntity) {
                console.log(`[UIManager] Setting enemy as target: ${entity.getName()}`);
                // If it's an enemy and we have a selected entity, set it as target
                this.targetEntity = entity;
                this.update(); // Update UI to show attack options
            }
        } else if (this.selectedEntity) {
            console.log(`[UIManager] Attempting to move ${this.selectedEntity.getName()} to (${position.x}, ${position.y})`);
            // If clicking on empty space with an entity selected, try to move
            // Use the movement system to check if the tile is reachable
            const movement = this.game.getMovement();
            
            if (movement.isReachable(position)) {
                console.log(`[UIManager] Position is reachable, moving entity`);
                // Move along the calculated path
                const moveResult = this.game.moveEntity(this.selectedEntity, position);
                
                if (!moveResult) {
                    console.log(`[UIManager] Move failed!`);
                } else {
                    console.log(`[UIManager] Moved to (${position.x}, ${position.y}) with cost ${movement.getMovementCost(position)}`);
                    console.log(`[UIManager] Entity has ${this.selectedEntity.actionPoints} AP remaining`);
                    
                    // Ensure entity stays selected after moving
                    const movedEntity = this.selectedEntity;
                    if (movedEntity.actionPoints > 0) {
                        // Re-select the entity to refresh its movement range visualization
                        this.selectEntity(movedEntity);
                    }
                }
                
                // Clear target when moving
                this.targetEntity = null;
                this.update();
            } else {
                console.log(`[UIManager] That tile is not reachable with current action points!`);
            }
        } else {
            console.log(`[UIManager] No entity at clicked position and no entity selected`);
        }
    }
    
    public getSelectedEntity(): Entity | null {
        return this.selectedEntity;
    }
    
    public selectEntity(entity: Entity | null): void {
        console.log(`[UIManager] Setting selected entity: ${entity ? entity.getName() : 'null'}`);
        this.selectedEntity = entity;
        this.game.setSelectedEntity(entity);
        this.updateSelectedEntityInfo();
    }
} 