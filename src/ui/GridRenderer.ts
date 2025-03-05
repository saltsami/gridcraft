// ui/GridRenderer.ts - Handles the visual rendering of the game grid
import { Game } from '../core/Game';
import { Position, TerrainType, Faction, EntityType } from '../types';
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
    
    // Simple texture patterns
    private grassPattern: CanvasPattern | null = null;
    private dirtPattern: CanvasPattern | null = null;
    private stonePattern: CanvasPattern | null = null;
    private waterPattern: CanvasPattern | null = null;
    
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
        
        // Initialize textures
        this.initializeTextures();
    }
    
    /**
     * Initialize simple texture patterns for terrain
     */
    private initializeTextures(): void {
        // Create grass pattern
        const grassCanvas = document.createElement('canvas');
        grassCanvas.width = 16;
        grassCanvas.height = 16;
        const grassCtx = grassCanvas.getContext('2d');
        if (grassCtx) {
            grassCtx.fillStyle = '#6ab04c';
            grassCtx.fillRect(0, 0, 16, 16);
            
            // Add some texture details
            grassCtx.fillStyle = '#88cc66';
            for (let i = 0; i < 8; i++) {
                const x = Math.random() * 16;
                const y = Math.random() * 16;
                const size = 1 + Math.random() * 2;
                grassCtx.fillRect(x, y, size, size);
            }
            
            this.grassPattern = this.ctx.createPattern(grassCanvas, 'repeat');
        }
        
        // Create dirt pattern
        const dirtCanvas = document.createElement('canvas');
        dirtCanvas.width = 16;
        dirtCanvas.height = 16;
        const dirtCtx = dirtCanvas.getContext('2d');
        if (dirtCtx) {
            dirtCtx.fillStyle = '#795548';
            dirtCtx.fillRect(0, 0, 16, 16);
            
            // Add some texture details
            dirtCtx.fillStyle = '#8B6B5F';
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * 16;
                const y = Math.random() * 16;
                const size = 1 + Math.random() * 3;
                dirtCtx.fillRect(x, y, size, size);
            }
            
            this.dirtPattern = this.ctx.createPattern(dirtCanvas, 'repeat');
        }
        
        // Create stone pattern
        const stoneCanvas = document.createElement('canvas');
        stoneCanvas.width = 16;
        stoneCanvas.height = 16;
        const stoneCtx = stoneCanvas.getContext('2d');
        if (stoneCtx) {
            stoneCtx.fillStyle = '#aaa9ad';
            stoneCtx.fillRect(0, 0, 16, 16);
            
            // Add some texture details
            stoneCtx.fillStyle = '#8E8E93';
            stoneCtx.fillRect(0, 0, 8, 8);
            stoneCtx.fillRect(8, 8, 8, 8);
            
            stoneCtx.fillStyle = '#C8C8CC';
            stoneCtx.fillRect(8, 0, 8, 8);
            stoneCtx.fillRect(0, 8, 8, 8);
            
            this.stonePattern = this.ctx.createPattern(stoneCanvas, 'repeat');
        }
        
        // Create water pattern
        const waterCanvas = document.createElement('canvas');
        waterCanvas.width = 16;
        waterCanvas.height = 16;
        const waterCtx = waterCanvas.getContext('2d');
        if (waterCtx) {
            waterCtx.fillStyle = '#2980b9';
            waterCtx.fillRect(0, 0, 16, 16);
            
            // Add some wave details
            waterCtx.fillStyle = '#3498db';
            waterCtx.beginPath();
            waterCtx.moveTo(0, 8);
            waterCtx.bezierCurveTo(4, 6, 8, 10, 16, 8);
            waterCtx.lineTo(16, 16);
            waterCtx.lineTo(0, 16);
            waterCtx.closePath();
            waterCtx.fill();
            
            this.waterPattern = this.ctx.createPattern(waterCanvas, 'repeat');
        }
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
        const isDayPhase = this.game.isDayPhase();
        
        // Apply day/night filter to canvas
        this.applyDayNightEffect(isDayPhase);
        
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

        // Get pattern for terrain type
        let pattern = this.grassPattern;
        let color = '#6ab04c'; // Default grass color
        
        switch (terrainType) {
            case TerrainType.GRASS:
                pattern = this.grassPattern;
                color = '#6ab04c';
                break;
            case TerrainType.DIRT:
                pattern = this.dirtPattern;
                color = '#795548';
                break;
            case TerrainType.STONE:
                pattern = this.stonePattern;
                color = '#aaa9ad';
                break;
            case TerrainType.WATER:
                pattern = this.waterPattern;
                color = '#2980b9';
                break;
        }
        
        // Apply visibility effects
        if (visibility === 'explored') {
            // Darken the color for explored but not visible tiles
            this.ctx.fillStyle = this.darkenColor(color, 0.6);
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        } else {
            // Use pattern for visible tiles if available, otherwise use color
            if (pattern) {
                this.ctx.fillStyle = pattern;
            } else {
                this.ctx.fillStyle = color;
            }
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }
        
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
        
        // Draw entity based on type
        const centerX = x + (this.tileSize / 2);
        const centerY = y + (this.tileSize / 2);
        const radius = this.tileSize * 0.4;
        
        switch (entity.getType()) {
            case EntityType.HERO:
                this.renderHero(centerX, centerY, radius, color, isSelected);
                break;
            case EntityType.ZOMBIE:
                this.renderZombie(centerX, centerY, radius, color, isSelected);
                break;
            case EntityType.SKELETON:
                this.renderSkeleton(centerX, centerY, radius, color, isSelected);
                break;
            case EntityType.SPIDER:
                this.renderSpider(centerX, centerY, radius, color, isSelected);
                break;
            case EntityType.CREEPER:
                this.renderCreeper(centerX, centerY, radius, color, isSelected);
                break;
            default:
                // Default circular entity
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add border
                this.ctx.strokeStyle = isSelected ? '#ffcc00' : '#000';
                this.ctx.lineWidth = isSelected ? 3 : 1;
                this.ctx.stroke();
                break;
        }
        
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
        }
        
        // Draw health bar above entity
        this.renderHealthBar(entity, x, y);
    }
    
    private renderHero(centerX: number, centerY: number, radius: number, color: string, isSelected: boolean): void {
        // Draw hero as a shield shape
        this.ctx.fillStyle = color;
        
        // Draw shield body
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add sword detail
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - radius/2);
        this.ctx.lineTo(centerX, centerY + radius/2);
        this.ctx.stroke();
        
        // Add horizontal guard
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - radius/3, centerY - radius/4);
        this.ctx.lineTo(centerX + radius/3, centerY - radius/4);
        this.ctx.stroke();
        
        // Add border
        this.ctx.strokeStyle = isSelected ? '#ffcc00' : '#000';
        this.ctx.lineWidth = isSelected ? 3 : 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    private renderZombie(centerX: number, centerY: number, radius: number, color: string, isSelected: boolean): void {
        // Draw zombie
        this.ctx.fillStyle = color;
        
        // Draw body
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add face details
        this.ctx.fillStyle = '#000';
        
        // Eyes
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius/3, centerY - radius/4, radius/6, 0, Math.PI * 2);
        this.ctx.arc(centerX + radius/3, centerY - radius/4, radius/6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Mouth
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + radius/4, radius/4, 0, Math.PI);
        this.ctx.fill();
        
        // Add border
        this.ctx.strokeStyle = isSelected ? '#ffcc00' : '#000';
        this.ctx.lineWidth = isSelected ? 3 : 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    private renderSkeleton(centerX: number, centerY: number, radius: number, color: string, isSelected: boolean): void {
        // Draw skeleton
        this.ctx.fillStyle = color;
        
        // Draw body
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add face details
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        
        // Skull pattern
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius/3, centerY - radius/4, radius/6, 0, Math.PI * 2);
        this.ctx.arc(centerX + radius/3, centerY - radius/4, radius/6, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Teeth
        this.ctx.beginPath();
        for (let i = -3; i <= 3; i++) {
            this.ctx.moveTo(centerX + i * radius/8, centerY + radius/4);
            this.ctx.lineTo(centerX + i * radius/8, centerY + radius/2);
        }
        this.ctx.stroke();
        
        // Add border
        this.ctx.strokeStyle = isSelected ? '#ffcc00' : '#000';
        this.ctx.lineWidth = isSelected ? 3 : 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    private renderSpider(centerX: number, centerY: number, radius: number, color: string, isSelected: boolean): void {
        // Draw spider
        this.ctx.fillStyle = color;
        
        // Draw body
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw legs
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = radius / 5;
        
        // 8 legs
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI / 4) + (Math.PI / 8);
            const legLength = radius * 1.2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            
            // Create a bent leg
            const midX = centerX + Math.cos(angle) * legLength * 0.6;
            const midY = centerY + Math.sin(angle) * legLength * 0.6;
            
            const endX = centerX + Math.cos(angle) * legLength;
            const endY = centerY + Math.sin(angle) * legLength;
            
            this.ctx.quadraticCurveTo(midX, midY, endX, endY);
            this.ctx.stroke();
        }
        
        // Add eyes
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius/3, centerY - radius/4, radius/8, 0, Math.PI * 2);
        this.ctx.arc(centerX + radius/3, centerY - radius/4, radius/8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add border
        this.ctx.strokeStyle = isSelected ? '#ffcc00' : '#000';
        this.ctx.lineWidth = isSelected ? 3 : 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    private renderCreeper(centerX: number, centerY: number, radius: number, color: string, isSelected: boolean): void {
        // Draw creeper
        this.ctx.fillStyle = color;
        
        // Draw body (square-ish)
        this.ctx.beginPath();
        this.ctx.rect(centerX - radius, centerY - radius, radius * 2, radius * 2);
        this.ctx.fill();
        
        // Add face details
        this.ctx.fillStyle = '#000';
        
        // Eyes
        this.ctx.beginPath();
        this.ctx.rect(centerX - radius/2, centerY - radius/2, radius/3, radius/3);
        this.ctx.rect(centerX + radius/6, centerY - radius/2, radius/3, radius/3);
        this.ctx.fill();
        
        // Mouth
        this.ctx.beginPath();
        this.ctx.rect(centerX - radius/4, centerY - radius/8, radius/2, radius/2);
        this.ctx.fill();
        
        // Add border
        this.ctx.strokeStyle = isSelected ? '#ffcc00' : '#000';
        this.ctx.lineWidth = isSelected ? 3 : 1;
        this.ctx.strokeRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    }
    
    private renderHealthBar(entity: Entity, x: number, y: number): void {
        const healthPercent = Math.max(0, Math.min(100, (entity.health / entity.maxHealth) * 100));
        const barWidth = this.tileSize * 0.8;
        const barHeight = 4;
        const barX = x + (this.tileSize - barWidth) / 2;
        const barY = y - 8;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health bar color based on percentage
        let barColor = '#4CAF50'; // Green
        if (healthPercent <= 25) {
            barColor = '#F44336'; // Red
        } else if (healthPercent <= 50) {
            barColor = '#FFC107'; // Yellow
        }
        
        // Health bar
        this.ctx.fillStyle = barColor;
        this.ctx.fillRect(barX, barY, barWidth * (healthPercent / 100), barHeight);
        
        // Border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    private renderTileHighlight(position: Position, color: string): void {
        const x = position.x * this.tileSize;
        const y = position.y * this.tileSize;
        
        // Draw a semi-transparent highlight
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Draw a more visible border instead of a solid line
        this.ctx.strokeStyle = color.replace('0.3', '0.8'); // Make border more opaque
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
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
        if (!path.length) return;
        
        // Draw path segments
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        
        // Start from the first position in the path
        const startX = path[0].x * this.tileSize + (this.tileSize / 2);
        const startY = path[0].y * this.tileSize + (this.tileSize / 2);
        this.ctx.moveTo(startX, startY);
        
        // Draw line to each subsequent position
        for (let i = 1; i < path.length; i++) {
            const x = path[i].x * this.tileSize + (this.tileSize / 2);
            const y = path[i].y * this.tileSize + (this.tileSize / 2);
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.stroke();
        
        // Draw dots at each path point
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const pos of path) {
            const x = pos.x * this.tileSize + (this.tileSize / 2);
            const y = pos.y * this.tileSize + (this.tileSize / 2);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw arrow at the end of the path
        const lastPos = path[path.length - 1];
        const arrowX = lastPos.x * this.tileSize + (this.tileSize / 2);
        const arrowY = lastPos.y * this.tileSize + (this.tileSize / 2);
        
        // Draw a circle instead of an arrow to avoid any weird lines
        this.ctx.fillStyle = 'rgba(255, 204, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(arrowX, arrowY, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Apply day/night visual effects to the canvas
     */
    private applyDayNightEffect(isDayPhase: boolean): void {
        if (!isDayPhase) {
            // Apply night effect - dark blue overlay with reduced opacity
            this.ctx.fillStyle = 'rgba(0, 0, 50, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Add some "stars" for night effect
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                const size = Math.random() * 2;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
} 