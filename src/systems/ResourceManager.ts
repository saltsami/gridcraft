// systems/ResourceManager.ts - Manages game resources
import { ResourceType } from '../types/ResourceType';
import { Position } from '../types/Position';
import { Entity } from '../entities/Entity';
import { Grid } from '../core/Grid';

export class ResourceManager {
    private resources: Map<ResourceType, number> = new Map();
    private grid: Grid;
    
    constructor(grid: Grid) {
        this.grid = grid;
        this.initializeResources();
    }
    
    private initializeResources(): void {
        // Start with some basic resources
        this.resources.set(ResourceType.WOOD, 20);
        this.resources.set(ResourceType.STONE, 10);
        this.resources.set(ResourceType.IRON, 5);
        this.resources.set(ResourceType.FOOD, 15);
    }
    
    public getResourceAmount(resourceType: ResourceType): number {
        return this.resources.get(resourceType) || 0;
    }
    
    public addResource(resourceType: ResourceType, amount: number): void {
        const currentAmount = this.getResourceAmount(resourceType);
        this.resources.set(resourceType, currentAmount + amount);
    }
    
    public consumeResource(resourceType: ResourceType, amount: number): boolean {
        const currentAmount = this.getResourceAmount(resourceType);
        
        if (currentAmount >= amount) {
            this.resources.set(resourceType, currentAmount - amount);
            return true;
        }
        
        return false;
    }
    
    public harvestResource(entity: Entity, position: Position): boolean {
        // Check if entity can gather resources
        if (!entity.canGatherResources) {
            return false;
        }
        
        // Check if entity has action points
        if (entity.actionPoints <= 0) {
            return false;
        }
        
        // Get the tile at the position
        const tile = this.grid.getTile(position);
        
        if (!tile || !tile.hasResource()) {
            return false;
        }
        
        // Calculate harvest amount (could depend on entity properties)
        const harvestAmount = 1;
        
        // Extract the resource from the tile
        const resourceType = tile.resourceType;
        if (!resourceType) {
            return false;
        }
        
        const extracted = tile.extractResource(harvestAmount);
        
        if (extracted > 0) {
            // Add to inventory
            this.addResource(resourceType, extracted);
            
            // Deduct action point
            entity.actionPoints--;
            
            return true;
        }
        
        return false;
    }
    
    public getAllResourceTypes(): ResourceType[] {
        return Object.values(ResourceType);
    }
} 