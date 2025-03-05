# GridCraft Defense

GridCraft Defense is a turn-based strategy game that combines Minecraft's PVE elements with XCOM-style tactical combat. Set in a procedurally generated 2D grid-based world, players must gather resources, build structures, and defend their settlement against waves of enemies.

## Table of Contents
- [Game Overview](#game-overview)
- [Core Game Mechanics](#core-game-mechanics)
- [Game Phases](#game-phases)
- [Entity Framework](#entity-framework)
- [Combat System](#combat-system)
- [Resource Management](#resource-management)
- [Development Setup](#development-setup)
- [Future Development](#future-development)

## Game Overview
In GridCraft Defense, players alternate between a preparation phase ("day") where they gather resources and build defenses, and a combat phase ("night") where they defend against enemy waves. The game features:

- Procedurally generated grid-based world
- Resource gathering and management
- Base building and defense construction
- Strategic turn-based combat with probability calculations
- Fog of war and exploration mechanics
- Technology progression and crafting

## Core Game Mechanics

### Grid System
The game world is represented as a 2D grid where each cell is a tile with specific properties:
- Different terrain types (grass, dirt, stone, water)
- Resources (wood, stone, iron, food)
- Buildings and structures
- Units and enemies

Each entity occupies a single cell, and movement/combat occur on this grid.

### Turn-Based Gameplay
The game follows a strict turn-based system:
- Players have a limited number of action points per turn
- Each unit can move, attack, gather resources, or build
- After the player's turn, enemies move and attack
- Day/night cycle progresses after a set number of turns

### Visibility and Fog of War
- The map starts mostly hidden
- Player units reveal areas based on their sight range
- Previously seen but no longer visible areas remain "explored" but outdated
- Enemies can hide in unexplored areas

## Game Phases

### Preparation Phase ("Day" Turns)
During day phases, players focus on:
- Gathering resources from the grid using the hero or workers
- Building and upgrading structures for production or defense
- Crafting items and training units
- Exploring the map to uncover resources and threats

### Defense Phase ("Night" Turns)
During night phases:
- Enemies spawn from designated points and attack the settlement
- Players must strategically position units and defenses
- Combat uses probability-based mechanics for hits and damage
- Players must protect key structures to avoid defeat

## Entity Framework

All game objects derive from the base Entity class, providing a unified interface for:
- Position tracking on the grid
- Health and combat statistics
- Action point management
- Faction designation (player or enemy)

```typescript
abstract class Entity {
  public position: Position;
  public faction: Faction;
  public health: number;
  public maxHealth: number;
  public actionPoints: number;
  public maxActionPoints: number;
  public isDefeated: boolean = false;
  public sightRange: number = 5;
  
  // Combat stats
  public accuracy: number = 0;
  public evasion: number = 0;
  public armor: number = 0;
  public meleeAttackPower: number = 0;
  public rangedAttackPower: number = 0;
  public rangedAttackRange: number = 0;
  public specialAttackPower: number = 0;
  public specialAttackRange: number = 0;
  public specialAttackAccuracy: number = 0;
  
  // Resource gathering
  public canGatherResources: boolean = false;
  
  // Abstract methods that must be implemented by subclasses
  public abstract getType(): EntityType;
  public abstract getName(): string;
}
```

### Entity Types
The game includes various entity types:
- **Hero**: Player-controlled character with combat and gathering abilities
- **Workers**: Resource gatherers with limited combat capabilities
- **Buildings**: Structures for defense, resource production, and unit training
- **Enemies**: Hostile mobs like zombies, skeletons, spiders, and creepers

## Combat System

The combat system is inspired by XCOM's probability-based mechanics:

### Attack Types
- **Melee**: Short-range, high-accuracy attacks
- **Ranged**: Longer-range attacks affected by distance
- **Special**: Unique abilities with custom effects

### Hit Probability
Combat outcomes are determined by probability calculations, considering:
- Base chance determined by attack type
- Attacker's accuracy stat
- Target's evasion stat
- Environmental factors (cover, elevation)
- Distance penalties for ranged attacks

```typescript
private calculateHitChance(attacker: Entity, target: Entity, attackType: AttackType, distance: number): number {
  let baseChance = 0;
  
  switch (attackType) {
    case AttackType.MELEE:
      baseChance = 85; // High base chance for melee
      break;
    case AttackType.RANGED:
      baseChance = 75 - (distance * 5); // Decreases with distance
      break;
    case AttackType.SPECIAL:
      baseChance = attacker.specialAttackAccuracy;
      break;
  }
  
  // Apply modifiers
  baseChance += attacker.accuracy;
  baseChance -= target.evasion;
  
  // Clamp value
  return Math.max(5, Math.min(95, baseChance));
}
```

### Damage Calculation
Damage calculation accounts for:
- Base damage from the attacker's weapon/ability
- Target's armor reducing damage by percentage
- Random variance for unpredictability

```typescript
private calculateDamage(attacker: Entity, target: Entity, attackType: AttackType): number {
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
  
  // Apply damage modifiers
  const damageReduction = Math.min(75, target.armor);
  const damageMultiplier = (100 - damageReduction) / 100;
  
  // Add slight randomization
  const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
  
  return Math.max(1, Math.floor(baseDamage * damageMultiplier * randomFactor));
}
```

## Resource Management

The resource system handles all economy-related aspects:

- **Resource Types**: Wood, stone, iron, and food
- **Collection**: Resources are gathered from specific tiles
- **Expenditure**: Used for building, crafting, and unit training
- **Generation**: Some buildings provide passive resource production

## Development Setup

GridCraft Defense uses a modern web development stack with TypeScript, webpack, and npm.

### Quick Setup

For a quick setup, run the following command:

```
npm run setup
```

This will install all dependencies and start the development server.

### Manual Setup

If you prefer to run the commands individually:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

The game will be available at `http://localhost:9000` in your web browser.

### Building for Production

To build the game for production:
```
npm run build
```

This will create optimized files in the `dist` directory.

### Current Development Status

The game currently has these core systems implemented:
- Grid system with terrain generation
- Entity framework
- Combat system with probability-based mechanics
- Resource management system
- Fog of war and visibility
- Basic UI components

Work is ongoing to implement specific entity types, enemy AI, and game mechanics. See the [CHANGELOG.md](CHANGELOG.md) file for details on what's implemented and what's next.

## Future Development

### Immediate Next Steps
- **Implement Enemy AI**
  - Pathfinding algorithms for movement
  - Target prioritization logic
  - Special enemy abilities
- **Expand Resource System**
  - Crafting recipes and upgrade trees
  - Resource conversion mechanics
  - Resource depletion visualization
- **Enhance Combat System**
  - Status effects (poison, stun, etc.)
  - Area-of-effect attacks
  - Environmental interactions

### Medium-Term Goals
- **Tech Tree and Progression**
  - Research system for unlocking new buildings and units
  - Tiered equipment with different strengths and weaknesses
  - Hero upgrades and skill trees
- **Advanced Enemy Waves**
  - Structured enemy waves with increasing difficulty
  - Mini-boss and boss encounters
  - Special events like blood moons or enemy sieges
- **Save/Load System**
  - Game state serialization
  - Multiple save slots
  - Auto-save functionality

### Long-Term Vision
- **Campaign Mode**
  - Narrative-driven scenarios with unique objectives
  - Persistent hero progression between levels
  - Branching mission structure
- **Procedural Mission Generation**
  - Dynamic objective generation
  - Adjustable difficulty parameters
  - Unique map features and themes
- **Multiplayer Features**
  - Cooperative play with multiple heroes
  - Competitive mode where players send waves against each other
  - Shared base building and resource management


  