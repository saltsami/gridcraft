import './styles.css';
import './ui/tooltip.css';
import { Game } from './core/Game';
import { GridRenderer, UIManager, Tooltip, CombatTooltip } from './ui';
import { CombatCalculator } from './systems/CombatCalculator';
import { AttackType } from './types';
import { Entity } from './entities/Entity';

// Constants
const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('GridCraft Defense starting...');
    
    // Get the canvas element
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
        console.error('Game canvas not found!');
        return;
    }
    
    // Initialize the game
    const game = new Game(GRID_WIDTH, GRID_HEIGHT);
    
    // Initialize the renderers
    const gridRenderer = new GridRenderer(game, canvas);
    const uiManager = new UIManager(game);
    
    // Initialize the tooltip system
    Tooltip.initialize();
    
    // Initialize the combat calculator for tooltips
    const combatCalculator = new CombatCalculator(
        game.getCombatSystem(),
        game.getGrid()
    );
    
    // Setup game loop
    let lastTimestamp = 0;
    
    function gameLoop(timestamp: number) {
        // Calculate delta time (for animations)
        const deltaTime = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
        lastTimestamp = timestamp;
        
        // Update game state (if needed for animations)
        
        // Render the game
        gridRenderer.render(deltaTime);
        
        // Update UI elements
        uiManager.update();
        
        // Continue the game loop
        requestAnimationFrame(gameLoop);
    }
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        gridRenderer.resize();
    });
    
    // Initialize event listeners
    setupEventListeners(game, gridRenderer, uiManager, combatCalculator);
    
    console.log('Game initialized successfully.');
});

function setupEventListeners(
    game: Game, 
    gridRenderer: GridRenderer, 
    uiManager: UIManager,
    combatCalculator: CombatCalculator
) {
    // Get the canvas element
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    // Mouse movement (hover)
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert canvas coordinates to grid coordinates
        const gridPos = gridRenderer.canvasToGridCoordinates(x, y);
        
        // Highlight the tile under cursor
        gridRenderer.setHoveredTile(gridPos);
        
        // Check if we're hovering over an entity
        const hoveredEntity = game.getEntityManager().getEntityAtPosition(gridPos);
        
        if (hoveredEntity) {
            // If we're hovering over an entity, show its tooltip
            CombatTooltip.showEntityStats(hoveredEntity, event.clientX, event.clientY);
            
            // If we have a selected entity, also show combat preview
            const selectedEntity = game.getSelectedEntity();
            
            if (selectedEntity && selectedEntity !== hoveredEntity 
                && selectedEntity.faction !== hoveredEntity.faction) {
                
                // For simplicity, we'll show melee odds for now
                // In a full implementation, this would use the currently selected attack type
                const attackType = determineAttackType(selectedEntity, hoveredEntity);
                
                if (attackType) {
                    const odds = combatCalculator.calculateCombatOdds(
                        selectedEntity,
                        hoveredEntity,
                        attackType
                    );
                    
                    if (odds) {
                        // Show combat odds in a tooltip
                        setTimeout(() => {
                            CombatTooltip.showCombatOdds(
                                selectedEntity,
                                hoveredEntity,
                                odds,
                                attackType,
                                event.clientX,
                                event.clientY + 10 // Offset to not overlap with entity tooltip
                            );
                        }, 300); // Small delay to avoid flickering
                    }
                }
            }
        } else {
            // Hide tooltip if not hovering over an entity
            Tooltip.hide(100); // Delay to avoid flickering
        }
    });
    
    // Mouse move out
    canvas.addEventListener('mouseleave', () => {
        // Hide tooltip when mouse leaves the canvas
        Tooltip.hide();
        gridRenderer.setHoveredTile(null);
    });
    
    // Mouse click (select tile or entity)
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert canvas coordinates to grid coordinates
        const gridPos = gridRenderer.canvasToGridCoordinates(x, y);
        
        // Handle selection
        uiManager.handleGridClick(gridPos);
    });
    
    // End turn button
    const endTurnButton = document.getElementById('end-turn');
    if (endTurnButton) {
        endTurnButton.addEventListener('click', () => {
            game.nextTurn();
            uiManager.update();
        });
    }
}

// Helper function to determine best attack type based on distance and entity capabilities
function determineAttackType(attacker: Entity, target: Entity): AttackType | null {
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