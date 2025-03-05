// ui/GridRenderer.ts - Handles the visual rendering of the game grid
import { Game } from '../core/Game';
import { Position } from '../types/Position';
import { TerrainType } from '../types/TerrainType';
import { Entity } from '../entities/Entity';
import { Faction } from '../types/Faction';
import { VisibilityState } from '../systems/FogOfWar';

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
        
        // Skip rendering unexplored tiles
        if (visibility === 'unexplored') {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
            return;
        }
        
        // Set color based on terrain type
        let color = '#888'; // Default gray
        
        switch (terrainType) {
            case TerrainType.GRASS:
                color = '#7CFC00';
                break;
            case TerrainType.DIRT:
                color = '#8B4513';
                break;
            case TerrainType.STONE:
                color = '#A9A9A9';
                break;
            case TerrainType.WATER:
                color = '#1E90FF';
                break;
        }
        
        // Draw tile
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Draw border
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        
        // Apply fog of war for explored but not visible tiles
        if (visibility === 'explored') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }
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
        
        // Draw entity
        this.ctx.fillStyle = color;
        
        // Draw as a circle in the center of the tile
        const radius = this.tileSize * 0.4;
        const centerX = x + (this.tileSize / 2);
        const centerY = y + (this.tileSize / 2);
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw health bar
        const healthBarWidth = this.tileSize * 0.8;
        const healthBarHeight = this.tileSize * 0.1;
        const healthBarX = x + (this.tileSize - healthBarWidth) / 2;
        const healthBarY = y + this.tileSize * 0.8;
        
        // Background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health level
        const healthPercentage = entity.health / entity.maxHealth;
        this.ctx.fillStyle = healthPercentage > 0.5 ? '#00ff00' : healthPercentage > 0.25 ? '#ffff00' : '#ff0000';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
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
} 