// ui/GridRenderer.ts - Handles the visual rendering of the game grid
import { Game } from '../core/Game';
import { Position, TerrainType, Faction } from '../types';
import { Entity } from '../entities';
import { VisibilityState, FogOfWar } from '../systems';
import { Movement, ReachableTile } from '../systems/Movement';

export class GridRenderer {
    private game: Game;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tileSize: number = 32;
    private hoveredTile: Position | null = null;
    private selectedTile: Position | null = null;
    
    constructor(game: Game, canvas: HTMLCanvasElement) {
        this.game = game;
        this.canvas = canvas;
        
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get canvas context');
        }
        this.ctx = context;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    public resize(): void {
        // Adjust canvas size to fit its container
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
        
        // Calculate tile size based on grid dimensions
        const grid = this.game.getGrid();
        const maxTileWidth = this.canvas.width / grid.getWidth();
        const maxTileHeight = this.canvas.height / grid.getHeight();
        
        // Use the smaller dimension to ensure tiles fit
        this.tileSize = Math.floor(Math.min(maxTileWidth, maxTileHeight));
    }
    
    public render(deltaTime: number): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const grid = this.game.getGrid();
        const fogOfWar = this.game.getFogOfWar();
        const movement = this.game.getMovement();
        
        // Calculate offset to center the grid
        const offsetX = (this.canvas.width - (grid.getWidth() * this.tileSize)) / 2;
        const offsetY = (this.canvas.height - (grid.getHeight() * this.tileSize)) / 2;
        
        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);
        
        // Render tiles
        for (let y = 0; y < grid.getHeight(); y++) {
            for (let x = 0; x < grid.getWidth(); x++) {
                const position = { x, y };
                const tile = grid.getTile(position);
                
                if (tile) {
                    const visibility = fogOfWar.getTileVisibility(position);
                    this.renderTile(position, tile.terrainType, visibility);
                }
            }
        }
        
        // Render reachable tiles
        if (movement && movement.getReachableTiles().length > 0) {
            const reachableTiles = movement.getReachableTiles();
            console.log(`[GridRenderer] Rendering ${reachableTiles.length} reachable tiles`);
            
            for (const tile of reachableTiles) {
                // Don't render highlight for the entity's own position
                const selectedEntity = this.game.getSelectedEntity();
                if (selectedEntity && 
                    selectedEntity.position.x === tile.position.x && 
                    selectedEntity.position.y === tile.position.y) {
                    continue;
                }
                
                this.renderReachableTile(tile);
            }
        } else {
            console.log('[GridRenderer] No reachable tiles to render');
        }
        
        // Render path
        if (movement && movement.getCurrentPath().length > 0) {
            console.log(`[GridRenderer] Rendering path with ${movement.getCurrentPath().length} steps`);
            this.renderPath(movement.getCurrentPath());
        }
        
        // Render entities
        const entities = this.game.getEntityManager().getAllEntities();
        for (const entity of entities) {
            const visibility = fogOfWar.getTileVisibility(entity.position);
            this.renderEntity(entity, visibility);
        }
        
        // Render highlights
        if (this.hoveredTile) {
            this.renderTileHighlight(this.hoveredTile, 'rgba(255, 255, 255, 0.3)');
        }
        
        if (this.selectedTile) {
            this.renderTileHighlight(this.selectedTile, 'rgba(0, 255, 0, 0.3)');
        }
        
        this.ctx.restore();
    }
    
    private renderTile(position: Position, terrainType: TerrainType, visibility: 'visible' | 'explored' | 'unexplored'): void {
        const x = position.x * this.tileSize;
        const y = position.y * this.tileSize;
        
        if (visibility === 'unexplored') {
            // Render unexplored as dark tile
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
            return;
        }

        // Get base color for terrain type
        let color = '#6ab04c'; // Default grass color
        
        switch (terrainType) {
            case TerrainType.GRASS:
                color = '#6ab04c';
                break;
            case TerrainType.DIRT:
                color = '#795548';
                break;
            case TerrainType.STONE:
                color = '#aaa9ad';
                break;
            case TerrainType.WATER:
                color = '#2980b9';
                break;
        }
        
        // Apply visibility effects
        if (visibility === 'explored') {
            // Darken the color for explored but not visible tiles
            this.ctx.fillStyle = this.darkenColor(color, 0.6);
        } else {
            // Use normal color for visible tiles
            this.ctx.fillStyle = color;
        }
        
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
    }
    
    // Helper method to darken a color
    private darkenColor(color: string, factor: number): string {
        // Convert hex to RGB
        let r = parseInt(color.substring(1, 3), 16);
        let g = parseInt(color.substring(3, 5), 16);
        let b = parseInt(color.substring(5, 7), 16);
        
        // Darken by factor
        r = Math.round(r * factor);
        g = Math.round(g * factor);
        b = Math.round(b * factor);
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    private renderEntity(entity: Entity, visibility: 'visible' | 'explored' | 'unexplored'): void {
        // Only render entities in visible tiles
        if (visibility !== 'visible') {
            return;
        }
        
        const x = entity.position.x * this.tileSize;
        const y = entity.position.y * this.tileSize;
        
        // Set color based on faction
        let color = '#fff'; // Default white
        
        switch (entity.faction) {
            case Faction.PLAYER:
                color = '#00ff00'; // Green for player
                break;
            case Faction.ENEMY:
                color = '#ff0000'; // Red for enemies
                break;
            case Faction.NEUTRAL:
                color = '#ffff00'; // Yellow for neutral
                break;
        }
        
        // Check if this entity is selected
        const isSelected = this.game.getSelectedEntity() === entity;
        
        // Draw tile highlight for selected entity
        if (isSelected) {
            // Draw selection indicator underneath the entity
            this.ctx.fillStyle = 'rgba(255, 204, 0, 0.3)';
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
            
            // Draw selection border
            this.ctx.strokeStyle = '#ffcc00';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        }
        
        // Draw entity
        this.ctx.fillStyle = color;
        
        // Draw as a circle in the center of the tile
        const radius = this.tileSize * 0.4;
        const centerX = x + (this.tileSize / 2);
        const centerY = y + (this.tileSize / 2);
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add thicker border for selected entities
        if (isSelected) {
            this.ctx.strokeStyle = '#ffcc00';
            this.ctx.lineWidth = 3;
        } else {
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
        }
        this.ctx.stroke();
        
        // Show death effect for dead entities
        if (entity.isDead) {
            // Draw death animation (X mark)
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            
            // Draw X
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - radius/2, centerY - radius/2);
            this.ctx.lineTo(centerX + radius/2, centerY + radius/2);
            this.ctx.moveTo(centerX + radius/2, centerY - radius/2);
            this.ctx.lineTo(centerX - radius/2, centerY + radius/2);
            this.ctx.stroke();
            
            // Add skull symbol
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${Math.floor(radius)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('☠', centerX, centerY);
            
            // Draw faded entity
            this.ctx.globalAlpha = 0.3;
        }
        
        // Draw health bar
        const healthBarWidth = this.tileSize * 0.8;
        const healthBarHeight = this.tileSize * 0.1;
        const healthBarX = x + (this.tileSize - healthBarWidth) / 2;
        const healthBarY = y + this.tileSize * 0.8;
        
        // Background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health level - don't show health bar for dead entities
        if (!entity.isDead) {
            const healthPercentage = entity.health / entity.maxHealth;
            this.ctx.fillStyle = healthPercentage > 0.5 ? '#00ff00' : healthPercentage > 0.25 ? '#ffff00' : '#ff0000';
            this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
        }
        
        // Reset opacity
        this.ctx.globalAlpha = 1.0;
    }
    
    private renderTileHighlight(position: Position, color: string): void {
        const x = position.x * this.tileSize;
        const y = position.y * this.tileSize;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
    }
    
    public setHoveredTile(position: Position | null): void {
        this.hoveredTile = position;
    }
    
    public setSelectedTile(position: Position | null): void {
        this.selectedTile = position;
    }
    
    public canvasToGridCoordinates(canvasX: number, canvasY: number): Position {
        const offsetX = (this.canvas.width - (this.game.getGrid().getWidth() * this.tileSize)) / 2;
        const offsetY = (this.canvas.height - (this.game.getGrid().getHeight() * this.tileSize)) / 2;
        
        const gridX = Math.floor((canvasX - offsetX) / this.tileSize);
        const gridY = Math.floor((canvasY - offsetY) / this.tileSize);
        
        return { x: gridX, y: gridY };
    }
    
    public getTileSize(): number {
        return this.tileSize;
    }
    
    /**
     * Render a reachable tile with action point cost
     */
    private renderReachableTile(tile: ReachableTile): void {
        const x = tile.position.x * this.tileSize;
        const y = tile.position.y * this.tileSize;
        
        // Highlight reachable tile
        this.ctx.fillStyle = 'rgba(0, 200, 100, 0.3)';
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Draw movement cost
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(tile.cost.toFixed(1), x + this.tileSize - 2, y + this.tileSize - 2);
    }
    
    /**
     * Render the path from current position to target
     */
    private renderPath(path: Position[]): void {
        if (path.length === 0) return;
        
        // Draw line connecting path points
        this.ctx.beginPath();
        
        // Start from the first position in the path
        const firstPos = path[0];
        const startX = firstPos.x * this.tileSize + this.tileSize / 2;
        const startY = firstPos.y * this.tileSize + this.tileSize / 2;
        this.ctx.moveTo(startX, startY);
        
        // Connect to each point in the path
        for (let i = 1; i < path.length; i++) {
            const pos = path[i];
            const x = pos.x * this.tileSize + this.tileSize / 2;
            const y = pos.y * this.tileSize + this.tileSize / 2;
            this.ctx.lineTo(x, y);
        }
        
        // Style the path line
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Highlight path tiles
        for (const pos of path) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(
                pos.x * this.tileSize, 
                pos.y * this.tileSize, 
                this.tileSize, 
                this.tileSize
            );
        }
    }
} 