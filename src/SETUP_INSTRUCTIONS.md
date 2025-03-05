# GridCraft Defense - Setup Instructions

## Project Structure
This project has been set up with a development environment using webpack. The source files are in the `src` directory, and the compiled files will be in the `dist` directory.

## Development Setup

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

This will start a development server at http://localhost:9000 where you can view and interact with the game. The page will automatically reload when you make changes to the source files.

## Building for Production

To build the project for production, run:
```
npm run build
```

This will create optimized files in the `dist` directory.

## Current Development Status

As outlined in the CHANGELOG.md, we have implemented the following core systems:
- Grid System
- Entity Framework
- Turn-Based System
- Combat System
- Resource Management
- Fog of War

The next step is to implement concrete entities such as Hero, Worker, and Enemies, along with the Building System. We have set up the UI framework, but there is still work to do on the visualization and interaction components.

## Moving Forward

We've created a basic user interface, but it needs more work:
1. Update the FogOfWar class to include getTileVisibility method
2. Implement the EntityManager.getEntityAtPosition method
3. Add getTurnCount and isDayPhase methods to the Game class

Once these are implemented, the basic game loop will be playable.

## Directory Structure

```
gridcraft/
├── dist/               # Compiled files (created when building)
├── src/                # Source files
│   ├── assets/         # Game assets (images, sounds, etc.)
│   ├── core/           # Core game mechanics
│   ├── entities/       # Entity definitions
│   ├── systems/        # Game systems
│   ├── types/          # TypeScript types
│   ├── ui/             # UI components
│   ├── index.html      # Main HTML file
│   ├── index.ts        # Main entry point
│   └── styles.css      # Global styles
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── webpack.config.js   # Webpack configuration
``` 