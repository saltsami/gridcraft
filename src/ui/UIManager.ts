// ui/UIManager.ts - Manages the game's user interface
import { Game } from '../core/Game';
import { Position } from '../types/Position';
import { Entity } from '../entities/Entity';
import { ResourceType } from '../types/ResourceType';

export class UIManager {
    private game: Game;
    private selectedEntity: Entity | null = null;
    
    // UI element references
    private woodElement: HTMLElement | null;
    private stoneElement: HTMLElement | null;
    private ironElement: HTMLElement | null;
    private foodElement: HTMLElement | null;
    private turnInfoElement: HTMLElement | null;
    private selectedEntityElement: HTMLElement | null;
    
    constructor(game: Game) {
        this.game = game;
        
        // Get references to UI elements
        this.woodElement = document.getElementById('wood');
        this.stoneElement = document.getElementById('stone');
        this.ironElement = document.getElementById('iron');
        this.foodElement = document.getElementById('food');
        this.turnInfoElement = document.getElementById('turn-info');
        this.selectedEntityElement = document.getElementById('selected-entity');
        
        // Setup end turn button event
        const endTurnButton = document.getElementById('end-turn');
        if (endTurnButton) {
            endTurnButton.addEventListener('click', () => this.game.nextTurn());
        }
    }
    
    public update(): void {
        this.updateResourceDisplay();
        this.updateTurnInfo();
        this.updateSelectedEntityInfo();
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
        if (this.selectedEntityElement && this.selectedEntity) {
            const entity = this.selectedEntity;
            let info = `${entity.getName()} | `;
            
            // Health info
            info += `HP: ${entity.health}/${entity.maxHealth} | `;
            
            // Action points
            info += `AP: ${entity.actionPoints}/${entity.maxActionPoints}`;
            
            // Position
            info += ` | Pos: (${entity.position.x}, ${entity.position.y})`;
            
            this.selectedEntityElement.textContent = info;
        } else if (this.selectedEntityElement) {
            this.selectedEntityElement.textContent = 'No entity selected';
        }
    }
    
    public handleGridClick(position: Position): void {
        // Check if there's an entity at the position
        const entity = this.game.getEntityManager().getEntityAtPosition(position);
        
        if (entity) {
            // If there's an entity, select it
            this.selectEntity(entity);
        } else if (this.selectedEntity) {
            // If an entity is selected, try to move it to the clicked position
            const moveResult = this.game.moveEntity(this.selectedEntity, position);
            
            if (!moveResult) {
                console.log('Invalid move!');
            }
        }
    }
    
    public getSelectedEntity(): Entity | null {
        return this.selectedEntity;
    }
    
    public selectEntity(entity: Entity | null): void {
        this.selectedEntity = entity;
        this.updateSelectedEntityInfo();
    }
} 