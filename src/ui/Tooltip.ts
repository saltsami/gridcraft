// ui/Tooltip.ts - Manages tooltips with entity information and combat probabilities
import { Position } from '../types/Position';

export interface TooltipPosition {
    x: number;
    y: number;
}

export class Tooltip {
    private static tooltipContainer: HTMLElement | null = null;
    private static isVisible: boolean = false;
    private static hideTimeout: number | null = null;
    private static showDelay: number = 150; // ms
    private static showTimeout: number | null = null;

    public static initialize(): void {
        // Create tooltip container if it doesn't exist
        if (!this.tooltipContainer) {
            const container = document.createElement('div');
            container.id = 'tooltip-container';
            container.className = 'tooltip-container';
            container.style.position = 'absolute';
            container.style.zIndex = '1000';
            container.style.display = 'none';
            container.style.pointerEvents = 'none';
            container.style.opacity = '0';
            container.style.transition = 'opacity 0.2s ease-in-out';
            
            document.body.appendChild(container);
            this.tooltipContainer = container;
        }
    }

    public static show(content: string, position: TooltipPosition, delay: number = this.showDelay): void {
        this.initialize();
        
        // Clear any existing hide timeout
        if (this.hideTimeout !== null) {
            window.clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        // If already showing something, update immediately, otherwise use delay
        if (this.isVisible) {
            this.updateTooltip(content, position);
        } else {
            // Clear any existing show timeout
            if (this.showTimeout !== null) {
                window.clearTimeout(this.showTimeout);
            }
            
            // Set a timeout to show the tooltip
            this.showTimeout = window.setTimeout(() => {
                this.updateTooltip(content, position);
                this.showTimeout = null;
            }, delay);
        }
    }

    public static hide(delay: number = 0): void {
        // Clear any existing show timeout
        if (this.showTimeout !== null) {
            window.clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        
        if (!this.tooltipContainer || !this.isVisible) return;
        
        if (delay > 0) {
            // Set a timeout to hide the tooltip
            if (this.hideTimeout !== null) {
                window.clearTimeout(this.hideTimeout);
            }
            
            this.hideTimeout = window.setTimeout(() => {
                this.hideTooltip();
                this.hideTimeout = null;
            }, delay);
        } else {
            this.hideTooltip();
        }
    }
    
    private static hideTooltip(): void {
        if (!this.tooltipContainer) return;
        
        this.tooltipContainer.style.opacity = '0';
        // Hide after the fade-out transition
        setTimeout(() => {
            if (this.tooltipContainer) {
                this.tooltipContainer.style.display = 'none';
            }
        }, 200);
        
        this.isVisible = false;
    }
    
    private static updateTooltip(content: string, position: TooltipPosition): void {
        if (!this.tooltipContainer) return;
        
        // Update content
        this.tooltipContainer.innerHTML = content;
        
        // Make it visible
        this.tooltipContainer.style.display = 'block';
        
        // Update position after content is set to get proper dimensions
        setTimeout(() => this.updatePosition(position), 0);
        
        // Fade in
        setTimeout(() => {
            if (this.tooltipContainer) {
                this.tooltipContainer.style.opacity = '1';
            }
        }, 10);
        
        this.isVisible = true;
    }
    
    private static updatePosition(position: TooltipPosition): void {
        if (!this.tooltipContainer) return;
        
        const tooltip = this.tooltipContainer;
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        // Window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Default positioning (right and below the mouse)
        let x = position.x + 15;
        let y = position.y + 15;
        
        // Ensure tooltip stays within window bounds
        if (x + tooltipWidth > windowWidth - 20) {
            x = position.x - tooltipWidth - 15; // Position left of the cursor
        }
        
        if (y + tooltipHeight > windowHeight - 20) {
            y = position.y - tooltipHeight - 15; // Position above the cursor
        }
        
        // Make sure tooltip is not off the left or top edge
        x = Math.max(20, x);
        y = Math.max(20, y);
        
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }
} 