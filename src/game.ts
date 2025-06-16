// Manages the overall game state, including all connected players and their positions.
import { Player, PlayerState } from './player';

/**
 * Manages the core game logic, including player states and updates.
 * This class serves as the single source of truth for the game world.
 */
export class Game {
    private players: Map<string, Player>; // Maps player ID to Player instance
    private lastKnownPositions: Map<string, { x: number; z: number }>; // Track last sent X and Z positions
    private updateInterval: NodeJS.Timeout | null = null;
    private readonly POLLING_RATE = 500; // 2 times per second (500ms)

    constructor() {
        this.players = new Map<string, Player>();
        this.lastKnownPositions = new Map<string, { x: number; z: number }>();
        console.log('Game initialized.');
        this.startUpdateLoop();
    }

    /**
     * Generates a random coordinate value between -50 and 50
     */
    private generateRandomCoordinate(): number {
        return Math.floor(Math.random() * 101) - 50; // Range: -50 to 50
    }

    /**
     * Starts the game update loop at 2 times per second
     */
    private startUpdateLoop(): void {
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.POLLING_RATE);
    }

    /**
     * Stops the game update loop
     */
    public stopUpdateLoop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Adds a new player to the game with random X and Z coordinates.
     * @param {string} playerId - The unique ID of the player to add.
     * @param {number} initialX - The starting X position for the new player (optional, will use random if not provided).
     * @param {number} initialZ - The starting Z position for the new player (optional, will use random if not provided).
     * @returns {PlayerState} The state of the newly added player.
     */
    public addPlayer(playerId: string, initialX?: number, initialZ?: number): PlayerState {
        if (this.players.has(playerId)) {
            console.warn(`Player with ID ${playerId} already exists.`);
            return this.players.get(playerId)!.getState();
        }
        
        const x = initialX ?? this.generateRandomCoordinate();
        const z = initialZ ?? this.generateRandomCoordinate();
        
        const player = new Player(playerId, x, 1, z); // Y remains 1 (ground level)
        this.players.set(playerId, player);
        this.lastKnownPositions.set(playerId, { x, z });
        console.log(`Player ${playerId} added at (${x}, 1, ${z}).`);
        return player.getState();
    }

    /**
     * Removes a player from the game.
     * @param {string} playerId - The ID of the player to remove.
     * @returns {boolean} True if the player was successfully removed, false otherwise.
     */
    public removePlayer(playerId: string): boolean {
        if (this.players.delete(playerId)) {
            this.lastKnownPositions.delete(playerId);
            console.log(`Player ${playerId} removed.`);
            return true;
        }
        console.warn(`Attempted to remove non-existent player ${playerId}.`);
        return false;
    }

    /**
     * Updates a player's X and Z position. Y position remains fixed at 1.
     * @param {string} playerId - The ID of the player to update.
     * @param {number} newX - The new X coordinate for the player.
     * @param {number} newZ - The new Z coordinate for the player.
     * @returns {PlayerState | null} The updated player state, or null if the player does not exist.
     */
    public updatePlayerPosition(playerId: string, newX: number, newZ: number): PlayerState | null {
        const player = this.players.get(playerId);
        if (player) {
            player.x = newX;
            player.z = newZ;
            // Y remains fixed at 1
            // console.log(`Player ${playerId} moved to (${newX}, 1, ${newZ}).`);
            return player.getState();
        }
        console.warn(`Attempted to move non-existent player ${playerId}.`);
        return null;
    }

    /**
     * Gets the state of a specific player.
     * @param {string} playerId - The ID of the player to retrieve.
     * @returns {PlayerState | null} The player's state, or null if the player does not exist.
     */
    public getPlayerState(playerId: string): PlayerState | null {
        return this.players.get(playerId)?.getState() || null;
    }

    /**
     * Retrieves the states of all players currently in the game.
     * @returns {PlayerState[]} An array of all player states.
     */
    public getAllPlayerStates(): PlayerState[] {
        return Array.from(this.players.values()).map(player => player.getState());
    }

    /**
     * Gets only the players whose positions have changed since last update.
     * @returns {PlayerState[]} An array of player states that have moved.
     */
    public getUpdatedPlayerStates(): PlayerState[] {
        const updatedPlayers: PlayerState[] = [];
        
        for (const [playerId, player] of this.players) {
            const currentX = player.x;
            const currentZ = player.z;
            const lastKnownPosition = this.lastKnownPositions.get(playerId);
            
            if (!lastKnownPosition || 
                currentX !== lastKnownPosition.x || 
                currentZ !== lastKnownPosition.z) {
                updatedPlayers.push(player.getState());
                this.lastKnownPositions.set(playerId, { x: currentX, z: currentZ });
            }
        }
        
        return updatedPlayers;
    }

    /**
     * Game logic updates called at 2 times per second.
     * This method would be called periodically by the game loop.
     */
    public update(): void {
        // Get players with position changes
        const updatedPlayers = this.getUpdatedPlayerStates();
        
        // Only broadcast/log if there are actually players who moved
        if (updatedPlayers.length > 1) {
            // Here you would typically broadcast the updates to connected clients
            // For now, we'll just log the updates
            /* console.log(`Broadcasting updates for ${updatedPlayers.length} players:`, 
                updatedPlayers.map(p => `${p.id}: (${p.x}, ${p.y}, ${p.z})`)); */
        }
        // No output when no players have moved
        
        // Implement additional game logic here, e.g.,
        // - Collision detection
        // - Environmental interactions
        // - AI updates
    }
}