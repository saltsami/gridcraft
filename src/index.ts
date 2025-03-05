import './styles.css';
import { Game } from './core/Game';
import { GridRenderer } from './ui/GridRenderer';
import { UIManager } from './ui/UIManager';

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
    setupEventListeners(game, gridRenderer, uiManager);
    
    console.log('Game initialized successfully.');
});

function setupEventListeners(game: Game, gridRenderer: GridRenderer, uiManager: UIManager) {
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