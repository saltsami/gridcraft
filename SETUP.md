# GridCraft Defense - Setup Guide

This document provides instructions for setting up the GridCraft Defense game for development and play testing.

## Quick Setup

For a quick setup, run the following command:

```
npm run setup
```

This will:
1. Install all required dependencies
2. Start the development server

The game will be available at `http://localhost:9000` in your web browser.

## Manual Setup

If you prefer to run the commands individually:

### 1. Install Dependencies

```
npm install
```

This will install all the required packages defined in `package.json`.

### 2. Start Development Server

```
npm start
```

This will start a webpack development server at `http://localhost:9000`.

## Production Build

To build the game for production:

```
npm run build
```

This will create optimized files in the `dist` directory.

## Troubleshooting

If you encounter any issues during setup:

1. Make sure you have Node.js installed (version 14 or higher recommended)
2. Check that your npm is up to date using `npm --version`
3. If you receive dependency errors, try deleting the `node_modules` folder and running `npm install` again
4. For webpack errors, check the console output for specific error messages

## Game Controls

- Left-click to select entities and tiles
- Right-click to deselect
- Click the "End Turn" button to advance to the next turn 